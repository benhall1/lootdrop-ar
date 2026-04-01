-- ============================================================
-- Migration 009: Stripe Columns
-- Adds subscription tracking fields and index for webhook lookups.
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON users(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
