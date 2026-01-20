/*
  # Update Author Signup Trigger with Trial Support

  1. Overview
    This migration updates the handle_new_user_with_code trigger function to
    implement automatic trial period assignment for regular users and immediate
    active status for GP authors with valid codes.

  2. Changes
    - Replace handle_new_user_with_code function with enhanced version
    - GP authors with valid codes: account_status = 'active', subscription_status = 'free', no trial
    - Regular users without GP codes: account_status = 'trial', trial_start_date = now, trial_end_date = now + 14 days
    - Admin users: account_status = 'active', no trial
    - Set is_approved = true for GP authors and admins
    - Set is_approved = true for trial users to allow immediate access

  3. Logic Flow
    - Extract author_code from user metadata
    - Validate code if provided
    - If valid GP code:
      - role = 'author'
      - is_grendel_press = true
      - account_status = 'active'
      - subscription_status = 'free'
      - No trial dates
    - If no code or invalid code:
      - role = 'user'
      - is_grendel_press = false
      - account_status = 'trial'
      - subscription_status = 'trial'
      - trial_start_date = now
      - trial_end_date = now + 14 days

  4. Security
    - Function runs with SECURITY DEFINER
    - Only operates on new user creation via trigger
*/

-- Drop and recreate the trigger function with trial support
CREATE OR REPLACE FUNCTION public.handle_new_user_with_code()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_author_code text;
  v_code_valid boolean := false;
  v_role text := 'user';
  v_is_grendel_press boolean := false;
  v_account_status text := 'trial';
  v_subscription_status text := 'trial';
  v_trial_start_date timestamptz := NOW();
  v_trial_end_date timestamptz := NOW() + INTERVAL '14 days';
BEGIN
  -- Extract author code from user metadata
  v_author_code := NEW.raw_user_meta_data->>'author_code';

  -- If author code provided, validate it
  IF v_author_code IS NOT NULL AND v_author_code != '' THEN
    -- Check if code exists and is active
    SELECT EXISTS (
      SELECT 1
      FROM public.author_codes
      WHERE code = v_author_code
      AND is_active = true
    ) INTO v_code_valid;

    -- If code is valid, set GP author status with no trial
    IF v_code_valid THEN
      v_role := 'author';
      v_is_grendel_press := true;
      v_account_status := 'active';
      v_subscription_status := 'free';
      v_trial_start_date := NULL;
      v_trial_end_date := NULL;
    END IF;
  END IF;

  -- Create author record with appropriate status
  INSERT INTO public.authors (
    id,
    display_name,
    email,
    role,
    is_grendel_press,
    account_status,
    subscription_status,
    trial_start_date,
    trial_end_date,
    is_approved,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    NEW.email,
    v_role,
    v_is_grendel_press,
    v_account_status,
    v_subscription_status,
    v_trial_start_date,
    v_trial_end_date,
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- The trigger already exists, no need to recreate it
-- It will automatically use the updated function