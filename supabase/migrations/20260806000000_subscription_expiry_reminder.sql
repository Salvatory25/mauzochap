-- Subscription Expiry Reminder Cron Job

-- 1. Create a function to check for expiring subscriptions and notify users
CREATE OR REPLACE FUNCTION public.check_expiring_subscriptions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  biz RECORD;
BEGIN
  -- Find all businesses that are approved and expiring in exactly 5 days
  FOR biz IN 
    SELECT id, business_name, expiry_date 
    FROM public.businesses 
    WHERE account_status = 'approved' 
      AND expiry_date = CURRENT_DATE + INTERVAL '5 days'
  LOOP
    -- Check if we already sent a notification today to prevent duplicates
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE business_id = biz.id 
        AND type = 'subscription' 
        AND title = 'Subscription Expiring Soon'
        AND created_at::DATE = CURRENT_DATE
    ) THEN
      -- Insert the notification for the business owner
      INSERT INTO public.notifications (business_id, title, message, type)
      VALUES (
        biz.id,
        'Subscription Expiring Soon',
        'Your subscription for ' || biz.business_name || ' will expire in 5 days (' || biz.expiry_date || '). Please renew your plan to avoid service interruption.',
        'subscription'
      );
    END IF;
  END LOOP;
END;
$$;

-- 2. Optional: If pg_cron is enabled on this Supabase project, schedule it to run daily at 00:00 (Midnight)
-- Note: To enable pg_cron, you must first run `CREATE EXTENSION IF NOT EXISTS pg_cron;` as superuser.
-- The following block gracefully attempts to schedule the job if pg_cron is available.

DO $$
BEGIN
  -- Check if the cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Try to unschedule if it exists to avoid duplicates
    PERFORM cron.unschedule('daily_subscription_expiry_check');
    
    -- Schedule the function to run at midnight every day
    PERFORM cron.schedule(
      'daily_subscription_expiry_check', 
      '0 0 * * *', 
      'SELECT public.check_expiring_subscriptions();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if pg_cron operations fail due to permissions
    NULL;
END;
$$;
