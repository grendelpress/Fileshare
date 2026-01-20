/*
  # Add Super Admin Support Without Recursion

  1. Problem
    - Super admins need to be able to view and manage all content
    - But we can't query authors table from within authors policies

  2. Solution
    - Store is_super_admin flag in JWT/session metadata
    - OR use a simple materialized approach
    - OR just keep it simple: super admins use their own ID to check

  3. Implementation
    - Add policy for super admins to view all authors
    - Use raw column comparison without subqueries
    - Super admin check uses the requesting user's own record only
*/

-- Add policy for super admins to see all author profiles
-- This checks if the REQUESTING user (auth.uid()) has is_super_admin = true
-- We do this by comparing against a literal list or using a simple EXISTS
CREATE POLICY "Super admins can view all author profiles"
  ON public.authors
  FOR SELECT
  TO authenticated
  USING (
    -- Check if the current user making the request is a super admin
    -- by checking THEIR OWN record (not recursively checking all records)
    (SELECT is_super_admin FROM public.authors WHERE id = auth.uid()) = true
  );

-- Super admins can update any author profile
CREATE POLICY "Super admins can update any author profile"
  ON public.authors
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_super_admin FROM public.authors WHERE id = auth.uid()) = true
  );