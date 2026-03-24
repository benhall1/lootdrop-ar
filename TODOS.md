# TODOS

## Pre-Launch: Seed Script for Test Data
- **What:** Create a seed script that populates Supabase with test loot boxes in a configurable location
- **Why:** After Wave 1 deploys, the DB is empty. Need test data to demo and QA.
- **Effort:** S (human ~2 hours) → CC: S (~10 min)
- **Priority:** P1 — needed before any testing or demos
- **Depends on:** Supabase schema (Wave 1)
- **Context:** Adapt the existing `mockData.ts` (6 SF loot boxes) into a Supabase INSERT script. Add a location parameter so you can seed any city.

## Pre-Launch: Supabase Row Level Security (RLS)
- **What:** Write RLS policies so users can only access their own data, merchants manage their own boxes, everyone reads active boxes
- **Why:** Without RLS, any authenticated user can read/write any row. Security baseline.
- **Effort:** S (human ~3 hours) → CC: S (~15 min)
- **Priority:** P1 — security requirement before any real users
- **Depends on:** Supabase schema (Wave 1)
- **Context:** Policies needed: users can SELECT/UPDATE own profile, SELECT active loot_boxes, INSERT/SELECT own claims and favorites. Merchants can INSERT/UPDATE/DELETE own loot_boxes.

## Phase 2: Native iOS/Android App
- **What:** Build native app with EAS Build, real ARKit/ARCore world-anchored AR, native push notifications
- **Why:** Web-first gets to market fast, but native AR is the 10x experience. App Store presence unlocks iOS push.
- **Effort:** L (human ~4 weeks) → CC: M (~4-6 hours)
- **Priority:** P1 — start after web v1 proves traction
- **Depends on:** Web v1 launched, Supabase backend stable, at least 100 active users
- **Context:** The Expo codebase already supports native builds. Key work is ARKit/ARCore integration (expo-three or ViroReact), EAS Build pipeline, App Store review preparation, and native push via expo-notifications.

## Phase 3: Merchant Analytics Dashboard
- **What:** Dedicated web dashboard for merchants: views, claims, redemptions, revenue attribution, heatmaps, optimal timing suggestions
- **Why:** Merchants need proof of ROI to keep paying. "Your drop drove 23 visits today" retains merchants.
- **Effort:** L (human ~3 weeks) → CC: M (~3-4 hours)
- **Priority:** P2 — after basic merchant tools prove value
- **Depends on:** Merchant self-serve (v1), at least 10 active merchants, 30+ days of claim data
- **Context:** v1 merchant tools include basic stats (claims count, active drops). This expands to time-series charts, geographic heatmaps, A/B testing different drop strategies, and export/PDF reports.

## Phase 3+: ML-Optimized Drop Scheduling
- **What:** Auto-schedule loot drops for optimal foot traffic based on historical data, time of day, weather, events
- **Why:** "Set budget, we handle the rest" is the ideal merchant UX. Major differentiator.
- **Effort:** XL (human ~2 months) → CC: L (~1-2 days)
- **Priority:** P3 — needs data accumulation first (~3-6 months of claim data)
- **Depends on:** Merchant analytics dashboard, 6+ months of claim history, enough volume for statistical significance
- **Context:** Start with simple heuristics (peak hours by day-of-week), graduate to ML model. Consider Claude API for initial "smart scheduling" before building custom models.
