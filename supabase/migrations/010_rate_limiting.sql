-- ============================================================
-- Migration 010: Rate Limiting
-- Lightweight per-user rate limiting using minute-window buckets.
-- ============================================================

-- 1. Rate limits table
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('minute', now()),
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON rate_limits(window_start);

-- 2. Rate limit check helper
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_per_minute INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO rate_limits (user_id, action, request_count)
  VALUES (p_user_id, p_action, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_max_per_minute;
END;
$$ LANGUAGE plpgsql;

-- 3. Add rate limiting to claim_loot_box (recreate with rate check as step 0)
-- The full function is already defined in 007_activity_events.sql;
-- this migration wraps it with a rate limit check at the top.
CREATE OR REPLACE FUNCTION claim_loot_box(
  p_box_id UUID,
  p_user_id UUID,
  p_user_lat DOUBLE PRECISION,
  p_user_lng DOUBLE PRECISION
)
RETURNS JSON AS $$
DECLARE
  v_box loot_boxes%ROWTYPE;
  v_distance DOUBLE PRECISION;
  v_existing_claim UUID;
  v_claim_id UUID;
  v_user RECORD;
  v_xp_earned INTEGER := 0;
  v_xp_events JSON[] := ARRAY[]::JSON[];
  v_new_badges JSON[] := ARRAY[]::JSON[];
  v_new_streak INTEGER;
  v_streak_bonus INTEGER;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_new_tier TEXT;
  v_old_tier TEXT;
  v_today DATE := CURRENT_DATE;
  v_user_name TEXT;
  v_xp_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000, 40000];
BEGIN
  -- Step 0: Rate limit check (max 5 claims per minute)
  IF NOT check_rate_limit(p_user_id, 'claim', 5) THEN
    RETURN json_build_object('success', false, 'error', 'rate_limited', 'message', 'Too many claims. Please wait a moment.');
  END IF;

  -- Step 0b: Fetch user state
  SELECT xp, level, streak_count, last_claim_date, longest_streak, total_claims, avatar_tier, name
    INTO v_user
    FROM users WHERE id = p_user_id;

  v_old_level := COALESCE(v_user.level, 1);
  v_old_tier := COALESCE(v_user.avatar_tier, 'bronze');
  v_user_name := COALESCE(v_user.name, 'Someone');

  -- Step 1: Fetch the box
  SELECT * INTO v_box FROM loot_boxes WHERE id = p_box_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'not_found', 'message', 'Loot box not found');
  END IF;

  -- Step 2: Check active + not expired
  IF NOT v_box.is_active OR v_box.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'expired', 'message', 'This loot box has expired');
  END IF;

  -- Step 3: Check not already claimed
  SELECT id INTO v_existing_claim FROM claims WHERE user_id = p_user_id AND loot_box_id = p_box_id;
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'already_claimed', 'message', 'You already claimed this one!');
  END IF;

  -- Step 4: Calculate distance
  v_distance := ST_Distance(
    v_box.location,
    ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
  );

  IF v_distance > 100 THEN
    RETURN json_build_object('success', false, 'error', 'too_far', 'message', 'Get closer! You need to be within 100m.');
  END IF;

  -- Step 5: Check max claims
  IF v_box.max_claims IS NOT NULL AND v_box.claims_count >= v_box.max_claims THEN
    RETURN json_build_object('success', false, 'error', 'max_claims', 'message', 'All claimed! This drop is sold out.');
  END IF;

  -- Step 6: Insert claim + update count (atomic)
  INSERT INTO claims (user_id, loot_box_id, claim_location, distance_m)
  VALUES (
    p_user_id,
    p_box_id,
    ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
    v_distance
  )
  RETURNING id INTO v_claim_id;

  UPDATE loot_boxes SET claims_count = claims_count + 1 WHERE id = p_box_id;

  -- GAMIFICATION
  v_xp_earned := 25;
  v_xp_events := v_xp_events || json_build_object('type', 'claim', 'amount', 25, 'message', 'Loot box claimed!');

  -- Streak
  IF v_user.last_claim_date = v_today THEN
    v_new_streak := COALESCE(v_user.streak_count, 1);
  ELSIF v_user.last_claim_date = v_today - 1 THEN
    v_new_streak := COALESCE(v_user.streak_count, 0) + 1;
    v_streak_bonus := 10 * v_new_streak;
    v_xp_earned := v_xp_earned + v_streak_bonus;
    v_xp_events := v_xp_events || json_build_object('type', 'streak', 'amount', v_streak_bonus, 'message', v_new_streak || '-day streak! 🔥');
  ELSE
    v_new_streak := 1;
  END IF;

  -- Badges
  DECLARE
    v_new_total_claims INTEGER := COALESCE(v_user.total_claims, 0) + 1;
    v_badge_checks RECORD;
  BEGIN
    FOR v_badge_checks IN
      SELECT * FROM (VALUES
        ('first_loot', 'First Find', '🎁', v_new_total_claims >= 1),
        ('streak_3', 'On a Roll', '🔥', v_new_streak >= 3),
        ('streak_7', 'Week Warrior', '⚡', v_new_streak >= 7),
        ('streak_30', 'Legendary', '👑', v_new_streak >= 30),
        ('claims_5', 'Collector', '🏆', v_new_total_claims >= 5),
        ('claims_25', 'Treasure Hunter', '💎', v_new_total_claims >= 25),
        ('claims_100', 'Loot Legend', '🌟', v_new_total_claims >= 100)
      ) AS t(badge_id, badge_name, badge_emoji, condition)
      WHERE t.condition = true
    LOOP
      IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = v_badge_checks.badge_id) THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_emoji)
        VALUES (p_user_id, v_badge_checks.badge_id, v_badge_checks.badge_name, v_badge_checks.badge_emoji);

        v_xp_earned := v_xp_earned + 50;
        v_new_badges := v_new_badges || json_build_object(
          'id', v_badge_checks.badge_id, 'name', v_badge_checks.badge_name, 'emoji', v_badge_checks.badge_emoji
        );
        v_xp_events := v_xp_events || json_build_object(
          'type', 'badge', 'amount', 50,
          'message', 'Badge unlocked: ' || v_badge_checks.badge_emoji || ' ' || v_badge_checks.badge_name
        );

        INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
        VALUES (p_user_id, 'badge', 'unlocked ' || v_badge_checks.badge_name || ' badge', v_badge_checks.badge_emoji,
          json_build_object('badge_id', v_badge_checks.badge_id)::jsonb);
      END IF;
    END LOOP;

    -- Level + tier
    DECLARE
      v_total_xp INTEGER := COALESCE(v_user.xp, 0) + v_xp_earned;
      i INTEGER;
    BEGIN
      v_new_level := 1;
      FOR i IN REVERSE array_length(v_xp_thresholds, 1)..1 LOOP
        IF v_total_xp >= v_xp_thresholds[i] THEN
          v_new_level := i;
          EXIT;
        END IF;
      END LOOP;

      IF v_new_level >= 15 THEN v_new_tier := 'gold';
      ELSIF v_new_level >= 7 THEN v_new_tier := 'silver';
      ELSE v_new_tier := 'bronze';
      END IF;

      UPDATE users SET
        xp = v_total_xp, level = v_new_level, streak_count = v_new_streak,
        last_claim_date = v_today,
        longest_streak = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
        total_claims = v_new_total_claims, avatar_tier = v_new_tier, updated_at = now()
      WHERE id = p_user_id;

      -- Activity events
      INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
      VALUES (p_user_id, 'claim', 'claimed a loot box at ' || v_box.business_name,
        CASE v_box.category WHEN 'restaurant' THEN '🍕' WHEN 'retail' THEN '🛍️'
          WHEN 'entertainment' THEN '🎬' WHEN 'services' THEN '💪' ELSE '📦' END,
        json_build_object('box_id', p_box_id, 'business_name', v_box.business_name, 'category', v_box.category)::jsonb);

      IF v_new_streak >= 3 AND (v_user.last_claim_date IS NULL OR v_user.last_claim_date != v_today) THEN
        INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
        VALUES (p_user_id, 'streak', 'hit a ' || v_new_streak || '-day streak!', '🔥',
          json_build_object('streak', v_new_streak)::jsonb);
      END IF;

      IF v_new_level > v_old_level THEN
        INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
        VALUES (p_user_id, 'levelup', 'reached Level ' || v_new_level || '!', '⭐',
          json_build_object('level', v_new_level, 'tier', v_new_tier)::jsonb);
      END IF;

      RETURN json_build_object(
        'success', true,
        'claim_id', v_claim_id,
        'coupon', json_build_object(
          'id', v_claim_id, 'code', v_box.coupon_code, 'title', v_box.coupon_title,
          'description', v_box.coupon_desc, 'discountType', v_box.discount_type,
          'value', CASE WHEN v_box.discount_type = 'percentage' THEN v_box.discount_value || '%'
            WHEN v_box.discount_type = 'fixed' THEN '$' || v_box.discount_value ELSE 'Free' END,
          'expiresAt', extract(epoch from v_box.expires_at) * 1000,
          'businessName', v_box.business_name, 'businessLogo', v_box.business_logo,
          'collectedAt', extract(epoch from now()) * 1000, 'isUsed', false
        ),
        'gamification', json_build_object(
          'xp_earned', v_xp_earned, 'total_xp', v_total_xp,
          'xp_events', array_to_json(v_xp_events), 'new_badges', array_to_json(v_new_badges),
          'leveled_up', v_new_level > v_old_level, 'previous_level', v_old_level,
          'new_level', v_new_level, 'tier_changed', v_new_tier != v_old_tier,
          'new_tier', v_new_tier, 'streak', v_new_streak
        )
      );
    END;
  END;
END;
$$ LANGUAGE plpgsql;

-- 4. pg_cron job to clean old rate limit rows (every 10 minutes)
SELECT cron.schedule(
  'clean-rate-limits',
  '*/10 * * * *',
  $$
  DELETE FROM rate_limits
  WHERE window_start < now() - interval '5 minutes';
  $$
);
