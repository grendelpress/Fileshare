/*
  # Update RLS Policies to Respect Account Status

  1. Overview
    This migration updates Row Level Security policies to prevent suspended
    users from creating, updating, or deleting content. Suspended users can
    still view their own content but cannot modify it or create new content.

  2. Changes
    - Update policies on books, series, collections tables
    - Add account_status checks to INSERT, UPDATE, DELETE policies
    - Suspended users cannot modify any content
    - Trial and active users have full access to their own content
    - Public read access remains unchanged

  3. Policy Logic
    - INSERT: Only active or trial accounts can create content
    - UPDATE: Only active or trial accounts can update their content
    - DELETE: Only active or trial accounts can delete their content
    - SELECT: All authenticated users can view their own content (for dashboard access)

  4. Security
    - Prevents data manipulation by suspended accounts
    - Maintains data visibility for account management
    - Preserves existing super admin access patterns
*/

-- Drop and recreate policies for books table with account_status checks

DROP POLICY IF EXISTS "Authors can create books" ON public.books;
CREATE POLICY "Authors can create books"
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.account_status IN ('active', 'trial')
    )
  );

DROP POLICY IF EXISTS "Authors can update own books v2" ON public.books;
CREATE POLICY "Authors can update own books v2"
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.account_status IN ('active', 'trial')
    )
  );

DROP POLICY IF EXISTS "Authors can delete own books v2" ON public.books;
CREATE POLICY "Authors can delete own books v2"
  ON public.books
  FOR DELETE
  TO authenticated
  USING (
    (author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.account_status IN ('active', 'trial')
    ))
    OR EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- Drop and recreate policies for series table with account_status checks

DROP POLICY IF EXISTS "Authors can create series" ON public.series;
CREATE POLICY "Authors can create series"
  ON public.series
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.account_status IN ('active', 'trial')
    )
  );

DROP POLICY IF EXISTS "Authors can update own series v2" ON public.series;
CREATE POLICY "Authors can update own series v2"
  ON public.series
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.account_status IN ('active', 'trial')
    )
  );

DROP POLICY IF EXISTS "Authors can delete own series v2" ON public.series;
CREATE POLICY "Authors can delete own series v2"
  ON public.series
  FOR DELETE
  TO authenticated
  USING (
    (author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.account_status IN ('active', 'trial')
    ))
    OR EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- Drop and recreate policies for collections table with account_status checks

DROP POLICY IF EXISTS "Authors can create collections" ON public.collections;
CREATE POLICY "Authors can create collections"
  ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.account_status IN ('active', 'trial')
    )
  );

DROP POLICY IF EXISTS "Authors can update own collections v2" ON public.collections;
CREATE POLICY "Authors can update own collections v2"
  ON public.collections
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.account_status IN ('active', 'trial')
    )
  );

DROP POLICY IF EXISTS "Authors can delete own collections v2" ON public.collections;
CREATE POLICY "Authors can delete own collections v2"
  ON public.collections
  FOR DELETE
  TO authenticated
  USING (
    (author_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.account_status IN ('active', 'trial')
    ))
    OR EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );