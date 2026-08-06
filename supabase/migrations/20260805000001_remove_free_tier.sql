-- Migration to remove free trial / free tier and enforce paid subscription workflow for all signups

-- 1. Update existing businesses on 'trial' package to 'kilimanjaro'
UPDATE public.businesses 
SET package = 'kilimanjaro' 
WHERE package = 'trial';

-- 2. Update handle_new_user function so new user signups start with pending account status and a paid plan selection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  user_count INTEGER;
  new_biz_id UUID;
  new_branch_id UUID;
  selected_pkg TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  selected_pkg := COALESCE(NEW.raw_user_meta_data->>'package', 'kilimanjaro');
  IF selected_pkg = 'trial' THEN
    selected_pkg := 'kilimanjaro';
  END IF;

  -- Create a new business for this user (pending status, requires payment verification to approve)
  INSERT INTO public.businesses (business_name, owner_name, email, account_status, package, expiry_date)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Owner'), 
    NEW.email,
    'pending',
    selected_pkg::public.subscription_package,
    NULL
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
    -- Default role for new business owner is admin
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  
  -- Insert welcome notification
  INSERT INTO public.notifications (business_id, title, message, type)
  VALUES (
    new_biz_id,
    'Welcome to MauzoChap!',
    'Thank you for signing up for MauzoChap POS! Please select a subscription plan and submit your payment reference to activate your account.',
    'subscription'
  );
  
  RETURN NEW;
END; $$;
