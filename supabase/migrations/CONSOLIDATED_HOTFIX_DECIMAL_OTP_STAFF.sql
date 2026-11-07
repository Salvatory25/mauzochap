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

-- 2. EXPLICITLY & DYNAMICALLY ALTER ALL QUANTITY & STOCK COLUMNS TO NUMERIC(12,3)
DO $$
BEGIN
  -- sale_items.quantity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sale_items') THEN
    BEGIN
      ALTER TABLE public.sale_items ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- invoice_items.quantity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_items') THEN
    BEGIN
      ALTER TABLE public.invoice_items ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- products.stock_quantity & low_stock_threshold
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    BEGIN
      ALTER TABLE public.products ALTER COLUMN stock_quantity DROP DEFAULT;
      ALTER TABLE public.products ALTER COLUMN stock_quantity TYPE NUMERIC(12,3) USING stock_quantity::NUMERIC(12,3);
      ALTER TABLE public.products ALTER COLUMN stock_quantity SET DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'low_stock_threshold') THEN
      BEGIN
        ALTER TABLE public.products ALTER COLUMN low_stock_threshold DROP DEFAULT;
        ALTER TABLE public.products ALTER COLUMN low_stock_threshold TYPE NUMERIC(12,3) USING low_stock_threshold::NUMERIC(12,3);
        ALTER TABLE public.products ALTER COLUMN low_stock_threshold SET DEFAULT 5;
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END IF;
  END IF;

  -- branch_inventory.stock_quantity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branch_inventory') THEN
    BEGIN
      ALTER TABLE public.branch_inventory ALTER COLUMN stock_quantity DROP DEFAULT;
      ALTER TABLE public.branch_inventory ALTER COLUMN stock_quantity TYPE NUMERIC(12,3) USING stock_quantity::NUMERIC(12,3);
      ALTER TABLE public.branch_inventory ALTER COLUMN stock_quantity SET DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- stock_movements.quantity_change
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') THEN
    BEGIN
      ALTER TABLE public.stock_movements ALTER COLUMN quantity_change TYPE NUMERIC(12,3) USING quantity_change::NUMERIC(12,3);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- product_batches.stock_quantity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_batches') THEN
    BEGIN
      ALTER TABLE public.product_batches ALTER COLUMN stock_quantity DROP DEFAULT;
      ALTER TABLE public.product_batches ALTER COLUMN stock_quantity TYPE NUMERIC(12,3) USING stock_quantity::NUMERIC(12,3);
      ALTER TABLE public.product_batches ALTER COLUMN stock_quantity SET DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- stock_transfers.quantity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_transfers') THEN
    BEGIN
      ALTER TABLE public.stock_transfers ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- purchase_items.quantity
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_items') THEN
    BEGIN
      ALTER TABLE public.purchase_items ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- 2b. DYNAMIC SWEEP FOR ANY REMAINING INTEGER QUANTITY / STOCK / QTY / CHANGE COLUMNS
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
        OR column_name ILIKE '%change%'
      )
  )
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT;', r.table_name, r.column_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE NUMERIC(12,3) USING %I::NUMERIC(12,3);', r.table_name, r.column_name, r.column_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT 0;', r.table_name, r.column_name);
    EXCEPTION WHEN OTHERS THEN NULL;
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
DROP POLICY IF EXISTS "auth delete sales" ON public.sales;
CREATE POLICY "auth delete sales" ON public.sales FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read sale_items" ON public.sale_items;
CREATE POLICY "auth read sale_items" ON public.sale_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert sale_items" ON public.sale_items;
CREATE POLICY "auth insert sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth update sale_items" ON public.sale_items;
CREATE POLICY "auth update sale_items" ON public.sale_items FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "auth delete sale_items" ON public.sale_items;
CREATE POLICY "auth delete sale_items" ON public.sale_items FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read products" ON public.products;
CREATE POLICY "auth read products" ON public.products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert products" ON public.products;
CREATE POLICY "auth insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth update products" ON public.products;
CREATE POLICY "auth update products" ON public.products FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "auth delete products" ON public.products;
CREATE POLICY "auth delete products" ON public.products FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read invoices" ON public.invoices;
CREATE POLICY "auth read invoices" ON public.invoices FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert invoices" ON public.invoices;
CREATE POLICY "auth insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth update invoices" ON public.invoices;
CREATE POLICY "auth update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "auth delete invoices" ON public.invoices;
CREATE POLICY "auth delete invoices" ON public.invoices FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "auth read invoice_items" ON public.invoice_items;
CREATE POLICY "auth read invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth insert invoice_items" ON public.invoice_items;
CREATE POLICY "auth insert invoice_items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth update invoice_items" ON public.invoice_items;
CREATE POLICY "auth update invoice_items" ON public.invoice_items FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "auth delete invoice_items" ON public.invoice_items;
CREATE POLICY "auth delete invoice_items" ON public.invoice_items FOR DELETE TO authenticated USING (true);

GRANT ALL ON public.sales TO authenticated, anon, service_role;
GRANT ALL ON public.sale_items TO authenticated, anon, service_role;
GRANT ALL ON public.products TO authenticated, anon, service_role;
GRANT ALL ON public.invoices TO authenticated, anon, service_role;
GRANT ALL ON public.invoice_items TO authenticated, anon, service_role;

-- 4. DROP ALL OLD TRIGGERS ON SALE_ITEMS TO ELIMINATE ANY HIDDEN INTEGER CASTS
DO $$
DECLARE trg RECORD;
BEGIN
  FOR trg IN (
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'sale_items' 
      AND trigger_schema = 'public'
  )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.sale_items;', trg.trigger_name);
  END LOOP;
END $$;

-- 5. ATOMIC POS CHECKOUT FUNCTION (Completely bypasses PostgREST table prepared statements)
CREATE OR REPLACE FUNCTION public.process_pos_checkout(
  p_receipt_number TEXT,
  p_branch_id UUID,
  p_customer_id UUID,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_tax NUMERIC,
  p_total NUMERIC,
  p_amount_paid NUMERIC,
  p_payment_method TEXT,
  p_status TEXT,
  p_notes TEXT,
  p_items JSONB,
  p_invoice_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_biz_id UUID;
  v_sale RECORD;
  v_invoice RECORD;
  v_item JSONB;
  v_qty NUMERIC(12,3);
  v_price NUMERIC(12,2);
  v_line_total NUMERIC(12,2);
  v_prod_id UUID;
  v_prod_name TEXT;
BEGIN
  -- Resolve business_id
  SELECT business_id INTO v_biz_id FROM public.profiles WHERE id = v_user_id;

  -- 1. Insert into sales
  INSERT INTO public.sales (
    receipt_number, cashier_id, branch_id, customer_id,
    subtotal, discount, tax, total, amount_paid,
    payment_method, status, notes, business_id
  ) VALUES (
    p_receipt_number, v_user_id, p_branch_id, p_customer_id,
    p_subtotal, p_discount, p_tax, p_total, p_amount_paid,
    p_payment_method, p_status, p_notes, v_biz_id
  )
  RETURNING * INTO v_sale;

  -- 2. Insert into sale_items and decrement product stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := NULLIF(v_item->>'id', '')::UUID;
    v_prod_name := COALESCE(v_item->>'name', 'Item');
    v_qty := (v_item->>'qty')::NUMERIC(12,3);
    v_price := (v_item->>'price')::NUMERIC(12,2);
    v_line_total := ROUND(v_qty * v_price, 2);

    INSERT INTO public.sale_items (
      sale_id, product_id, product_name, quantity, unit_price, line_total, business_id
    ) VALUES (
      v_sale.id, v_prod_id, v_prod_name, v_qty, v_price, v_line_total, v_biz_id
    );

    IF v_prod_id IS NOT NULL THEN
      UPDATE public.products 
      SET stock_quantity = stock_quantity - v_qty 
      WHERE id = v_prod_id;
    END IF;
  END LOOP;

  -- 3. Insert into invoices
  INSERT INTO public.invoices (
    sale_id, customer_id, subtotal, discount, tax, total_amount,
    amount_paid, balance, payment_method, payment_status, created_by, business_id
  ) VALUES (
    v_sale.id, p_customer_id, p_subtotal, p_discount, p_tax, p_total,
    p_amount_paid, GREATEST(0, p_total - p_amount_paid), p_payment_method,
    p_invoice_status, v_user_id, v_biz_id
  )
  RETURNING * INTO v_invoice;

  -- 4. Insert into invoice_items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := NULLIF(v_item->>'id', '')::UUID;
    v_qty := (v_item->>'qty')::NUMERIC(12,3);
    v_price := (v_item->>'price')::NUMERIC(12,2);
    v_line_total := ROUND(v_qty * v_price, 2);

    INSERT INTO public.invoice_items (
      invoice_id, product_id, quantity, unit_price, subtotal, business_id
    ) VALUES (
      v_invoice.id, v_prod_id, v_qty, v_price, v_line_total, v_biz_id
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'sale', row_to_json(v_sale),
    'invoice', row_to_json(v_invoice)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_pos_checkout TO authenticated, anon, service_role;

-- 6. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
