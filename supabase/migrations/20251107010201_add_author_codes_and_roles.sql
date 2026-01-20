/*
  # Add Author Codes and Role System
  
  1. Overview
    This migration adds support for GP author verification codes during signup
    and establishes a role-based permission system.
  
  2. New Tables
    - `author_codes`
      - `id` (uuid, primary key) - Unique identifier for each code
      - `code` (text, unique, not null) - The actual verification code
      - `description` (text) - Description of what this code is for
      - `created_by` (uuid) - References the admin who created this code
      - `is_active` (boolean, default true) - Whether the code can be used
      - `created_at` (timestamptz) - When the code was created
  
  3. Changes to Existing Tables
    - Add `role` column to `authors` table
      - Values: 'user', 'author', 'admin'
      - Default: 'user'
      - For existing records, set to 'author' if is_grendel_press is true
  
  4. Security
    - Enable RLS on `author_codes` table
    - Only super admins can read author codes
    - Only super admins can create/update/delete author codes
    - Regular users and authors cannot access the codes table
  
  5. Notes
    - All GP authors will use shared codes (codes are reusable)
    - Codes do not expire (no expiration date field)
    - Super admins can activate/deactivate codes as needed
    - The role field provides a foundation for role-based access control
*/

-- Create the author_codes table
CREATE TABLE IF NOT EXISTS public.author_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Add role column to authors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'authors'
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.authors 
    ADD COLUMN role text DEFAULT 'user' NOT NULL
    CHECK (role IN ('user', 'author', 'admin'));
  END IF;
END $$;

-- Update existing records: set role to 'author' for GP authors
UPDATE public.authors
SET role = CASE
  WHEN is_super_admin = true THEN 'admin'
  WHEN is_grendel_press = true THEN 'author'
  ELSE 'user'
END
WHERE role = 'user';

-- Enable RLS on author_codes table
ALTER TABLE public.author_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Only super admins can view author codes
CREATE POLICY "Super admins can view codes"
  ON public.author_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- Policy: Only super admins can create author codes
CREATE POLICY "Super admins can create codes"
  ON public.author_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- Policy: Only super admins can update author codes
CREATE POLICY "Super admins can update codes"
  ON public.author_codes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- Policy: Only super admins can delete author codes
CREATE POLICY "Super admins can delete codes"
  ON public.author_codes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- Create an index on the code column for faster lookups
CREATE INDEX IF NOT EXISTS idx_author_codes_code ON public.author_codes(code);
CREATE INDEX IF NOT EXISTS idx_author_codes_is_active ON public.author_codes(is_active);

-- Create an index on the role column for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_authors_role ON public.authors(role);