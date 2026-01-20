/*
  Grendel Press ARC Delivery System Schema

  1. New Tables
    - books: stores book information and master PDF references
    - book_passwords: multiple passwords per book with labels
    - signups: user registrations for book downloads
    - downloads: tracking of PDF downloads with watermarks

  2. Indexes
    - signups: indexed by book_id and created_at
    - downloads: indexed by book_id and created_at

  3. Security
    - RLS enabled on all tables
    - Access via Edge Functions with service role key only
*/

-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  author_name text NOT NULL,
  description text DEFAULT '',
  storage_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create book_passwords table
CREATE TABLE IF NOT EXISTS public.book_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  label text NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create signups table
CREATE TABLE IF NOT EXISTS public.signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  referred_by text DEFAULT '',
  mailing_opt_in boolean NOT NULL DEFAULT false,
  source_password_label text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, email)
);

-- Create downloads table
CREATE TABLE IF NOT EXISTS public.downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_id uuid NOT NULL REFERENCES public.signups(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  watermark_uid text DEFAULT '',
  ip text DEFAULT '',
  user_agent text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_signups_book_created ON public.signups (book_id, created_at);
CREATE INDEX IF NOT EXISTS idx_downloads_book_created ON public.downloads (book_id, created_at);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies (restrictive - no public access, Edge Functions use service role)
-- No policies needed as Edge Functions bypass RLS with service role key