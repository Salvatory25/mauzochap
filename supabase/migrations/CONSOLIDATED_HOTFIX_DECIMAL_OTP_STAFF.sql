-- ==============================================================================
-- MAUZOCHAP: 100% TRIGGER-FREE CHECKOUT
-- Futa kabisa triggers zote kwenye sale_items & invoice_items
-- POS sasa inasimamia kupunguza stoo moja kwa moja kupitia JavaScript!
-- ==============================================================================

-- 1. FUTA TRIGGERS ZOTE ZILIZOPO KWENYE SALE_ITEMS & INVOICE_ITEMS (BILA KUBAKISHA HATA MOJA)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'public.sale_items'::regclass 
    AND NOT tgisinternal
  )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.sale_items CASCADE;', r.tgname);
  END LOOP;

  FOR r IN (
    SELECT tgname 
    FROM pg_trigger 
    WHERE tgrelid = 'public.invoice_items'::regclass 
    AND NOT tgisinternal
  )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.invoice_items CASCADE;', r.tgname);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_decrement_stock ON public.sale_items;
DROP TRIGGER IF EXISTS trg_completed_sale_stock ON public.sales;
DROP FUNCTION IF EXISTS public.decrement_stock_on_sale() CASCADE;

-- 2. HAKIKISHA NGUZO ZOTE NI NUMERIC(12,3)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'quantity') THEN
    ALTER TABLE public.sale_items ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'quantity') THEN
    ALTER TABLE public.invoice_items ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.products ALTER COLUMN stock_quantity DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN stock_quantity TYPE NUMERIC(12,3) USING stock_quantity::NUMERIC(12,3);
    ALTER TABLE public.products ALTER COLUMN stock_quantity SET DEFAULT 0;
  END IF;
END $$;

-- 3. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
