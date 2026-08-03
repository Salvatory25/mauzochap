-- Performance Optimization Indexes
-- These indexes optimize the query speeds for large datasets when filtering or ordering

-- 1. Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON public.invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- 2. Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON public.sales(branch_id);

-- 3. Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON public.payments(business_id);

-- 4. Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON public.notifications(business_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 5. Branch Inventory indexes
CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch_id ON public.branch_inventory(branch_id);
