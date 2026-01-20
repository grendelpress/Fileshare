/*
  # Fix Author Codes RLS Circular Dependency
  
  1. Overview
    This migration fixes the infinite loading issue in the Author Codes tab by
    eliminating the circular RLS policy dependency between author_codes and authors tables.
  
  2. Problem
    - The author_codes RLS policies use nested EXISTS queries to check authors.is_super_admin
    - The authors table RLS only allows users to view their own profile (id = auth.uid())
    - This creates a circular dependency that causes queries to hang in production
  
  3. Solution
    - Create a SECURITY DEFINER function that safely checks super admin status
    - The function bypasses RLS when querying the authors table
    - Update all author_codes RLS policies to use this function
  
  4. Changes
    - Add `is_current_user_super_admin()` helper function
    - Drop and recreate all author_codes RLS policies using the new function
    - Function uses SECURITY DEFINER to avoid RLS circular dependency
  
  5. Security
    - Function only checks the current authenticated user's status
    - No parameters to prevent unauthorized data access
    - Returns simple boolean value
    - Maintains same security model as before
*/

-- Drop existing author_codes RLS policies
DROP POLICY IF EXISTS "Super admins can view codes" ON public.author_codes;
DROP POLICY IF EXISTS "Super admins can create codes" ON public.author_codes;
DROP POLICY IF EXISTS "Super admins can update codes" ON public.author_codes;
DROP POLICY IF EXISTS "Super admins can delete codes" ON public.author_codes;

-- Create a helper function that safely checks if current user is super admin
-- Uses SECURITY DEFINER to bypass RLS when checking the authors table
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_is_super_admin boolean;
BEGIN
  -- Check if the current user is a super admin
  -- SECURITY DEFINER allows this function to bypass RLS on authors table
  SELECT is_super_admin INTO v_is_super_admin
  FROM public.authors
  WHERE id = auth.uid()
  LIMIT 1;
  
  -- Return false if user not found or is_super_admin is null
  RETURN COALESCE(v_is_super_admin, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_current_user_super_admin() TO authenticated;

-- Recreate RLS policies using the new helper function

-- Policy: Only super admins can view author codes
CREATE POLICY "Super admins can view codes"
  ON public.author_codes
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_super_admin());

-- Policy: Only super admins can create author codes
CREATE POLICY "Super admins can create codes"
  ON public.author_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_super_admin());

-- Policy: Only super admins can update author codes
CREATE POLICY "Super admins can update codes"
  ON public.author_codes
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_super_admin())
  WITH CHECK (public.is_current_user_super_admin());

-- Policy: Only super admins can delete author codes
CREATE POLICY "Super admins can delete codes"
  ON public.author_codes
  FOR DELETE
  TO authenticated
  USING (public.is_current_user_super_admin());
