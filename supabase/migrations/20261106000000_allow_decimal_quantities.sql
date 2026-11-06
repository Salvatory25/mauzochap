-- Migration: Allow Decimal Quantities (1.5, 2.5, etc.) and Enforce Strict Supplier Tenant Isolation
-- Fixes "invalid input syntax for type integer: '1.5'" across POS, Sales, Invoices, and Inventory.
-- Also removes test/orphaned supplier records (e.g. 'Yolanda') and enforces business_id isolation.

-- 1. Alter quantity and stock columns to NUMERIC(12,3) to support fractional quantities (kg, litres, meters, half units, etc.)
DO $$
BEGIN
  -- sale_items
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'quantity') THEN
    ALTER TABLE public.sale_items ALTER COLUMN quantity TYPE NUMERIC(12,3);
  END IF;

  -- invoice_items
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoice_items' AND column_name = 'quantity') THEN
    ALTER TABLE public.invoice_items ALTER COLUMN quantity TYPE NUMERIC(12,3);
  END IF;

  -- products.stock_quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.products ALTER COLUMN stock_quantity TYPE NUMERIC(12,3);
  END IF;

  -- branch_inventory.stock_quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'branch_inventory' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.branch_inventory ALTER COLUMN stock_quantity TYPE NUMERIC(12,3);
  END IF;

  -- stock_movements.quantity_change
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'quantity_change') THEN
    ALTER TABLE public.stock_movements ALTER COLUMN quantity_change TYPE NUMERIC(12,3);
  END IF;

  -- purchase_items.quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_items' AND column_name = 'quantity') THEN
    ALTER TABLE public.purchase_items ALTER COLUMN quantity TYPE NUMERIC(12,3);
  END IF;

  -- stock_transfers.quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock_transfers' AND column_name = 'quantity') THEN
    ALTER TABLE public.stock_transfers ALTER COLUMN quantity TYPE NUMERIC(12,3);
  END IF;

  -- product_batches.stock_quantity
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_batches' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.product_batches ALTER COLUMN stock_quantity TYPE NUMERIC(12,3);
  END IF;
END $$;

-- 2. Update stock decrement function to handle NUMERIC quantities without integer casting errors
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

    -- Update branch stock if branch is known
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

-- 3. Delete orphaned or test supplier records ('Yolanda') and suppliers without valid business association
DELETE FROM public.suppliers WHERE LOWER(name) LIKE '%yolanda%';
DELETE FROM public.suppliers WHERE business_id IS NULL;

-- 4. Ensure suppliers table enforces business_id tenant isolation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

    -- Drop outdated permissive policies if any
    DROP POLICY IF EXISTS "auth read suppliers" ON public.suppliers;
    DROP POLICY IF EXISTS "auth manage suppliers" ON public.suppliers;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.suppliers;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.suppliers;

    -- Create tenant-isolated policies
    CREATE POLICY "tenant_read_suppliers" ON public.suppliers
      FOR SELECT TO authenticated
      USING (
        business_id IN (
          SELECT business_id FROM public.profiles WHERE id = auth.uid()
        )
      );

    CREATE POLICY "tenant_manage_suppliers" ON public.suppliers
      FOR ALL TO authenticated
      USING (
        business_id IN (
          SELECT business_id FROM public.profiles WHERE id = auth.uid()
        )
      )
      WITH CHECK (
        business_id IN (
          SELECT business_id FROM public.profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;
