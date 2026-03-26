-- Add merchant profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_category TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_lat DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_lng DOUBLE PRECISION;

-- Allow users to update their own profile (including becoming a merchant)
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow anon updates for demo mode
DROP POLICY IF EXISTS "Anon can update own profile" ON users;
CREATE POLICY "Anon can update own profile"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Merchant claim verification: merchants can read claims on their own loot boxes
DROP POLICY IF EXISTS "Merchants can read claims on own boxes" ON claims;
CREATE POLICY "Merchants can read claims on own boxes"
  ON claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM loot_boxes
      WHERE loot_boxes.id = claims.loot_box_id
      AND loot_boxes.merchant_id = auth.uid()
    )
  );

-- RPC: Verify a claim (merchant marks customer coupon as redeemed)
CREATE OR REPLACE FUNCTION verify_claim(
  p_claim_id UUID,
  p_merchant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claim RECORD;
BEGIN
  -- Look up claim with its loot box
  SELECT c.id, c.is_used, c.used_at, c.user_id,
         lb.merchant_id, lb.coupon_code, lb.coupon_title, lb.business_name
  INTO v_claim
  FROM claims c
  JOIN loot_boxes lb ON lb.id = c.loot_box_id
  WHERE c.id = p_claim_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found', 'message', 'Claim not found');
  END IF;

  -- Verify merchant owns this loot box
  IF v_claim.merchant_id != p_merchant_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized', 'message', 'This claim is not for your business');
  END IF;

  -- Check if already used
  IF v_claim.is_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_used', 'message', 'This coupon has already been redeemed');
  END IF;

  -- Mark as used
  UPDATE claims SET is_used = true, used_at = now() WHERE id = p_claim_id;

  RETURN jsonb_build_object(
    'success', true,
    'coupon_code', v_claim.coupon_code,
    'coupon_title', v_claim.coupon_title,
    'business_name', v_claim.business_name
  );
END;
$$;
