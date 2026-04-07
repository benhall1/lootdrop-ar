# TODOS

## Pre-Launch: Seed Script for Test Data — DONE
- Implemented in `supabase/seed.sql` — 8 merchants, 9 consumers, 10 loot boxes, demo claims. All SF locations.

## Pre-Launch: Supabase Row Level Security (RLS) — DONE
- Implemented across migrations 003, 004, 006, 007. All tables covered with appropriate policies.

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
