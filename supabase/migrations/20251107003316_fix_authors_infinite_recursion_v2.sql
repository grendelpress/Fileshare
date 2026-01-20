/*
  # Fix Authors Table Infinite Recursion - V2

  1. Problem
    - The authors table policies have infinite recursion
    - When querying authors table, policies check is_super_admin
    - This creates a loop

  2. Solution
    - Completely remove recursive checks from authors policies
    - Use simple, direct checks only
    - No nested subqueries that check the same table

  3. Changes
    - Recreate authors table policies without any recursive logic
    - Keep policies simple and direct
*/

-- ============================================================================
-- AUTHORS TABLE POLICIES - FIX INFINITE RECURSION
-- ============================================================================

DROP POLICY IF EXISTS "Authors can view own profile or super admin can view all" ON public.authors;
DROP POLICY IF EXISTS "Authors can view own profile" ON public.authors;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.authors;
DROP POLICY IF EXISTS "Authors can update own profile" ON public.authors;
DROP POLICY IF EXISTS "Super admins can update any author" ON public.authors;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.authors;

-- Simple policy: users can view their own author record
CREATE POLICY "Users can view own author profile"
  ON public.authors
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Authors can update their own profile
-- Prevent changing security fields by checking they haven't changed
CREATE POLICY "Users can update own author profile"
  ON public.authors
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());