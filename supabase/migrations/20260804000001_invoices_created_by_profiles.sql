-- Link public.invoices.created_by to public.profiles(id) so PostgREST can resolve the relation
ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_created_by_profile_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;
