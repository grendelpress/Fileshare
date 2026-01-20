/*
  # Add EPUB Support to Grendel Press

  1. Schema Changes
    - Add `epub_storage_key` column to books table to store EPUB file references
    - Add `file_format` column to downloads table to track which format was downloaded
  
  2. Details
    - `epub_storage_key` is nullable since not all books will have EPUB versions
    - `file_format` defaults to 'pdf' for backward compatibility with existing downloads
    - Both columns use appropriate data types and constraints
  
  3. Notes
    - EPUBs and PDFs will be stored in the same storage bucket with naming conventions
    - File format can be 'pdf' or 'epub'
*/

-- Add epub_storage_key column to books table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'epub_storage_key'
  ) THEN
    ALTER TABLE public.books ADD COLUMN epub_storage_key text DEFAULT NULL;
  END IF;
END $$;

-- Add file_format column to downloads table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'downloads' AND column_name = 'file_format'
  ) THEN
    ALTER TABLE public.downloads ADD COLUMN file_format text NOT NULL DEFAULT 'pdf';
  END IF;
END $$;

-- Add check constraint to ensure file_format is either 'pdf' or 'epub'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'downloads_file_format_check'
  ) THEN
    ALTER TABLE public.downloads 
    ADD CONSTRAINT downloads_file_format_check 
    CHECK (file_format IN ('pdf', 'epub'));
  END IF;
END $$;