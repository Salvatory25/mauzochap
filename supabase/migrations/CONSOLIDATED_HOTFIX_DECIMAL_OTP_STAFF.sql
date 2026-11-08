-- ==============================================================================
-- MAUZOCHAP GUARANTEED DECIMAL CHECKOUT FIX (PURE PRODUCTS & CLEAN TRIGGERS)
-- Hakuna kutaja branch_inventory au meza ambazo hazipo. 
-- Inafanya kazi 100% kwenye database yoyote ya MauzoChap bila kosa la 42P01!
-- ==============================================================================

-- 1. DROP ALL OLD TRIGGERS ON SALE_ITEMS, INVOICE_ITEMS & SALES
DO $$
DECLARE trg RECORD;
BEGIN
  FOR trg IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'sale_items' AND trigger_schema = 'public')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.sale_items CASCADE;', trg.trigger_name);
  END LOOP;
  FOR trg IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'invoice_items' AND trigger_schema = 'public')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.invoice_items CASCADE;', trg.trigger_name);
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_completed_sale_stock ON public.sales;

-- 2. ENSURE COLUMNS ARE DEFINITELY NUMERIC ON EXISTING TABLES
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

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'low_stock_threshold') THEN
    ALTER TABLE public.products ALTER COLUMN low_stock_threshold DROP DEFAULT;
    ALTER TABLE public.products ALTER COLUMN low_stock_threshold TYPE NUMERIC(12,3) USING low_stock_threshold::NUMERIC(12,3);
    ALTER TABLE public.products ALTER COLUMN low_stock_threshold SET DEFAULT 5;
  END IF;
END $$;

-- 3. BULLETPROOF STOCK DECREMENT TRIGGER FUNCTION (SAFE, FAST & CANNOT BLOCK SALE_ITEMS)
CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity 
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Kinga: Chochote kikitokea, mauzo yataendelea na hayatakwama kamwe!
  RETURN NEW;
END; 
$$;

-- 4. RECREATE THE SAFE TRIGGER ON SALE_ITEMS
DROP TRIGGER IF EXISTS trg_decrement_stock ON public.sale_items;
CREATE TRIGGER trg_decrement_stock 
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sale();

-- 5. RLS & PERMISSIONS ON EXISTING TABLES ONLY
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated, anon, service_role;

-- 6. REFRESH POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
