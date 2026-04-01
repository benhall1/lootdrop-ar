-- ============================================================
-- Migration 007: Activity Events + Merchant Stats
-- Creates activity_events table for social feed and adds
-- activity logging to claim/redemption RPCs.
-- ============================================================

-- 1. Activity events table
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('claim', 'badge', 'streak', 'levelup', 'redeem', 'share')),
  message TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📦',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_created ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_user ON activity_events(user_id, created_at DESC);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- Public read (social feed is visible to all authenticated users)
CREATE POLICY "Anyone can view activity feed"
  ON activity_events FOR SELECT
  USING (true);

-- Only service role can insert (from RPCs)
CREATE POLICY "Service role manages activity events"
  ON activity_events FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 2. Update claim_loot_box to log activity events
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
  v_user_name TEXT;
  v_xp_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, 6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000, 40000];
BEGIN
  -- Step 0: Fetch user state
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

  -- ============================================================
  -- GAMIFICATION: XP, streak, badges, level, tier
  -- ============================================================

  -- Base XP for claim
  v_xp_earned := 25;
  v_xp_events := v_xp_events || json_build_object('type', 'claim', 'amount', 25, 'message', 'Loot box claimed!');

  -- Streak calculation
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

  -- Badge checks
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
          'id', v_badge_checks.badge_id,
          'name', v_badge_checks.badge_name,
          'emoji', v_badge_checks.badge_emoji
        );
        v_xp_events := v_xp_events || json_build_object(
          'type', 'badge',
          'amount', 50,
          'message', 'Badge unlocked: ' || v_badge_checks.badge_emoji || ' ' || v_badge_checks.badge_name
        );

        -- Log badge activity event
        INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
        VALUES (p_user_id, 'badge', 'unlocked ' || v_badge_checks.badge_name || ' badge', v_badge_checks.badge_emoji,
          json_build_object('badge_id', v_badge_checks.badge_id)::jsonb);
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

      IF v_new_level >= 15 THEN v_new_tier := 'gold';
      ELSIF v_new_level >= 7 THEN v_new_tier := 'silver';
      ELSE v_new_tier := 'bronze';
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

      -- ============================================================
      -- ACTIVITY EVENTS: log claim + optional streak/levelup
      -- ============================================================

      -- Claim event
      INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
      VALUES (p_user_id, 'claim',
        'claimed a loot box at ' || v_box.business_name,
        CASE v_box.category
          WHEN 'restaurant' THEN '🍕'
          WHEN 'retail' THEN '🛍️'
          WHEN 'entertainment' THEN '🎬'
          WHEN 'services' THEN '💪'
          ELSE '📦'
        END,
        json_build_object('box_id', p_box_id, 'business_name', v_box.business_name, 'category', v_box.category)::jsonb
      );

      -- Streak event (if streak >= 3)
      IF v_new_streak >= 3 AND (v_user.last_claim_date IS NULL OR v_user.last_claim_date != v_today) THEN
        INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
        VALUES (p_user_id, 'streak', 'hit a ' || v_new_streak || '-day streak!', '🔥',
          json_build_object('streak', v_new_streak)::jsonb);
      END IF;

      -- Level-up event
      IF v_new_level > v_old_level THEN
        INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
        VALUES (p_user_id, 'levelup', 'reached Level ' || v_new_level || '!', '⭐',
          json_build_object('level', v_new_level, 'tier', v_new_tier)::jsonb);
      END IF;

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
-- 3. Update record_redemption to log activity events
-- ============================================================
CREATE OR REPLACE FUNCTION record_redemption(p_user_id UUID, p_claim_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user RECORD;
  v_claim RECORD;
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
  WHERE id = p_claim_id AND user_id = p_user_id AND is_used = false
  RETURNING * INTO v_claim;

  IF v_claim IS NULL THEN
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

    INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
    VALUES (p_user_id, 'badge', 'unlocked Saver badge', '💰', '{"badge_id": "redeemed_1"}'::jsonb);
  END IF;

  IF v_new_total_redemptions >= 10 AND NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = 'redeemed_10') THEN
    INSERT INTO user_badges (user_id, badge_id, badge_name, badge_emoji) VALUES (p_user_id, 'redeemed_10', 'Smart Shopper', '🛒');
    v_xp_earned := v_xp_earned + 50;
    v_new_badges := v_new_badges || json_build_object('id', 'redeemed_10', 'name', 'Smart Shopper', 'emoji', '🛒');
    v_xp_events := v_xp_events || json_build_object('type', 'badge', 'amount', 50, 'message', 'Badge unlocked: 🛒 Smart Shopper');

    INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
    VALUES (p_user_id, 'badge', 'unlocked Smart Shopper badge', '🛒', '{"badge_id": "redeemed_10"}'::jsonb);
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

  -- Log redeem activity event
  INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
  VALUES (p_user_id, 'redeem', 'redeemed a coupon', '💳',
    json_build_object('claim_id', p_claim_id)::jsonb);

  -- Log level-up if applicable
  IF v_new_level > v_old_level THEN
    INSERT INTO activity_events (user_id, event_type, message, emoji, metadata)
    VALUES (p_user_id, 'levelup', 'reached Level ' || v_new_level || '!', '⭐',
      json_build_object('level', v_new_level, 'tier', v_new_tier)::jsonb);
  END IF;

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

-- ============================================================
-- 4. RPC: merchant_stats
-- Returns real stats for merchant dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION merchant_stats(p_merchant_id UUID)
RETURNS JSON AS $$
DECLARE
  v_this_week INTEGER;
  v_last_week INTEGER;
  v_total_claims INTEGER;
  v_active_drops INTEGER;
  v_total_redemptions INTEGER;
  v_weekly_growth TEXT;
BEGIN
  -- Count claims on this merchant's boxes this week vs last week
  SELECT
    COUNT(*) FILTER (WHERE c.created_at >= date_trunc('week', now())),
    COUNT(*) FILTER (WHERE c.created_at >= date_trunc('week', now()) - interval '7 days'
                     AND c.created_at < date_trunc('week', now())),
    COUNT(*)
  INTO v_this_week, v_last_week, v_total_claims
  FROM claims c
  JOIN loot_boxes lb ON lb.id = c.loot_box_id
  WHERE lb.merchant_id = p_merchant_id;

  -- Active drops
  SELECT COUNT(*) INTO v_active_drops
  FROM loot_boxes
  WHERE merchant_id = p_merchant_id AND is_active = true AND expires_at > now();

  -- Total redemptions
  SELECT COUNT(*) INTO v_total_redemptions
  FROM claims c
  JOIN loot_boxes lb ON lb.id = c.loot_box_id
  WHERE lb.merchant_id = p_merchant_id AND c.is_used = true;

  -- Calculate weekly growth
  IF v_last_week = 0 THEN
    IF v_this_week > 0 THEN
      v_weekly_growth := '+100%';
    ELSE
      v_weekly_growth := '0%';
    END IF;
  ELSE
    v_weekly_growth := CASE
      WHEN v_this_week >= v_last_week THEN '+'
      ELSE ''
    END || round(((v_this_week - v_last_week)::numeric / v_last_week) * 100) || '%';
  END IF;

  RETURN json_build_object(
    'totalClaims', v_total_claims,
    'activeDrops', v_active_drops,
    'weeklyGrowth', v_weekly_growth,
    'thisWeek', v_this_week,
    'lastWeek', v_last_week,
    'totalRedemptions', v_total_redemptions
  );
END;
$$ LANGUAGE plpgsql STABLE;
