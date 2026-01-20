/*
  # Row Level Security Policies

  1. Authors Table
    - Authors can view and update their own profile
    - Super admins can view and update all profiles
    - No public access

  2. Books Table
    - Authors can CRUD their own books
    - Super admins can CRUD all books
    - Public can view active books

  3. Series Table
    - Authors can CRUD their own series
    - Super admins can CRUD all series
    - Public can view active series

  4. Collections Table
    - Authors can CRUD their own collections
    - Super admins can CRUD all collections
    - Public can view active collections

  5. Collection Books Table
    - Authors can CRUD books in their own collections
    - Super admins can CRUD all collection books
    - Public can view collection books for active collections

  6. Book Passwords Table
    - Authors can CRUD passwords for their own books
    - Super admins can CRUD all passwords
    - No public access

  7. Signups Table
    - Authors can view signups for their own books
    - Super admins can view all signups
    - No public access, no author modifications (signups are created via public Edge Function)

  8. Downloads Table
    - Authors can view downloads for their own books
    - Super admins can view all downloads
    - No public access, no author modifications (downloads are created via Edge Function)
*/

-- Drop existing policies first
DROP POLICY IF EXISTS "Authors can update own profile" ON public.authors;
DROP POLICY IF EXISTS "Authors can view own profile or super admin can view all" ON public.authors;
DROP POLICY IF EXISTS "Super admins can update any author" ON public.authors;

DROP POLICY IF EXISTS "Public can view active books" ON public.books;
DROP POLICY IF EXISTS "Authors can view own books" ON public.books;
DROP POLICY IF EXISTS "Authors can create own books" ON public.books;
DROP POLICY IF EXISTS "Authors can update own books" ON public.books;
DROP POLICY IF EXISTS "Authors can delete own books" ON public.books;

DROP POLICY IF EXISTS "Public can view active series" ON public.series;
DROP POLICY IF EXISTS "Authors can view own series" ON public.series;
DROP POLICY IF EXISTS "Authors can create own series" ON public.series;
DROP POLICY IF EXISTS "Authors can update own series" ON public.series;
DROP POLICY IF EXISTS "Authors can delete own series" ON public.series;

DROP POLICY IF EXISTS "Public can view active collections" ON public.collections;
DROP POLICY IF EXISTS "Authors can view own collections" ON public.collections;
DROP POLICY IF EXISTS "Authors can create own collections" ON public.collections;
DROP POLICY IF EXISTS "Authors can update own collections" ON public.collections;
DROP POLICY IF EXISTS "Authors can delete own collections" ON public.collections;

DROP POLICY IF EXISTS "Public can view collection books" ON public.collection_books;
DROP POLICY IF EXISTS "Authors can view own collection books" ON public.collection_books;
DROP POLICY IF EXISTS "Authors can add books to own collections" ON public.collection_books;
DROP POLICY IF EXISTS "Authors can update own collection books" ON public.collection_books;
DROP POLICY IF EXISTS "Authors can delete own collection books" ON public.collection_books;

DROP POLICY IF EXISTS "Authors can view own book passwords" ON public.book_passwords;
DROP POLICY IF EXISTS "Authors can create passwords for own books" ON public.book_passwords;
DROP POLICY IF EXISTS "Authors can update own book passwords" ON public.book_passwords;
DROP POLICY IF EXISTS "Authors can delete own book passwords" ON public.book_passwords;

DROP POLICY IF EXISTS "Authors can view own book signups" ON public.signups;
DROP POLICY IF EXISTS "Authors can view own book downloads" ON public.downloads;

-- ============================================================================
-- AUTHORS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authors can view own profile or super admin can view all"
  ON public.authors
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

CREATE POLICY "Authors can update own profile"
  ON public.authors
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND is_super_admin = (SELECT is_super_admin FROM public.authors WHERE id = auth.uid())
    AND is_grendel_press = (SELECT is_grendel_press FROM public.authors WHERE id = auth.uid())
    AND subscription_status = (SELECT subscription_status FROM public.authors WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can update any author"
  ON public.authors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- ============================================================================
-- BOOKS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Public can view active books"
  ON public.books
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authors can view own books"
  ON public.books
  FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

CREATE POLICY "Authors can create own books"
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own books"
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

CREATE POLICY "Authors can delete own books"
  ON public.books
  FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- ============================================================================
-- SERIES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Public can view active series"
  ON public.series
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authors can view own series"
  ON public.series
  FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

CREATE POLICY "Authors can create own series"
  ON public.series
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own series"
  ON public.series
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

CREATE POLICY "Authors can delete own series"
  ON public.series
  FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- ============================================================================
-- COLLECTIONS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Public can view active collections"
  ON public.collections
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authors can view own collections"
  ON public.collections
  FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

CREATE POLICY "Authors can create own collections"
  ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own collections"
  ON public.collections
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

CREATE POLICY "Authors can delete own collections"
  ON public.collections
  FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- ============================================================================
-- COLLECTION_BOOKS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Public can view collection books"
  ON public.collection_books
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_books.collection_id
      AND collections.is_active = true
    )
  );

CREATE POLICY "Authors can view own collection books"
  ON public.collection_books
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_books.collection_id
      AND (
        collections.author_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.authors
          WHERE authors.id = auth.uid()
          AND authors.is_super_admin = true
        )
      )
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
      AND (
        collections.author_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.authors
          WHERE authors.id = auth.uid()
          AND authors.is_super_admin = true
        )
      )
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
      AND (
        collections.author_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.authors
          WHERE authors.id = auth.uid()
          AND authors.is_super_admin = true
        )
      )
    )
  );

-- ============================================================================
-- BOOK_PASSWORDS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authors can view own book passwords"
  ON public.book_passwords
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = book_passwords.book_id
      AND (
        books.author_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.authors
          WHERE authors.id = auth.uid()
          AND authors.is_super_admin = true
        )
      )
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
      AND (
        books.author_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.authors
          WHERE authors.id = auth.uid()
          AND authors.is_super_admin = true
        )
      )
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
      AND (
        books.author_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.authors
          WHERE authors.id = auth.uid()
          AND authors.is_super_admin = true
        )
      )
    )
  );

-- ============================================================================
-- SIGNUPS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authors can view own book signups"
  ON public.signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = signups.book_id
      AND (
        books.author_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.authors
          WHERE authors.id = auth.uid()
          AND authors.is_super_admin = true
        )
      )
    )
  );

-- ============================================================================
-- DOWNLOADS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Authors can view own book downloads"
  ON public.downloads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = downloads.book_id
      AND (
        books.author_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM public.authors
          WHERE authors.id = auth.uid()
          AND authors.is_super_admin = true
        )
      )
    )
  );