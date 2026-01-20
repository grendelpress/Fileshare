/*
  # Add Distribution Type to Book Passwords

  1. Changes
    - Add `distribution_type` column to `book_passwords` table
    - Values: 'arc', 'hwa', 'giveaway', 'other'
    - Update existing passwords with default distribution type based on label
    - Add index for better query performance

  2. Notes
    - Allows multiple passwords per distribution type per book
    - No unique constraints - admins can create as many as needed
    - Enforces NOT NULL to ensure all passwords have a type
*/

-- Add distribution_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'book_passwords' AND column_name = 'distribution_type'
  ) THEN
    ALTER TABLE public.book_passwords
    ADD COLUMN distribution_type text;
  END IF;
END $$;

-- Update existing passwords with distribution type based on label
UPDATE public.book_passwords
SET distribution_type = CASE
  WHEN LOWER(label) LIKE '%arc%' THEN 'arc'
  WHEN LOWER(label) LIKE '%hwa%' THEN 'hwa'
  WHEN LOWER(label) LIKE '%giveaway%' THEN 'giveaway'
  ELSE 'other'
END
WHERE distribution_type IS NULL;

-- Make distribution_type NOT NULL
ALTER TABLE public.book_passwords
ALTER COLUMN distribution_type SET NOT NULL;

-- Add check constraint for valid distribution types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'book_passwords_distribution_type_check'
  ) THEN
    ALTER TABLE public.book_passwords
    ADD CONSTRAINT book_passwords_distribution_type_check
    CHECK (distribution_type IN ('arc', 'hwa', 'giveaway', 'other'));
  END IF;
END $$;

-- Add index for efficient querying by book and distribution type
CREATE INDEX IF NOT EXISTS idx_book_passwords_book_distribution
ON public.book_passwords (book_id, distribution_type);
