/*
  # Add cover images to books

  1. Schema Changes
    - Add `cover_image_key` column to books table (optional text field)
    - Stores the storage key for the cover image in the cover_images bucket

  2. Storage
    - Create cover_images bucket for book covers
    - Add public read access to cover_images bucket

  3. Security
    - Allow public read access to cover images
    - Allow uploads to cover_images bucket (admin uploads)
*/

-- Add cover image column to books table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'cover_image_key'
  ) THEN
    ALTER TABLE public.books ADD COLUMN cover_image_key text;
  END IF;
END $$;

-- Create cover_images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cover_images', 'cover_images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow uploads to cover_images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public access to cover_images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow updates to cover_images" ON storage.objects;
  DROP POLICY IF EXISTS "Allow deletes from cover_images" ON storage.objects;
END $$;

-- Allow uploads to cover_images bucket
CREATE POLICY "Allow uploads to cover_images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'cover_images');

-- Allow public read access to cover_images
CREATE POLICY "Allow public access to cover_images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cover_images');

-- Allow updates to cover_images
CREATE POLICY "Allow updates to cover_images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'cover_images')
  WITH CHECK (bucket_id = 'cover_images');

-- Allow deletes from cover_images
CREATE POLICY "Allow deletes from cover_images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'cover_images');
