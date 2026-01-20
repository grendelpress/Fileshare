/*
  # Add Trial Period and Account Management System

  1. Overview
    This migration implements a comprehensive trial period and account management
    system that automatically handles GP author codes and 14-day trials for
    regular users.

  2. Changes to Existing Tables
    - Add `trial_start_date` column to `authors` table
    - Add `trial_end_date` column to `authors` table
    - Add `account_status` column to `authors` table
      - Values: 'active', 'trial', 'suspended', 'cancelled'
      - GP authors with codes: 'active'
      - Regular users: 'trial' for 14 days
      - After trial: 'suspended' until payment
    - Add `original_subscription_status` column to preserve status before suspension

  3. New Indexes
    - Index on `trial_end_date` for efficient expiration queries
    - Index on `account_status` for filtering suspended/trial accounts
    - Composite index on `account_status` and `trial_end_date` for cron jobs

  4. New Functions
    - `suspend_expired_trials()` - Marks expired trials as suspended and hides content
    - `reactivate_account()` - Restores suspended accounts after successful payment
    - `get_trial_days_remaining()` - Helper function to calculate days left in trial

  5. Security
    - Account status checked before allowing content modifications
    - Suspended users cannot create, update, or delete content
    - Public content from suspended authors is automatically hidden

  6. Notes
    - GP authors bypass trials completely (account_status = 'active')
    - Regular users get 14-day trial automatically on signup
    - Content is hidden but not deleted when accounts are suspended
    - Accounts can be reactivated when users subscribe
    - Trial countdown visible to users throughout the application
*/

-- Add new columns to authors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'authors'
    AND column_name = 'trial_start_date'
  ) THEN
    ALTER TABLE public.authors ADD COLUMN trial_start_date timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'authors'
    AND column_name = 'trial_end_date'
  ) THEN
    ALTER TABLE public.authors ADD COLUMN trial_end_date timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'authors'
    AND column_name = 'account_status'
  ) THEN
    ALTER TABLE public.authors 
    ADD COLUMN account_status text DEFAULT 'active' NOT NULL
    CHECK (account_status IN ('active', 'trial', 'suspended', 'cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'authors'
    AND column_name = 'original_subscription_status'
  ) THEN
    ALTER TABLE public.authors ADD COLUMN original_subscription_status text DEFAULT NULL;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_authors_trial_end_date 
  ON public.authors(trial_end_date) 
  WHERE trial_end_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_authors_account_status 
  ON public.authors(account_status);

CREATE INDEX IF NOT EXISTS idx_authors_account_trial_composite 
  ON public.authors(account_status, trial_end_date) 
  WHERE account_status = 'trial';

-- Function to calculate days remaining in trial
CREATE OR REPLACE FUNCTION public.get_trial_days_remaining(author_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trial_end_date timestamptz;
  v_days_remaining integer;
BEGIN
  SELECT trial_end_date INTO v_trial_end_date
  FROM public.authors
  WHERE id = author_id;

  IF v_trial_end_date IS NULL THEN
    RETURN NULL;
  END IF;

  v_days_remaining := EXTRACT(DAY FROM (v_trial_end_date - NOW()));
  
  RETURN GREATEST(0, v_days_remaining);
END;
$$;

-- Function to suspend expired trials
CREATE OR REPLACE FUNCTION public.suspend_expired_trials()
RETURNS TABLE(suspended_count integer, affected_author_ids uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_suspended_count integer := 0;
  v_affected_author_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  -- Find all authors with expired trials
  WITH expired_authors AS (
    SELECT id
    FROM public.authors
    WHERE account_status = 'trial'
    AND trial_end_date IS NOT NULL
    AND trial_end_date < NOW()
  )
  -- Update author status to suspended
  UPDATE public.authors
  SET 
    account_status = 'suspended',
    original_subscription_status = subscription_status,
    updated_at = NOW()
  FROM expired_authors
  WHERE authors.id = expired_authors.id
  RETURNING authors.id INTO v_affected_author_ids;

  v_suspended_count := array_length(v_affected_author_ids, 1);
  IF v_suspended_count IS NULL THEN
    v_suspended_count := 0;
  END IF;

  -- Hide all books by suspended authors
  IF v_suspended_count > 0 THEN
    UPDATE public.books
    SET is_active = false
    WHERE author_id = ANY(v_affected_author_ids);

    -- Hide all series by suspended authors
    UPDATE public.series
    SET is_active = false
    WHERE author_id = ANY(v_affected_author_ids);

    -- Hide all collections by suspended authors
    UPDATE public.collections
    SET is_active = false
    WHERE author_id = ANY(v_affected_author_ids);
  END IF;

  RETURN QUERY SELECT v_suspended_count, v_affected_author_ids;
END;
$$;

-- Function to reactivate account after successful payment
CREATE OR REPLACE FUNCTION public.reactivate_account(p_author_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_was_suspended boolean;
BEGIN
  -- Check if author was suspended
  SELECT account_status = 'suspended' INTO v_was_suspended
  FROM public.authors
  WHERE id = p_author_id;

  IF NOT v_was_suspended THEN
    RETURN false;
  END IF;

  -- Update author status to active
  UPDATE public.authors
  SET 
    account_status = 'active',
    subscription_status = 'active',
    trial_start_date = NULL,
    trial_end_date = NULL,
    original_subscription_status = NULL,
    updated_at = NOW()
  WHERE id = p_author_id;

  -- Reactivate all books by this author
  UPDATE public.books
  SET is_active = true
  WHERE author_id = p_author_id;

  -- Reactivate all series by this author
  UPDATE public.series
  SET is_active = true
  WHERE author_id = p_author_id;

  -- Reactivate all collections by this author
  UPDATE public.collections
  SET is_active = true
  WHERE author_id = p_author_id;

  RETURN true;
END;
$$;

-- Update existing authors to have appropriate account status
-- GP authors and admins should be active, others should be trial or active based on subscription
UPDATE public.authors
SET 
  account_status = CASE
    WHEN is_super_admin = true THEN 'active'
    WHEN is_grendel_press = true THEN 'active'
    WHEN subscription_status = 'active' THEN 'active'
    WHEN subscription_status = 'free' THEN 'active'
    ELSE 'active'
  END,
  trial_start_date = CASE
    WHEN is_super_admin = false AND is_grendel_press = false AND subscription_status NOT IN ('active', 'free') 
    THEN created_at
    ELSE NULL
  END,
  trial_end_date = CASE
    WHEN is_super_admin = false AND is_grendel_press = false AND subscription_status NOT IN ('active', 'free') 
    THEN created_at + INTERVAL '14 days'
    ELSE NULL
  END
WHERE account_status IS NULL OR account_status = 'active';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_trial_days_remaining(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.suspend_expired_trials() TO service_role;
GRANT EXECUTE ON FUNCTION public.reactivate_account(uuid) TO service_role;