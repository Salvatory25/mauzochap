-- ========================================================
-- MAUZOCHAP POS & ERP - COMPLETE DATABASE INITIALIZATION
-- Multi-Tenant SaaS, Roles, Inventory, Sales, Batches & SMS
-- ========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'owner', 'super_admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM ('cash', 'mobile_money', 'card', 'credit', 'bank');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
    CREATE TYPE public.sale_status AS ENUM ('completed', 'cancelled', 'pending');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type') THEN
    CREATE TYPE public.stock_movement_type AS ENUM ('sale', 'purchase', 'adjustment', 'return');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE public.account_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_package') THEN
    CREATE TYPE public.subscription_package AS ENUM ('kilimanjaro', 'serengeti', 'zanzibar', 'uhuru', 'trial');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'waiting_verification', 'rejected');
  END IF;
END $$;

-- 3. CORE TENANT & BRANCH TABLES
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  account_status public.account_status NOT NULL DEFAULT 'approved',
  package public.subscription_package NOT NULL DEFAULT 'trial',
  expiry_date TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  full_name TEXT,
  business_name TEXT,
  phone TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 5. ESSENTIAL SECURITY & MULTI-TENANT FUNCTIONS
CREATE OR REPLACE FUNCTION public.current_business_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_branch_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT branch_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role IN ('admin', 'manager', 'owner', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.get_business_name(_business_id UUID)
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT business_name FROM public.businesses WHERE id = _business_id;
$$;

-- 6. DOMAIN TABLES
-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  unit TEXT DEFAULT 'pcs',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);

-- Sales
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  receipt_number TEXT NOT NULL UNIQUE,
  cashier_id UUID NOT NULL REFERENCES auth.users(id),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  status public.sale_status NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_business ON public.sales(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON public.sales(cashier_id);

-- Sale Items (Supports fractional sales)
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_number TEXT,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON public.invoices(business_id);

-- Invoice Items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_business ON public.expenses(business_id);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_business ON public.suppliers(business_id);

-- Purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  invoice_number TEXT,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_purchases_business ON public.purchases(business_id);

-- Purchase Items
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity NUMERIC(12,3) NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product Batches & Expiry Dates
CREATE TABLE IF NOT EXISTS public.product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date DATE,
  stock_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry ON public.product_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_product_batches_business ON public.product_batches(business_id);

-- Stock Movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type public.stock_movement_type NOT NULL,
  quantity_change NUMERIC(12,3) NOT NULL,
  reference_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Branch Inventory
CREATE TABLE IF NOT EXISTS public.branch_inventory (
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  stock_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (branch_id, product_id)
);

-- Stock Transfers
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  from_branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  to_branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity NUMERIC(12,3) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supplier Payments
CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  paid_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer Payments
CREATE TABLE IF NOT EXISTS public.customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT public.current_business_id() REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  notes TEXT,
  received_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscription Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_reference TEXT NOT NULL,
  verification_status public.payment_status NOT NULL DEFAULT 'waiting_verification',
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. INITIAL SEED DATA
INSERT INTO public.businesses (id, business_name, owner_name, account_status, package, expiry_date)
VALUES ('00000000-0000-0000-0000-000000000001', 'MauzoChap Store', 'Admin', 'approved', 'uhuru', '2099-12-31')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branches (id, business_id, name, location)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Main Branch', 'HQ')
ON CONFLICT (id) DO NOTHING;

-- 8. GRANT ACCESS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.businesses TO anon;
GRANT SELECT ON public.branches TO anon;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Businesses policies
DROP POLICY IF EXISTS "super_admin all businesses" ON public.businesses;
CREATE POLICY "super_admin all businesses" ON public.businesses FOR ALL TO authenticated 
  USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "users read own business" ON public.businesses;
CREATE POLICY "users read own business" ON public.businesses FOR SELECT TO authenticated 
  USING (id = public.current_business_id() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "users update own business" ON public.businesses;
CREATE POLICY "users update own business" ON public.businesses FOR UPDATE TO authenticated 
  USING ((id = public.current_business_id() AND public.is_admin_or_manager(auth.uid())) OR public.is_super_admin(auth.uid()));

-- Profiles policies
DROP POLICY IF EXISTS "profiles select access" ON public.profiles;
CREATE POLICY "profiles select access" ON public.profiles FOR SELECT TO authenticated 
  USING (id = auth.uid() OR business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles insert own" ON public.profiles;
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

-- User roles policies
DROP POLICY IF EXISTS "users see own roles" ON public.user_roles;
CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated 
  USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "admins see business roles" ON public.user_roles;
CREATE POLICY "admins see business roles" ON public.user_roles FOR SELECT TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') AND (SELECT business_id FROM public.profiles WHERE id = user_id) = public.current_business_id());

DROP POLICY IF EXISTS "admins manage business roles" ON public.user_roles;
CREATE POLICY "admins manage business roles" ON public.user_roles FOR ALL TO authenticated 
  USING ((public.has_role(auth.uid(), 'admin') AND (SELECT business_id FROM public.profiles WHERE id = user_id) = public.current_business_id()) OR public.is_super_admin(auth.uid()))
  WITH CHECK ((public.has_role(auth.uid(), 'admin') AND (SELECT business_id FROM public.profiles WHERE id = user_id) = public.current_business_id()) OR public.is_super_admin(auth.uid()));

-- Multi-Tenant Tenant Isolation Policies
DO $$
DECLARE
  t TEXT;
  tables_to_protect TEXT[] := ARRAY[
    'branches', 'categories', 'products', 'customers', 'sales', 'sale_items',
    'invoices', 'invoice_items', 'expenses', 'suppliers', 'purchases', 'purchase_items',
    'product_batches', 'stock_movements', 'branch_inventory', 'stock_transfers',
    'supplier_payments', 'customer_payments', 'payments', 'notifications'
  ];
BEGIN
  FOREACH t IN ARRAY tables_to_protect LOOP
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_select_%I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_all_%I" ON public.%I', t, t);
    
    EXECUTE format(
      'CREATE POLICY "tenant_isolation_select_%I" ON public.%I FOR SELECT TO authenticated ' ||
      'USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "tenant_isolation_all_%I" ON public.%I FOR ALL TO authenticated ' ||
      'USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid())) ' ||
      'WITH CHECK (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()))',
      t, t
    );
  END LOOP;
END $$;

-- 10. SYSTEM FUNCTIONS & TRIGGERS

-- Touch updated_at function
CREATE OR REPLACE FUNCTION public.touch_updated_at() 
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END; $$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated ON public.products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated ON public.customers;
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_businesses_updated ON public.businesses;
CREATE TRIGGER trg_businesses_updated BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_suppliers_updated ON public.suppliers;
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Sales decrement stock (branch + overall product)
CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE 
  v_branch_id UUID;
  v_biz_id UUID;
BEGIN
  SELECT branch_id, business_id INTO v_branch_id, v_biz_id FROM public.sales WHERE id = NEW.sale_id;

  IF NEW.product_id IS NOT NULL THEN
    -- Update overall product stock
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity 
    WHERE id = NEW.product_id;

    -- Update branch stock if branch known
    IF v_branch_id IS NOT NULL THEN
      UPDATE public.branch_inventory 
      SET stock_quantity = stock_quantity - NEW.quantity 
      WHERE branch_id = v_branch_id AND product_id = NEW.product_id;
      
      INSERT INTO public.stock_movements (business_id, product_id, branch_id, movement_type, quantity_change, reference_id)
      VALUES (COALESCE(NEW.business_id, v_biz_id), NEW.product_id, v_branch_id, 'sale', -NEW.quantity, NEW.sale_id::TEXT);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON public.sale_items;
CREATE TRIGGER trg_decrement_stock AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sale();

-- Purchases increment stock
CREATE OR REPLACE FUNCTION public.process_purchase_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE 
  v_branch_id UUID;
  v_biz_id UUID;
BEGIN
  SELECT branch_id, business_id INTO v_branch_id, v_biz_id FROM public.purchases WHERE id = NEW.purchase_id;

  IF NEW.product_id IS NOT NULL THEN
    -- Update product cost and overall stock
    UPDATE public.products 
    SET cost = NEW.unit_cost, stock_quantity = stock_quantity + NEW.quantity 
    WHERE id = NEW.product_id;
    
    -- Insert or update branch_inventory
    IF v_branch_id IS NOT NULL THEN
      INSERT INTO public.branch_inventory (business_id, branch_id, product_id, stock_quantity)
      VALUES (COALESCE(NEW.business_id, v_biz_id), v_branch_id, NEW.product_id, NEW.quantity)
      ON CONFLICT (branch_id, product_id) 
      DO UPDATE SET stock_quantity = public.branch_inventory.stock_quantity + EXCLUDED.stock_quantity;
      
      INSERT INTO public.stock_movements (business_id, product_id, branch_id, movement_type, quantity_change, reference_id)
      VALUES (COALESCE(NEW.business_id, v_biz_id), NEW.product_id, v_branch_id, 'purchase', NEW.quantity, NEW.purchase_id::TEXT);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_process_purchase_item ON public.purchase_items;
CREATE TRIGGER trg_process_purchase_item AFTER INSERT ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.process_purchase_item();

-- Stock transfer execution
CREATE OR REPLACE FUNCTION public.execute_stock_transfer()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Deduct from source branch
    UPDATE public.branch_inventory 
    SET stock_quantity = stock_quantity - NEW.quantity 
    WHERE branch_id = NEW.from_branch_id AND product_id = NEW.product_id;
    
    -- Add to destination branch
    INSERT INTO public.branch_inventory (business_id, branch_id, product_id, stock_quantity)
    VALUES (NEW.business_id, NEW.to_branch_id, NEW.product_id, NEW.quantity)
    ON CONFLICT (branch_id, product_id) 
    DO UPDATE SET stock_quantity = public.branch_inventory.stock_quantity + EXCLUDED.stock_quantity;
    
    -- Record movements
    INSERT INTO public.stock_movements (business_id, product_id, branch_id, movement_type, quantity_change, reference_id)
    VALUES (NEW.business_id, NEW.product_id, NEW.from_branch_id, 'adjustment', -NEW.quantity, NEW.id::TEXT);
    
    INSERT INTO public.stock_movements (business_id, product_id, branch_id, movement_type, quantity_change, reference_id)
    VALUES (NEW.business_id, NEW.product_id, NEW.to_branch_id, 'adjustment', NEW.quantity, NEW.id::TEXT);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_execute_stock_transfer ON public.stock_transfers;
CREATE TRIGGER trg_execute_stock_transfer AFTER UPDATE ON public.stock_transfers
FOR EACH ROW EXECUTE FUNCTION public.execute_stock_transfer();

-- Customer Debt on Credit Sale
CREATE OR REPLACE FUNCTION public.add_debt_on_credit_sale()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.status = 'completed' AND NEW.total > NEW.amount_paid THEN
    UPDATE public.customers 
    SET balance = balance + (NEW.total - NEW.amount_paid)
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_add_customer_debt ON public.sales;
CREATE TRIGGER trg_add_customer_debt AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.add_debt_on_credit_sale();

-- Customer Debt adjustments on Sale updates
CREATE OR REPLACE FUNCTION public.adjust_debt_on_sale_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  old_debt NUMERIC(12,2) := 0;
  new_debt NUMERIC(12,2) := 0;
BEGIN
  IF OLD.status = 'completed' AND OLD.total > OLD.amount_paid THEN
    old_debt := OLD.total - OLD.amount_paid;
  END IF;

  IF NEW.status = 'completed' AND NEW.total > NEW.amount_paid THEN
    new_debt := NEW.total - NEW.amount_paid;
  END IF;

  IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
    IF OLD.customer_id IS NOT NULL AND old_debt > 0 THEN
      UPDATE public.customers SET balance = balance - old_debt WHERE id = OLD.customer_id;
    END IF;
    IF NEW.customer_id IS NOT NULL AND new_debt > 0 THEN
      UPDATE public.customers SET balance = balance + new_debt WHERE id = NEW.customer_id;
    END IF;
  ELSE
    IF OLD.customer_id IS NOT NULL AND (new_debt - old_debt) <> 0 THEN
      UPDATE public.customers SET balance = balance + (new_debt - old_debt) WHERE id = OLD.customer_id;
    END IF;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_adjust_customer_debt_on_update ON public.sales;
CREATE TRIGGER trg_adjust_customer_debt_on_update AFTER UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.adjust_debt_on_sale_update();

-- Customer Debt on Sale delete
CREATE OR REPLACE FUNCTION public.revert_debt_on_sale_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'completed' AND OLD.customer_id IS NOT NULL AND OLD.total > OLD.amount_paid THEN
    UPDATE public.customers 
    SET balance = balance - (OLD.total - OLD.amount_paid)
    WHERE id = OLD.customer_id;
  END IF;
  RETURN OLD;
END; $$;

DROP TRIGGER IF EXISTS trg_revert_customer_debt_on_delete ON public.sales;
CREATE TRIGGER trg_revert_customer_debt_on_delete AFTER DELETE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.revert_debt_on_sale_delete();

-- Customer balance reduction on customer payment
CREATE OR REPLACE FUNCTION public.deduct_balance_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.customers 
  SET balance = balance - NEW.amount 
  WHERE id = NEW.customer_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_deduct_customer_balance ON public.customer_payments;
CREATE TRIGGER trg_deduct_customer_balance AFTER INSERT ON public.customer_payments
FOR EACH ROW EXECUTE FUNCTION public.deduct_balance_on_payment();

-- Supplier balance on purchase
CREATE OR REPLACE FUNCTION public.update_supplier_balance_on_purchase()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.supplier_id IS NOT NULL AND NEW.total_amount > NEW.amount_paid THEN
    UPDATE public.suppliers 
    SET balance = balance + (NEW.total_amount - NEW.amount_paid)
    WHERE id = NEW.supplier_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_update_supplier_debt ON public.purchases;
CREATE TRIGGER trg_update_supplier_debt AFTER INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.update_supplier_balance_on_purchase();

-- Supplier balance on supplier payment
CREATE OR REPLACE FUNCTION public.update_supplier_balance_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.suppliers
  SET balance = balance - NEW.amount
  WHERE id = NEW.supplier_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_update_supplier_balance_after_payment ON public.supplier_payments;
CREATE TRIGGER trg_update_supplier_balance_after_payment AFTER INSERT ON public.supplier_payments
FOR EACH ROW EXECUTE FUNCTION public.update_supplier_balance_on_payment();

-- Handle New User Registration Hook
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  user_count INTEGER;
  target_biz_id UUID;
  target_branch_id UUID;
  target_role public.app_role;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- Check if user joining an existing business
  IF (NEW.raw_user_meta_data->>'business_id') IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.businesses WHERE id = (NEW.raw_user_meta_data->>'business_id')::UUID
  ) THEN
    target_biz_id := (NEW.raw_user_meta_data->>'business_id')::UUID;
    
    SELECT id INTO target_branch_id 
    FROM public.branches 
    WHERE business_id = target_biz_id 
    ORDER BY created_at ASC
    LIMIT 1;
    
    target_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cashier')::public.app_role;
  ELSE
    -- Create new tenant business
    INSERT INTO public.businesses (business_name, owner_name, email, phone)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), 
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Owner'), 
      NEW.email,
      NEW.raw_user_meta_data->>'phone'
    )
    RETURNING id INTO target_biz_id;
    
    -- Create Main Branch
    INSERT INTO public.branches (name, location, business_id)
    VALUES ('Main Branch', 'HQ', target_biz_id)
    RETURNING id INTO target_branch_id;
    
    -- First ever user is super_admin, subsequent are admin of their own business
    IF user_count = 0 THEN
      target_role := 'super_admin'::public.app_role;
    ELSE
      target_role := 'admin'::public.app_role;
    END IF;
  END IF;

  -- Create Profile
  INSERT INTO public.profiles (id, full_name, business_name, phone, business_id, branch_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'business_name', (SELECT business_name FROM public.businesses WHERE id = target_biz_id)),
    NEW.raw_user_meta_data->>'phone',
    target_biz_id,
    target_branch_id
  );
  
  -- Insert Role
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, target_role);
  
  RETURN NEW;
END; $$;

-- Trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security lockdown on functions
REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_or_manager(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_business_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_business_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_name(UUID) TO anon, authenticated;
