-- Migration: Fix business user assignment, ensure business owner authority, and allow business admins to manage profiles
-- Description:
-- 1. Safely creates prerequisite enums and tables (businesses, branches, profiles, user_roles, notifications) if they do not exist
-- 2. Ensures functions (has_role, is_super_admin, is_admin_or_manager, handle_new_user) are defined AFTER tables exist
-- 3. Grants business admins full authority over staff in their business without superadmin approval
-- 4. Enables seamless branch creation and management

-- ============================================================================
-- 1. ENUMS (Safe Idempotent Creation)
-- ============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE public.account_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_package') THEN
    CREATE TYPE public.subscription_package AS ENUM ('kilimanjaro', 'serengeti', 'zanzibar', 'uhuru', 'trial');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'owner', 'super_admin');
  ELSE
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- ============================================================================
-- 2. PREREQUISITE TABLES (Safe Idempotent Creation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  account_status public.account_status NOT NULL DEFAULT 'pending',
  package public.subscription_package NOT NULL DEFAULT 'kilimanjaro',
  expiry_date DATE,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  business_name TEXT,
  phone TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Grant standard permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated, service_role;

-- ============================================================================
-- 3. HELPER FUNCTIONS (Safe definitions after tables exist)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role::TEXT = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role::TEXT = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role::TEXT IN ('admin', 'manager', 'owner', 'super_admin')
  );
$$;

-- ============================================================================
-- 4. HANDLE NEW USER TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  user_count INTEGER;
  target_biz_id UUID;
  target_branch_id UUID;
  target_role TEXT;
  selected_pkg TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;

  -- 1. Check if business_id was provided in user metadata and exists (User added by Business Owner)
  IF (NEW.raw_user_meta_data->>'business_id') IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.businesses WHERE id = (NEW.raw_user_meta_data->>'business_id')::UUID
  ) THEN
    target_biz_id := (NEW.raw_user_meta_data->>'business_id')::UUID;
    
    -- Check if branch_id was provided and valid, otherwise fallback to first branch
    IF (NEW.raw_user_meta_data->>'branch_id') IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.branches WHERE id = (NEW.raw_user_meta_data->>'branch_id')::UUID
    ) THEN
      target_branch_id := (NEW.raw_user_meta_data->>'branch_id')::UUID;
    ELSE
      SELECT id INTO target_branch_id 
      FROM public.branches 
      WHERE business_id = target_biz_id 
      ORDER BY created_at ASC 
      LIMIT 1;
    END IF;

    -- If no branch exists yet for this business, create a default Main Branch
    IF target_branch_id IS NULL THEN
      INSERT INTO public.branches (name, location, business_id)
      VALUES ('Main Branch', 'HQ', target_biz_id)
      RETURNING id INTO target_branch_id;
    END IF;
    
    -- Target role chosen by the business owner (admin, manager, or cashier)
    target_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cashier');
    IF target_role NOT IN ('admin', 'manager', 'cashier', 'owner', 'super_admin') THEN
      target_role := 'cashier';
    END IF;

    -- Create profile linked directly to the business owner's business
    INSERT INTO public.profiles (id, full_name, business_name, phone, business_id, branch_id)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      (SELECT business_name FROM public.businesses WHERE id = target_biz_id),
      NEW.raw_user_meta_data->>'phone',
      target_biz_id,
      target_branch_id
    )
    ON CONFLICT (id) DO UPDATE SET
      business_id = target_biz_id,
      branch_id = COALESCE(target_branch_id, profiles.branch_id),
      business_name = (SELECT business_name FROM public.businesses WHERE id = target_biz_id),
      phone = COALESCE(NEW.raw_user_meta_data->>'phone', profiles.phone),
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name);

    -- Insert user role immediately with full authority given by the business owner
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, target_role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
  END IF;

  -- 2. Brand New Merchant Registration (Requires selecting package and completing payment verification)
  selected_pkg := COALESCE(NEW.raw_user_meta_data->>'package', 'kilimanjaro');
  IF selected_pkg = 'trial' OR selected_pkg NOT IN ('kilimanjaro', 'serengeti', 'zanzibar', 'uhuru') THEN
    selected_pkg := 'kilimanjaro';
  END IF;

  INSERT INTO public.businesses (business_name, owner_name, email, phone, account_status, package, expiry_date)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Owner'), 
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    'pending'::public.account_status,
    selected_pkg::public.subscription_package,
    NULL
  )
  RETURNING id INTO target_biz_id;
  
  -- Create a default branch for this new business
  INSERT INTO public.branches (name, location, business_id)
  VALUES ('Main Branch', COALESCE(NEW.raw_user_meta_data->>'region', 'HQ'), target_biz_id)
  RETURNING id INTO target_branch_id;

  INSERT INTO public.profiles (id, full_name, business_name, phone, business_id, branch_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    NEW.raw_user_meta_data->>'phone',
    target_biz_id,
    target_branch_id
  )
  ON CONFLICT (id) DO UPDATE SET
    business_id = target_biz_id,
    branch_id = COALESCE(target_branch_id, profiles.branch_id),
    business_name = COALESCE(NEW.raw_user_meta_data->>'business_name', profiles.business_name),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', profiles.phone),
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name);
  
  IF user_count = 0 THEN
    -- First ever user in database is super_admin
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Default role for new business owner is admin
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  INSERT INTO public.notifications (business_id, title, message, type)
  VALUES (
    target_biz_id,
    'Karibu MauzoChap!',
    'Asante kwa kujiunga na MauzoChap POS! Tafadhali chagua kifurushi chako na weka namba ya muamala ili kuanza kutumia mfumo.',
    'subscription'
  );
  
  RETURN NEW;
END; $$;

-- Set up trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- Profiles policies
DROP POLICY IF EXISTS "profiles select own or any auth" ON public.profiles;
CREATE POLICY "profiles select own or any auth" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles insert own" ON public.profiles;
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admins update profiles in own business" ON public.profiles;
CREATE POLICY "admins update profiles in own business" ON public.profiles FOR UPDATE TO authenticated
  USING (
    business_id = public.current_business_id() AND 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    business_id = public.current_business_id() AND 
    public.has_role(auth.uid(), 'admin')
  );

-- User roles policies
DROP POLICY IF EXISTS "users see own roles" ON public.user_roles;
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated 
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admins see all roles" ON public.user_roles;
CREATE POLICY "admins see all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid()) OR
    (
      public.has_role(auth.uid(), 'admin') AND 
      (SELECT business_id FROM public.profiles WHERE id = user_id) = public.current_business_id()
    )
  );

DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (
    public.is_super_admin(auth.uid()) OR
    (
      public.has_role(auth.uid(), 'admin') AND 
      (SELECT business_id FROM public.profiles WHERE id = user_id) = public.current_business_id()
    )
  )
  WITH CHECK (
    public.is_super_admin(auth.uid()) OR
    (
      public.has_role(auth.uid(), 'admin') AND 
      (SELECT business_id FROM public.profiles WHERE id = user_id) = public.current_business_id()
    )
  );

DROP POLICY IF EXISTS "admins delete staff roles in own business" ON public.user_roles;
CREATE POLICY "admins delete staff roles in own business" ON public.user_roles FOR DELETE TO authenticated
  USING (
    public.is_super_admin(auth.uid()) OR
    (
      public.has_role(auth.uid(), 'admin') AND 
      (SELECT business_id FROM public.profiles WHERE id = user_id) = public.current_business_id()
    )
  );

-- Branches policies
DROP POLICY IF EXISTS "auth read branches" ON public.branches;
DROP POLICY IF EXISTS "managers manage branches" ON public.branches;

CREATE POLICY "auth read branches" ON public.branches 
  FOR SELECT TO authenticated 
  USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "managers manage branches" ON public.branches 
  FOR ALL TO authenticated 
  USING (
    (business_id = public.current_business_id() AND public.is_admin_or_manager(auth.uid())) OR 
    public.is_super_admin(auth.uid())
  )
  WITH CHECK (
    (business_id = public.current_business_id() AND public.is_admin_or_manager(auth.uid())) OR 
    public.is_super_admin(auth.uid())
  );

-- Notifications policies
DROP POLICY IF EXISTS "users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "allow all insert notifications" ON public.notifications;

CREATE POLICY "users read own notifications" ON public.notifications 
  FOR SELECT TO authenticated USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "users update own notifications" ON public.notifications 
  FOR UPDATE TO authenticated USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "allow all insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));
