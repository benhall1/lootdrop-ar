# Supabase Setup Guide

## Quick Start (5 minutes)

### 1. Create a Supabase Project

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.

### 2. Enable PostGIS

In the Supabase dashboard: **Database > Extensions** > search "postgis" > enable it.

### 3. Run Migrations

In the **SQL Editor**, run these files in order:

1. `migrations/001_initial_schema.sql` — creates tables, indexes
2. `migrations/002_rpc_functions.sql` — creates server-side claim validation
3. `seed.sql` — populates demo data (merchants, loot boxes, leaderboard users)

### 4. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Get your values from the Supabase dashboard: **Settings > API**

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
```

### 5. Configure Auth Providers (optional)

For Google Sign-In: **Authentication > Providers > Google** — add your OAuth client ID.

For Apple Sign-In: **Authentication > Providers > Apple** — add your service ID.

Email/password auth works out of the box.

### 6. Set Up Row Level Security (recommended for production)

```sql
-- Users can only read/update their own profile
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Anyone can read active loot boxes
ALTER TABLE loot_boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active boxes" ON loot_boxes FOR SELECT USING (is_active = true);
CREATE POLICY "Merchants manage own boxes" ON loot_boxes FOR ALL USING (auth.uid() = merchant_id);

-- Users can only see their own claims
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own claims" ON claims FOR SELECT USING (auth.uid() = user_id);

-- Favorites are per-user
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);
```

### 7. Deploy to Vercel

Add the same env vars to your Vercel project: **Settings > Environment Variables**

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
```

## Schema Overview

```
users ─────────── loot_boxes
  │                    │
  │  (merchant_id)     │
  │                    │
  └──── claims ────────┘
  │     (user_id)  (loot_box_id)
  │
  └──── favorites ─────┘
```

- **users**: consumers and merchants, XP/tier/streak tracking
- **loot_boxes**: PostGIS GEOGRAPHY point, coupon details, claim limits
- **claims**: UNIQUE(user_id, loot_box_id), distance recorded
- **favorites**: simple bookmark system

## Key Design Decisions

- Claims are validated server-side via PostgreSQL RPC function (not client-side)
- Distance check uses ST_Distance with 100m maximum
- Double-claim prevention via UNIQUE constraint
- XP awarded atomically within the claim transaction
