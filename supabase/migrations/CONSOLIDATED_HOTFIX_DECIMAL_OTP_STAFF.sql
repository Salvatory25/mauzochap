-- ==============================================================================
-- MAUZOCHAP COMPLETE PRODUCTION HOTFIX MIGRATION (DIRECT & VERIFIABLE)
-- Run this in your Supabase Dashboard:
-- https://supabase.com/dashboard/project/mnopesayeoklyymowmwc/sql/new
-- ==============================================================================

-- 1. DIRECT COLUMN CONVERSIONS TO NUMERIC(12,3) (FOR FRACTIONAL QUANTITIES LIKE 1.5, 2.5)
ALTER TABLE public.sale_items ALTER COLUMN quantity TYPE NUMERIC(12,3);
ALTER TABLE public.invoice_items ALTER COLUMN quantity TYPE NUMERIC(12,3);
ALTER TABLE public.products ALTER COLUMN stock_quantity TYPE NUMERIC(12,3);
ALTER TABLE IF EXISTS public.branch_inventory ALTER COLUMN stock_quantity TYPE NUMERIC(12,3);
ALTER TABLE IF EXISTS public.stock_movements ALTER COLUMN quantity_change TYPE NUMERIC(12,3);
ALTER TABLE IF EXISTS public.purchase_items ALTER COLUMN quantity TYPE NUMERIC(12,3);
ALTER TABLE IF EXISTS public.stock_transfers ALTER COLUMN quantity TYPE NUMERIC(12,3);
ALTER TABLE IF EXISTS public.product_batches ALTER COLUMN stock_quantity TYPE NUMERIC(12,3);

-- 2. UPDATE STOCK DECREMENT TRIGGER FUNCTIONS
CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_branch_id UUID;
  v_biz_id UUID;
  v_status TEXT;
  v_has_branch_inv BOOLEAN;
  v_has_stock_mov BOOLEAN;
BEGIN
  SELECT branch_id, business_id, status::TEXT INTO v_branch_id, v_biz_id, v_status 
  FROM public.sales 
  WHERE id = NEW.sale_id;

  -- Only decrement stock if the sale is completed (or status is null / direct sale)
  IF (v_status IS NULL OR v_status = 'completed') AND NEW.product_id IS NOT NULL THEN
    -- Update overall product stock
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity 
    WHERE id = NEW.product_id;

    -- Update branch stock if branch is known
    IF v_branch_id IS NOT NULL THEN
      SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'branch_inventory') INTO v_has_branch_inv;
      IF v_has_branch_inv THEN
        EXECUTE 'UPDATE public.branch_inventory SET stock_quantity = stock_quantity - $1 WHERE branch_id = $2 AND product_id = $3'
        USING NEW.quantity, v_branch_id, NEW.product_id;
      END IF;

      SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_movements') INTO v_has_stock_mov;
      IF v_has_stock_mov THEN
        EXECUTE 'INSERT INTO public.stock_movements (business_id, product_id, branch_id, movement_type, quantity_change, reference_id) VALUES ($1, $2, $3, ''sale'', -$4, $5)'
        USING COALESCE(NEW.business_id, v_biz_id), NEW.product_id, v_branch_id, NEW.quantity, NEW.sale_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON public.sale_items;
CREATE TRIGGER trg_decrement_stock 
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sale();

CREATE OR REPLACE FUNCTION public.process_completed_sale_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  item RECORD;
  v_has_branch_inv BOOLEAN;
  v_has_stock_mov BOOLEAN;
BEGIN
  IF NEW.status::TEXT = 'completed' AND (OLD.status::TEXT = 'pending' OR OLD.status::TEXT IS NULL) THEN
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'branch_inventory') INTO v_has_branch_inv;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock_movements') INTO v_has_stock_mov;

    FOR item IN SELECT * FROM public.sale_items WHERE sale_id = NEW.id
    LOOP
      IF item.product_id IS NOT NULL AND NEW.branch_id IS NOT NULL THEN
        IF v_has_branch_inv THEN
          EXECUTE 'UPDATE public.branch_inventory SET stock_quantity = stock_quantity - $1 WHERE branch_id = $2 AND product_id = $3'
          USING item.quantity, NEW.branch_id, item.product_id;
        END IF;
        
        IF v_has_stock_mov THEN
          EXECUTE 'INSERT INTO public.stock_movements (business_id, product_id, branch_id, movement_type, quantity_change, reference_id) VALUES ($1, $2, $3, ''sale'', -$4, $5)'
          USING COALESCE(item.business_id, NEW.business_id), item.product_id, NEW.branch_id, item.quantity, NEW.id;
        END IF;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;

-- 3. REMOVE TEST SUPPLIERS & ENFORCE TENANT ISOLATION (IF TABLE EXISTS)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers') THEN
    EXECUTE 'DELETE FROM public.suppliers WHERE LOWER(name) LIKE ''%yolanda%''';
    EXECUTE 'DELETE FROM public.suppliers WHERE business_id IS NULL';
    EXECUTE 'ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "auth read suppliers" ON public.suppliers';
    EXECUTE 'DROP POLICY IF EXISTS "auth manage suppliers" ON public.suppliers';
    EXECUTE 'DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.suppliers';
    EXECUTE 'DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.suppliers';
    EXECUTE 'DROP POLICY IF EXISTS "tenant_read_suppliers" ON public.suppliers';
    EXECUTE 'DROP POLICY IF EXISTS "tenant_manage_suppliers" ON public.suppliers';

    EXECUTE '
      CREATE POLICY "tenant_read_suppliers" ON public.suppliers
        FOR SELECT TO authenticated
        USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()))';

    EXECUTE '
      CREATE POLICY "tenant_manage_suppliers" ON public.suppliers
        FOR ALL TO authenticated
        USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()))
        WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()))';
  END IF;
END $$;

-- 4. AUTO-SYNC STAFF ACCOUNTS & ROLES TO PROFILES
DO $$
DECLARE
  v_role_type TEXT;
  v_has_branch_id BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'branch_id') INTO v_has_branch_id;

  IF v_has_branch_id THEN
    INSERT INTO public.profiles (id, full_name, phone, business_id, branch_id)
    SELECT 
      u.id, 
      COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), u.email), 
      NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''),
      (u.raw_user_meta_data->>'business_id')::UUID,
      CASE 
        WHEN (u.raw_user_meta_data->>'branch_id') IS NOT NULL AND TRIM(u.raw_user_meta_data->>'branch_id') <> ''
        THEN (u.raw_user_meta_data->>'branch_id')::UUID
        ELSE NULL
      END
    FROM auth.users u
    WHERE (u.raw_user_meta_data->>'business_id') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
    ON CONFLICT (id) DO UPDATE SET
      business_id = EXCLUDED.business_id,
      full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), profiles.full_name),
      phone = COALESCE(NULLIF(TRIM(EXCLUDED.phone), ''), profiles.phone);

    UPDATE public.profiles p
    SET 
      business_id = (u.raw_user_meta_data->>'business_id')::UUID,
      branch_id = COALESCE(p.branch_id, NULLIF(TRIM(u.raw_user_meta_data->>'branch_id'), '')::UUID),
      phone = COALESCE(p.phone, NULLIF(TRIM(u.raw_user_meta_data->>'phone'), '')),
      full_name = COALESCE(p.full_name, NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''))
    FROM auth.users u
    WHERE p.id = u.id
      AND (u.raw_user_meta_data->>'business_id') IS NOT NULL
      AND (p.business_id IS NULL OR p.business_id <> (u.raw_user_meta_data->>'business_id')::UUID);
  ELSE
    INSERT INTO public.profiles (id, full_name, phone, business_id)
    SELECT 
      u.id, 
      COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), u.email), 
      NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''),
      (u.raw_user_meta_data->>'business_id')::UUID
    FROM auth.users u
    WHERE (u.raw_user_meta_data->>'business_id') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
    ON CONFLICT (id) DO UPDATE SET
      business_id = EXCLUDED.business_id,
      full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), profiles.full_name),
      phone = COALESCE(NULLIF(TRIM(EXCLUDED.phone), ''), profiles.phone);

    UPDATE public.profiles p
    SET 
      business_id = (u.raw_user_meta_data->>'business_id')::UUID,
      phone = COALESCE(p.phone, NULLIF(TRIM(u.raw_user_meta_data->>'phone'), '')),
      full_name = COALESCE(p.full_name, NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''))
    FROM auth.users u
    WHERE p.id = u.id
      AND (u.raw_user_meta_data->>'business_id') IS NOT NULL
      AND (p.business_id IS NULL OR p.business_id <> (u.raw_user_meta_data->>'business_id')::UUID);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    SELECT udt_name INTO v_role_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role';

    IF v_role_type = 'app_role' THEN
      EXECUTE '
        INSERT INTO public.user_roles (user_id, role)
        SELECT p.id, COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>''role''), ''''), ''cashier'')::public.app_role
        FROM public.profiles p JOIN auth.users u ON p.id = u.id
        WHERE p.business_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
        ON CONFLICT DO NOTHING';
    ELSE
      EXECUTE '
        INSERT INTO public.user_roles (user_id, role)
        SELECT p.id, COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>''role''), ''''), ''cashier'')
        FROM public.profiles p JOIN auth.users u ON p.id = u.id
        WHERE p.business_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
        ON CONFLICT DO NOTHING';
    END IF;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_business_staff(_business_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role_type TEXT;
  v_has_branch_id BOOLEAN;
BEGIN
  IF _business_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'business_id is required');
  END IF;

  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'branch_id') INTO v_has_branch_id;

  IF v_has_branch_id THEN
    INSERT INTO public.profiles (id, full_name, phone, business_id, branch_id)
    SELECT 
      u.id, 
      COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), u.email), 
      NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''),
      _business_id,
      CASE 
        WHEN (u.raw_user_meta_data->>'branch_id') IS NOT NULL AND TRIM(u.raw_user_meta_data->>'branch_id') <> ''
        THEN (u.raw_user_meta_data->>'branch_id')::UUID
        ELSE NULL
      END
    FROM auth.users u
    WHERE (u.raw_user_meta_data->>'business_id')::UUID = _business_id
      AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
    ON CONFLICT (id) DO UPDATE SET
      business_id = _business_id,
      full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), profiles.full_name),
      phone = COALESCE(NULLIF(TRIM(EXCLUDED.phone), ''), profiles.phone);

    UPDATE public.profiles p
    SET 
      business_id = _business_id,
      branch_id = COALESCE(p.branch_id, NULLIF(TRIM(u.raw_user_meta_data->>'branch_id'), '')::UUID),
      phone = COALESCE(p.phone, NULLIF(TRIM(u.raw_user_meta_data->>'phone'), '')),
      full_name = COALESCE(p.full_name, NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''))
    FROM auth.users u
    WHERE p.id = u.id
      AND (u.raw_user_meta_data->>'business_id')::UUID = _business_id
      AND (p.business_id IS NULL OR p.business_id <> _business_id);
  ELSE
    INSERT INTO public.profiles (id, full_name, phone, business_id)
    SELECT 
      u.id, 
      COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''), u.email), 
      NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''),
      _business_id
    FROM auth.users u
    WHERE (u.raw_user_meta_data->>'business_id')::UUID = _business_id
      AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
    ON CONFLICT (id) DO UPDATE SET
      business_id = _business_id,
      full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), profiles.full_name),
      phone = COALESCE(NULLIF(TRIM(EXCLUDED.phone), ''), profiles.phone);

    UPDATE public.profiles p
    SET 
      business_id = _business_id,
      phone = COALESCE(p.phone, NULLIF(TRIM(u.raw_user_meta_data->>'phone'), '')),
      full_name = COALESCE(p.full_name, NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''))
    FROM auth.users u
    WHERE p.id = u.id
      AND (u.raw_user_meta_data->>'business_id')::UUID = _business_id
      AND (p.business_id IS NULL OR p.business_id <> _business_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles') THEN
    SELECT udt_name INTO v_role_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'role';

    IF v_role_type = 'app_role' THEN
      EXECUTE '
        INSERT INTO public.user_roles (user_id, role)
        SELECT p.id, COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>''role''), ''''), ''cashier'')::public.app_role
        FROM public.profiles p JOIN auth.users u ON p.id = u.id
        WHERE p.business_id = $1 AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
        ON CONFLICT DO NOTHING' USING _business_id;
    ELSE
      EXECUTE '
        INSERT INTO public.user_roles (user_id, role)
        SELECT p.id, COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>''role''), ''''), ''cashier'')
        FROM public.profiles p JOIN auth.users u ON p.id = u.id
        WHERE p.business_id = $1 AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
        ON CONFLICT DO NOTHING' USING _business_id;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_business_staff(UUID) TO anon, authenticated, service_role;

-- 5. PASSWORD RESET VIA SMS OTP TABLE & FUNCTIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  v_has_businesses BOOLEAN;
BEGIN
  IF _identifier IS NULL OR TRIM(_identifier) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tafadhali weka barua pepe au namba ya simu.');
  END IF;

  _identifier := TRIM(_identifier);

  IF _identifier ~ '^[0-9+]+$' THEN
    clean_phone := REGEXP_REPLACE(_identifier, '^\+?255', '0');
  ELSE
    clean_phone := _identifier;
  END IF;

  SELECT id, email INTO target_user_id, target_email
  FROM auth.users
  WHERE LOWER(email) = LOWER(_identifier)
  LIMIT 1;

  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'businesses') INTO v_has_businesses;

  IF target_user_id IS NOT NULL THEN
    SELECT phone INTO target_phone FROM public.profiles WHERE id = target_user_id AND phone IS NOT NULL AND phone <> '' LIMIT 1;
    IF target_phone IS NULL AND v_has_businesses THEN
      EXECUTE 'SELECT phone FROM public.businesses WHERE LOWER(email) = LOWER($1) AND phone IS NOT NULL AND phone <> '''' LIMIT 1'
      INTO target_phone USING target_email;
    END IF;
  ELSE
    SELECT id, phone INTO target_user_id, target_phone
    FROM public.profiles
    WHERE phone = clean_phone OR phone = _identifier OR phone = ('+255' || SUBSTRING(clean_phone FROM 2))
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
      SELECT email INTO target_email FROM auth.users WHERE id = target_user_id LIMIT 1;
    ELSIF v_has_businesses THEN
      EXECUTE 'SELECT email, phone FROM public.businesses WHERE phone = $1 OR phone = $2 OR phone = (''+255'' || SUBSTRING($1 FROM 2)) LIMIT 1'
      INTO target_email, target_phone USING clean_phone, _identifier;

      IF target_email IS NOT NULL THEN
        SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email) LIMIT 1;
      END IF;
    END IF;
  END IF;

  IF target_user_id IS NULL AND target_email IS NULL AND target_phone IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Akaunti yenye taarifa hizi haijapatikana. Hakikisha umeandika barua pepe au namba ya simu sahihi.');
  END IF;

  IF (target_phone IS NULL OR target_phone = '') AND clean_phone ~ '^0[67][0-9]{8}$' THEN
    target_phone := clean_phone;
  END IF;

  generated_otp := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

  DELETE FROM public.otp_verifications 
  WHERE (
    (target_phone IS NOT NULL AND phone = target_phone) OR 
    (target_email IS NOT NULL AND LOWER(email) = LOWER(target_email))
  ) AND purpose = 'password_reset' AND verified = FALSE;

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
  v_has_businesses BOOLEAN;
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

  UPDATE public.otp_verifications
  SET verified = TRUE
  WHERE id = target_otp_id;

  IF target_email IS NOT NULL AND target_email <> '' THEN
    SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email) LIMIT 1;
  END IF;

  IF target_user_id IS NULL AND target_phone IS NOT NULL AND target_phone <> '' THEN
    SELECT id INTO target_user_id FROM public.profiles WHERE phone = target_phone LIMIT 1;
  END IF;

  SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'businesses') INTO v_has_businesses;

  IF target_user_id IS NULL AND target_phone IS NOT NULL AND target_phone <> '' AND v_has_businesses THEN
    EXECUTE 'SELECT u.id FROM auth.users u JOIN public.businesses b ON LOWER(u.email) = LOWER(b.email) WHERE b.phone = $1 LIMIT 1'
    INTO target_user_id USING target_phone;
  END IF;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mtumiaji wa akaunti hii hakupatikana kwenye mfumo.');
  END IF;

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

-- 6. RELOAD SCHEMA CACHE & VERIFY
NOTIFY pgrst, 'reload schema';

SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('sale_items', 'invoice_items', 'products', 'branch_inventory', 'stock_movements')
  AND column_name IN ('quantity', 'stock_quantity', 'quantity_change');
