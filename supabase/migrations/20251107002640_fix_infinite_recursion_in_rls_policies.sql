/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - The RLS policies on books, series, and collections have EXISTS subqueries
    - These subqueries check the authors table for is_super_admin
    - This creates infinite recursion when anonymous users try to query
    - Error: "infinite recursion detected in policy for relation 'authors'"

  2. Solution
    - Simplify the policies to avoid nested author table checks
    - For super admin checks, use a security definer function
    - Keep public access policies simple and separate from author policies

  3. Changes
    - Drop existing problematic policies
    - Recreate policies with simplified logic
    - Create a security definer function for super admin checks
*/

-- Create a security definer function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.authors
    WHERE id = auth.uid()
    AND is_super_admin = true
  );
END;
$$;

-- ============================================================================
-- BOOKS TABLE POLICIES - RECREATE
-- ============================================================================

DROP POLICY IF EXISTS "Public can view active books" ON public.books;
DROP POLICY IF EXISTS "Authors can view own books" ON public.books;
DROP POLICY IF EXISTS "Authors can create own books" ON public.books;
DROP POLICY IF EXISTS "Authors can update own books" ON public.books;
DROP POLICY IF EXISTS "Authors can delete own books" ON public.books;

CREATE POLICY "Public can view active books"
  ON public.books
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authors can view own books"
  ON public.books
  FOR SELECT
  TO authenticated
  USING (author_id = auth.uid() OR is_super_admin());

CREATE POLICY "Authors can create own books"
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own books"
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR is_super_admin());

CREATE POLICY "Authors can delete own books"
  ON public.books
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- SERIES TABLE POLICIES - RECREATE
-- ============================================================================

DROP POLICY IF EXISTS "Public can view active series" ON public.series;
DROP POLICY IF EXISTS "Authors can view own series" ON public.series;
DROP POLICY IF EXISTS "Authors can create own series" ON public.series;
DROP POLICY IF EXISTS "Authors can update own series" ON public.series;
DROP POLICY IF EXISTS "Authors can delete own series" ON public.series;

CREATE POLICY "Public can view active series"
  ON public.series
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authors can view own series"
  ON public.series
  FOR SELECT
  TO authenticated
  USING (author_id = auth.uid() OR is_super_admin());

CREATE POLICY "Authors can create own series"
  ON public.series
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own series"
  ON public.series
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR is_super_admin());

CREATE POLICY "Authors can delete own series"
  ON public.series
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- COLLECTIONS TABLE POLICIES - RECREATE
-- ============================================================================

DROP POLICY IF EXISTS "Public can view active collections" ON public.collections;
DROP POLICY IF EXISTS "Authors can view own collections" ON public.collections;
DROP POLICY IF EXISTS "Authors can create own collections" ON public.collections;
DROP POLICY IF EXISTS "Authors can update own collections" ON public.collections;
DROP POLICY IF EXISTS "Authors can delete own collections" ON public.collections;

CREATE POLICY "Public can view active collections"
  ON public.collections
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authors can view own collections"
  ON public.collections
  FOR SELECT
  TO authenticated
  USING (author_id = auth.uid() OR is_super_admin());

CREATE POLICY "Authors can create own collections"
  ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own collections"
  ON public.collections
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid() OR is_super_admin());

CREATE POLICY "Authors can delete own collections"
  ON public.collections
  FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR is_super_admin());

-- ============================================================================
-- COLLECTION_BOOKS TABLE POLICIES - RECREATE
-- ============================================================================

DROP POLICY IF EXISTS "Authors can view own collection books" ON public.collection_books;
DROP POLICY IF EXISTS "Authors can add books to own collections" ON public.collection_books;
DROP POLICY IF EXISTS "Authors can update own collection books" ON public.collection_books;
DROP POLICY IF EXISTS "Authors can delete own collection books" ON public.collection_books;

CREATE POLICY "Authors can view own collection books"
  ON public.collection_books
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_books.collection_id
      AND (collections.author_id = auth.uid() OR is_super_admin())
    )
  );

CREATE POLICY "Authors can add books to own collections"
  ON public.collection_books
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_books.collection_id
      AND collections.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update own collection books"
  ON public.collection_books
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_books.collection_id
      AND (collections.author_id = auth.uid() OR is_super_admin())
    )
  );

CREATE POLICY "Authors can delete own collection books"
  ON public.collection_books
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_books.collection_id
      AND (collections.author_id = auth.uid() OR is_super_admin())
    )
  );

-- ============================================================================
-- BOOK_PASSWORDS TABLE POLICIES - RECREATE
-- ============================================================================

DROP POLICY IF EXISTS "Authors can view own book passwords" ON public.book_passwords;
DROP POLICY IF EXISTS "Authors can create passwords for own books" ON public.book_passwords;
DROP POLICY IF EXISTS "Authors can update own book passwords" ON public.book_passwords;
DROP POLICY IF EXISTS "Authors can delete own book passwords" ON public.book_passwords;

CREATE POLICY "Authors can view own book passwords"
  ON public.book_passwords
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_passwords.book_id
      AND (books.author_id = auth.uid() OR is_super_admin())
    )
  );

CREATE POLICY "Authors can create passwords for own books"
  ON public.book_passwords
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_passwords.book_id
      AND books.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update own book passwords"
  ON public.book_passwords
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_passwords.book_id
      AND (books.author_id = auth.uid() OR is_super_admin())
    )
  );

CREATE POLICY "Authors can delete own book passwords"
  ON public.book_passwords
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_passwords.book_id
      AND (books.author_id = auth.uid() OR is_super_admin())
    )
  );

-- ============================================================================
-- SIGNUPS TABLE POLICIES - RECREATE
-- ============================================================================

DROP POLICY IF EXISTS "Authors can view own book signups" ON public.signups;

CREATE POLICY "Authors can view own book signups"
  ON public.signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = signups.book_id
      AND (books.author_id = auth.uid() OR is_super_admin())
    )
  );

-- ============================================================================
-- DOWNLOADS TABLE POLICIES - RECREATE
-- ============================================================================

DROP POLICY IF EXISTS "Authors can view own book downloads" ON public.downloads;

CREATE POLICY "Authors can view own book downloads"
  ON public.downloads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = downloads.book_id
      AND (books.author_id = auth.uid() OR is_super_admin())
    )
  );