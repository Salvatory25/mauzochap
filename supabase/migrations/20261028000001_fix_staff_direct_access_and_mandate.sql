-- Migration: Direct Staff Access, Owner Mandate, and User Assignment RPC
-- Ensures staff added by business owners never get blocked by subscription verification,
-- and allows business owners to add or assign existing users directly to their business.

-- Step 1: Explicitly drop any existing function signatures to prevent Postgres 42P13 errors
DROP FUNCTION IF EXISTS public.admin_add_staff_member(TEXT, TEXT, TEXT, TEXT, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.admin_add_staff_member(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.admin_add_staff_member(JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.admin_add_staff_member CASCADE;

-- Step 2: Create admin_add_staff_member RPC function with flexible TEXT parameters
CREATE OR REPLACE FUNCTION public.admin_add_staff_member(
  _email TEXT,
  _full_name TEXT,
  _phone TEXT DEFAULT '',
  _role TEXT DEFAULT 'cashier',
  _branch_id TEXT DEFAULT NULL,
  _user_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id UUID := auth.uid();
  target_biz_id UUID;
  target_branch_id UUID;
  target_user_id UUID;
  clean_role TEXT;
BEGIN
  -- Verify caller is authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify caller is admin, manager, owner or super_admin
  IF NOT (
    public.has_role(caller_id, 'admin') OR 
    public.has_role(caller_id, 'manager') OR 
    public.has_role(caller_id, 'owner') OR 
    public.is_super_admin(caller_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only store administrators, managers or super admins can add staff';
  END IF;

  -- Get caller's business_id
  SELECT business_id INTO target_biz_id FROM public.profiles WHERE id = caller_id;
  IF target_biz_id IS NULL THEN
    -- Fallback: Check if they own any business in public.businesses
    SELECT id INTO target_biz_id FROM public.businesses WHERE email = (SELECT email FROM auth.users WHERE id = caller_id) LIMIT 1;
    IF target_biz_id IS NOT NULL THEN
      UPDATE public.profiles SET business_id = target_biz_id WHERE id = caller_id;
    END IF;
  END IF;

  IF target_biz_id IS NULL AND NOT public.is_super_admin(caller_id) THEN
    RAISE EXCEPTION 'No business associated with the current administrator profile';
  END IF;

  -- Determine target user_id
  IF _user_id IS NOT NULL AND TRIM(_user_id) <> '' THEN
    BEGIN
      target_user_id := TRIM(_user_id)::UUID;
    EXCEPTION WHEN OTHERS THEN
      target_user_id := NULL;
    END;
  END IF;

  IF target_user_id IS NULL AND _email IS NOT NULL AND TRIM(_email) <> '' THEN
    SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(TRIM(_email)) LIMIT 1;
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found in authentication system. Please ensure the user was created.';
  END IF;

  -- Determine clean role
  clean_role := LOWER(COALESCE(_role, 'cashier'));
  IF clean_role NOT IN ('cashier', 'manager', 'admin', 'owner') THEN
    clean_role := 'cashier';
  END IF;

  -- Validate or find branch
  IF _branch_id IS NOT NULL AND TRIM(_branch_id) <> '' THEN
    BEGIN
      IF EXISTS (
        SELECT 1 FROM public.branches 
        WHERE id = TRIM(_branch_id)::UUID AND business_id = target_biz_id
      ) THEN
        target_branch_id := TRIM(_branch_id)::UUID;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      target_branch_id := NULL;
    END;
  END IF;

  IF target_branch_id IS NULL THEN
    SELECT id INTO target_branch_id FROM public.branches WHERE business_id = target_biz_id ORDER BY created_at ASC LIMIT 1;
    IF target_branch_id IS NULL THEN
      INSERT INTO public.branches (name, location, business_id)
      VALUES ('Main Branch', 'HQ', target_biz_id)
      RETURNING id INTO target_branch_id;
    END IF;
  END IF;

  -- Upsert Profile linked to the store owner's business
  INSERT INTO public.profiles (id, full_name, business_name, phone, business_id, branch_id)
  VALUES (
    target_user_id,
    COALESCE(NULLIF(TRIM(_full_name), ''), _email),
    (SELECT business_name FROM public.businesses WHERE id = target_biz_id),
    NULLIF(TRIM(_phone), ''),
    target_biz_id,
    target_branch_id
  )
  ON CONFLICT (id) DO UPDATE SET
    business_id = target_biz_id,
    branch_id = COALESCE(target_branch_id, profiles.branch_id),
    business_name = (SELECT business_name FROM public.businesses WHERE id = target_biz_id),
    phone = COALESCE(NULLIF(TRIM(_phone), ''), profiles.phone),
    full_name = COALESCE(NULLIF(TRIM(_full_name), ''), profiles.full_name);

  -- Upsert Role
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, clean_role::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'business_id', target_biz_id,
    'branch_id', target_branch_id,
    'role', clean_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_add_staff_member(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- Overload with single JSONB parameter (matches PostgREST fallback directly)
CREATE OR REPLACE FUNCTION public.admin_add_staff_member(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN public.admin_add_staff_member(
    payload->>'_email',
    payload->>'_full_name',
    COALESCE(payload->>'_phone', ''),
    COALESCE(payload->>'_role', 'cashier'),
    payload->>'_branch_id',
    payload->>'_user_id'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_add_staff_member(JSONB) TO anon, authenticated, service_role;

-- Step 3: Update RLS policies so admins have full authority over their staff profiles
DROP POLICY IF EXISTS "admins insert profiles in own business" ON public.profiles;
CREATE POLICY "admins insert profiles in own business" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    business_id = public.current_business_id() AND 
    (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "admins update profiles in own business" ON public.profiles;
CREATE POLICY "admins update profiles in own business" ON public.profiles FOR UPDATE TO authenticated
  USING (
    (business_id = public.current_business_id() AND (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))) OR
    auth.uid() = id
  )
  WITH CHECK (
    (business_id = public.current_business_id() AND (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))) OR
    auth.uid() = id
  );

-- Step 4: Update user_roles RLS so admins can manage roles in their business
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.is_super_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

-- Step 5: Reload PostgREST schema cache immediately
SELECT pg_notification_queue_usage();
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
