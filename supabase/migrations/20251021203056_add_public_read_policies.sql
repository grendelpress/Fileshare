/*
  Add RLS policies for public read access

  1. Security Changes
    - Allow anonymous users to read active books
    - Keeps all write operations restricted to Edge Functions with service role
    - Other tables remain locked down (no public access)

  2. Policies Added
    - books: SELECT policy for anonymous users on active books only
*/

-- Allow public read access to active books only
CREATE POLICY "Anyone can view active books"
  ON public.books
  FOR SELECT
  USING (is_active = true);
