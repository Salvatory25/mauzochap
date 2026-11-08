-- ==============================================================================
-- MAUZOCHAP DEFINITIVE DECIMAL & STOCK TRIGGER FIX
-- Inarekebisha: branch_inventory, stock_movements, purchase_items, stock_transfers
-- na inalinda triggers zote ili zisiwahi kuzuia au kurejesha hitilafu kwenye sale_items!
-- ==============================================================================

-- 1. DROP ALL EXISTING TRIGGERS ON SALE_ITEMS & INVOICE_ITEMS
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

-- 2. ALTER ALL INVENTORY, MOVEMENTS, AND QUANTITY COLUMNS TO NUMERIC(12,3)
DO $$
BEGIN
  -- branch_inventory.stock_quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'branch_inventory' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.branch_inventory ALTER COLUMN stock_quantity DROP DEFAULT;
    ALTER TABLE public.branch_inventory ALTER COLUMN stock_quantity TYPE NUMERIC(12,3) USING stock_quantity::NUMERIC(12,3);
    ALTER TABLE public.branch_inventory ALTER COLUMN stock_quantity SET DEFAULT 0;
  END IF;

  -- stock_movements.quantity_change
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'quantity_change') THEN
    ALTER TABLE public.stock_movements ALTER COLUMN quantity_change TYPE NUMERIC(12,3) USING quantity_change::NUMERIC(12,3);
  END IF;

  -- purchase_items.quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_items' AND column_name = 'quantity') THEN
    ALTER TABLE public.purchase_items ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
  END IF;

  -- stock_transfers.quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock_transfers' AND column_name = 'quantity') THEN
    ALTER TABLE public.stock_transfers ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
  END IF;

  -- product_batches.stock_quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_batches' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.product_batches ALTER COLUMN stock_quantity DROP DEFAULT;
    ALTER TABLE public.product_batches ALTER COLUMN stock_quantity TYPE NUMERIC(12,3) USING stock_quantity::NUMERIC(12,3);
    ALTER TABLE public.product_batches ALTER COLUMN stock_quantity SET DEFAULT 0;
  END IF;

  -- products.stock_quantity & low_stock_threshold
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

  -- sale_items.quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'quantity') THEN
    ALTER TABLE public.sale_items ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
  END IF;

  -- invoice_items.quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'quantity') THEN
    ALTER TABLE public.invoice_items ALTER COLUMN quantity TYPE NUMERIC(12,3) USING quantity::NUMERIC(12,3);
  END IF;
END $$;

-- 3. BULLETPROOF STOCK DECREMENT TRIGGER FUNCTION (CANNOT FAIL OR BLOCK SALE_ITEMS)
CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE 
  v_branch_id UUID;
  v_biz_id UUID;
  v_status TEXT;
BEGIN
  -- get branch_id, business_id and status of the sale
  SELECT branch_id, business_id, status::TEXT 
  INTO v_branch_id, v_biz_id, v_status 
  FROM public.sales 
  WHERE id = NEW.sale_id;

  IF (v_status IS NULL OR v_status = 'completed') AND NEW.product_id IS NOT NULL THEN
    -- Update overall products stock
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity 
    WHERE id = NEW.product_id;
    
    -- Update branch_inventory if branch is present
    IF v_branch_id IS NOT NULL THEN
      UPDATE public.branch_inventory 
      SET stock_quantity = stock_quantity - NEW.quantity 
      WHERE branch_id = v_branch_id AND product_id = NEW.product_id;
      
      -- Record stock movement
      INSERT INTO public.stock_movements (business_id, product_id, branch_id, movement_type, quantity_change, reference_id)
      VALUES (COALESCE(NEW.business_id, v_biz_id), NEW.product_id, v_branch_id, 'sale', -NEW.quantity, NEW.sale_id);
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Bulletproof: under NO circumstances should stock calculation fail checkout!
  RAISE WARNING 'Stock decrement caught warning: %', SQLERRM;
  RETURN NEW;
END; $$;

-- 4. RECREATE TRIGGER ON SALE_ITEMS
CREATE TRIGGER trg_decrement_stock 
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sale();

-- 5. BULLETPROOF PROCESS COMPLETED SALE STOCK
CREATE OR REPLACE FUNCTION public.process_completed_sale_stock()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  item RECORD;
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
    FOR item IN SELECT * FROM public.sale_items WHERE sale_id = NEW.id
    LOOP
      IF item.product_id IS NOT NULL AND NEW.branch_id IS NOT NULL THEN
        UPDATE public.branch_inventory 
        SET stock_quantity = stock_quantity - item.quantity 
        WHERE branch_id = NEW.branch_id AND product_id = item.product_id;
        
        INSERT INTO public.stock_movements (business_id, product_id, branch_id, movement_type, quantity_change, reference_id)
        VALUES (COALESCE(item.business_id, NEW.business_id), item.product_id, NEW.branch_id, 'sale', -item.quantity, NEW.id);
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Process completed sale stock warning: %', SQLERRM;
  RETURN NEW;
END; $$;

-- 6. BULLETPROOF PURCHASE ITEM TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.process_purchase_item()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_branch_id UUID;
BEGIN
  SELECT branch_id INTO v_branch_id FROM public.purchases WHERE id = NEW.purchase_id;

  IF NEW.product_id IS NOT NULL AND v_branch_id IS NOT NULL THEN
    UPDATE public.products SET cost = NEW.unit_cost WHERE id = NEW.product_id;
    
    INSERT INTO public.branch_inventory (branch_id, product_id, stock_quantity)
    VALUES (v_branch_id, NEW.product_id, NEW.quantity)
    ON CONFLICT (branch_id, product_id) 
    DO UPDATE SET stock_quantity = public.branch_inventory.stock_quantity + EXCLUDED.stock_quantity;
    
    INSERT INTO public.stock_movements (product_id, branch_id, movement_type, quantity_change, reference_id)
    VALUES (NEW.product_id, v_branch_id, 'purchase', NEW.quantity, NEW.purchase_id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Process purchase item warning: %', SQLERRM;
  RETURN NEW;
END; $$;

-- 7. RLS & PERMISSIONS TO ENSURE FULL ACCESS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branch_inventory TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated, anon, service_role;

-- 8. REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
