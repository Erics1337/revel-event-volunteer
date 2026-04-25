CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.configure_reminder_cron(
  app_base_url_secret_name TEXT DEFAULT 'reminder_app_base_url',
  cron_secret_name TEXT DEFAULT 'reminder_cron_secret',
  cron_schedule TEXT DEFAULT '*/10 * * * *'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  job_command TEXT;
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE EXCEPTION 'Supabase Vault is required. Create Vault secrets named % and % first.',
      app_base_url_secret_name,
      cron_secret_name;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'dispatch-volunteer-reminders'
  ) THEN
    PERFORM cron.unschedule('dispatch-volunteer-reminders');
  END IF;

  job_command := format(
    $job$
      SELECT net.http_get(
        url := rtrim((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = %L), '/') || '/api/cron/reminders',
        headers := jsonb_build_object(
          'Authorization',
          'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = %L)
        ),
        timeout_milliseconds := 10000
      ) AS request_id;
    $job$,
    app_base_url_secret_name,
    cron_secret_name
  );

  PERFORM cron.schedule(
    'dispatch-volunteer-reminders',
    cron_schedule,
    job_command
  );
END;
$$;

COMMENT ON FUNCTION public.configure_reminder_cron(TEXT, TEXT, TEXT)
  IS 'Schedules the reminder dispatcher with Supabase Cron. Store the app URL and CRON_SECRET in Supabase Vault, then call this function.';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM vault.decrypted_secrets
    WHERE name IN ('reminder_app_base_url', 'reminder_cron_secret')
    HAVING COUNT(DISTINCT name) = 2
  ) THEN
    PERFORM public.configure_reminder_cron();
  END IF;
END;
$$;
