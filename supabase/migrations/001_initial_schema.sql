-- LootDrop AR — Initial Schema
-- Requires PostGIS extension for spatial queries

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- Users
-- Replaces both authService.ts and userService.ts User interfaces
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL,
  name            TEXT,
  role            TEXT NOT NULL DEFAULT 'consumer'
                  CHECK (role IN ('consumer', 'merchant')),
  avatar_tier     TEXT NOT NULL DEFAULT 'bronze'
                  CHECK (avatar_tier IN ('bronze', 'silver', 'gold')),
  xp              INTEGER NOT NULL DEFAULT 0,
  streak_count    INTEGER NOT NULL DEFAULT 0,
  last_claim_date DATE,
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  is_premium      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Loot Boxes
-- Replaces mockData.ts with real merchant-created loot drops
-- Uses PostGIS GEOGRAPHY for accurate distance calculations
--
--   location (GEOGRAPHY POINT)
--       │
--       ├── ST_DWithin(location, user_point, 100) → claim validation
--       ├── ST_Distance(location, user_point)     → distance display
--       └── GIST index for fast spatial queries
-- ============================================================
CREATE TABLE loot_boxes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  category        TEXT NOT NULL
                  CHECK (category IN ('restaurant', 'retail', 'entertainment', 'services')),
  business_name   TEXT NOT NULL,
  business_logo   TEXT,
  coupon_code     TEXT NOT NULL,
  coupon_title    TEXT NOT NULL,
  coupon_desc     TEXT,
  discount_type   TEXT NOT NULL
                  CHECK (discount_type IN ('percentage', 'fixed', 'freeItem')),
  discount_value  NUMERIC NOT NULL,
  terms           TEXT,
  drop_time       TIMESTAMPTZ NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  max_claims      INTEGER,
  claims_count    INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Claims
-- Tracks which users claimed which loot boxes
-- UNIQUE constraint prevents double-claims (idempotency)
--
--   Claim flow (Edge Function):
--   1. Check box exists + active + not expired
--   2. Check UNIQUE(user_id, loot_box_id) → no double-claim
--   3. Check ST_Distance < 100m → must be nearby
--   4. Check claims_count < max_claims → not sold out
--   5. INSERT claim + UPDATE claims_count
-- ============================================================
CREATE TABLE claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loot_box_id     UUID NOT NULL REFERENCES loot_boxes(id) ON DELETE CASCADE,
  claim_location  GEOGRAPHY(POINT, 4326),
  distance_m      NUMERIC,
  is_used         BOOLEAN NOT NULL DEFAULT false,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, loot_box_id)
);

-- ============================================================
-- Favorites
-- ============================================================
CREATE TABLE favorites (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loot_box_id     UUID NOT NULL REFERENCES loot_boxes(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, loot_box_id)
);

-- ============================================================
-- Indexes
-- ============================================================

-- Spatial index: powers "find loot boxes near me" queries
CREATE INDEX idx_loot_boxes_location ON loot_boxes USING GIST(location);

-- Composite index: active boxes filtered by time range
CREATE INDEX idx_loot_boxes_active ON loot_boxes(is_active, drop_time, expires_at);

-- Claims lookup by user (for collection screen)
CREATE INDEX idx_claims_user ON claims(user_id, created_at DESC);

-- Claims lookup by box (for claim count validation)
CREATE INDEX idx_claims_box ON claims(loot_box_id);
