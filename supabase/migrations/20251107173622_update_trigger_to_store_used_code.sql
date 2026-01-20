/*
  # Update Author Signup Trigger to Track Used Code
  
  1. Overview
    This migration updates the handle_new_user_with_code trigger function to
    store the actual author code that was used during signup in the
    used_author_code column.
  
  2. Changes
    - Update handle_new_user_with_code function to populate used_author_code
    - Store the code string when a valid code is used
    - Store NULL when no code or invalid code is provided
  
  3. Logic
    - Extract author_code from user metadata
    - Validate code if provided
    - If valid: store code in used_author_code, set role to 'author'
    - If invalid or missing: used_author_code remains NULL, role is 'user'
  
  4. Security
    - Function runs with SECURITY DEFINER
    - Only operates on new user creation via trigger
*/

-- Drop and recreate the trigger function with code tracking
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
  v_used_code text := NULL;
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

    -- If code is valid, set GP author status with no trial and store the code
    IF v_code_valid THEN
      v_role := 'author';
      v_is_grendel_press := true;
      v_account_status := 'active';
      v_subscription_status := 'free';
      v_trial_start_date := NULL;
      v_trial_end_date := NULL;
      v_used_code := v_author_code;
    END IF;
  END IF;

  -- Create author record with appropriate status and used code
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
    used_author_code,
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
    v_used_code,
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;