-- Subscription Plans & Notifications Migration

-- 1. Alter payment_status enum to add 'rejected' if it doesn't exist
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'rejected';

-- 2. Add rejection_reason column to payments and businesses
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Create notifications table first so handle_new_user trigger function can reference it
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'payment', 'subscription', 'stock'
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "allow all insert notifications" ON public.notifications;

-- Create policies
CREATE POLICY "users read own notifications" ON public.notifications 
  FOR SELECT TO authenticated USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "users update own notifications" ON public.notifications 
  FOR UPDATE TO authenticated USING (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

CREATE POLICY "allow all insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (business_id = public.current_business_id() OR public.is_super_admin(auth.uid()));

-- 4. Update handle_new_user function to set trial defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  user_count INTEGER;
  new_biz_id UUID;
  new_branch_id UUID;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- Create a new business for this user (approved status, trial package, 14 days expiry)
  INSERT INTO public.businesses (business_name, owner_name, email, account_status, package, expiry_date)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Owner'), 
    NEW.email,
    'approved',
    'trial',
    (CURRENT_DATE + INTERVAL '14 days')::DATE
  )
  RETURNING id INTO new_biz_id;
  
  -- Create a default branch for this business
  INSERT INTO public.branches (name, location, business_id)
  VALUES ('Main Branch', 'HQ', new_biz_id)
  RETURNING id INTO new_branch_id;

  INSERT INTO public.profiles (id, full_name, business_name, business_id, branch_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    new_biz_id,
    new_branch_id
  );
  
  IF user_count = 0 THEN
    -- Make the very first user in the whole system super_admin
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    -- For now, every new signup creates a new business, so they are the owner/admin of that business
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  
  -- Insert a welcome notification
  INSERT INTO public.notifications (business_id, title, message, type)
  VALUES (
    new_biz_id,
    'Welcome to MauzoChap!',
    'Thank you for signing up. Welcome to MauzoChap POS! Enjoy exploring the system!',
    'subscription'
  );
  
  RETURN NEW;
END; $$;
