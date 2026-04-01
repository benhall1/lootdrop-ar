-- ============================================================
-- Migration 006: Gamification Sync
-- Moves gamification logic (XP, badges, streaks, levels) from
-- client-only AsyncStorage into the database as source of truth.
-- ============================================================

-- 1. New columns on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_claims INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_redemptions INTEGER NOT NULL DEFAULT 0;

-- 2. Badge unlock audit table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL DEFAULT '',
  badge_emoji TEXT NOT NULL DEFAULT '',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read own badges; service role can manage all
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages badges"
  ON user_badges FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 3. Replace claim_loot_box RPC with full gamification logic
-- ============================================================
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
  v_xp_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000, 40000];
BEGIN
  -- Step 0: Fetch user state
  SELECT xp, level, streak_count, last_claim_date, longest_streak, total_claims, avatar_tier
    INTO v_user
    FROM users WHERE id = p_user_id;

  v_old_level := COALESCE(v_user.level, 1);
  v_old_tier := COALESCE(v_user.avatar_tier, 'bronze');

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

  -- ============================================================
  -- GAMIFICATION: XP, streak, badges, level, tier
  -- ============================================================

  -- Base XP for claim
  v_xp_earned := 25;
  v_xp_events := v_xp_events || json_build_object('type', 'claim', 'amount', 25, 'message', 'Loot box claimed!');

  -- Streak calculation
  IF v_user.last_claim_date = v_today THEN
    -- Already claimed today, no streak change
    v_new_streak := COALESCE(v_user.streak_count, 1);
  ELSIF v_user.last_claim_date = v_today - 1 THEN
    -- Continuing streak
    v_new_streak := COALESCE(v_user.streak_count, 0) + 1;
    v_streak_bonus := 10 * v_new_streak;
    v_xp_earned := v_xp_earned + v_streak_bonus;
    v_xp_events := v_xp_events || json_build_object('type', 'streak', 'amount', v_streak_bonus, 'message', v_new_streak || '-day streak! 🔥');
  ELSE
    -- Streak broken or first claim
    v_new_streak := 1;
  END IF;

  -- Badge checks
  DECLARE
    v_new_total_claims INTEGER := COALESCE(v_user.total_claims, 0) + 1;
    v_badge_checks RECORD;
  BEGIN
    -- Define badge thresholds
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
      -- Only award if not already unlocked
      IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = v_badge_checks.badge_id) THEN
        INSERT INTO user_badges (user_id, badge_id, badge_name, badge_emoji)
        VALUES (p_user_id, v_badge_checks.badge_id, v_badge_checks.badge_name, v_badge_checks.badge_emoji);

        v_xp_earned := v_xp_earned + 50;
        v_new_badges := v_new_badges || json_build_object(
          'id', v_badge_checks.badge_id,
          'name', v_badge_checks.badge_name,
          'emoji', v_badge_checks.badge_emoji
        );
        v_xp_events := v_xp_events || json_build_object(
          'type', 'badge',
          'amount', 50,
          'message', 'Badge unlocked: ' || v_badge_checks.badge_emoji || ' ' || v_badge_checks.badge_name
        );
      END IF;
    END LOOP;

    -- Calculate new level from total XP
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

      -- Calculate tier
      IF v_new_level >= 15 THEN
        v_new_tier := 'gold';
      ELSIF v_new_level >= 7 THEN
        v_new_tier := 'silver';
      ELSE
        v_new_tier := 'bronze';
      END IF;

      -- Update user with all gamification state
      UPDATE users SET
        xp = v_total_xp,
        level = v_new_level,
        streak_count = v_new_streak,
        last_claim_date = v_today,
        longest_streak = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
        total_claims = v_new_total_claims,
        avatar_tier = v_new_tier,
        updated_at = now()
      WHERE id = p_user_id;

      -- Return enriched response
      RETURN json_build_object(
        'success', true,
        'claim_id', v_claim_id,
        'coupon', json_build_object(
          'id', v_claim_id,
          'code', v_box.coupon_code,
          'title', v_box.coupon_title,
          'description', v_box.coupon_desc,
          'discountType', v_box.discount_type,
          'value', CASE
            WHEN v_box.discount_type = 'percentage' THEN v_box.discount_value || '%'
            WHEN v_box.discount_type = 'fixed' THEN '$' || v_box.discount_value
            ELSE 'Free'
          END,
          'expiresAt', extract(epoch from v_box.expires_at) * 1000,
          'businessName', v_box.business_name,
          'businessLogo', v_box.business_logo,
          'collectedAt', extract(epoch from now()) * 1000,
          'isUsed', false
        ),
        'gamification', json_build_object(
          'xp_earned', v_xp_earned,
          'total_xp', v_total_xp,
          'xp_events', array_to_json(v_xp_events),
          'new_badges', array_to_json(v_new_badges),
          'leveled_up', v_new_level > v_old_level,
          'previous_level', v_old_level,
          'new_level', v_new_level,
          'tier_changed', v_new_tier != v_old_tier,
          'new_tier', v_new_tier,
          'streak', v_new_streak
        )
      );
    END;
  END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. RPC: get_gamification_state
-- Returns full gamification state for a user (called on app open)
-- ============================================================
CREATE OR REPLACE FUNCTION get_gamification_state(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_badges JSON;
BEGIN
  SELECT xp, level, streak_count, longest_streak, total_claims, total_redemptions, avatar_tier, last_claim_date
    INTO v_user
    FROM users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'user_not_found');
  END IF;

  -- Get user badges
  SELECT COALESCE(json_agg(json_build_object(
    'id', badge_id,
    'name', badge_name,
    'emoji', badge_emoji,
    'unlockedAt', unlocked_at
  ) ORDER BY unlocked_at), '[]'::json)
  INTO v_badges
  FROM user_badges WHERE user_id = p_user_id;

  RETURN json_build_object(
    'xp', COALESCE(v_user.xp, 0),
    'level', COALESCE(v_user.level, 1),
    'streak', COALESCE(v_user.streak_count, 0),
    'longestStreak', COALESCE(v_user.longest_streak, 0),
    'totalClaims', COALESCE(v_user.total_claims, 0),
    'totalRedemptions', COALESCE(v_user.total_redemptions, 0),
    'tier', COALESCE(v_user.avatar_tier, 'bronze'),
    'lastClaimDate', v_user.last_claim_date,
    'badges', v_badges
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 5. RPC: record_redemption
-- Awards XP for redeeming a coupon, checks redemption badges
-- ============================================================
CREATE OR REPLACE FUNCTION record_redemption(p_user_id UUID, p_claim_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_xp_earned INTEGER := 15;
  v_xp_events JSON[] := ARRAY[]::JSON[];
  v_new_badges JSON[] := ARRAY[]::JSON[];
  v_new_total_redemptions INTEGER;
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_total_xp INTEGER;
  v_new_tier TEXT;
  v_xp_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000, 40000];
  i INTEGER;
BEGIN
  -- Mark claim as used
  UPDATE claims SET is_used = true, used_at = now()
  WHERE id = p_claim_id AND user_id = p_user_id AND is_used = false;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'not_found', 'message', 'Claim not found or already redeemed');
  END IF;

  -- Get user state
  SELECT xp, level, total_redemptions, avatar_tier
    INTO v_user
    FROM users WHERE id = p_user_id;

  v_old_level := COALESCE(v_user.level, 1);
  v_new_total_redemptions := COALESCE(v_user.total_redemptions, 0) + 1;

  v_xp_events := v_xp_events || json_build_object('type', 'redeem', 'amount', 15, 'message', 'Coupon redeemed!');

  -- Check redemption badges
  IF v_new_total_redemptions >= 1 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'redeemed_1') THEN
    INSERT INTO user_badges (user_id, badge_id, badge_name, badge_emoji) VALUES (p_user_id, 'redeemed_1', 'Saver', '💰');
    v_xp_earned := v_xp_earned + 50;
    v_new_badges := v_new_badges || json_build_object('id', 'redeemed_1', 'name', 'Saver', 'emoji', '💰');
    v_xp_events := v_xp_events || json_build_object('type', 'badge', 'amount', 50, 'message', 'Badge unlocked: 💰 Saver');
  END IF;

  IF v_new_total_redemptions >= 10 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'redeemed_10') THEN
    INSERT INTO user_badges (user_id, badge_id, badge_name, badge_emoji) VALUES (p_user_id, 'redeemed_10', 'Smart Shopper', '🛒');
    v_xp_earned := v_xp_earned + 50;
    v_new_badges := v_new_badges || json_build_object('id', 'redeemed_10', 'name', 'Smart Shopper', 'emoji', '🛒');
    v_xp_events := v_xp_events || json_build_object('type', 'badge', 'amount', 50, 'message', 'Badge unlocked: 🛒 Smart Shopper');
  END IF;

  -- Calculate new totals
  v_total_xp := COALESCE(v_user.xp, 0) + v_xp_earned;

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

  -- Update user
  UPDATE users SET
    xp = v_total_xp,
    level = v_new_level,
    total_redemptions = v_new_total_redemptions,
    avatar_tier = v_new_tier,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'xp_earned', v_xp_earned,
    'total_xp', v_total_xp,
    'xp_events', array_to_json(v_xp_events),
    'new_badges', array_to_json(v_new_badges),
    'leveled_up', v_new_level > v_old_level,
    'new_level', v_new_level
  );
END;
$$ LANGUAGE plpgsql;
