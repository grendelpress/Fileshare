/*
  # Remove pg_cron Keep-Alive System

  This migration removes the database-based keep-alive system that used pg_cron and pg_net.
  We are migrating to Netlify Scheduled Functions instead.

  ## Changes
  
  1. Unschedule and delete the 'keep-alive-ping' cron job
  2. Drop the pg_net extension (no longer needed for HTTP requests)
  3. Keep pg_cron extension as it may be useful for future scheduled tasks
  
  ## Notes
  
  - The keep-alive functionality will be handled by Netlify Scheduled Functions
  - This change reduces database overhead and improves reliability
*/

-- Unschedule the keep-alive cron job
SELECT cron.unschedule('keep-alive-ping');

-- Drop the pg_net extension (no longer needed)
DROP EXTENSION IF EXISTS pg_net;

-- Note: We keep pg_cron in case it's needed for other scheduled tasks in the future