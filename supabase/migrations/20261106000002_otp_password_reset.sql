-- Migration: 20261106000002_otp_password_reset.sql
-- Description:
-- Adds secure OTP table and functions for phone/email password reset via SMS OTP

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create OTP verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT,
  email TEXT,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'password_reset',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone_code ON public.otp_verifications(phone, otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_code ON public.otp_verifications(email, otp_code);

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- 2. Function to request password reset OTP
CREATE OR REPLACE FUNCTION public.request_password_reset_otp(_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  target_user_id UUID;
  target_email TEXT;
  target_phone TEXT;
  clean_phone TEXT;
  generated_otp TEXT;
BEGIN
  IF _identifier IS NULL OR TRIM(_identifier) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tafadhali weka barua pepe au namba ya simu.');
  END IF;

  _identifier := TRIM(_identifier);

  -- Standardize Tanzanian phone number format: 07XXXXXXXX or +2557XXXXXXXX
  IF _identifier ~ '^[0-9+]+$' THEN
    clean_phone := REGEXP_REPLACE(_identifier, '^\+?255', '0');
  ELSE
    clean_phone := _identifier;
  END IF;

  -- 1. Try finding by email in auth.users
  SELECT id, email INTO target_user_id, target_email
  FROM auth.users
  WHERE LOWER(email) = LOWER(_identifier)
  LIMIT 1;

  -- If found by email, check phone in profiles or businesses
  IF target_user_id IS NOT NULL THEN
    SELECT phone INTO target_phone FROM public.profiles WHERE id = target_user_id AND phone IS NOT NULL AND phone <> '' LIMIT 1;
    IF target_phone IS NULL THEN
      SELECT phone INTO target_phone FROM public.businesses WHERE LOWER(email) = LOWER(target_email) AND phone IS NOT NULL AND phone <> '' LIMIT 1;
    END IF;
  ELSE
    -- 2. Try finding by phone in profiles
    SELECT id, phone INTO target_user_id, target_phone
    FROM public.profiles
    WHERE phone = clean_phone OR phone = _identifier OR phone = ('+255' || SUBSTRING(clean_phone FROM 2))
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
      SELECT email INTO target_email FROM auth.users WHERE id = target_user_id LIMIT 1;
    ELSE
      -- 3. Try finding in businesses by phone
      SELECT email, phone INTO target_email, target_phone
      FROM public.businesses
      WHERE phone = clean_phone OR phone = _identifier OR phone = ('+255' || SUBSTRING(clean_phone FROM 2))
      LIMIT 1;

      IF target_email IS NOT NULL THEN
        SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email) LIMIT 1;
      END IF;
    END IF;
  END IF;

  IF target_user_id IS NULL AND target_email IS NULL AND target_phone IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Akaunti yenye taarifa hizi haijapatikana. Hakikisha umeandika barua pepe au namba ya simu sahihi.');
  END IF;

  -- Default target phone to clean_phone if phone was provided
  IF (target_phone IS NULL OR target_phone = '') AND clean_phone ~ '^0[67][0-9]{8}$' THEN
    target_phone := clean_phone;
  END IF;

  -- Generate 6-digit random code
  generated_otp := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

  -- Invalidate any existing unused OTP for this user
  DELETE FROM public.otp_verifications 
  WHERE (
    (target_phone IS NOT NULL AND phone = target_phone) OR 
    (target_email IS NOT NULL AND LOWER(email) = LOWER(target_email))
  ) AND purpose = 'password_reset' AND verified = FALSE;

  -- Insert new OTP
  INSERT INTO public.otp_verifications (phone, email, otp_code, purpose, expires_at)
  VALUES (
    COALESCE(target_phone, clean_phone),
    target_email,
    generated_otp,
    'password_reset',
    now() + INTERVAL '15 minutes'
  );

  RETURN jsonb_build_object(
    'success', true,
    'phone', COALESCE(target_phone, clean_phone),
    'email', target_email,
    'otp_code', generated_otp
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_password_reset_otp(TEXT) TO anon, authenticated, service_role;

-- 3. Function to verify OTP and reset password
CREATE OR REPLACE FUNCTION public.verify_otp_and_reset_password(
  _identifier TEXT,
  _otp_code TEXT,
  _new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  target_otp_id UUID;
  target_email TEXT;
  target_phone TEXT;
  target_user_id UUID;
  clean_phone TEXT;
BEGIN
  IF _identifier IS NULL OR TRIM(_identifier) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tafadhali weka barua pepe au namba ya simu.');
  END IF;

  IF _otp_code IS NULL OR LENGTH(TRIM(_otp_code)) <> 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tafadhali weka nambari ya siri (OTP) ya tarakimu 6 iliyotumwa kwenye simu yako.');
  END IF;

  IF _new_password IS NULL OR LENGTH(_new_password) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenosiri jipya lazima liwe na angalau herufi 8.');
  END IF;

  _identifier := TRIM(_identifier);
  IF _identifier ~ '^[0-9+]+$' THEN
    clean_phone := REGEXP_REPLACE(_identifier, '^\+?255', '0');
  ELSE
    clean_phone := _identifier;
  END IF;

  -- Find valid, unexpired, unverified OTP
  SELECT id, email, phone INTO target_otp_id, target_email, target_phone
  FROM public.otp_verifications
  WHERE (
    LOWER(email) = LOWER(_identifier) OR 
    phone = clean_phone OR 
    phone = _identifier OR
    phone = ('+255' || SUBSTRING(clean_phone FROM 2))
  )
    AND otp_code = TRIM(_otp_code)
    AND verified = FALSE
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF target_otp_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nambari ya OTP sio sahihi au muda wake wa dakika 15 umekwisha. Tafadhali omba OTP mpya.');
  END IF;

  -- Mark OTP as verified
  UPDATE public.otp_verifications
  SET verified = TRUE
  WHERE id = target_otp_id;

  -- Find target auth user
  IF target_email IS NOT NULL AND target_email <> '' THEN
    SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email) LIMIT 1;
  END IF;

  IF target_user_id IS NULL AND target_phone IS NOT NULL AND target_phone <> '' THEN
    SELECT id INTO target_user_id FROM public.profiles WHERE phone = target_phone LIMIT 1;
  END IF;

  IF target_user_id IS NULL AND target_phone IS NOT NULL AND target_phone <> '' THEN
    SELECT u.id INTO target_user_id 
    FROM auth.users u
    JOIN public.businesses b ON LOWER(u.email) = LOWER(b.email)
    WHERE b.phone = target_phone
    LIMIT 1;
  END IF;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mtumiaji wa akaunti hii hakupatikana kwenye mfumo.');
  END IF;

  -- Update password securely in auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'email', target_email,
    'message', 'Nenosiri lako limebadilishwa kikamilifu! Sasa unaweza kuingia kwenye akaunti yako.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_otp_and_reset_password(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

