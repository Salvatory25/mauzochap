-- ==============================================================================
-- MAUZOCHAP UNIVERSAL PRODUCTION HOTFIX (AUTO-CREATING & AUTO-MIGRATING)
-- Run this in your Supabase Dashboard:
-- https://supabase.com/dashboard/project/mnopesayeoklyymowmwc/sql/new
--
-- This script:
-- 1. Ensures core sales and invoice tables exist (IF NOT EXISTS)
-- 2. Dynamically finds EVERY integer column with 'quantity', 'stock', or 'qty' in public schema and alters it to NUMERIC(12,3)
-- 3. Updates stock decrement triggers safely
-- 4. Configures RLS policies and grants permissions
-- 5. Reloads PostgREST schema cache
-- ==============================================================================

-- 1. ENSURE CORE TABLES EXIST
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  cashier_id UUID NOT NULL,
  customer_id UUID,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  business_id UUID,
  branch_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC(12,3) DEFAULT 5,
  category_id UUID,
  business_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  business_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT,
  sale_id UUID,
  customer_id UUID,
  business_id UUID,
  created_by UUID,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. DYNAMICALLY ALTER ALL INTEGER QUANTITY & STOCK COLUMNS TO NUMERIC(12,3)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND data_type IN ('integer', 'smallint', 'bigint')
      AND (
        column_name ILIKE '%quantity%' 
        OR column_name ILIKE '%stock%' 
        OR column_name ILIKE '%qty%'
      )
  )
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE NUMERIC(12,3);', r.table_name, r.column_name);
    EXCEPTION WHEN OTHERS THEN
      -- Continue gracefully if any specific column has constraints
      NULL;
    END;
  END LOOP;
END $$;

-- 3. CONFIGURE RLS & PERMISSIONS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth read sales" ON public.sales;
CREATE POLICY "auth read sales" ON public.sales FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert sales" ON public.sales;
CREATE POLICY "auth insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth update sales" ON public.sales;
CREATE POLICY "auth update sales" ON public.sales FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read sale_items" ON public.sale_items;
CREATE POLICY "auth read sale_items" ON public.sale_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert sale_items" ON public.sale_items;
CREATE POLICY "auth insert sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth update sale_items" ON public.sale_items FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read products" ON public.products;
CREATE POLICY "auth read products" ON public.products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert products" ON public.products;
CREATE POLICY "auth insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth update products" ON public.products;
CREATE POLICY "auth update products" ON public.products FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read invoices" ON public.invoices;
CREATE POLICY "auth read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert invoices" ON public.invoices;
CREATE POLICY "auth insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth update invoices" ON public.invoices;
CREATE POLICY "auth update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read invoice_items" ON public.invoice_items;
CREATE POLICY "auth read invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert invoice_items" ON public.invoice_items;
CREATE POLICY "auth insert invoice_items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth update invoice_items" ON public.invoice_items FOR UPDATE TO authenticated USING (true);

GRANT ALL ON public.sales TO authenticated, anon, service_role;
GRANT ALL ON public.sale_items TO authenticated, anon, service_role;
GRANT ALL ON public.products TO authenticated, anon, service_role;
GRANT ALL ON public.invoices TO authenticated, anon, service_role;
GRANT ALL ON public.invoice_items TO authenticated, anon, service_role;

-- 4. UPDATE STOCK DECREMENT TRIGGER
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

  IF (v_status IS NULL OR v_status = 'completed') AND NEW.product_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
      UPDATE public.products 
      SET stock_quantity = stock_quantity - NEW.quantity 
      WHERE id = NEW.product_id;
    END IF;

    IF v_branch_id IS NOT NULL THEN
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branch_inventory') INTO v_has_branch_inv;
      IF v_has_branch_inv THEN
        EXECUTE 'UPDATE public.branch_inventory SET stock_quantity = stock_quantity - $1 WHERE branch_id = $2 AND product_id = $3'
        USING NEW.quantity, v_branch_id, NEW.product_id;
      END IF;

      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') INTO v_has_stock_mov;
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

-- 5. RELOAD POSTGREST SCHEMA
NOTIFY pgrst, 'reload schema';
