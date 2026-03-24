-- ============================================================
-- RPC: nearby_loot_boxes
-- Returns active loot boxes within a radius of a point.
-- Called from lootBoxService.ts via supabase.rpc()
-- ============================================================
CREATE OR REPLACE FUNCTION nearby_loot_boxes(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_m DOUBLE PRECISION DEFAULT 2000
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  category TEXT,
  business_name TEXT,
  business_logo TEXT,
  coupon_code TEXT,
  coupon_title TEXT,
  coupon_desc TEXT,
  discount_type TEXT,
  discount_value NUMERIC,
  terms TEXT,
  drop_time TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_claims INTEGER,
  claims_count INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  distance_m DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lb.id,
    lb.title,
    ST_Y(lb.location::geometry) AS latitude,
    ST_X(lb.location::geometry) AS longitude,
    lb.category,
    lb.business_name,
    lb.business_logo,
    lb.coupon_code,
    lb.coupon_title,
    lb.coupon_desc,
    lb.discount_type,
    lb.discount_value,
    lb.terms,
    lb.drop_time,
    lb.expires_at,
    lb.max_claims,
    lb.claims_count,
    lb.is_active,
    lb.created_at,
    ST_Distance(
      lb.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) AS distance_m
  FROM loot_boxes lb
  WHERE
    lb.is_active = true
    AND lb.expires_at > now()
    AND ST_DWithin(
      lb.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_m
    )
  ORDER BY distance_m ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- RPC: claim_loot_box
-- Server-side claim validation + insert.
-- Validates: exists, active, not expired, not already claimed,
-- within 100m, under max_claims.
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
BEGIN
  -- 1. Fetch the box
  SELECT * INTO v_box FROM loot_boxes WHERE id = p_box_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'not_found', 'message', 'Loot box not found');
  END IF;

  -- 2. Check active + not expired
  IF NOT v_box.is_active OR v_box.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'expired', 'message', 'This loot box has expired');
  END IF;

  -- 3. Check not already claimed
  SELECT id INTO v_existing_claim FROM claims WHERE user_id = p_user_id AND loot_box_id = p_box_id;
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'already_claimed', 'message', 'You already claimed this one!');
  END IF;

  -- 4. Calculate distance
  v_distance := ST_Distance(
    v_box.location,
    ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
  );

  IF v_distance > 100 THEN
    RETURN json_build_object('success', false, 'error', 'too_far', 'message', 'Get closer! You need to be within 100m.');
  END IF;

  -- 5. Check max claims
  IF v_box.max_claims IS NOT NULL AND v_box.claims_count >= v_box.max_claims THEN
    RETURN json_build_object('success', false, 'error', 'max_claims', 'message', 'All claimed! This drop is sold out.');
  END IF;

  -- 6. Insert claim + update count (atomic)
  INSERT INTO claims (user_id, loot_box_id, claim_location, distance_m)
  VALUES (
    p_user_id,
    p_box_id,
    ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
    v_distance
  )
  RETURNING id INTO v_claim_id;

  UPDATE loot_boxes SET claims_count = claims_count + 1 WHERE id = p_box_id;

  -- 7. Award XP to user
  UPDATE users SET xp = xp + 10, updated_at = now() WHERE id = p_user_id;

  -- 8. Return success with coupon data
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
    )
  );
END;
$$ LANGUAGE plpgsql;
