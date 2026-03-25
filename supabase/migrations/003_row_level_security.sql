-- LootDrop AR — Row Level Security Policies
-- Run after 001 and 002. Required for production security.

-- ============================================================
-- Users — can read/update own profile only
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Allow the claim RPC function to update XP (runs as definer)
CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Loot Boxes — anyone reads active, merchants manage own
-- ============================================================
ALTER TABLE loot_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active loot boxes"
  ON loot_boxes FOR SELECT
  USING (is_active = true OR auth.uid() = merchant_id);

CREATE POLICY "Merchants can insert own loot boxes"
  ON loot_boxes FOR INSERT
  WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update own loot boxes"
  ON loot_boxes FOR UPDATE
  USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can delete own loot boxes"
  ON loot_boxes FOR DELETE
  USING (auth.uid() = merchant_id);

-- Allow RPC function to update claims_count
CREATE POLICY "Service role can manage loot boxes"
  ON loot_boxes FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Claims — users see own claims only
-- ============================================================
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own claims"
  ON claims FOR SELECT
  USING (auth.uid() = user_id);

-- Claims are created by the RPC function (SECURITY DEFINER)
-- so we don't need an INSERT policy for regular users
CREATE POLICY "Service role can manage claims"
  ON claims FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Favorites — users manage own favorites
-- ============================================================
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
