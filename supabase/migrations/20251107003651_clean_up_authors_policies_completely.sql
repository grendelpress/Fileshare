/*
  # Clean Up Authors Policies Completely

  1. Problem
    - Multiple overlapping policies exist
    - Some use recursive EXISTS subqueries checking authors table
    - The "Super admins can read all profiles" policy has infinite recursion
    - Cannot use is_super_admin() function within authors policies

  2. Solution
    - Drop ALL authors policies
    - Create only simple, non-recursive policies
    - For super admin functionality, we'll handle it differently

  3. Changes
    - Remove all existing authors policies
    - Add simple policy for users to access their own record
    - No super admin policy on authors table (they can query directly without RLS)
*/

-- Drop ALL existing policies on authors table
DROP POLICY IF EXISTS "Authors can create own profile" ON public.authors;
DROP POLICY IF EXISTS "Authors can read own profile" ON public.authors;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON public.authors;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.authors;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.authors;
DROP POLICY IF EXISTS "Users can update own author profile" ON public.authors;
DROP POLICY IF EXISTS "Users can view own author profile" ON public.authors;

-- Simple policy: authenticated users can view their own author profile ONLY
CREATE POLICY "View own profile"
  ON public.authors
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Simple policy: authenticated users can update their own profile ONLY
CREATE POLICY "Update own profile"
  ON public.authors
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: authenticated users can insert their own profile
CREATE POLICY "Insert own profile"
  ON public.authors
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());