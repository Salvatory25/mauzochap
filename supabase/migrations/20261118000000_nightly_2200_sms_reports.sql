-- =============================================================================
-- Nightly 22:00 EAT (19:00 UTC) Automated Business Report SMS Dispatcher
-- Automatically computes daily sales, cash, mobile/bank, net profit, and low-stock
-- metrics for EVERY active business in MauzoChap and dispatches via SwalaSMS.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.daily_sms_report_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  report_date DATE NOT NULL,
  total_sales NUMERIC(15,2) NOT NULL DEFAULT 0,
  order_count INTEGER NOT NULL DEFAULT 0,
  cash_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  mobile_total NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(15,2) NOT NULL DEFAULT 0,
  low_stock_count INTEGER NOT NULL DEFAULT 0,
  sms_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  http_request_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, report_date)
);

ALTER TABLE public.daily_sms_report_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_sms_report_logs'
      AND policyname = 'Read daily sms report logs'
  ) THEN
    CREATE POLICY "Read daily sms report logs"
      ON public.daily_sms_report_logs
      FOR SELECT
      TO authenticated
      USING (
        public.is_super_admin(auth.uid())
        OR business_id = public.current_business_id()
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.format_tz_phone_e164(_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_clean TEXT;
BEGIN
  IF _phone IS NULL THEN
    RETURN NULL;
  END IF;
  v_clean := regexp_replace(trim(_phone), '[^0-9+]', '', 'g');
  IF v_clean LIKE '+%' THEN
    v_clean := substring(v_clean FROM 2);
  END IF;
  IF v_clean LIKE '0%' AND length(v_clean) = 10 THEN
    v_clean := '255' || substring(v_clean FROM 2);
  ELSIF length(v_clean) = 9 AND substring(v_clean FROM 1 FOR 1) IN ('6', '7') THEN
    v_clean := '255' || v_clean;
  END IF;
  IF v_clean ~ '^255[67][0-9]{8}$' THEN
    RETURN '+' || v_clean;
  END IF;
  RETURN NULL;
END;
$$;

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
  v_dispatched_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_api_token TEXT := '7|t3d18d70V5xR2rI6fF8wW1cM4bN9pQ0kL5zX2jH8abcdef12';
BEGIN
  -- Compute East Africa Time (UTC+3) current date & window
  v_eat_now := timezone('Africa/Dar_es_Salaam', now());
  v_report_date := v_eat_now::DATE;
  v_date_label := to_char(v_report_date, 'DD/MM/YYYY');
  v_day_start_utc := (v_report_date::TIMESTAMP AT TIME ZONE 'Africa/Dar_es_Salaam');
  v_day_end_utc := ((v_report_date + 1)::TIMESTAMP AT TIME ZONE 'Africa/Dar_es_Salaam');

  FOR v_biz IN
    SELECT
      b.id,
      b.name,
      COALESCE(
        NULLIF(trim(b.phone), ''),
        (SELECT NULLIF(trim(p.phone), '') FROM public.profiles p WHERE p.business_id = b.id AND p.phone IS NOT NULL AND trim(p.phone) <> '' ORDER BY p.created_at ASC LIMIT 1)
      ) AS raw_phone
    FROM public.businesses b
    WHERE COALESCE(b.account_status, 'active') NOT IN ('suspended', 'rejected')
      AND (_target_business_id IS NULL OR b.id = _target_business_id)
  LOOP
    v_phone := public.format_tz_phone_e164(v_biz.raw_phone);

    IF v_phone IS NULL THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    -- Skip if already dispatched today unless _force = TRUE
    IF NOT _force AND EXISTS (
      SELECT 1 FROM public.daily_sms_report_logs l
      WHERE l.business_id = v_biz.id AND l.report_date = v_report_date
    ) THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    -- Aggregate today's non-cancelled sales in EAT
    SELECT
      COALESCE(SUM(s.total_amount), 0),
      COUNT(s.id),
      COALESCE(SUM(CASE WHEN s.payment_method = 'cash' THEN s.total_amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN s.payment_method IN ('mobile_money', 'card', 'bank_transfer') THEN s.total_amount ELSE 0 END), 0)
    INTO v_total_sales, v_order_count, v_cash_total, v_mobile_total
    FROM public.sales s
    WHERE s.business_id = v_biz.id
      AND COALESCE(s.status, 'completed') <> 'cancelled'
      AND s.created_at >= v_day_start_utc
      AND s.created_at < v_day_end_utc;

    -- Aggregate today's Cost of Goods Sold (COGS)
    SELECT
      COALESCE(SUM(si.quantity * COALESCE(NULLIF(si.buying_price, 0), pr.buying_price, 0)), 0)
    INTO v_cogs
    FROM public.sale_items si
    JOIN public.sales s ON s.id = si.sale_id
    LEFT JOIN public.products pr ON pr.id = si.product_id
    WHERE s.business_id = v_biz.id
      AND COALESCE(s.status, 'completed') <> 'cancelled'
      AND s.created_at >= v_day_start_utc
      AND s.created_at < v_day_end_utc;

    -- Aggregate today's operating expenses
    SELECT
      COALESCE(SUM(e.amount), 0)
    INTO v_expenses
    FROM public.expenses e
    WHERE e.business_id = v_biz.id
      AND e.created_at >= v_day_start_utc
      AND e.created_at < v_day_end_utc;

    v_net_profit := v_total_sales - v_cogs - v_expenses;

    -- Count low-stock products
    SELECT
      COUNT(*)
    INTO v_low_stock
    FROM public.products pr
    WHERE pr.business_id = v_biz.id
      AND pr.stock_quantity <= COALESCE(pr.min_stock_level, 5);

    -- Build clean, clear Swahili SMS report
    v_sms_body :=
      'MauzoChap Ripoti ya Siku Saa 22:00 - ' || v_date_label || ' (' || v_biz.name || '):' || E'\n' ||
      '• Mauzo Yote: TZS ' || trim(to_char(v_total_sales, 'FM999,999,999,990')) || E'\n' ||
      '• Faida Halisi: TZS ' || trim(to_char(v_net_profit, 'FM999,999,999,990')) || E'\n' ||
      '• Miamala: ' || v_order_count || ' (Cash: ' || trim(to_char(v_cash_total, 'FM999,999,999,990')) || ', Mitandao: ' || trim(to_char(v_mobile_total, 'FM999,999,999,990')) || ')' ||
      CASE WHEN v_low_stock > 0 THEN E'\n• Bidhaa Chini ya Stoo: ' || v_low_stock ELSE '' END || E'\n' ||
      'Asante kwa kutumia MauzoChap POS.';

    -- Dispatch HTTP POST via pg_net to SwalaSMS Gateway
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

    INSERT INTO public.daily_sms_report_logs (
      business_id,
      business_name,
      recipient_phone,
      report_date,
      total_sales,
      order_count,
      cash_total,
      mobile_total,
      net_profit,
      low_stock_count,
      sms_body,
      status,
      http_request_id
    ) VALUES (
      v_biz.id,
      v_biz.name,
      v_phone,
      v_report_date,
      v_total_sales,
      v_order_count,
      v_cash_total,
      v_mobile_total,
      v_net_profit,
      v_low_stock,
      v_sms_body,
      'dispatched',
      v_req_id
    )
    ON CONFLICT (business_id, report_date) DO UPDATE SET
      recipient_phone = EXCLUDED.recipient_phone,
      total_sales = EXCLUDED.total_sales,
      order_count = EXCLUDED.order_count,
      cash_total = EXCLUDED.cash_total,
      mobile_total = EXCLUDED.mobile_total,
      net_profit = EXCLUDED.net_profit,
      low_stock_count = EXCLUDED.low_stock_count,
      sms_body = EXCLUDED.sms_body,
      status = 'dispatched',
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

-- Schedule automatic cron job at 19:00 UTC every day = 22:00 EAT (10:00 PM Tanzania Time)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mauzochap-nightly-2030-sms-report') THEN
    PERFORM cron.unschedule('mauzochap-nightly-2030-sms-report');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mauzochap-nightly-2200-sms-report') THEN
    PERFORM cron.unschedule('mauzochap-nightly-2200-sms-report');
  END IF;
END $$;

SELECT cron.schedule(
  'mauzochap-nightly-2200-sms-report',
  '0 19 * * *',
  $cron$SELECT public.dispatch_nightly_2200_sms_reports(NULL, FALSE);$cron$
);

