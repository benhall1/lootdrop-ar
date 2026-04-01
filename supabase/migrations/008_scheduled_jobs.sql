-- ============================================================
-- Migration 008: Scheduled Jobs (pg_cron)
--
-- NOTE: pg_cron must be enabled in your Supabase project first:
-- Dashboard → Database → Extensions → search "pg_cron" → Enable
--
-- These jobs handle:
-- 1. Streak reset at midnight for users who missed a day
-- 2. Auto-deactivation of expired loot boxes
-- 3. Cleanup of stale push subscriptions
-- ============================================================

-- Enable pg_cron extension (may require manual enable in Supabase Dashboard)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required for Supabase)
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================
-- Job 1: Reset broken streaks (daily at 00:05 UTC)
-- If a user's last_claim_date was before yesterday, their
-- streak is broken and should be reset to 0.
-- ============================================================
SELECT cron.schedule(
  'reset-broken-streaks',
  '5 0 * * *',
  $$
  UPDATE users
  SET streak_count = 0, updated_at = now()
  WHERE last_claim_date < CURRENT_DATE - 1
    AND streak_count > 0;
  $$
);

-- ============================================================
-- Job 2: Deactivate expired loot boxes (every hour)
-- Marks expired boxes as inactive so they don't appear in
-- queries even without the expires_at filter.
-- ============================================================
SELECT cron.schedule(
  'deactivate-expired-boxes',
  '0 * * * *',
  $$
  UPDATE loot_boxes
  SET is_active = false
  WHERE is_active = true
    AND expires_at < now();
  $$
);

-- ============================================================
-- Job 3: Clean stale push subscriptions (weekly, Sunday 03:00 UTC)
-- Remove push subscriptions older than 90 days that are likely
-- abandoned browser sessions.
-- ============================================================
SELECT cron.schedule(
  'clean-stale-push-subscriptions',
  '0 3 * * 0',
  $$
  DELETE FROM push_subscriptions
  WHERE created_at < now() - interval '90 days';
  $$
);
