/*
  # Add Author Signup with Code Support

  1. Overview
    This migration adds support for automatically creating author records
    when users sign up with a valid GP author code stored in their metadata.

  2. Changes
    - Create a trigger function to handle new user signups
    - Check if user metadata contains a valid author_code
    - If valid code exists, create author record with role 'author'
    - If no code or invalid code, create author record with role 'user'
    - Trigger runs after auth.users insert

  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only operates on new user creation
    - Validates author codes before setting role

  4. Notes
    - The author code should be passed in user metadata during signup
    - Format: { author_code: 'code_value' }
    - Invalid or missing codes result in 'user' role
    - Valid codes result in 'author' role and is_grendel_press = true
*/

-- Create function to handle new user signups with author code verification
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

    -- If code is valid, set role to author
    IF v_code_valid THEN
      v_role := 'author';
      v_is_grendel_press := true;
    END IF;
  END IF;

  -- Create author record with appropriate role
  INSERT INTO public.authors (
    id,
    display_name,
    email,
    role,
    is_grendel_press,
    subscription_status,
    is_approved,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    NEW.email,
    v_role,
    v_is_grendel_press,
    'trial',
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_with_code ON auth.users;

-- Create trigger to run after new user is created
CREATE TRIGGER on_auth_user_created_with_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_code();