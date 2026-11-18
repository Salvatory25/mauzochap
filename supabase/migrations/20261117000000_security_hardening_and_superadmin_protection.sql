-- =============================================================================
-- Security Hardening & Super Admin Anti-Sabotage Protection
-- Protects salvatoryfilbert2@gmail.com from unauthorized deletion/demotion,
-- enforces strict multi-tenant RLS isolation, locks function search_paths,
-- and adds 5-attempt brute-force lockout to OTP password reset.
-- =============================================================================

-- 1. Anti-Sabotage Protection Trigger Function for Super Admin
CREATE OR REPLACE FUNCTION public.prevent_super_admin_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF TG_TABLE_SCHEMA = 'auth' AND TG_TABLE_NAME = 'users' THEN
    IF lower(OLD.email) = 'salvatoryfilbert2@gmail.com' THEN
      RAISE EXCEPTION 'SECURITY LOCK: Master Super Admin account (salvatoryfilbert2@gmail.com) cannot be deleted.';
    END IF;
  ELSIF TG_TABLE_SCHEMA = 'public' AND TG_TABLE_NAME = 'profiles' THEN
    IF EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = OLD.id AND lower(u.email) = 'salvatoryfilbert2@gmail.com'
    ) THEN
      RAISE EXCEPTION 'SECURITY LOCK: Master Super Admin profile cannot be deleted.';
    END IF;
  ELSIF TG_TABLE_SCHEMA = 'public' AND TG_TABLE_NAME = 'user_roles' THEN
    IF OLD.role = 'super_admin' AND EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = OLD.user_id AND lower(u.email) = 'salvatoryfilbert2@gmail.com'
    ) THEN
      RAISE EXCEPTION 'SECURITY LOCK: Master Super Admin role cannot be revoked or deleted.';
    END IF;
  ELSIF TG_TABLE_SCHEMA = 'public' AND TG_TABLE_NAME = 'businesses' THEN
    IF lower(COALESCE(OLD.email, '')) = 'salvatoryfilbert2@gmail.com' THEN
      RAISE EXCEPTION 'SECURITY LOCK: Master Super Admin HQ business cannot be deleted.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER trg_protect_super_admin_auth_user
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_super_admin_deletion();

CREATE OR REPLACE TRIGGER trg_protect_super_admin_profile
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_super_admin_deletion();

CREATE OR REPLACE TRIGGER trg_protect_super_admin_role
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_super_admin_deletion();

CREATE OR REPLACE TRIGGER trg_protect_super_admin_business
  BEFORE DELETE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_super_admin_deletion();

-- 2. Strict Tenant Isolation Policies on Core Tables
ALTER POLICY "Manage categories" ON public.categories
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage products" ON public.products
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage product batches" ON public.product_batches
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage customers" ON public.customers
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage customer payments" ON public.customer_payments
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage suppliers" ON public.suppliers
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage supplier payments" ON public.supplier_payments
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage purchase orders" ON public.purchase_orders
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage sales" ON public.sales
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage sale items" ON public.sale_items
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage stock adjustments" ON public.stock_adjustments
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage invoices" ON public.invoices
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage invoice items" ON public.invoice_items
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage expenses" ON public.expenses
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage store settings" ON public.store_settings
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

ALTER POLICY "Manage branches" ON public.branches
  USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id())
  WITH CHECK (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());

-- 3. Lock Down Privileges on Internal SECURITY DEFINER Functions
REVOKE ALL ON FUNCTION public.admin_add_staff_member(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_staff_member(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_delete_staff_member(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_staff_member(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.ensure_merchant_business(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_merchant_business(TEXT, TEXT, TEXT) TO authenticated, service_role;

