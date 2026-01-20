/*
  # Add Stripe Integration and Payment Tracking

  1. Schema Changes
    - Add `stripe_customer_id` column to authors table
    - Add `stripe_subscription_id` column to authors table
    - Create `author_payment_history` table for tracking all payment events

  2. New Tables
    - `author_payment_history`
      - `id` (uuid, primary key)
      - `author_id` (uuid, foreign key to authors)
      - `stripe_event_id` (text, unique)
      - `event_type` (text) - e.g., 'subscription.created', 'payment.succeeded'
      - `amount` (integer) - amount in cents
      - `currency` (text)
      - `status` (text) - e.g., 'succeeded', 'failed'
      - `metadata` (jsonb) - full Stripe event data
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on author_payment_history
    - Authors can only view their own payment history
    - Super admins can view all payment history
*/

-- Add Stripe columns to authors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'authors' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.authors ADD COLUMN stripe_customer_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'authors' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.authors ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;

-- Create author_payment_history table
CREATE TABLE IF NOT EXISTS public.author_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  amount integer DEFAULT 0,
  currency text DEFAULT 'usd',
  status text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_payment_history_author_created 
  ON public.author_payment_history (author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_event 
  ON public.author_payment_history (stripe_event_id);

-- Enable RLS
ALTER TABLE public.author_payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for author_payment_history
-- Authors can view their own payment history
CREATE POLICY "Authors can view own payment history"
  ON public.author_payment_history
  FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.authors
      WHERE authors.id = auth.uid()
      AND authors.is_super_admin = true
    )
  );

-- Only service role can insert payment history (via Edge Functions)
-- No INSERT policy needed - Edge Functions use service role which bypasses RLS