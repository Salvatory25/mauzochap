-- =============================================================================
-- MAUZOCHAP SECURE SUPER ADMIN CUSTOMER DASHBOARD ACCESS (ADDITIVE MIGRATION)
-- =============================================================================
-- Safety Guarantees:
--   1. Strictly additive: ZERO DROP TABLE, ZERO TRUNCATE, ZERO destructive DDL.
--   2. Preserves Super Admin's own auth.uid() & keeps customer sessions untouched.
--   3. Binds active support sessions to ONE target business at a time (partial unique index)
--      with mandatory server-side expiration (expires_at > now()).
--   4. Integrates active support session resolution into current_business_id() and
--      current_user_branch_id(), while tightening operational store RLS policies so
--      Super Admin queries during Support Mode are strictly isolated to ONLY the
--      selected target business (preventing cross-tenant data mixing).
--   5. Append-only, tamper-protected internal audit trail (super_admin_support_audit_logs)
--      recording session lifecycle, module views, and database-level mutations.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Support Sessions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.super_admin_support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  super_admin_email TEXT NOT NULL,
  target_business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  target_business_name TEXT NOT NULL,
  target_owner_id UUID NULL,
  active_branch_id UUID NULL REFERENCES public.branches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired', 'revoked')),
  reason TEXT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '60 minutes'),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ NULL
);

-- Enforce single-business binding: a Super Admin can have at most ONE active session at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_support_session_per_super_admin
  ON public.super_admin_support_sessions (super_admin_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_support_sessions_business_started
  ON public.super_admin_support_sessions (target_business_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_sessions_admin_started
  ON public.super_admin_support_sessions (super_admin_id, started_at DESC);

ALTER TABLE public.super_admin_support_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'super_admin_support_sessions'
      AND policyname = 'super_admins_read_support_sessions'
  ) THEN
    CREATE POLICY "super_admins_read_support_sessions"
      ON public.super_admin_support_sessions
      FOR SELECT
      TO authenticated
      USING (public.is_super_admin(auth.uid()));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Immutable Support Activity Audit Logs Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.super_admin_support_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NULL REFERENCES public.super_admin_support_sessions(id) ON DELETE SET NULL,
  super_admin_id UUID NOT NULL,
  super_admin_email TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT NULL,
  result TEXT NOT NULL DEFAULT 'success',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_audit_logs_session_created
  ON public.super_admin_support_audit_logs (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_audit_logs_business_created
  ON public.super_admin_support_audit_logs (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_audit_logs_admin_created
  ON public.super_admin_support_audit_logs (super_admin_id, created_at DESC);

ALTER TABLE public.super_admin_support_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'super_admin_support_audit_logs'
      AND policyname = 'super_admins_read_support_audit_logs'
  ) THEN
    CREATE POLICY "super_admins_read_support_audit_logs"
      ON public.super_admin_support_audit_logs
      FOR SELECT
      TO authenticated
      USING (public.is_super_admin(auth.uid()));
  END IF;
END $$;

-- Append-only protection: block UPDATE or DELETE on audit logs through application connections
CREATE OR REPLACE FUNCTION public.prevent_support_audit_log_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow CASCADE cleanup only if parent business is legitimately deleted (auth.uid() checked separately by business triggers)
  IF TG_OP = 'DELETE' AND NOT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = OLD.business_id) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'SECURITY LOCK: Support activity audit logs are append-only and cannot be modified or deleted.';
END;
$$;

CREATE OR REPLACE TRIGGER trg_immutable_support_audit_logs
  BEFORE UPDATE OR DELETE ON public.super_admin_support_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_support_audit_log_tampering();

-- -----------------------------------------------------------------------------
-- 3. Server-Side Support Context Resolution Helpers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.active_support_session_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_session_id UUID;
BEGIN
  IF v_uid IS NULL OR NOT public.is_super_admin(v_uid) THEN
    RETURN NULL;
  END IF;

  SELECT s.id INTO v_session_id
  FROM public.super_admin_support_sessions s
  WHERE s.super_admin_id = v_uid
    AND s.status = 'active'
    AND s.expires_at > now()
  LIMIT 1;

  RETURN v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.active_support_business_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_biz_id UUID;
BEGIN
  IF v_uid IS NULL OR NOT public.is_super_admin(v_uid) THEN
    RETURN NULL;
  END IF;

  SELECT s.target_business_id INTO v_biz_id
  FROM public.super_admin_support_sessions s
  WHERE s.super_admin_id = v_uid
    AND s.status = 'active'
    AND s.expires_at > now()
  LIMIT 1;

  RETURN v_biz_id;
END;
$$;

-- Upgrade current_business_id() to resolve active, unexpired Super Admin support session first
CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_support_biz UUID;
  v_biz_id UUID;
  v_email TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1. If caller is a verified Super Admin with an active, non-expired support session, bind strictly to target_business_id
  IF public.is_super_admin(v_uid) THEN
    SELECT s.target_business_id INTO v_support_biz
    FROM public.super_admin_support_sessions s
    WHERE s.super_admin_id = v_uid
      AND s.status = 'active'
      AND s.expires_at > now()
    LIMIT 1;

    IF v_support_biz IS NOT NULL THEN
      RETURN v_support_biz;
    END IF;
  END IF;

  -- 2. Standard resolution from profiles
  SELECT p.business_id INTO v_biz_id
  FROM public.profiles p
  WHERE p.id = v_uid
  LIMIT 1;

  IF v_biz_id IS NOT NULL THEN
    RETURN v_biz_id;
  END IF;

  -- 3. Self-healing fallback from auth.users metadata or business owner email
  SELECT
    u.email,
    CASE
      WHEN (u.raw_user_meta_data->>'business_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (u.raw_user_meta_data->>'business_id')::UUID
      ELSE NULL
    END
  INTO v_email, v_biz_id
  FROM auth.users u
  WHERE u.id = v_uid;

  IF v_biz_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = v_biz_id) THEN
    RETURN v_biz_id;
  END IF;

  IF v_email IS NOT NULL THEN
    SELECT b.id INTO v_biz_id
    FROM public.businesses b
    WHERE lower(b.email) = lower(v_email)
    ORDER BY b.created_at ASC
    LIMIT 1;
  END IF;

  RETURN v_biz_id;
END;
$$;

-- Upgrade current_user_branch_id() to resolve active support session branch first
CREATE OR REPLACE FUNCTION public.current_user_branch_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_support_branch UUID;
  v_support_biz UUID;
  v_branch_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  IF public.is_super_admin(v_uid) THEN
    SELECT s.active_branch_id, s.target_business_id
    INTO v_support_branch, v_support_biz
    FROM public.super_admin_support_sessions s
    WHERE s.super_admin_id = v_uid
      AND s.status = 'active'
      AND s.expires_at > now()
    LIMIT 1;

    IF v_support_biz IS NOT NULL THEN
      IF v_support_branch IS NOT NULL THEN
        RETURN v_support_branch;
      END IF;
      SELECT br.id INTO v_support_branch
      FROM public.branches br
      WHERE br.business_id = v_support_biz
      ORDER BY br.created_at ASC
      LIMIT 1;
      RETURN v_support_branch;
    END IF;
  END IF;

  SELECT p.branch_id INTO v_branch_id
  FROM public.profiles p
  WHERE p.id = v_uid
  LIMIT 1;

  RETURN v_branch_id;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Narrowly Scoped Operational Store RLS Policies
--    Replaces broad `OR is_super_admin(auth.uid())` on operational store tables
--    with strict `business_id = public.current_business_id()` so Super Admin in
--    Support Mode is bound exclusively to the single selected business, while
--    platform tables (`businesses`, `payments`, `notifications`, `daily_sms_report_logs`)
--    retain global Super Admin console visibility.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Standard operational tables with tenant_isolation_all_* / tenant_isolation_select_* policies
  FOR rec IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'branch_inventory',
        'categories',
        'customer_payments',
        'customers',
        'expenses',
        'invoice_items',
        'invoices',
        'product_batches',
        'products',
        'purchase_items',
        'purchases',
        'sale_items',
        'sales',
        'stock_movements',
        'stock_transfers',
        'supplier_payments',
        'suppliers'
      )
  LOOP
    IF rec.policyname LIKE 'auth delete %' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I USING ((business_id = public.current_business_id()) AND public.is_admin_or_manager(auth.uid()))',
        rec.policyname, rec.tablename
      );
    ELSIF rec.cmd = 'SELECT' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I USING (business_id = public.current_business_id())',
        rec.policyname, rec.tablename
      );
    ELSIF rec.cmd = 'INSERT' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I WITH CHECK (business_id = public.current_business_id())',
        rec.policyname, rec.tablename
      );
    ELSE
      EXECUTE format(
        'ALTER POLICY %I ON public.%I USING (business_id = public.current_business_id()) WITH CHECK (business_id = public.current_business_id())',
        rec.policyname, rec.tablename
      );
    END IF;
  END LOOP;

  -- Branches: strictly scoped to current_business_id() (admin/manager or Super Admin in support session for writes)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'auth read branches') THEN
    ALTER POLICY "auth read branches" ON public.branches USING (business_id = public.current_business_id());
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'tenant_isolation_select_branches') THEN
    ALTER POLICY "tenant_isolation_select_branches" ON public.branches USING (business_id = public.current_business_id());
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'managers manage branches') THEN
    ALTER POLICY "managers manage branches" ON public.branches
      USING ((business_id = public.current_business_id()) AND public.is_admin_or_manager(auth.uid()))
      WITH CHECK ((business_id = public.current_business_id()) AND public.is_admin_or_manager(auth.uid()));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'branches' AND policyname = 'tenant_isolation_all_branches') THEN
    ALTER POLICY "tenant_isolation_all_branches" ON public.branches
      USING ((business_id = public.current_business_id()) AND public.is_admin_or_manager(auth.uid()))
      WITH CHECK ((business_id = public.current_business_id()) AND public.is_admin_or_manager(auth.uid()));
  END IF;

  -- Profiles: when Super Admin is in Support Mode, restrict SELECT to own profile + target business profiles;
  -- when in Platform Console (active_support_business_id() IS NULL), allow directory phone sync read.
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles select own or any auth') THEN
    ALTER POLICY "profiles select own or any auth" ON public.profiles
      USING (
        (id = auth.uid())
        OR (business_id = public.current_business_id())
        OR (public.is_super_admin(auth.uid()) AND public.active_support_business_id() IS NULL)
      );
  END IF;

  -- User Roles: during Support Mode, bind Super Admin strictly to target business staff roles & never allow super_admin/owner assignment
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'admins see all roles') THEN
    ALTER POLICY "admins see all roles" ON public.user_roles
      USING (
        (public.is_super_admin(auth.uid()) AND public.active_support_business_id() IS NULL)
        OR (
          (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'owner'::text) OR public.is_super_admin(auth.uid()))
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = user_roles.user_id
              AND p.business_id = public.current_business_id()
          )
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'admins manage roles') THEN
    ALTER POLICY "admins manage roles" ON public.user_roles
      USING (
        (public.is_super_admin(auth.uid()) AND public.active_support_business_id() IS NULL)
        OR (
          (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'owner'::text) OR public.is_super_admin(auth.uid()))
          AND role::TEXT NOT IN ('super_admin', 'owner')
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = user_roles.user_id
              AND p.business_id = public.current_business_id()
          )
        )
      )
      WITH CHECK (
        (public.is_super_admin(auth.uid()) AND public.active_support_business_id() IS NULL)
        OR (
          (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'owner'::text) OR public.is_super_admin(auth.uid()))
          AND role::TEXT IN ('cashier', 'manager', 'admin')
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = user_roles.user_id
              AND p.business_id = public.current_business_id()
          )
        )
      );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'admins delete staff roles in own business') THEN
    ALTER POLICY "admins delete staff roles in own business" ON public.user_roles
      USING (
        (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'owner'::text) OR public.is_super_admin(auth.uid()))
        AND role::TEXT <> 'super_admin'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = user_roles.user_id
            AND p.business_id = public.current_business_id()
        )
      );
  END IF;
END $$;

-- Ensure package branch limits & staff limits also apply faithfully during Support Mode (Phase 4 requirement)
CREATE OR REPLACE FUNCTION public.enforce_branch_limits_and_safety()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg TEXT;
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Respect the target business's subscription package limits even during Support Mode
    IF auth.uid() IS NOT NULL AND public.is_super_admin(auth.uid()) AND public.active_support_business_id() IS NULL THEN
      RETURN NEW;
    END IF;

    SELECT LOWER(COALESCE(b.package::TEXT, 'kilimanjaro')) INTO v_pkg
    FROM public.businesses b
    WHERE b.id = NEW.business_id;

    v_limit := CASE
      WHEN v_pkg IN ('starter', 'basic') THEN 1
      WHEN v_pkg IN ('kilimanjaro', 'standard', 'zanzibar', 'trial') THEN 3
      ELSE 9999
    END;

    SELECT COUNT(*) INTO v_count
    FROM public.branches
    WHERE business_id = NEW.business_id;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'Limit Reached: Your % package allows up to % branch(es). Please upgrade to Serengeti for unlimited branches.', UPPER(COALESCE(v_pkg, 'kilimanjaro')), v_limit;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.branches
    WHERE business_id = OLD.business_id;

    IF v_count <= 1 THEN
      RAISE EXCEPTION 'Cannot delete the last remaining branch of a business.';
    END IF;

    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Guard admin_add_staff_member so Support Mode never overwrites Super Admin's own profile & enforces target business user limits
CREATE OR REPLACE FUNCTION public.admin_add_staff_member(
  _email TEXT,
  _full_name TEXT,
  _phone TEXT DEFAULT ''::TEXT,
  _role TEXT DEFAULT 'cashier'::TEXT,
  _branch_id TEXT DEFAULT NULL::TEXT,
  _user_id TEXT DEFAULT NULL::TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  caller_id UUID := auth.uid();
  target_biz_id UUID;
  target_branch_id UUID;
  target_user_id UUID;
  existing_biz_id UUID;
  clean_role TEXT;
  pkg_name TEXT;
  user_limit INTEGER;
  current_users INTEGER;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.has_role(caller_id, 'admin') OR
    public.has_role(caller_id, 'manager') OR
    public.has_role(caller_id, 'owner') OR
    public.is_super_admin(caller_id)
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only store administrators or managers can add staff';
  END IF;

  target_biz_id := public.current_business_id();
  IF target_biz_id IS NULL THEN
    RAISE EXCEPTION 'No business associated with your administrator profile';
  END IF;

  -- Never overwrite Super Admin's own profile when operating in Support Mode
  IF NOT public.is_super_admin(caller_id) THEN
    UPDATE public.profiles SET business_id = target_biz_id WHERE id = caller_id AND business_id IS NULL;
  END IF;

  -- Enforce target business's package user limit (including during Support Mode)
  IF NOT public.is_super_admin(caller_id) OR public.active_support_business_id() IS NOT NULL THEN
    SELECT LOWER(COALESCE(b.package::TEXT, 'kilimanjaro')) INTO pkg_name
    FROM public.businesses b WHERE b.id = target_biz_id;

    user_limit := CASE
      WHEN pkg_name IN ('starter', 'basic') THEN 2
      WHEN pkg_name IN ('kilimanjaro', 'standard', 'zanzibar', 'trial') THEN 10
      ELSE 9999
    END;

    SELECT COUNT(*) INTO current_users
    FROM public.profiles p
    WHERE p.business_id = target_biz_id;

    IF current_users >= user_limit THEN
      RAISE EXCEPTION 'Limit Reached: Your current package (%) allows up to % users. Please upgrade your plan to add more staff.', UPPER(pkg_name), user_limit;
    END IF;
  END IF;

  IF _user_id IS NOT NULL AND TRIM(_user_id) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    target_user_id := TRIM(_user_id)::UUID;
  END IF;

  IF target_user_id IS NULL AND _email IS NOT NULL AND TRIM(_email) <> '' THEN
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE LOWER(email) = LOWER(TRIM(_email))
    LIMIT 1;
  END IF;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found in authentication system. Please ensure the account was created.';
  END IF;

  -- Prevent modifying any super_admin account
  IF public.is_super_admin(target_user_id) AND target_user_id <> caller_id THEN
    RAISE EXCEPTION 'SECURITY LOCK: Cannot modify another Super Admin account.';
  END IF;

  SELECT p.business_id INTO existing_biz_id
  FROM public.profiles p
  WHERE p.id = target_user_id;

  IF existing_biz_id IS NOT NULL AND existing_biz_id <> target_biz_id THEN
    RAISE EXCEPTION 'Barua pepe hii tayari imesajiliwa kwenye duka jingine (This user already belongs to another business).';
  END IF;

  clean_role := LOWER(TRIM(COALESCE(_role, 'cashier')));
  IF clean_role NOT IN ('cashier', 'manager', 'admin') THEN
    clean_role := 'cashier';
  END IF;

  IF clean_role = 'admin' AND NOT (
    public.has_role(caller_id, 'admin') OR
    public.has_role(caller_id, 'owner') OR
    public.is_super_admin(caller_id)
  ) THEN
    clean_role := 'manager';
  END IF;

  IF _branch_id IS NOT NULL AND TRIM(_branch_id) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT id INTO target_branch_id
    FROM public.branches
    WHERE id = TRIM(_branch_id)::UUID AND business_id = target_biz_id
    LIMIT 1;
  END IF;

  IF target_branch_id IS NULL THEN
    SELECT id INTO target_branch_id
    FROM public.branches
    WHERE business_id = target_biz_id
    ORDER BY created_at ASC
    LIMIT 1;

    IF target_branch_id IS NULL THEN
      INSERT INTO public.branches (name, location, business_id)
      VALUES ('Main Branch', 'HQ', target_biz_id)
      RETURNING id INTO target_branch_id;
    END IF;
  END IF;

  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'full_name', COALESCE(NULLIF(TRIM(_full_name), ''), _email),
      'phone', NULLIF(TRIM(_phone), ''),
      'business_id', target_biz_id,
      'branch_id', target_branch_id,
      'role', clean_role
    ),
    updated_at = now()
  WHERE id = target_user_id;

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
    branch_id = target_branch_id,
    business_name = (SELECT business_name FROM public.businesses WHERE id = target_biz_id),
    phone = COALESCE(NULLIF(TRIM(_phone), ''), public.profiles.phone),
    full_name = COALESCE(NULLIF(TRIM(_full_name), ''), public.profiles.full_name);

  UPDATE public.user_roles
  SET role = clean_role::public.app_role
  WHERE user_id = target_user_id AND role <> 'super_admin';

  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, clean_role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'business_id', target_biz_id,
    'branch_id', target_branch_id,
    'role', clean_role
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Server-Authorized Support Session Management RPCs
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_super_admin_support_session(
  _target_business_id UUID,
  _reason TEXT DEFAULT NULL,
  _duration_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_admin_email TEXT;
  v_biz RECORD;
  v_owner_id UUID;
  v_branch_id UUID;
  v_duration INTEGER;
  v_session_id UUID;
  v_started_at TIMESTAMPTZ := now();
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_super_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only verified Super Administrators can initiate support sessions.';
  END IF;

  IF _target_business_id IS NULL THEN
    RAISE EXCEPTION 'Target business ID is required.';
  END IF;

  SELECT u.email INTO v_admin_email FROM auth.users u WHERE u.id = v_admin_id;

  SELECT b.* INTO v_biz
  FROM public.businesses b
  WHERE b.id = _target_business_id;

  IF v_biz.id IS NULL THEN
    RAISE EXCEPTION 'Target business does not exist.';
  END IF;

  -- Resolve target business owner ID (if registered)
  SELECT u.id INTO v_owner_id
  FROM auth.users u
  WHERE LOWER(u.email) = LOWER(COALESCE(v_biz.email, ''))
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    SELECT p.id INTO v_owner_id
    FROM public.profiles p
    WHERE p.business_id = _target_business_id
    ORDER BY p.created_at ASC
    LIMIT 1;
  END IF;

  -- Prevent accessing another Super Admin's private HQ account unless it is the caller's own business
  IF v_owner_id IS NOT NULL AND v_owner_id <> v_admin_id AND public.is_super_admin(v_owner_id) THEN
    RAISE EXCEPTION 'SECURITY LOCK: Cannot initiate support session into another Super Admin account.';
  END IF;

  -- Ensure at least one branch exists for the target business
  SELECT br.id INTO v_branch_id
  FROM public.branches br
  WHERE br.business_id = _target_business_id
  ORDER BY br.created_at ASC
  LIMIT 1;

  IF v_branch_id IS NULL THEN
    INSERT INTO public.branches (name, location, business_id)
    VALUES ('Main Branch', 'HQ', _target_business_id)
    RETURNING id INTO v_branch_id;
  END IF;

  -- Clamp session duration between 15 minutes and 240 minutes (4 hours)
  v_duration := GREATEST(15, LEAST(COALESCE(_duration_minutes, 60), 240));
  v_expires_at := v_started_at + make_interval(mins => v_duration);

  -- Close any prior active session for this Super Admin before starting the new one
  UPDATE public.super_admin_support_sessions
  SET
    status = CASE WHEN expires_at <= now() THEN 'expired' ELSE 'ended' END,
    ended_at = now()
  WHERE super_admin_id = v_admin_id
    AND status = 'active';

  INSERT INTO public.super_admin_support_sessions (
    super_admin_id,
    super_admin_email,
    target_business_id,
    target_business_name,
    target_owner_id,
    active_branch_id,
    status,
    reason,
    started_at,
    expires_at,
    last_activity_at
  ) VALUES (
    v_admin_id,
    COALESCE(v_admin_email, 'super_admin'),
    v_biz.id,
    v_biz.business_name,
    v_owner_id,
    v_branch_id,
    'active',
    NULLIF(TRIM(COALESCE(_reason, '')), ''),
    v_started_at,
    v_expires_at,
    v_started_at
  )
  RETURNING id INTO v_session_id;

  INSERT INTO public.super_admin_support_audit_logs (
    session_id,
    super_admin_id,
    super_admin_email,
    business_id,
    business_name,
    action,
    module,
    record_id,
    result,
    metadata
  ) VALUES (
    v_session_id,
    v_admin_id,
    COALESCE(v_admin_email, 'super_admin'),
    v_biz.id,
    v_biz.business_name,
    'session_started',
    'session',
    v_session_id::TEXT,
    'success',
    jsonb_build_object(
      'duration_minutes', v_duration,
      'expires_at', v_expires_at,
      'reason', NULLIF(TRIM(COALESCE(_reason, '')), ''),
      'initial_branch_id', v_branch_id
    )
  );

  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'super_admin_id', v_admin_id,
    'super_admin_email', COALESCE(v_admin_email, 'super_admin'),
    'target_business_id', v_biz.id,
    'target_business_name', v_biz.business_name,
    'target_owner_id', v_owner_id,
    'active_branch_id', v_branch_id,
    'reason', NULLIF(TRIM(COALESCE(_reason, '')), ''),
    'started_at', v_started_at,
    'expires_at', v_expires_at,
    'status', 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_super_admin_support_session()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_sess RECORD;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_super_admin(v_admin_id) THEN
    RETURN NULL;
  END IF;

  -- Auto-expire any stale active sessions whose expires_at has passed
  FOR v_sess IN
    UPDATE public.super_admin_support_sessions
    SET status = 'expired', ended_at = now()
    WHERE super_admin_id = v_admin_id
      AND status = 'active'
      AND expires_at <= now()
    RETURNING *
  LOOP
    INSERT INTO public.super_admin_support_audit_logs (
      session_id, super_admin_id, super_admin_email, business_id, business_name,
      action, module, record_id, result, metadata
    ) VALUES (
      v_sess.id, v_sess.super_admin_id, v_sess.super_admin_email, v_sess.target_business_id, v_sess.target_business_name,
      'session_expired', 'session', v_sess.id::TEXT, 'success',
      jsonb_build_object('started_at', v_sess.started_at, 'expired_at', now())
    );
  END LOOP;

  SELECT s.* INTO v_sess
  FROM public.super_admin_support_sessions s
  WHERE s.super_admin_id = v_admin_id
    AND s.status = 'active'
    AND s.expires_at > now()
  LIMIT 1;

  IF v_sess.id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.super_admin_support_sessions
  SET last_activity_at = now()
  WHERE id = v_sess.id;

  RETURN jsonb_build_object(
    'session_id', v_sess.id,
    'super_admin_id', v_sess.super_admin_id,
    'super_admin_email', v_sess.super_admin_email,
    'target_business_id', v_sess.target_business_id,
    'target_business_name', v_sess.target_business_name,
    'target_owner_id', v_sess.target_owner_id,
    'active_branch_id', v_sess.active_branch_id,
    'reason', v_sess.reason,
    'started_at', v_sess.started_at,
    'expires_at', v_sess.expires_at,
    'status', v_sess.status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.switch_support_session_branch(
  _session_id UUID,
  _branch_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_sess RECORD;
  v_branch_name TEXT;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_super_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Super Admin access required.';
  END IF;

  SELECT * INTO v_sess
  FROM public.super_admin_support_sessions
  WHERE id = _session_id
    AND super_admin_id = v_admin_id
    AND status = 'active'
    AND expires_at > now();

  IF v_sess.id IS NULL THEN
    RAISE EXCEPTION 'Support session is invalid or has expired.';
  END IF;

  SELECT br.name INTO v_branch_name
  FROM public.branches br
  WHERE br.id = _branch_id
    AND br.business_id = v_sess.target_business_id;

  IF v_branch_name IS NULL THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Selected branch does not belong to the active support business.';
  END IF;

  UPDATE public.super_admin_support_sessions
  SET active_branch_id = _branch_id, last_activity_at = now()
  WHERE id = v_sess.id;

  INSERT INTO public.super_admin_support_audit_logs (
    session_id, super_admin_id, super_admin_email, business_id, business_name,
    action, module, record_id, result, metadata
  ) VALUES (
    v_sess.id, v_sess.super_admin_id, v_sess.super_admin_email, v_sess.target_business_id, v_sess.target_business_name,
    'branch_switched', 'locations', _branch_id::TEXT, 'success',
    jsonb_build_object('branch_id', _branch_id, 'branch_name', v_branch_name)
  );

  RETURN jsonb_build_object('success', true, 'active_branch_id', _branch_id, 'branch_name', v_branch_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.end_super_admin_support_session(
  _session_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_sess RECORD;
  v_ended_count INTEGER := 0;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_super_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Super Admin access required.';
  END IF;

  FOR v_sess IN
    UPDATE public.super_admin_support_sessions
    SET status = 'ended', ended_at = now(), last_activity_at = now()
    WHERE super_admin_id = v_admin_id
      AND status = 'active'
      AND (_session_id IS NULL OR id = _session_id)
    RETURNING *
  LOOP
    v_ended_count := v_ended_count + 1;
    INSERT INTO public.super_admin_support_audit_logs (
      session_id, super_admin_id, super_admin_email, business_id, business_name,
      action, module, record_id, result, metadata
    ) VALUES (
      v_sess.id, v_sess.super_admin_id, v_sess.super_admin_email, v_sess.target_business_id, v_sess.target_business_name,
      'session_ended', 'session', v_sess.id::TEXT, 'success',
      jsonb_build_object(
        'started_at', v_sess.started_at,
        'ended_at', now(),
        'duration_seconds', EXTRACT(EPOCH FROM (now() - v_sess.started_at))::INTEGER
      )
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'ended_count', v_ended_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_support_audit_event(
  _session_id UUID,
  _action TEXT,
  _module TEXT,
  _record_id TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_sess RECORD;
  v_safe_meta JSONB;
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_super_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Super Admin access required.';
  END IF;

  SELECT * INTO v_sess
  FROM public.super_admin_support_sessions
  WHERE id = _session_id
    AND super_admin_id = v_admin_id
    AND status = 'active'
    AND expires_at > now();

  IF v_sess.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'session_inactive_or_expired');
  END IF;

  -- Strip any accidental sensitive keys from metadata
  v_safe_meta := COALESCE(_metadata, '{}'::jsonb) - 'password' - 'token' - 'access_token' - 'refresh_token' - 'secret';

  UPDATE public.super_admin_support_sessions
  SET last_activity_at = now()
  WHERE id = v_sess.id;

  INSERT INTO public.super_admin_support_audit_logs (
    session_id, super_admin_id, super_admin_email, business_id, business_name,
    action, module, record_id, result, metadata
  ) VALUES (
    v_sess.id, v_sess.super_admin_id, v_sess.super_admin_email, v_sess.target_business_id, v_sess.target_business_name,
    LEFT(TRIM(COALESCE(_action, 'activity')), 100),
    LEFT(TRIM(COALESCE(_module, 'general')), 60),
    _record_id,
    'success',
    v_safe_meta
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Safe Settings update RPC during Support Mode (updates target business & owner profile without touching Super Admin's own profile)
CREATE OR REPLACE FUNCTION public.support_update_business_settings(
  _session_id UUID,
  _business_name TEXT,
  _owner_name TEXT,
  _phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_sess RECORD;
  v_clean_biz_name TEXT := NULLIF(TRIM(COALESCE(_business_name, '')), '');
  v_clean_owner_name TEXT := NULLIF(TRIM(COALESCE(_owner_name, '')), '');
  v_clean_phone TEXT := NULLIF(TRIM(COALESCE(_phone, '')), '');
BEGIN
  IF v_admin_id IS NULL OR NOT public.is_super_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Super Admin access required.';
  END IF;

  SELECT * INTO v_sess
  FROM public.super_admin_support_sessions
  WHERE id = _session_id
    AND super_admin_id = v_admin_id
    AND status = 'active'
    AND expires_at > now();

  IF v_sess.id IS NULL THEN
    RAISE EXCEPTION 'Support session is invalid or has expired.';
  END IF;

  UPDATE public.businesses
  SET
    business_name = COALESCE(v_clean_biz_name, business_name),
    owner_name = COALESCE(v_clean_owner_name, owner_name),
    phone = v_clean_phone
  WHERE id = v_sess.target_business_id;

  IF v_clean_biz_name IS NOT NULL THEN
    UPDATE public.super_admin_support_sessions
    SET target_business_name = v_clean_biz_name, last_activity_at = now()
    WHERE id = v_sess.id;
  END IF;

  -- Sync target business owner's profile if present and not a Super Admin
  IF v_sess.target_owner_id IS NOT NULL AND NOT public.is_super_admin(v_sess.target_owner_id) THEN
    UPDATE public.profiles
    SET
      full_name = COALESCE(v_clean_owner_name, full_name),
      business_name = COALESCE(v_clean_biz_name, business_name),
      phone = COALESCE(v_clean_phone, phone)
    WHERE id = v_sess.target_owner_id
      AND business_id = v_sess.target_business_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.start_super_admin_support_session(UUID, TEXT, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_super_admin_support_session(UUID, TEXT, INTEGER) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_current_super_admin_support_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_super_admin_support_session() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.switch_support_session_branch(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.switch_support_session_branch(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.end_super_admin_support_session(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.end_super_admin_support_session(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_support_audit_event(UUID, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_support_audit_event(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.support_update_business_settings(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_update_business_settings(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 6. Automatic Database-Level Support Mutation Audit Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_support_session_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_sess RECORD;
  v_row JSONB;
  v_record_id TEXT;
  v_row_biz_id UUID;
  v_module TEXT;
  v_action TEXT;
  v_summary JSONB;
BEGIN
  -- Immediate zero-cost exit for all normal customer/staff traffic
  IF v_uid IS NULL OR NOT public.is_super_admin(v_uid) THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_sess
  FROM public.super_admin_support_sessions
  WHERE super_admin_id = v_uid
    AND status = 'active'
    AND expires_at > now()
  LIMIT 1;

  IF v_sess.id IS NULL THEN
    RETURN NULL;
  END IF;

  v_row := to_jsonb(COALESCE(NEW, OLD));
  v_record_id := COALESCE(v_row->>'id', v_row->>'user_id');

  -- Verify mutation pertains to the active support session's business
  IF TG_TABLE_NAME = 'businesses' THEN
    v_row_biz_id := (v_row->>'id')::UUID;
  ELSIF v_row ? 'business_id' AND (v_row->>'business_id') IS NOT NULL THEN
    v_row_biz_id := (v_row->>'business_id')::UUID;
  ELSE
    v_row_biz_id := v_sess.target_business_id;
  END IF;

  IF v_row_biz_id IS DISTINCT FROM v_sess.target_business_id THEN
    RETURN NULL;
  END IF;

  v_module := CASE TG_TABLE_NAME
    WHEN 'sales' THEN 'sales'
    WHEN 'products' THEN 'products'
    WHEN 'categories' THEN 'categories'
    WHEN 'branch_inventory' THEN 'inventory'
    WHEN 'product_batches' THEN 'inventory'
    WHEN 'stock_transfers' THEN 'inventory'
    WHEN 'purchases' THEN 'inventory'
    WHEN 'customers' THEN 'customers'
    WHEN 'customer_payments' THEN 'customers'
    WHEN 'suppliers' THEN 'suppliers'
    WHEN 'supplier_payments' THEN 'suppliers'
    WHEN 'expenses' THEN 'expenses'
    WHEN 'invoices' THEN 'invoices'
    WHEN 'branches' THEN 'locations'
    WHEN 'user_roles' THEN 'users'
    WHEN 'profiles' THEN 'users'
    WHEN 'businesses' THEN 'settings'
    ELSE TG_TABLE_NAME
  END;

  v_action := TG_TABLE_NAME || '_' || LOWER(TG_OP);

  -- Sanitized operational metadata only (never passwords, secrets, or large binary blobs)
  v_summary := jsonb_strip_nulls(jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'name', COALESCE(v_row->>'name', v_row->>'business_name', v_row->>'full_name'),
    'receipt_number', v_row->>'receipt_number',
    'invoice_number', v_row->>'invoice_number',
    'total', COALESCE(v_row->>'total', v_row->>'total_amount', v_row->>'amount'),
    'status', COALESCE(v_row->>'status', v_row->>'payment_status', v_row->>'account_status'),
    'stock_quantity', v_row->>'stock_quantity',
    'role', v_row->>'role'
  ));

  INSERT INTO public.super_admin_support_audit_logs (
    session_id,
    super_admin_id,
    super_admin_email,
    business_id,
    business_name,
    action,
    module,
    record_id,
    result,
    metadata
  ) VALUES (
    v_sess.id,
    v_sess.super_admin_id,
    v_sess.super_admin_email,
    v_sess.target_business_id,
    v_sess.target_business_name,
    v_action,
    v_module,
    v_record_id,
    'success',
    v_summary
  );

  UPDATE public.super_admin_support_sessions
  SET last_activity_at = now()
  WHERE id = v_sess.id;

  RETURN NULL;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'sales',
    'products',
    'categories',
    'branch_inventory',
    'product_batches',
    'stock_transfers',
    'purchases',
    'customers',
    'customer_payments',
    'suppliers',
    'supplier_payments',
    'expenses',
    'invoices',
    'branches',
    'user_roles',
    'profiles',
    'businesses'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_support_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_support_session_mutation()',
      t, t
    );
  END LOOP;
END $$;
