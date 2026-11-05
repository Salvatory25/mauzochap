-- Migration: Backfill & Sync Registered Merchant Phone Numbers for Super Admin SMS Console
-- Ensures all registered businesses in public.businesses and public.profiles have phone numbers
-- populated from auth.users metadata, and provides a SECURITY DEFINER directory RPC for Super Admin.

-- 1. Backfill profiles.phone and profiles.full_name from auth.users metadata where missing
UPDATE public.profiles p
SET
  phone = COALESCE(
    NULLIF(TRIM(p.phone), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(u.phone), '')
  ),
  full_name = COALESCE(
    NULLIF(TRIM(p.full_name), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'owner_name'), '')
  )
FROM auth.users u
WHERE u.id = p.id
  AND (
    p.phone IS NULL OR TRIM(p.phone) = '' OR
    p.full_name IS NULL OR TRIM(p.full_name) = ''
  );

-- 2. Backfill businesses.phone and businesses.owner_name from auth.users (matched by email)
UPDATE public.businesses b
SET
  phone = COALESCE(
    NULLIF(TRIM(b.phone), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(u.phone), '')
  ),
  owner_name = COALESCE(
    NULLIF(NULLIF(TRIM(b.owner_name), ''), 'Owner'),
    NULLIF(TRIM(u.raw_user_meta_data->>'owner_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
    b.owner_name
  )
FROM auth.users u
WHERE LOWER(TRIM(b.email)) = LOWER(TRIM(u.email))
  AND (
    b.phone IS NULL OR TRIM(b.phone) = '' OR
    b.owner_name IS NULL OR TRIM(b.owner_name) IN ('', 'Owner')
  );

-- 3. Backfill businesses.phone from linked profiles.phone if still empty
UPDATE public.businesses b
SET phone = sub.phone
FROM (
  SELECT DISTINCT ON (business_id) business_id, TRIM(phone) AS phone
  FROM public.profiles
  WHERE business_id IS NOT NULL AND phone IS NOT NULL AND TRIM(phone) <> ''
  ORDER BY business_id, created_at ASC
) sub
WHERE b.id = sub.business_id
  AND (b.phone IS NULL OR TRIM(b.phone) = '');

-- 4. Ensure Super Admin can always SELECT/UPDATE businesses, profiles, and customers for SMS management
DROP POLICY IF EXISTS "super_admin all businesses" ON public.businesses;
CREATE POLICY "super_admin all businesses" ON public.businesses
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin all profiles" ON public.profiles;
CREATE POLICY "super_admin all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin read all customers" ON public.customers;
CREATE POLICY "super_admin read all customers" ON public.customers
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 5. SECURITY DEFINER RPC: Returns all registered businesses enriched directly with auth.users & profiles phone numbers
CREATE OR REPLACE FUNCTION public.super_admin_get_merchants_directory()
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  package TEXT,
  account_status TEXT,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Super Admin access required';
  END IF;

  -- Auto-sync any newly registered users from auth.users metadata into businesses.phone before returning
  UPDATE public.businesses b
  SET
    phone = COALESCE(
      NULLIF(TRIM(b.phone), ''),
      NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''),
      NULLIF(TRIM(u.phone), '')
    ),
    owner_name = COALESCE(
      NULLIF(NULLIF(TRIM(b.owner_name), ''), 'Owner'),
      NULLIF(TRIM(u.raw_user_meta_data->>'owner_name'), ''),
      NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
      b.owner_name
    )
  FROM auth.users u
  WHERE LOWER(TRIM(b.email)) = LOWER(TRIM(u.email))
    AND (b.phone IS NULL OR TRIM(b.phone) = '');

  RETURN QUERY
  SELECT
    b.id,
    b.business_name,
    COALESCE(
      NULLIF(NULLIF(TRIM(b.owner_name), ''), 'Owner'),
      (SELECT NULLIF(TRIM(p.full_name), '') FROM public.profiles p WHERE p.business_id = b.id ORDER BY p.created_at ASC LIMIT 1),
      (SELECT NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), '') FROM auth.users u WHERE LOWER(u.email) = LOWER(b.email) LIMIT 1),
      b.owner_name
    ) AS owner_name,
    COALESCE(
      NULLIF(TRIM(b.phone), ''),
      (SELECT NULLIF(TRIM(p.phone), '') FROM public.profiles p WHERE p.business_id = b.id AND NULLIF(TRIM(p.phone), '') IS NOT NULL ORDER BY p.created_at ASC LIMIT 1),
      (SELECT COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'phone'), ''), NULLIF(TRIM(u.phone), '')) FROM auth.users u WHERE LOWER(u.email) = LOWER(b.email) LIMIT 1),
      ''
    ) AS phone,
    b.email,
    b.package::TEXT,
    b.account_status::TEXT,
    b.expiry_date::TIMESTAMPTZ,
    b.created_at
  FROM public.businesses b
  ORDER BY b.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.super_admin_get_merchants_directory() TO authenticated;

NOTIFY pgrst, 'reload schema';

