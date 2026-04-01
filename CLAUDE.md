# LootDrop AR — Project Context

## What This Is

A cross-platform Expo/React Native app that gamifies local commerce. Virtual "loot boxes" are placed at real-world business locations. Users discover them via an interactive radar/map, claim real coupons, and drive foot traffic to local merchants.

**Current state:** Fully functional PWA with Supabase backend, server-side gamification, activity feed, Stripe via Edge Functions, and scheduled jobs. Decoupled from Replit.

## Product Decision: Web-First PWA

We decided to ship as a **Progressive Web App** (not native iOS/Android) for v1. Reasons: no App Store review, instant updates, shareable URLs, faster to market. Native app is Phase 2 after web traction is proven.

## Architecture (Target)

```
PWA (Expo Web)
├── Radar View (animated discovery)
├── Leaflet Map (CartoDB dark tiles, marker clustering)
├── Merchant Dashboard (create drops, view real stats)
├── Social (leaderboards, activity feed from activity_events)
├── Gamification (server-side XP, badges, streaks, levels, tiers)
├── Sound + Haptics
└── PWA (manifest, service worker, install prompt, offline fallback)
        │
        │ Supabase Client (REST + Realtime + functions.invoke)
        ▼
Supabase (Auth + PostgreSQL/PostGIS + Realtime + Edge Functions)
├── Edge Function: send-push (VAPID Web Push dispatch)
├── Edge Function: stripe-checkout (Checkout sessions + product listing)
├── Edge Function: stripe-webhook (subscription lifecycle)
├── RPC: claim_loot_box (validation + gamification + activity logging + rate limiting)
├── RPC: get_gamification_state (hydrate client on app open)
├── RPC: record_redemption (XP + badges for coupon use)
├── RPC: merchant_stats (real weekly growth metrics)
├── pg_cron: streak reset, expired box cleanup, push sub cleanup, rate limit cleanup
└── PostGIS: spatial queries, distance validation
```

## Key Tech Decisions (Locked In)

- **Backend:** Supabase only (DB/Auth/Realtime/Edge Functions). No separate server. Fully decoupled from Replit.
- **Auth:** Supabase Auth (Apple + Google + Email). `authService.ts` is a thin wrapper.
- **Discovery:** Radar View (animated top-down radar). Works on all browsers.
- **Map:** Leaflet with react-leaflet v5, CartoDB dark tiles, marker clustering via leaflet.markercluster.
- **Notifications:** Web Push via VAPID (Edge Function `send-push`). Service worker handles push events.
- **Payments:** Stripe via Supabase Edge Functions (`stripe-checkout`, `stripe-webhook`). No Express server.
- **Gamification:** Server-authoritative. XP, badges, streaks, levels calculated in `claim_loot_box` RPC. AsyncStorage is read cache only.
- **Distribution:** Vercel for PWA static hosting. GitHub Actions CI.
- **Security:** Server-side distance validation (100m), rate limiting (5 claims/min), RLS on all tables.

## v1 Scope (10 Deliverables)

1. Portable backend (Supabase + Fly.io) — decouple from Replit
2. Supabase Auth (Apple + Google + Email)
3. Radar View (animated discovery, replaces fake AR)
4. Merchant self-serve (create drops, set coupons, view basic stats)
5. Web Push + email notifications
6. Real map (Leaflet/Mapbox with custom markers)
7. Social features (neighborhood leaderboards, share-a-deal deep links, activity feed)
8. Sound design + haptic polish (discovery/approach/open/claim sounds)
9. Streak rewards + gamification (daily streaks, XP, avatar tier upgrades bronze→silver→gold)
10. Bug fixes + dead code cleanup

## Review Status

- **CEO Review:** COMPLETE (2026-03-21) — CLEAR, 8/8 scope proposals accepted
- **Eng Review:** COMPLETE (2026-03-23) — CLEAR, 2 issues resolved, 0 critical gaps
- **Design Review:** NOT DONE — optional, run `/plan-design-review` for radar view UX

**Next step: Create Supabase project, add credentials, and deploy. See `supabase/README.md`.**

## Implementation Status

### Wave 1: Foundation — DONE (code complete, needs Supabase project)

| # | Task | Status |
|---|------|--------|
| 1 | Bug fixes, dead code cleanup | DONE |
| 2 | Supabase project setup | BLOCKED — needs credentials |
| 3 | supabaseClient.ts | DONE |
| 4 | authService.ts → Supabase Auth | DONE |
| 5 | App.tsx → Supabase session listener | DONE |
| 6 | LoginScreen → Google + Email | DONE |
| 7 | lootBoxService.ts | DONE |
| 8 | claim_loot RPC function | DONE (PostgreSQL, not Edge Function) |
| 9 | claimService.ts | DONE |
| 10 | Leaflet map | DONE |
| 11 | Screens wired to Supabase (with mock fallback) | DONE |
| 12 | Stripe Edge Functions | DONE (stripe-checkout + stripe-webhook) |
| 13 | Jest tests | DONE (services + geolocation) |
| 14 | Deployed to Vercel | DONE |

### Wave 2: Features — DONE

| # | Task | Status |
|---|------|--------|
| 1 | Radar View | DONE |
| 2 | Merchant self-serve | DONE (UI + real stats via merchant_stats RPC) |
| 3 | Web Push notifications | DONE (SW + subscribe + send-push Edge Function) |
| 4 | Social (leaderboard, activity, badges) | DONE (activity_events table + real feed) |
| 5 | Sound design + haptics | DONE |
| 6 | Gamification (XP, streaks, tiers) | DONE (server-authoritative via claim_loot_box RPC) |

### Wave 3: Backend Hardening — DONE

| # | Task | Status |
|---|------|--------|
| 1 | Gamification sync to database | DONE (migration 006) |
| 2 | Activity events + merchant stats | DONE (migration 007) |
| 3 | Scheduled jobs (pg_cron) | DONE (migration 008) |
| 4 | Stripe migration to Edge Functions | DONE (migration 009, server/ deleted) |
| 5 | Rate limiting | DONE (migration 010) |
| 6 | PWA (manifest, SW caching, install prompt) | DONE |
| 7 | Map clustering (leaflet.markercluster) | DONE |

### Remaining Work

- **Add Vercel env vars** — EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
- **Run migrations 006-010** on Supabase project
- **Enable pg_cron** via Supabase Dashboard > Database > Extensions
- **Deploy Edge Functions** — `supabase functions deploy stripe-checkout stripe-webhook`
- **Set Stripe secrets** — `supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=...`
- **Register Stripe webhook** — point to `https://<project>.supabase.co/functions/v1/stripe-webhook`

## Database Schema (Supabase PostgreSQL + PostGIS)

Tables: users, loot_boxes (GEOGRAPHY + GIST index), claims (UNIQUE user+box), favorites, push_subscriptions, user_badges, activity_events, rate_limits.
Key decisions:
- Claims validated server-side via `claim_loot_box` RPC (not Edge Function)
- Distance check: ST_Distance < 100m
- Idempotency: UNIQUE(user_id, loot_box_id) prevents double-claims
- Rate limiting: 5 claims/minute per user via `rate_limits` table
- Gamification calculated atomically in claim RPC (XP, badges, streaks, level, tier)
- Activity events logged in same transaction as claims
- pg_cron: streak reset (daily), box expiry (hourly), push cleanup (weekly), rate limit cleanup (10min)

## Known Bugs — ALL FIXED

1. ~~`authService.ts` / `userService.ts` AsyncStorage conflict~~ — merged into single authService
2. ~~`ThemedText.tsx` missing Typography entries~~ — h4, small, link added to theme.ts
3. ~~`calculateDistance` duplicated~~ — consolidated in geolocation.ts
4. ~~Sign-out "restart app" message~~ — App.tsx auth context handles navigation
5. ~~Dead code files~~ — all deleted (MainTabNavigator26, couponService, Card, HeaderTitle, screenOptions)
6. ~~MerchantScreen buttons blank~~ — fixed title prop → children syntax

## Existing Code Worth Reusing

- `locationService.ts` — real GPS via expo-location (works on web)
- `geolocation.ts` — Haversine distance calculation
- `CouponCard.tsx` — coupon display component
- `CountdownTimer.tsx` — real-time countdown
- `BusinessLogo.tsx` — logo with initials fallback
- `ErrorBoundary.tsx` — React error boundary
- `LootBoxPrizeModal` (inside ARCamera.tsx) — extract and reuse standalone
- `constants/theme.ts` — design token system (fix Typography gaps)
- `MainTabNavigator.tsx` — 5-tab bottom nav structure

## Deferred Work (see TODOS.md)

- **P1:** Native iOS/Android app with real ARKit/ARCore (Phase 2)
- **P2:** Merchant analytics dashboard (Phase 3)
- **P3:** ML-optimized drop scheduling (Phase 3+)

## Plan Documents

- Full product launch plan: `docs/designs/PRODUCT-LAUNCH.md`
- Deferred work: `TODOS.md`
- Design guidelines: `design_guidelines.md`
- Original Replit prompt: `attached_assets/Pasted-You-are-Replit-*.txt`

## Testing

No test framework set up yet. Plan:
- **Unit:** Jest — service layer, utility functions, gamification logic
- **Component:** React Testing Library — screens, modals, interactive components
- **E2E:** Playwright — critical flows (sign up → find box → claim → view coupon)

## Business Model

Free for consumers. Merchants pay per-redemption ($0.50-$2 per coupon claimed) or monthly subscription for unlimited drops. Premium consumer tier for early access + no ads.
