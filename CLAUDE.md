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

**Next step: Start implementing Wave 1. Run `/ship` when done.**

## Implementation Plan (Two Waves)

### Wave 1: Foundation (~2 hours CC)
Simplified architecture: PWA (Vercel) + Supabase (everything). No Fly.io needed.

1. Bug fixes: delete dead code, fix Typography, merge user services, fix sign-out, dedupe calculateDistance
2. Set up Supabase project: create DB, enable PostGIS, run schema
3. Create supabaseClient.ts
4. Refactor authService.ts → Supabase Auth wrapper
5. Update App.tsx → Supabase session listener
6. Update LoginScreen → Google + Email sign-in
7. Create lootBoxService.ts (replaces mockData.ts)
8. Create Edge Function: claim_loot (distance validation + claim insert)
9. Create claimService.ts (client-side claim flow)
10. Replace SimpleMapView → Leaflet map component
11. Update MapScreen, CollectionScreen to use Supabase data
12. Create Edge Functions: stripe_webhook + create_checkout
13. Set up Jest + Playwright, write tests
14. Deploy: Expo Web → Vercel

### Wave 2: Features (~4 hours CC)
Add Fly.io if needed for push dispatch.

1. Radar View (animated discovery)
2. Merchant self-serve (create drops, view stats)
3. Web Push + email notifications
4. Social (leaderboards, share-a-deal, activity feed)
5. Sound design + haptic polish
6. Streak rewards + gamification loop

## Database Schema (Supabase PostgreSQL + PostGIS)

Tables: users, loot_boxes (with GEOGRAPHY point + spatial index), claims (UNIQUE user+box), favorites.
Key decisions:
- Claims validated server-side via Supabase Edge Function (not Express)
- Distance check: ST_Distance < 100m
- Idempotency: UNIQUE(user_id, loot_box_id) prevents double-claims

## Known Bugs to Fix

1. `authService.ts` and `userService.ts` both use `@lootdrop_user` AsyncStorage key with DIFFERENT data shapes — merge into one service
2. `ThemedText.tsx` references `Typography.h4`, `.small`, `.link` which don't exist in `theme.ts` — add them
3. `calculateDistance` duplicated in `MapScreen.tsx` and `services/geolocation.ts` — consolidate
4. Sign-out tells user to "restart the app" instead of navigating to login — fix state management
5. Dead code to delete: `MainTabNavigator26.tsx`, `couponService.ts`, `Card.tsx`, `HeaderTitle.tsx`, `screenOptions.ts`, `mockCollectedCoupons` export, `logoService.getFallbackIcon()`

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
