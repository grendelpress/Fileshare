/*
  # Fix is_super_admin Function to Bypass RLS

  1. Problem
    - Need to check if user is super admin without triggering RLS
    - Function needs to bypass RLS policies completely

  2. Solution
    - Recreate function as SECURITY DEFINER with proper search path
    - Set search_path to bypass RLS
    - Query must execute with elevated privileges

  3. Changes
    - Replace is_super_admin() function
    - Use pg_read_all_data role or similar approach
*/

-- Drop the policies that cause recursion on authors table
DROP POLICY IF EXISTS "Super admins can view all author profiles" ON public.authors;
DROP POLICY IF EXISTS "Super admins can update any author profile" ON public.authors;

-- Recreate the is_super_admin function to truly bypass RLS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
STABLE
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Query with SECURITY DEFINER bypasses RLS
  SELECT is_super_admin INTO is_admin
  FROM public.authors
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Now add back the super admin policies for authors table
-- These will work because is_super_admin() bypasses RLS
CREATE POLICY "Super admins can view all profiles"
  ON public.authors
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

CREATE POLICY "Super admins can update all profiles"
  ON public.authors  
  FOR UPDATE
  TO authenticated
  USING (is_super_admin());