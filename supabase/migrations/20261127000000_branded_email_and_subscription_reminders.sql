-- =============================================================================
-- MAUZOCHAP BRANDED EMAIL + SMS AUTOMATED SUBSCRIPTION EXPIRY & 22:00 REPORTS
-- =============================================================================
-- 1. Protected internal_service_tokens table for pg_cron -> Edge Function auth.
-- 2. Deduplicated subscription_reminder_logs table.
-- 3. Automated daily 09:00 AM EAT (06:00 UTC) dispatcher sending BOTH SwalaSMS
--    AND Branded MauzoChap HTML Card Emails for expiring (3d, 1d) and expired
--    (0d, -3d, -7d) subscriptions.
-- 4. Upgrades dispatch_nightly_2200_sms_reports so businesses with email ALSO
--    receive the matching branded 22:00 EAT Daily Business Summary card email.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Internal Service Token Table (locked down strictly to postgres / service_role)
CREATE TABLE IF NOT EXISTS public.internal_service_tokens (
  service_name TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_service_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.internal_service_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.internal_service_tokens TO service_role;

INSERT INTO public.internal_service_tokens (service_name, token)
VALUES ('pg_cron_email_dispatcher', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (service_name) DO NOTHING;

-- 2. Subscription Reminder Logs Table (prevents duplicate spam per milestone)
CREATE TABLE IF NOT EXISTS public.subscription_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  recipient_phone TEXT NULL,
  recipient_email TEXT NULL,
  expiry_date DATE NOT NULL,
  stage TEXT NOT NULL,
  sms_request_id BIGINT NULL,
  email_request_id BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_subscription_reminder_stage
  ON public.subscription_reminder_logs (business_id, expiry_date, stage);

ALTER TABLE public.subscription_reminder_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_reminder_logs FROM PUBLIC, anon;
GRANT SELECT ON public.subscription_reminder_logs TO authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'subscription_reminder_logs'
      AND policyname = 'super_admins_read_subscription_reminders'
  ) THEN
    CREATE POLICY "super_admins_read_subscription_reminders"
      ON public.subscription_reminder_logs
      FOR SELECT
      TO authenticated
      USING (public.is_super_admin(auth.uid()) OR business_id = public.current_business_id());
  END IF;
END $$;

-- 3. Automated Subscription Expiry & Out-of-Subscription Reminder Dispatcher (SMS + Branded Email)
CREATE OR REPLACE FUNCTION public.dispatch_subscription_expiry_reminders(
  _target_business_id UUID DEFAULT NULL,
  _force BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_today_eat DATE := (timezone('Africa/Dar_es_Salaam', now()))::DATE;
  v_cron_token TEXT;
  v_sms_token TEXT := 'swl_live_SZvkG6VjaYRFKJlQHG6FCu8HJZDRCVVHYHWhqgf8VV6lhIeP';
  v_email_url TEXT := 'https://rcinghijelhlehfycjka.supabase.co/functions/v1/mauzochap-email';
  v_biz RECORD;
  v_days_left INTEGER;
  v_stage TEXT;
  v_phone TEXT;
  v_pkg_upper TEXT;
  v_exp_label TEXT;
  v_sms_body TEXT;
  v_sms_req_id BIGINT;
  v_email_req_id BIGINT;
  v_dispatched INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  -- If invoked by an authenticated user (manual trigger), require Super Admin
  IF auth.uid() IS NOT NULL AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Super Admin privileges required.';
  END IF;

  SELECT token INTO v_cron_token
  FROM public.internal_service_tokens
  WHERE service_name = 'pg_cron_email_dispatcher';

  FOR v_biz IN
    SELECT
      b.id,
      b.business_name,
      COALESCE(NULLIF(trim(b.owner_name), ''), b.business_name) AS owner_name,
      NULLIF(trim(b.email), '') AS email,
      COALESCE(
        NULLIF(trim(b.phone), ''),
        (SELECT NULLIF(trim(p.phone), '') FROM public.profiles p WHERE p.business_id = b.id AND p.phone IS NOT NULL AND trim(p.phone) <> '' ORDER BY p.created_at ASC LIMIT 1)
      ) AS raw_phone,
      COALESCE(b.package::TEXT, 'kilimanjaro') AS pkg,
      b.expiry_date::DATE AS exp_date
    FROM public.businesses b
    WHERE b.expiry_date IS NOT NULL
      AND COALESCE(b.account_status::TEXT, 'approved') IN ('approved', 'pending')
      AND (_target_business_id IS NULL OR b.id = _target_business_id)
  LOOP
    v_days_left := (v_biz.exp_date - v_today_eat);

    -- Determine milestone stage
    IF _force AND _target_business_id IS NOT NULL THEN
      v_stage := 'manual_' || to_char(now(), 'YYYYMMDDHH24MISS');
    ELSIF v_days_left = 3 THEN
      v_stage := 'expiring_3d';
    ELSIF v_days_left = 1 THEN
      v_stage := 'expiring_1d';
    ELSIF v_days_left = 0 THEN
      v_stage := 'expired_0d';
    ELSIF v_days_left = -3 THEN
      v_stage := 'overdue_3d';
    ELSIF v_days_left = -7 THEN
      v_stage := 'overdue_7d';
    ELSE
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    IF NOT _force AND EXISTS (
      SELECT 1 FROM public.subscription_reminder_logs l
      WHERE l.business_id = v_biz.id
        AND l.expiry_date = v_biz.exp_date
        AND l.stage = v_stage
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_phone := public.format_tz_phone_e164(v_biz.raw_phone);
    v_pkg_upper := UPPER(v_biz.pkg);
    v_exp_label := to_char(v_biz.exp_date, 'DD/MM/YYYY');
    v_sms_req_id := NULL;
    v_email_req_id := NULL;

    -- 1. Dispatch SwalaSMS if valid Tanzanian phone exists
    IF v_phone IS NOT NULL THEN
      v_sms_body := CASE
        WHEN v_days_left <= 0 THEN
          'Habari ' || v_biz.owner_name || ', kifurushi chako cha ' || v_pkg_upper || ' kwa duka la ' || v_biz.business_name || ' kimekwisha muda wake (' || v_exp_label || '). Lipia sasa kupitia https://www.mauzochap.co.tz/setup-billing ili uendelee kutumia MauzoChap POS.'
        ELSE
          'Habari ' || v_biz.owner_name || ', zimebaki siku ' || v_days_left || ' kifurushi chako cha ' || v_pkg_upper || ' (' || v_biz.business_name || ') kumalizika tarehe ' || v_exp_label || '. Lipia mapema kupitia https://www.mauzochap.co.tz/setup-billing ili huduma isikatike.'
      END;

      SELECT net.http_post(
        url := 'https://api.swalasms.com/v1/sms/messages',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_sms_token
        ),
        body := jsonb_build_object(
          'recipient', v_phone,
          'sender_id', 'MauzoChap',
          'body', v_sms_body
        )
      ) INTO v_sms_req_id;
    END IF;

    -- 2. Dispatch Branded MauzoChap HTML Card Email if email exists
    IF v_biz.email IS NOT NULL AND v_cron_token IS NOT NULL THEN
      SELECT net.http_post(
        url := v_email_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-cron-token', v_cron_token
        ),
        body := jsonb_build_object(
          'to', v_biz.email,
          'subject', CASE
            WHEN v_days_left <= 0 THEN 'Kifurushi Kimekwisha - ' || v_biz.business_name || ' (MauzoChap POS)'
            ELSE 'Kumbusho la Kifurushi: Siku ' || v_days_left || ' Zimebaki - ' || v_biz.business_name
          END,
          'heading', CASE WHEN v_days_left <= 0 THEN 'Kifurushi Kimekwisha' ELSE 'Kumbusho la Kifurushi' END,
          'greetingName', v_biz.owner_name,
          'tone', CASE WHEN v_days_left <= 0 THEN 'danger' ELSE 'warning' END,
          'highlightText', CASE
            WHEN v_days_left <= 0 THEN
              'Habari ' || v_biz.owner_name || ', muda wa kifurushi chako cha ' || v_pkg_upper || ' kwa duka la ' || v_biz.business_name || ' umemalizika tarehe ' || v_exp_label || '. Lipia sasa ili uendelee kuuza, kukata risiti na kusimamia stoo yako bila usumbufu.'
            ELSE
              'Habari ' || v_biz.owner_name || ', zimebaki siku ' || v_days_left || ' pekee kabla ya kifurushi chako cha ' || v_pkg_upper || ' kwa duka la ' || v_biz.business_name || ' kumalizika (' || v_exp_label || '). Lipia mapema ili huduma ya duka lako isikatike.'
          END,
          'rows', jsonb_build_array(
            jsonb_build_object('label', 'Duka', 'value', v_biz.business_name),
            jsonb_build_object('label', 'Kifurushi', 'value', v_pkg_upper),
            jsonb_build_object('label', 'Tarehe ya Kuisha', 'value', v_exp_label),
            jsonb_build_object('label', 'Hali', 'value', CASE WHEN v_days_left <= 0 THEN 'Kimekwisha Muda' ELSE 'Siku ' || v_days_left || ' Zimebaki' END)
          ),
          'ctaLabel', 'Lipia Kifurushi Sasa',
          'ctaUrl', 'https://www.mauzochap.co.tz/setup-billing'
        )
      ) INTO v_email_req_id;
    END IF;

    IF v_sms_req_id IS NOT NULL OR v_email_req_id IS NOT NULL THEN
      INSERT INTO public.subscription_reminder_logs (
        business_id, business_name, recipient_phone, recipient_email,
        expiry_date, stage, sms_request_id, email_request_id
      ) VALUES (
        v_biz.id, v_biz.business_name, v_phone, v_biz.email,
        v_biz.exp_date, v_stage, v_sms_req_id, v_email_req_id
      )
      ON CONFLICT (business_id, expiry_date, stage) DO NOTHING;

      v_dispatched := v_dispatched + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'date_eat', v_today_eat,
    'dispatched_count', v_dispatched,
    'skipped_count', v_skipped
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_subscription_expiry_reminders(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_subscription_expiry_reminders(UUID, BOOLEAN) TO authenticated, service_role;

-- 4. Upgrade 22:00 EAT Nightly Report Dispatcher to ALSO send Branded MauzoChap Card Email alongside SMS
CREATE OR REPLACE FUNCTION public.dispatch_nightly_2200_sms_reports(
  _target_business_id UUID DEFAULT NULL,
  _force BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_eat_now TIMESTAMP;
  v_report_date DATE;
  v_date_label TEXT;
  v_day_start_utc TIMESTAMPTZ;
  v_day_end_utc TIMESTAMPTZ;
  v_biz RECORD;
  v_phone TEXT;
  v_total_sales NUMERIC(15,2);
  v_order_count INTEGER;
  v_cash_total NUMERIC(15,2);
  v_mobile_total NUMERIC(15,2);
  v_cogs NUMERIC(15,2);
  v_expenses NUMERIC(15,2);
  v_net_profit NUMERIC(15,2);
  v_low_stock INTEGER;
  v_sms_body TEXT;
  v_req_id BIGINT;
  v_cron_token TEXT;
  v_dispatched_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_api_token TEXT := 'swl_live_SZvkG6VjaYRFKJlQHG6FCu8HJZDRCVVHYHWhqgf8VV6lhIeP';
  v_email_url TEXT := 'https://rcinghijelhlehfycjka.supabase.co/functions/v1/mauzochap-email';
BEGIN
  v_eat_now := timezone('Africa/Dar_es_Salaam', now());
  v_report_date := v_eat_now::DATE;
  v_date_label := to_char(v_report_date, 'DD/MM/YYYY');
  v_day_start_utc := (v_report_date::TIMESTAMP AT TIME ZONE 'Africa/Dar_es_Salaam');
  v_day_end_utc := ((v_report_date + 1)::TIMESTAMP AT TIME ZONE 'Africa/Dar_es_Salaam');

  SELECT token INTO v_cron_token
  FROM public.internal_service_tokens
  WHERE service_name = 'pg_cron_email_dispatcher';

  FOR v_biz IN
    SELECT
      b.id,
      b.business_name AS name,
      COALESCE(NULLIF(trim(b.owner_name), ''), b.business_name) AS owner_name,
      NULLIF(trim(b.email), '') AS email,
      COALESCE(
        NULLIF(trim(b.phone), ''),
        (SELECT NULLIF(trim(p.phone), '') FROM public.profiles p WHERE p.business_id = b.id AND p.phone IS NOT NULL AND trim(p.phone) <> '' ORDER BY p.created_at ASC LIMIT 1)
      ) AS raw_phone
    FROM public.businesses b
    WHERE COALESCE(b.account_status::TEXT, 'approved') = 'approved'
      AND (_target_business_id IS NULL OR b.id = _target_business_id)
  LOOP
    v_phone := public.format_tz_phone_e164(v_biz.raw_phone);

    IF v_phone IS NULL AND v_biz.email IS NULL THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    IF NOT _force AND EXISTS (
      SELECT 1 FROM public.daily_sms_report_logs l
      WHERE l.business_id = v_biz.id
        AND l.report_date = v_report_date
        AND l.trigger_source = 'pg_cron_2200'
    ) THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    SELECT
      COALESCE(SUM(s.total), 0),
      COUNT(s.id),
      COALESCE(SUM(CASE WHEN s.payment_method::TEXT = 'cash' THEN s.total ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN s.payment_method::TEXT IN ('mobile_money', 'card', 'bank_transfer') THEN s.total ELSE 0 END), 0)
    INTO v_total_sales, v_order_count, v_cash_total, v_mobile_total
    FROM public.sales s
    WHERE s.business_id = v_biz.id
      AND COALESCE(s.status::TEXT, 'completed') <> 'cancelled'
      AND s.created_at >= v_day_start_utc
      AND s.created_at < v_day_end_utc;

    SELECT
      COALESCE(SUM(si.quantity * COALESCE(pr.cost, 0)), 0)
    INTO v_cogs
    FROM public.sale_items si
    JOIN public.sales s ON s.id = si.sale_id
    LEFT JOIN public.products pr ON pr.id = si.product_id
    WHERE s.business_id = v_biz.id
      AND COALESCE(s.status::TEXT, 'completed') <> 'cancelled'
      AND s.created_at >= v_day_start_utc
      AND s.created_at < v_day_end_utc;

    SELECT
      COALESCE(SUM(e.amount), 0)
    INTO v_expenses
    FROM public.expenses e
    WHERE e.business_id = v_biz.id
      AND e.created_at >= v_day_start_utc
      AND e.created_at < v_day_end_utc;

    v_net_profit := v_total_sales - v_cogs - v_expenses;

    SELECT
      COUNT(*)
    INTO v_low_stock
    FROM public.products pr
    WHERE pr.business_id = v_biz.id
      AND COALESCE(pr.is_active, true) = true
      AND pr.stock_quantity <= COALESCE(pr.low_stock_threshold, 5);

    v_sms_body :=
      'MauzoChap Ripoti ya Siku Saa 22:00 - ' || v_date_label || ' (' || v_biz.name || '):' || E'\n' ||
      '- Mauzo Yote: TZS ' || trim(to_char(v_total_sales, 'FM999,999,999,990')) || E'\n' ||
      '- Faida Halisi: TZS ' || trim(to_char(v_net_profit, 'FM999,999,999,990')) || E'\n' ||
      '- Miamala: ' || v_order_count || ' (Cash: ' || trim(to_char(v_cash_total, 'FM999,999,999,990')) || ', Mitandao: ' || trim(to_char(v_mobile_total, 'FM999,999,999,990')) || ')' ||
      CASE WHEN v_low_stock > 0 THEN E'\n- Bidhaa Chini ya Stoo: ' || v_low_stock ELSE '' END || E'\n' ||
      'Asante kwa kutumia MauzoChap POS.';

    v_req_id := NULL;
    IF v_phone IS NOT NULL THEN
      SELECT net.http_post(
        url := 'https://api.swalasms.com/v1/sms/messages',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Accept', 'application/json',
          'Authorization', 'Bearer ' || v_api_token
        ),
        body := jsonb_build_object(
          'recipient', v_phone,
          'sender_id', 'MauzoChap',
          'body', v_sms_body
        )
      ) INTO v_req_id;
    END IF;

    -- Also send matching Branded MauzoChap Card Email
    IF v_biz.email IS NOT NULL AND v_cron_token IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_email_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-cron-token', v_cron_token
        ),
        body := jsonb_build_object(
          'to', v_biz.email,
          'subject', 'Ripoti ya Mauzo ya Siku (' || v_date_label || ') - ' || v_biz.name,
          'heading', 'Ripoti ya Mauzo ya Siku',
          'greetingName', v_biz.owner_name,
          'tone', 'success',
          'highlightText', 'Muhtasari wa mauzo na faida ya duka lako la ' || v_biz.name || ' kwa leo tarehe ' || v_date_label || ' hadi saa 22:00 usiku.',
          'rows', jsonb_build_array(
            jsonb_build_object('label', 'Mauzo Yote', 'value', 'TZS ' || trim(to_char(v_total_sales, 'FM999,999,999,990'))),
            jsonb_build_object('label', 'Faida Halisi', 'value', 'TZS ' || trim(to_char(v_net_profit, 'FM999,999,999,990'))),
            jsonb_build_object('label', 'Idadi ya Risiti', 'value', v_order_count::TEXT),
            jsonb_build_object('label', 'Cash / Taslimu', 'value', 'TZS ' || trim(to_char(v_cash_total, 'FM999,999,999,990'))),
            jsonb_build_object('label', 'Mitandao / Benki', 'value', 'TZS ' || trim(to_char(v_mobile_total, 'FM999,999,999,990'))),
            jsonb_build_object('label', 'Matumizi (Expenses)', 'value', 'TZS ' || trim(to_char(v_expenses, 'FM999,999,999,990'))),
            jsonb_build_object('label', 'Bidhaa Chini ya Stoo', 'value', v_low_stock::TEXT)
          ),
          'ctaLabel', 'Fungua Ripoti Kamili',
          'ctaUrl', 'https://www.mauzochap.co.tz/reports'
        )
      );
    END IF;

    INSERT INTO public.daily_sms_report_logs (
      business_id, business_name, recipient_phone, report_date,
      total_sales, order_count, cash_total, mobile_total,
      expenses_total, net_profit, low_stock_count,
      message_body, status, trigger_source, http_request_id
    ) VALUES (
      v_biz.id, v_biz.name, COALESCE(v_phone, v_biz.email), v_report_date,
      v_total_sales, v_order_count, v_cash_total, v_mobile_total,
      v_expenses, v_net_profit, v_low_stock,
      v_sms_body, 'dispatched',
      CASE WHEN _force THEN 'manual_or_test' ELSE 'pg_cron_2200' END,
      v_req_id
    )
    ON CONFLICT (business_id, report_date) DO UPDATE SET
      recipient_phone = EXCLUDED.recipient_phone,
      total_sales = EXCLUDED.total_sales,
      order_count = EXCLUDED.order_count,
      cash_total = EXCLUDED.cash_total,
      mobile_total = EXCLUDED.mobile_total,
      expenses_total = EXCLUDED.expenses_total,
      net_profit = EXCLUDED.net_profit,
      low_stock_count = EXCLUDED.low_stock_count,
      message_body = EXCLUDED.message_body,
      status = 'dispatched',
      trigger_source = EXCLUDED.trigger_source,
      http_request_id = EXCLUDED.http_request_id,
      created_at = now();

    v_dispatched_count := v_dispatched_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'report_date', v_report_date,
    'schedule_time_eat', '22:00',
    'dispatched_count', v_dispatched_count,
    'skipped_count', v_skipped_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_nightly_2200_sms_reports(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispatch_nightly_2200_sms_reports(UUID, BOOLEAN) TO authenticated, service_role;

-- Schedule daily 09:00 AM EAT (06:00 UTC) Subscription Expiry & Out-of-Subscription Reminder Job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mauzochap-daily-0900-sub-reminders') THEN
    PERFORM cron.unschedule('mauzochap-daily-0900-sub-reminders');
  END IF;
END $$;

SELECT cron.schedule(
  'mauzochap-daily-0900-sub-reminders',
  '0 6 * * *',
  $cron$SELECT public.dispatch_subscription_expiry_reminders(NULL, FALSE);$cron$
);

NOTIFY pgrst, 'reload schema';
