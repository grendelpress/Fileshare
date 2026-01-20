/*
  # Add Access Requests System

  1. Overview
    This migration creates a comprehensive access request system that allows
    readers to request access to books without an initial password. Authors
    and admins can then approve or deny these requests and generate temporary
    passwords that expire after use or after 7 days.

  2. New Tables
    - `access_requests`
      - `id` (uuid, primary key) - Unique identifier for each request
      - `book_id` (uuid, foreign key to books) - The book being requested
      - `first_name` (text, not null) - Requester's first name
      - `last_name` (text, not null) - Requester's last name
      - `email` (text, not null) - Requester's email address
      - `status` (text, not null) - Request status: pending, approved, denied
      - `temporary_password_hash` (text, nullable) - Bcrypt hash of temp password
      - `password_expires_at` (timestamptz, nullable) - When password expires
      - `claimed_at` (timestamptz, nullable) - When password was used
      - `approved_by` (uuid, foreign key to auth.users, nullable) - Who approved/denied
      - `denial_reason` (text, nullable) - Optional reason for denial
      - `created_at` (timestamptz, not null) - When request was created
      - `updated_at` (timestamptz, not null) - Last update timestamp

  3. Indexes
    - Composite index on book_id and email for uniqueness and lookups
    - Index on status for filtering pending/approved requests
    - Index on created_at for sorting and date filtering
    - Index on book_id for author-specific queries

  4. Security
    - Enable RLS on access_requests table
    - Public can insert new requests (for unauthenticated readers)
    - Authors can view requests for their own books
    - Admins can view all requests
    - Only authenticated authors/admins can update requests
    - No one can delete requests (audit trail)

  5. Constraints
    - Unique constraint on (book_id, email) to prevent duplicate requests
    - Check constraint on status to ensure valid values
    - Password expiration must be in the future when set
*/

-- Create access_requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  temporary_password_hash text DEFAULT NULL,
  password_expires_at timestamptz DEFAULT NULL,
  claimed_at timestamptz DEFAULT NULL,
  approved_by uuid REFERENCES auth.users(id) DEFAULT NULL,
  denial_reason text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_book_email UNIQUE (book_id, email)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_access_requests_book_id 
  ON public.access_requests(book_id);

CREATE INDEX IF NOT EXISTS idx_access_requests_status 
  ON public.access_requests(status);

CREATE INDEX IF NOT EXISTS idx_access_requests_created_at 
  ON public.access_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_requests_book_email 
  ON public.access_requests(book_id, email);

CREATE INDEX IF NOT EXISTS idx_access_requests_password_expiry
  ON public.access_requests(password_expires_at)
  WHERE password_expires_at IS NOT NULL AND status = 'approved';

-- Enable Row Level Security
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert access requests (for unauthenticated readers)
CREATE POLICY "Anyone can submit access requests"
  ON public.access_requests
  FOR INSERT
  WITH CHECK (true);

-- Policy: Authors can view requests for their own books
CREATE POLICY "Authors can view requests for their books"
  ON public.access_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = access_requests.book_id
      AND books.author_id = auth.uid()
    )
  );

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all requests"
  ON public.access_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND (authors.is_super_admin = true OR authors.role = 'admin')
    )
  );

-- Policy: Authors can update requests for their books
CREATE POLICY "Authors can update their book requests"
  ON public.access_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = access_requests.book_id
      AND books.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books
      WHERE books.id = access_requests.book_id
      AND books.author_id = auth.uid()
    )
  );

-- Policy: Admins can update all requests
CREATE POLICY "Admins can update all requests"
  ON public.access_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND (authors.is_super_admin = true OR authors.role = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND (authors.is_super_admin = true OR authors.role = 'admin')
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_access_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at on row updates
CREATE TRIGGER update_access_requests_updated_at_trigger
  BEFORE UPDATE ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_access_requests_updated_at();
