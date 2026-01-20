/*
  # Add Author Code Tracking
  
  1. Overview
    This migration adds the ability to track which specific author code
    each user used during signup, enabling detailed analytics and reporting
    on code usage.
  
  2. Changes to Existing Tables
    - Add `used_author_code` column to `authors` table
      - Stores the actual code string that was used during signup
      - NULL for users who didn't use a code
      - Allows admins to see which specific code each user entered
  
  3. Benefits
    - Track which codes are most popular
    - See which users signed up with which specific code
    - Generate reports on code usage per code
    - Audit trail of code usage
  
  4. Notes
    - Existing users will have NULL in this field
    - Future signups will populate this field automatically via trigger
    - The column is not a foreign key to allow historical tracking even if codes are deleted
*/

-- Add used_author_code column to authors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'authors'
    AND column_name = 'used_author_code'
  ) THEN
    ALTER TABLE public.authors 
    ADD COLUMN used_author_code text DEFAULT NULL;
  END IF;
END $$;

-- Create index for efficient queries on used_author_code
CREATE INDEX IF NOT EXISTS idx_authors_used_author_code 
  ON public.authors(used_author_code)
  WHERE used_author_code IS NOT NULL;

-- Create index for combined queries (role + code)
CREATE INDEX IF NOT EXISTS idx_authors_role_code 
  ON public.authors(role, used_author_code)
  WHERE used_author_code IS NOT NULL;