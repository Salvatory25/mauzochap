-- Fix duplicate key value violates unique constraint "invoices_invoice_number_key"
-- 1. Drop the global unique constraint on invoice_number
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;

-- 2. Add a composite unique constraint per business (business_id + invoice_number)
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_business_invoice_number_key;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_business_invoice_number_key UNIQUE (business_id, invoice_number);

-- 3. Update set_invoice_number trigger function with business scoping and advisory locking
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  current_year TEXT;
  prefix TEXT;
  next_seq INTEGER;
BEGIN
  -- Ensure business_id is set
  IF NEW.business_id IS NULL THEN
    NEW.business_id := public.current_business_id();
  END IF;

  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    current_year := to_char(CURRENT_DATE, 'YYYY');
    prefix := 'MC-' || current_year || '-';
    
    -- Transaction-level advisory lock per business to prevent race conditions during sequence generation
    IF NEW.business_id IS NOT NULL THEN
      PERFORM pg_advisory_xact_lock(hashtext('invoice_number_' || NEW.business_id::text));
    END IF;

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

-- 4. Re-apply the trigger
DROP TRIGGER IF EXISTS trg_set_invoice_number ON public.invoices;
CREATE TRIGGER trg_set_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();
