-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE DEFAULT public.current_business_id(),
  invoice_number TEXT UNIQUE, -- trigger handles populating this if null
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Paid', 'Partial', 'Unpaid')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE DEFAULT public.current_business_id(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "auth read invoices" ON public.invoices;
DROP POLICY IF EXISTS "auth insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "auth update invoices" ON public.invoices;
DROP POLICY IF EXISTS "admins delete invoices" ON public.invoices;

DROP POLICY IF EXISTS "auth read invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "auth insert invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "auth update invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "admins delete invoice_items" ON public.invoice_items;

-- RLS Policies for Invoices
CREATE POLICY "auth read invoices" ON public.invoices 
  FOR SELECT TO authenticated 
  USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "auth insert invoices" ON public.invoices 
  FOR INSERT TO authenticated 
  WITH CHECK (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "auth update invoices" ON public.invoices 
  FOR UPDATE TO authenticated 
  USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "admins delete invoices" ON public.invoices 
  FOR DELETE TO authenticated 
  USING ((business_id = public.current_business_id() AND public.is_admin_or_manager(auth.uid())) OR public.is_super_admin(auth.uid()));

-- RLS Policies for Invoice Items
CREATE POLICY "auth read invoice_items" ON public.invoice_items 
  FOR SELECT TO authenticated 
  USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "auth insert invoice_items" ON public.invoice_items 
  FOR INSERT TO authenticated 
  WITH CHECK (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "auth update invoice_items" ON public.invoice_items 
  FOR UPDATE TO authenticated 
  USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "admins delete invoice_items" ON public.invoice_items 
  FOR DELETE TO authenticated 
  USING ((business_id = public.current_business_id() AND public.is_admin_or_manager(auth.uid())) OR public.is_super_admin(auth.uid()));

-- Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;

-- Invoice number generator function
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  current_year TEXT;
  prefix TEXT;
  next_seq INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    current_year := to_char(CURRENT_DATE, 'YYYY');
    prefix := 'MC-' || current_year || '-';
    
    -- Select the max sequence number for this business and this year
    SELECT COALESCE(
      MAX(SUBSTRING(invoice_number FROM '\d+$')::INTEGER),
      0
    ) INTO next_seq
    FROM public.invoices
    WHERE business_id = NEW.business_id 
      AND invoice_number LIKE prefix || '%';
    
    next_seq := next_seq + 1;
    NEW.invoice_number := prefix || lpad(next_seq::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END; $$;

-- Trigger for generating invoice number
DROP TRIGGER IF EXISTS trg_set_invoice_number ON public.invoices;
CREATE TRIGGER trg_set_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

-- Trigger to touch updated_at
DROP TRIGGER IF EXISTS trg_invoices_updated ON public.invoices;
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
