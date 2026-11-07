-- ==============================================================================
-- MAUZOCHAP GUARANTEED DECIMAL HOTFIX (TABLE SWAP & CACHE RESET)
-- ==============================================================================

-- 1. DROP ALL TRIGGERS ON SALE_ITEMS & INVOICE_ITEMS
DO $$
DECLARE trg RECORD;
BEGIN
  FOR trg IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'sale_items' AND trigger_schema = 'public')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.sale_items;', trg.trigger_name);
  END LOOP;
  FOR trg IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'invoice_items' AND trigger_schema = 'public')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.invoice_items;', trg.trigger_name);
  END LOOP;
END $$;

-- 2. ENSURE PRODUCTS STOCK_QUANTITY IS NUMERIC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.products ALTER COLUMN stock_quantity DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN stock_quantity TYPE NUMERIC(12,3) USING stock_quantity::NUMERIC(12,3);
    ALTER TABLE public.products ALTER COLUMN stock_quantity SET DEFAULT 0;
  END IF;
END $$;

-- 3. RECREATE SALE_ITEMS WITH PURE NUMERIC QUANTITY (FORCES POSTGREST CACHE INVALIDATION)
CREATE TABLE IF NOT EXISTS public.sale_items_new (
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

-- Copy any existing sale items if the table existed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sale_items') THEN
    INSERT INTO public.sale_items_new (id, sale_id, product_id, product_name, quantity, unit_price, line_total, business_id, created_at)
    SELECT id, sale_id, product_id, product_name, quantity::NUMERIC(12,3), unit_price, line_total, business_id, created_at
    FROM public.sale_items
    ON CONFLICT (id) DO NOTHING;

    DROP TABLE public.sale_items CASCADE;
  END IF;
END $$;

ALTER TABLE public.sale_items_new RENAME TO sale_items;

-- 4. RECREATE INVOICE_ITEMS WITH PURE NUMERIC QUANTITY
CREATE TABLE IF NOT EXISTS public.invoice_items_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID,
  quantity NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_items') THEN
    INSERT INTO public.invoice_items_new (id, business_id, invoice_id, product_id, quantity, unit_price, subtotal, created_at)
    SELECT id, business_id, invoice_id, product_id, quantity::NUMERIC(12,3), unit_price, subtotal, created_at
    FROM public.invoice_items
    ON CONFLICT (id) DO NOTHING;

    DROP TABLE public.invoice_items CASCADE;
  END IF;
END $$;

ALTER TABLE public.invoice_items_new RENAME TO invoice_items;

-- 5. RE-APPLY RLS & PERMISSIONS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read sale_items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert sale_items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update sale_items" ON public.sale_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete sale_items" ON public.sale_items FOR DELETE TO authenticated USING (true);
GRANT ALL ON public.sale_items TO authenticated, anon, service_role;

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert invoice_items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update invoice_items" ON public.invoice_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth delete invoice_items" ON public.invoice_items FOR DELETE TO authenticated USING (true);
GRANT ALL ON public.invoice_items TO authenticated, anon, service_role;

-- 6. LIGHTWEIGHT STOCK TRIGGER
CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity 
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_decrement_stock 
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sale();

-- 7. ATOMIC RPC FUNCTION
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
  SELECT business_id INTO v_biz_id FROM public.profiles WHERE id = v_user_id;

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
  END LOOP;

  INSERT INTO public.invoices (
    sale_id, customer_id, subtotal, discount, tax, total_amount,
    amount_paid, balance, payment_method, payment_status, created_by, business_id
  ) VALUES (
    v_sale.id, p_customer_id, p_subtotal, p_discount, p_tax, p_total,
    p_amount_paid, GREATEST(0, p_total - p_amount_paid), p_payment_method,
    p_invoice_status, v_user_id, v_biz_id
  )
  RETURNING * INTO v_invoice;

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

-- 8. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

-- 9. VERIFY WITH A TEST DECIMAL INSERT
DO $$
DECLARE
  v_user_id UUID;
  v_test_sale_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.profiles LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.sales (receipt_number, cashier_id, total, status)
    VALUES ('TEST-' || floor(random()*1000000)::text, v_user_id, 1500, 'completed')
    RETURNING id INTO v_test_sale_id;

    INSERT INTO public.sale_items (sale_id, product_name, quantity, unit_price, line_total)
    VALUES (v_test_sale_id, 'Test Item 1.5', 1.5, 1000, 1500);

    DELETE FROM public.sales WHERE id = v_test_sale_id;
  END IF;
END $$;
