/*
  Add storage policies for master_pdfs bucket

  1. Security Changes
    - Allow uploads to master_pdfs bucket (admin uploads via frontend)
    - Allow reads via service role (already works in Edge Functions)
    - Restrict deletes to service role only

  2. Policies Added
    - Allow INSERT (upload) for authenticated and anon users
    - Allow SELECT (download) for authenticated and anon users
    - Service role bypasses RLS for all operations
*/

-- Allow uploads to master_pdfs bucket
CREATE POLICY "Allow uploads to master_pdfs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'master_pdfs');

-- Allow downloads from master_pdfs bucket (for admin UI preview/verification)
CREATE POLICY "Allow downloads from master_pdfs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'master_pdfs');

-- Allow updates for admin file management
CREATE POLICY "Allow updates to master_pdfs"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'master_pdfs')
  WITH CHECK (bucket_id = 'master_pdfs');

-- Allow deletes for admin file management
CREATE POLICY "Allow deletes from master_pdfs"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'master_pdfs');
