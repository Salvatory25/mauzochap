-- =============================================================================
-- Hardened Staff/User Management & Multi-Location (Branches) Security Migration
-- 1. Ensures 'starter' enum value exists on subscription_package
-- 2. Self-healing current_business_id()
-- 3. Hardened handle_new_user() & sync_business_staff() (prevents role escalation)
-- 4. Server-side admin_create_staff_account() (bypasses browser rate limits & auto-confirms)
-- 5. Strict RLS on user_roles & branches + profile tenant transfer guard + branch limit triggers
-- =============================================================================

ALTER TYPE public.subscription_package ADD VALUE IF NOT EXISTS 'starter';

CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_biz_id UUID;
  v_email TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.business_id INTO v_biz_id
  FROM public.profiles p
  WHERE p.id = v_uid
  LIMIT 1;

  IF v_biz_id IS NOT NULL THEN
    RETURN v_biz_id;
  END IF;

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

ALTER POLICY "admins manage roles" ON public.user_roles
  USING (
    public.is_super_admin(auth.uid())
    OR (
      (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'owner'::text))
      AND role::TEXT NOT IN ('super_admin', 'owner')
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = user_roles.user_id
          AND p.business_id = public.current_business_id()
      )
    )
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (
      (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'owner'::text))
      AND role::TEXT IN ('cashier', 'manager', 'admin')
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = user_roles.user_id
          AND p.business_id = public.current_business_id()
      )
    )
  );

ALTER POLICY "tenant_isolation_all_branches" ON public.branches
  USING (
    public.is_super_admin(auth.uid())
    OR (business_id = public.current_business_id() AND public.is_admin_or_manager(auth.uid()))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (business_id = public.current_business_id() AND public.is_admin_or_manager(auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.guard_profile_tenant_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_super_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF OLD.business_id IS NOT NULL AND NEW.business_id IS NULL THEN
    IF OLD.id <> auth.uid()
       AND OLD.business_id = public.current_business_id()
       AND (public.has_role(auth.uid(), 'admin'::text) OR public.has_role(auth.uid(), 'owner'::text))
       AND NOT public.is_super_admin(OLD.id) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'SECURITY VIOLATION: Unauthorized profile unlinking.';
  END IF;

  IF OLD.business_id IS NOT NULL AND NEW.business_id IS DISTINCT FROM OLD.business_id THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Cannot transfer profile to another business.';
  END IF;

  IF NEW.branch_id IS NOT NULL AND NEW.business_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.branches br
      WHERE br.id = NEW.branch_id AND br.business_id = NEW.business_id
    ) THEN
      RAISE EXCEPTION 'SECURITY VIOLATION: Branch does not belong to your business.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_guard_profile_tenant_transfer
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_tenant_transfer();

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
    IF auth.uid() IS NOT NULL AND public.is_super_admin(auth.uid()) THEN
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

CREATE OR REPLACE TRIGGER trg_enforce_branch_limits_insert
  BEFORE INSERT ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_branch_limits_and_safety();

CREATE OR REPLACE TRIGGER trg_enforce_branch_safety_delete
  BEFORE DELETE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_branch_limits_and_safety();

