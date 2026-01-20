/*
  # Storage Bucket RLS Policies

  1. Master PDFs Bucket
    - Authors can upload/update/delete PDFs in their own author_id folder
    - Super admins can upload/update/delete any PDFs
    - Public read access handled via download Edge Function (not direct RLS)

  2. Cover Images Bucket
    - Authors can upload/update/delete images in their own author_id folder
    - Super admins can upload/update/delete any images
    - Public can view all cover images

  3. Important Notes
    - File paths must follow pattern: {author_id}/filename.ext
    - Edge Functions using service role bypass these policies
    - Public download access for PDFs is handled by download Edge Function
*/

-- ============================================================================
-- MASTER_PDFS BUCKET POLICIES
-- ============================================================================

-- Authors can upload PDFs to their own folder
CREATE POLICY "Authors can upload PDFs to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'master_pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authors can update their own PDFs
CREATE POLICY "Authors can update own PDFs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'master_pdfs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      EXISTS (
        SELECT 1 FROM public.authors
        WHERE authors.id = auth.uid()
        AND authors.is_super_admin = true
      )
    )
  );

-- Authors can delete their own PDFs
CREATE POLICY "Authors can delete own PDFs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'master_pdfs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      EXISTS (
        SELECT 1 FROM public.authors
        WHERE authors.id = auth.uid()
        AND authors.is_super_admin = true
      )
    )
  );

-- Authors can view their own PDFs
CREATE POLICY "Authors can view own PDFs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'master_pdfs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      EXISTS (
        SELECT 1 FROM public.authors
        WHERE authors.id = auth.uid()
        AND authors.is_super_admin = true
      )
    )
  );

-- ============================================================================
-- COVER_IMAGES BUCKET POLICIES
-- ============================================================================

-- Authors can upload cover images to their own folder
CREATE POLICY "Authors can upload covers to own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'cover_images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authors can update their own cover images
CREATE POLICY "Authors can update own covers"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'cover_images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      EXISTS (
        SELECT 1 FROM public.authors
        WHERE authors.id = auth.uid()
        AND authors.is_super_admin = true
      )
    )
  );

-- Authors can delete their own cover images
CREATE POLICY "Authors can delete own covers"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cover_images'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      EXISTS (
        SELECT 1 FROM public.authors
        WHERE authors.id = auth.uid()
        AND authors.is_super_admin = true
      )
    )
  );

-- Public can view all cover images
CREATE POLICY "Public can view cover images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'cover_images');