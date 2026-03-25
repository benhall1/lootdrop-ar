# LootDrop AR — Project Context

## What This Is

A cross-platform Expo/React Native app that gamifies local commerce. Virtual "loot boxes" are placed at real-world business locations. Users discover them via an interactive radar/map, claim real coupons, and drive foot traffic to local merchants.

**Current state:** ~65% complete prototype built by Replit AI. Functional but has bugs, dead code, and is locked to Replit infrastructure.

## Product Decision: Web-First PWA

We decided to ship as a **Progressive Web App** (not native iOS/Android) for v1. Reasons: no App Store review, instant updates, shareable URLs, faster to market. Native app is Phase 2 after web traction is proven.

## Architecture (Target)

```
PWA (Expo Web)
├── Radar View (animated discovery — replaces fake AR camera)
├── Leaflet/Mapbox (real map — replaces custom canvas SimpleMapView)
├── Merchant Dashboard (create drops, view stats)
├── Social (leaderboards, share-a-deal)
├── Gamification (streaks, XP, badges)
└── Sound + Haptics
        │
        │ Supabase Client (REST + Realtime)
        ▼
Supabase (Auth + PostgreSQL + Realtime + Storage + Edge Functions)
        │
        ▼
Fly.io (Express API)
├── Stripe webhooks
├── Push notification dispatch (Web Push + email)
├── Merchant analytics engine
└── Social feed aggregation
```

## Key Tech Decisions (Locked In)

- **Backend:** Supabase (DB/Auth/Realtime) + Fly.io (Express API). Decoupled from Replit.
- **Auth:** Supabase Auth (Apple + Google + Email). Current `authService.ts` becomes a thin wrapper.
- **Discovery:** Radar View (animated top-down radar) instead of AR camera. Works on all browsers.
- **Map:** Leaflet or Mapbox (web). Not react-native-maps.
- **Notifications:** Web Push where supported + email fallback. NOT native push.
- **Payments:** Stripe (keep existing integration, decouple from Replit connectors).
- **Distribution:** Vercel or Netlify for PWA static hosting. GitHub Actions CI.
- **Security:** Server-side distance validation (100m) on all loot box claims.

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
| 12 | Stripe Edge Functions | TODO |
| 13 | Jest tests | DONE (services + geolocation) |
| 14 | Deployed to Vercel | DONE |

### Wave 2: Features — DONE (frontend complete, uses mock data)

| # | Task | Status |
|---|------|--------|
| 1 | Radar View | DONE |
| 2 | Merchant self-serve | DONE (UI, needs Supabase) |
| 3 | Web Push notifications | TODO |
| 4 | Social (leaderboard, activity, badges) | DONE (UI, mock data) |
| 5 | Sound design + haptics | DONE |
| 6 | Gamification (XP, streaks, tiers) | DONE |

### Remaining Work

- **Create Supabase project** — run migrations + seed data (see `supabase/README.md`)
- **Add Vercel env vars** — EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
- **Stripe Edge Functions** — webhook handler + checkout session creation
- **Web Push notifications** — service worker + notification dispatch
- **Wire leaderboard/social** to real Supabase data (currently mock)

## Database Schema (Supabase PostgreSQL + PostGIS)

Tables: users, loot_boxes (with GEOGRAPHY point + spatial index), claims (UNIQUE user+box), favorites.
Key decisions:
- Claims validated server-side via Supabase Edge Function (not Express)
- Distance check: ST_Distance < 100m
- Idempotency: UNIQUE(user_id, loot_box_id) prevents double-claims

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
