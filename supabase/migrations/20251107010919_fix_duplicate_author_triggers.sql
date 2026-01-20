/*
  # Fix Duplicate Author Creation Triggers

  1. Problem
    - Two triggers are trying to create author records on user signup
    - `on_auth_user_created` (old trigger)
    - `on_auth_user_created_with_code` (new trigger with code support)
    - This causes a duplicate key violation and signup fails

  2. Solution
    - Drop the old trigger and function
    - Keep only the new trigger that supports author codes
    - This ensures only one author record is created per user

  3. Changes
    - Remove `on_auth_user_created` trigger
    - Remove `handle_new_user()` function
    - Keep `on_auth_user_created_with_code` trigger
    - Keep `handle_new_user_with_code()` function
*/

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the old function
DROP FUNCTION IF EXISTS public.handle_new_user();