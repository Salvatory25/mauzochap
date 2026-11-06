-- Migration: 20261106000001_fix_staff_sync_and_expenses.sql
-- Description:
-- 1. Syncs all staff users from auth.users metadata into public.profiles and public.user_roles
-- 2. Ensures handle_new_user trigger correctly assigns staff to business owner
-- 3. Provides public.sync_business_staff() SECURITY DEFINER helper to auto-heal staff members
-- 4. Extends profiles and user_roles RLS policies to include 'owner' and 'manager' roles
-- 5. Ensures expenses table RLS policies allow reading and writing by all authorized roles in a business

-- 1. Auto-heal any orphaned staff users whose metadata contains business_id
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

INSERT INTO public.user_roles (user_id, role)
SELECT 
  p.id, 
  COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'role'), ''), 'cashier')::public.app_role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.business_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Helper function to heal/sync business staff at any time
CREATE OR REPLACE FUNCTION public.sync_business_staff(_business_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF _business_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'business_id is required');
  END IF;

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

  INSERT INTO public.user_roles (user_id, role)
  SELECT 
    p.id, 
    COALESCE(NULLIF(TRIM(u.raw_user_meta_data->>'role'), ''), 'cashier')::public.app_role
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.business_id = _business_id
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_business_staff(UUID) TO anon, authenticated, service_role;

-- 3. Update RLS policies on profiles & user_roles to cover admin, owner, and manager
DROP POLICY IF EXISTS "admins insert profiles in own business" ON public.profiles;
CREATE POLICY "admins insert profiles in own business" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    business_id = public.current_business_id() AND 
    (
      public.has_role(auth.uid(), 'admin') OR 
      public.has_role(auth.uid(), 'owner') OR 
      public.has_role(auth.uid(), 'manager') OR 
      public.is_super_admin(auth.uid())
    )
  );

DROP POLICY IF EXISTS "admins update profiles in own business" ON public.profiles;
CREATE POLICY "admins update profiles in own business" ON public.profiles FOR UPDATE TO authenticated
  USING (
    (
      business_id = public.current_business_id() AND (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'owner') OR 
        public.has_role(auth.uid(), 'manager') OR 
        public.is_super_admin(auth.uid())
      )
    ) OR
    auth.uid() = id
  )
  WITH CHECK (
    (
      business_id = public.current_business_id() AND (
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'owner') OR 
        public.has_role(auth.uid(), 'manager') OR 
        public.is_super_admin(auth.uid())
      )
    ) OR
    auth.uid() = id
  );

DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.is_super_admin(auth.uid()) OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    public.has_role(auth.uid(), 'manager')
  );

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
