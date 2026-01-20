/*
  # Seed Default Author Code
  
  1. Overview
    This migration adds a default GP author code for testing and initial setup.
  
  2. Changes
    - Inserts a default author code: "GRENDEL2024"
    - This code can be used by GP authors to sign up
    - The code is active by default
  
  3. Notes
    - This is a safe operation - if the code already exists, it will be ignored
    - Super admins can manage this code from the admin panel
    - Feel free to change this code or add more codes as needed
*/

-- Insert default author code (ignore if it already exists)
INSERT INTO public.author_codes (code, description, is_active)
VALUES ('GRENDEL2024', 'Default GP Author Code', true)
ON CONFLICT (code) DO NOTHING;