-- Migration: Fix business user assignment, ensure business owner authority, and allow business admins to manage profiles
-- Description:
-- 1. Updates handle_new_user() so users added to an existing business are linked directly to that business without creating dummy pending businesses
-- 2. Grants business admins full authority over users within their own business
-- 3. Enables business admins to update profiles (like branch_id) for users in their business

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  user_count INTEGER;
  target_biz_id UUID;
  target_branch_id UUID;
  target_role public.app_role;
  selected_pkg TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;

  -- 1. Check if business_id was provided in user metadata and exists (User added by Business Owner)
  IF (NEW.raw_user_meta_data->>'business_id') IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.businesses WHERE id = (NEW.raw_user_meta_data->>'business_id')::UUID
  ) THEN
    target_biz_id := (NEW.raw_user_meta_data->>'business_id')::UUID;
    
    -- Check if branch_id was provided and valid, otherwise fallback to first branch
    IF (NEW.raw_user_meta_data->>'branch_id') IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.branches WHERE id = (NEW.raw_user_meta_data->>'branch_id')::UUID
    ) THEN
      target_branch_id := (NEW.raw_user_meta_data->>'branch_id')::UUID;
    ELSE
      SELECT id INTO target_branch_id 
      FROM public.branches 
      WHERE business_id = target_biz_id 
      ORDER BY created_at ASC 
      LIMIT 1;
    END IF;
    
    -- Target role chosen by the business owner (admin, manager, or cashier)
    target_role := COALESCE(NEW.raw_user_meta_data->>'role', 'cashier')::public.app_role;

    -- Create profile linked directly to the business owner's business
    INSERT INTO public.profiles (id, full_name, business_name, phone, business_id, branch_id)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
      (SELECT business_name FROM public.businesses WHERE id = target_biz_id),
      NEW.raw_user_meta_data->>'phone',
      target_biz_id,
      target_branch_id
    )
    ON CONFLICT (id) DO UPDATE SET
      business_id = target_biz_id,
      branch_id = COALESCE(target_branch_id, profiles.branch_id),
      business_name = (SELECT business_name FROM public.businesses WHERE id = target_biz_id),
      phone = COALESCE(NEW.raw_user_meta_data->>'phone', profiles.phone),
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name);

    -- Insert user role immediately with full authority given by the business owner
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, target_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
  END IF;

  -- 2. Brand New Merchant Registration (Requires selecting package and completing payment verification)
  selected_pkg := COALESCE(NEW.raw_user_meta_data->>'package', 'kilimanjaro');
  IF selected_pkg = 'trial' THEN
    selected_pkg := 'kilimanjaro';
  END IF;

  INSERT INTO public.businesses (business_name, owner_name, email, phone, account_status, package, expiry_date)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Owner'), 
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    'pending',
    selected_pkg::public.subscription_package,
    NULL
  )
  RETURNING id INTO target_biz_id;
  
  -- Create a default branch for this new business
  INSERT INTO public.branches (name, location, business_id)
  VALUES ('Main Branch', COALESCE(NEW.raw_user_meta_data->>'region', 'HQ'), target_biz_id)
  RETURNING id INTO target_branch_id;

  INSERT INTO public.profiles (id, full_name, business_name, phone, business_id, branch_id)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'),
    NEW.raw_user_meta_data->>'phone',
    target_biz_id,
    target_branch_id
  );
  
  IF user_count = 0 THEN
    -- First ever user in database is super_admin
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    -- Default role for new business owner is admin
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  
  INSERT INTO public.notifications (business_id, title, message, type)
  VALUES (
    target_biz_id,
    'Karibu MauzoChap!',
    'Asante kwa kujiunga na MauzoChap POS! Tafadhali chagua kifurushi chako na weka namba ya muamala ili kuanza kutumia mfumo.',
    'subscription'
  );
  
  RETURN NEW;
END; $$;

-- Allow store administrators to update user profiles (such as branch_id or full_name) within their own business
DROP POLICY IF EXISTS "admins update profiles in own business" ON public.profiles;
CREATE POLICY "admins update profiles in own business" ON public.profiles FOR UPDATE TO authenticated
  USING (
    business_id = public.current_business_id() AND 
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    business_id = public.current_business_id() AND 
    public.has_role(auth.uid(), 'admin')
  );

-- Ensure admins can delete user roles for staff within their own business
DROP POLICY IF EXISTS "admins delete staff roles in own business" ON public.user_roles;
CREATE POLICY "admins delete staff roles in own business" ON public.user_roles FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') AND 
    (SELECT business_id FROM public.profiles WHERE id = user_id) = public.current_business_id()
  );
