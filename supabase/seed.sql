-- LootDrop AR — Seed Data
-- Run after migrations to populate demo data for development/staging.
-- All locations are in San Francisco's Financial District / Union Square area.

-- ============================================================
-- Demo Merchants
-- ============================================================
INSERT INTO users (id, email, name, role, avatar_tier, xp) VALUES
  ('00000000-0000-0000-0000-000000000001', 'merchant@bluebottle.demo', 'Blue Bottle Coffee', 'merchant', 'gold', 5000),
  ('00000000-0000-0000-0000-000000000002', 'merchant@tonys.demo', 'Tony''s Pizzeria', 'merchant', 'gold', 4200),
  ('00000000-0000-0000-0000-000000000003', 'merchant@juicebar.demo', 'Juice Bar SF', 'merchant', 'silver', 2800),
  ('00000000-0000-0000-0000-000000000004', 'merchant@citylights.demo', 'City Lights Books', 'merchant', 'silver', 3100),
  ('00000000-0000-0000-0000-000000000005', 'merchant@fitzone.demo', 'FitZone Gym', 'merchant', 'bronze', 1500),
  ('00000000-0000-0000-0000-000000000006', 'merchant@cinema.demo', 'Cinema Palace', 'merchant', 'silver', 2200),
  ('00000000-0000-0000-0000-000000000007', 'merchant@tacoking.demo', 'Taco King', 'merchant', 'bronze', 800),
  ('00000000-0000-0000-0000-000000000008', 'merchant@plantshop.demo', 'Green Thumb Plants', 'merchant', 'bronze', 600)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Demo Consumers (leaderboard population)
-- ============================================================
INSERT INTO users (id, email, name, role, avatar_tier, xp, streak_count) VALUES
  ('00000000-0000-0000-0000-000000000101', 'treasureking@demo.com', 'TreasureKing', 'consumer', 'gold', 4200, 14),
  ('00000000-0000-0000-0000-000000000102', 'lootqueen22@demo.com', 'LootQueen22', 'consumer', 'gold', 3800, 9),
  ('00000000-0000-0000-0000-000000000103', 'dealhunterx@demo.com', 'DealHunterX', 'consumer', 'silver', 3100, 7),
  ('00000000-0000-0000-0000-000000000104', 'couponninja@demo.com', 'CouponNinja', 'consumer', 'silver', 2600, 5),
  ('00000000-0000-0000-0000-000000000105', 'saversam@demo.com', 'SaverSam', 'consumer', 'silver', 1800, 3),
  ('00000000-0000-0000-0000-000000000106', 'bargainboss@demo.com', 'BargainBoss', 'consumer', 'bronze', 1200, 2),
  ('00000000-0000-0000-0000-000000000107', 'lootlooper@demo.com', 'LootLooper', 'consumer', 'bronze', 900, 1),
  ('00000000-0000-0000-0000-000000000108', 'chestchaser@demo.com', 'ChestChaser', 'consumer', 'bronze', 600, 0),
  ('00000000-0000-0000-0000-000000000109', 'newexplorer@demo.com', 'NewExplorer', 'consumer', 'bronze', 100, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Loot Boxes — Active drops near SF Financial District
-- Using ST_MakePoint(longitude, latitude) for PostGIS GEOGRAPHY
-- ============================================================
INSERT INTO loot_boxes (
  id, merchant_id, title, location, category,
  business_name, business_logo,
  coupon_code, coupon_title, coupon_desc,
  discount_type, discount_value, terms,
  drop_time, expires_at, max_claims, claims_count, is_active
) VALUES
  -- Active: Blue Bottle Coffee — near Market & Montgomery
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Morning Brew Deal',
    ST_MakePoint(-122.4020, 37.7895)::GEOGRAPHY,
    'restaurant',
    'Blue Bottle Coffee', NULL,
    'COFFEE50', '50% Off Any Coffee', 'Get half off any handcrafted coffee drink. Valid for one use.',
    'percentage', 50, 'Valid at Blue Bottle Coffee SF locations only. One per customer.',
    NOW() - INTERVAL '2 hours', NOW() + INTERVAL '5 days',
    100, 23, true
  ),
  -- Active: Tony's Pizzeria — near Columbus & Broadway
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Pizza Party',
    ST_MakePoint(-122.4064, 37.7978)::GEOGRAPHY,
    'restaurant',
    'Tony''s Pizzeria', NULL,
    'PIZZA20', '20% Off Large Pizza', 'Discount on any large pizza, any toppings.',
    'percentage', 20, 'Dine-in or takeout. Cannot combine with other offers.',
    NOW() - INTERVAL '1 hour', NOW() + INTERVAL '7 days',
    50, 12, true
  ),
  -- Active: Juice Bar — near Union Square
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'Free Smoothie Drop',
    ST_MakePoint(-122.4074, 37.7879)::GEOGRAPHY,
    'restaurant',
    'Juice Bar SF', NULL,
    'FREESMOOTHIE', 'Free Small Smoothie', 'Redeem for a complimentary small smoothie of your choice.',
    'freeItem', 0, 'One per customer. While supplies last.',
    NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '3 days',
    75, 41, true
  ),
  -- Active: City Lights Books — North Beach
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000004',
    'Bookworm Special',
    ST_MakePoint(-122.4065, 37.7976)::GEOGRAPHY,
    'retail',
    'City Lights Books', NULL,
    'BOOK15', '$15 Off Purchase', 'Save $15 on any purchase over $50.',
    'fixed', 15, 'In-store only. One per transaction.',
    NOW() - INTERVAL '3 hours', NOW() + INTERVAL '14 days',
    30, 8, true
  ),
  -- Active: FitZone Gym — near Embarcadero
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000005',
    'Gym Membership Deal',
    ST_MakePoint(-122.3934, 37.7946)::GEOGRAPHY,
    'services',
    'FitZone Gym', NULL,
    'GYM30', '30% Off First Month', 'First month membership at 30% discount.',
    'percentage', 30, 'New members only. Valid for monthly membership.',
    NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '10 days',
    200, 67, true
  ),
  -- Upcoming: Cinema Palace — near Metreon
  (
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000006',
    'Movie Night BOGO',
    ST_MakePoint(-122.4030, 37.7835)::GEOGRAPHY,
    'entertainment',
    'Cinema Palace', NULL,
    'MOVIE2FOR1', 'Buy One Get One Free', 'Second ticket free on weekday showings.',
    'freeItem', 0, 'Weekdays only. Standard screenings. Not valid for IMAX.',
    NOW() + INTERVAL '2 hours', NOW() + INTERVAL '7 days',
    150, 0, true
  ),
  -- Active: Taco King — Mission District overflow
  (
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000007',
    'Taco Tuesday Treasure',
    ST_MakePoint(-122.4100, 37.7850)::GEOGRAPHY,
    'restaurant',
    'Taco King', NULL,
    'TACO3FREE', 'Free Taco with Combo', 'Get a free street taco when you buy any combo meal.',
    'freeItem', 0, 'Dine-in only. One per customer per visit.',
    NOW() - INTERVAL '4 hours', NOW() + INTERVAL '2 days',
    80, 55, true
  ),
  -- Active: Green Thumb Plants — near Yerba Buena
  (
    '10000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000008',
    'Plant Parent Deal',
    ST_MakePoint(-122.4010, 37.7855)::GEOGRAPHY,
    'retail',
    'Green Thumb Plants', NULL,
    'PLANT25', '25% Off Any Plant', 'Take 25% off any plant in the shop.',
    'percentage', 25, 'In-store purchases only. Excludes rare specimens.',
    NOW() - INTERVAL '1 hour', NOW() + INTERVAL '5 days',
    40, 15, true
  ),
  -- Expired: Old coffee deal (shows in history)
  (
    '10000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    'Espresso Express',
    ST_MakePoint(-122.4025, 37.7890)::GEOGRAPHY,
    'restaurant',
    'Blue Bottle Coffee', NULL,
    'ESPRESSO10', '$10 Off Espresso Machine', 'Discount on home espresso equipment.',
    'fixed', 10, 'In-store only.',
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days',
    50, 50, false
  ),
  -- Sold out: Popular gym deal
  (
    '10000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000005',
    'New Year Fitness',
    ST_MakePoint(-122.3940, 37.7950)::GEOGRAPHY,
    'services',
    'FitZone Gym', NULL,
    'NEWYEAR50', '50% Off Annual Membership', 'Half price on annual gym membership.',
    'percentage', 50, 'New members only.',
    NOW() - INTERVAL '7 days', NOW() + INTERVAL '1 day',
    25, 25, false
  );

-- ============================================================
-- Demo Claims — Simulate leaderboard users having claimed things
-- ============================================================
INSERT INTO claims (user_id, loot_box_id, distance_m, is_used) VALUES
  -- TreasureKing claimed a bunch
  ('00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', 15.2, true),
  ('00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000002', 42.7, false),
  ('00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000003', 8.1, true),
  ('00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000005', 67.3, false),
  -- LootQueen22
  ('00000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001', 22.4, true),
  ('00000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000003', 31.0, false),
  ('00000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000007', 55.8, true),
  -- DealHunterX
  ('00000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000002', 19.5, false),
  ('00000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000004', 44.2, true),
  -- CouponNinja
  ('00000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000005', 12.9, false),
  ('00000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000008', 88.1, false)
ON CONFLICT DO NOTHING;
