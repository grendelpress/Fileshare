/*
  # Setup Keep-Alive Cron Job

  ## Purpose
  Prevents Supabase database from shutting down due to inactivity by automatically
  querying the database every 4 days.

  ## Implementation
  1. Extensions
    - Enables pg_cron for scheduled job management
    - Enables pg_net for making HTTP requests from within the database

  2. Scheduled Job
    - Job name: keep-alive-ping
    - Schedule: Every 4 days at midnight (cron: 0 0 star-slash-4 star star)
    - Action: Calls the keep-alive edge function via HTTP POST
    - Timeout: 5 seconds

  ## Notes
  - The job uses the service role key to authenticate with the edge function
  - Logs are automatically captured by pg_cron and can be viewed in cron.job_run_details
  - The edge function performs a lightweight COUNT query on the authors table
  - Running every 4 days provides a 2-day buffer before the 6-day inactivity shutdown
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'keep-alive-ping',
  '0 0 */4 * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/keep-alive',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object('source', 'pg_cron'),
      timeout_milliseconds := 5000
    ) AS request_id;
  $$
);

DO $$
BEGIN
  PERFORM set_config('app.settings.supabase_url', current_setting('SUPABASE_URL', true), false);
  PERFORM set_config('app.settings.supabase_service_role_key', current_setting('SUPABASE_SERVICE_ROLE_KEY', true), false);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not set app settings automatically. Please configure via Supabase dashboard.';
END $$;
