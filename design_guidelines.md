# LootDrop AR - Design Guidelines

## Authentication & Navigation

**Auth Required**: Yes (personal collections, merchant publishing, device sync)

**Implementation**:
- Apple Sign-In (iOS), Google Sign-In (Android/cross-platform)
- SSO-based with local state simulation in prototype
- Login: App logo, auth buttons, privacy/terms links
- Account: Profile avatars (gold/silver/bronze chest), display name, settings, logout (confirm), delete account (double confirm)

**Tab Navigation** (4 tabs):
1. **Discover**: AR camera (primary action, leftmost)
2. **Map**: Interactive locations + timers
3. **Collection**: Claimed coupons + stats
4. **Profile**: Account + merchant tools

**Modals**: Loot box opening, coupon detail, merchant dashboard

## Screen Specifications

### 1. Discover (AR Camera)
**Layout**:
- Full-screen camera (no scroll)
- Transparent header: Info icon (right)
- Floating: Minimap (bottom-left, 120x120pt), distance indicator (top-center), loot counter badge (top-right), "Switch to Map" FAB (bottom-right)
- **Safe areas**: Top elements: `insets.top + Spacing.xl`, Bottom elements: `tabBarHeight + Spacing.xl`

**Components**: Camera viewport, AR overlay, distance HUD, minimap (user dot + loot markers), haptic feedback zones

### 2. Map View
**Layout**:
- Full-screen map (no scroll)
- Header: "Loot Drops Nearby", filter icon, search bar
- Floating: Category chips (below header), recenter FAB (bottom-right), "Switch to AR" CTA (bottom-center)
- **Safe areas**: Top chips: `Spacing.xl`, Bottom CTA: `tabBarHeight + Spacing.xl`

**Components**: Map (react-native-maps), custom markers with timers, location callouts, category filters (Restaurants/Retail/Entertainment/Services)

### 3. Loot Box Opening Modal
**Layout**:
- Full-screen, no header
- Centered 3D animation
- Close button (top-right)
- Reward card (slides up after animation)
- **Safe areas**: Top: `insets.top + Spacing.xl`, Bottom: `insets.bottom + Spacing.xl`

**Components**: 3D loot box (Expo GL), particle effects, reward card, "Add to Collection" + "Redeem Now" buttons

### 4. Collection
**Layout**:
- Scrollable list
- Transparent scroll header: "My Collection", sort/filter icon
- **Safe areas**: Top: `headerHeight + Spacing.xl`, Bottom: `tabBarHeight + Spacing.xl`

**Components**: User stats header (coupons/savings/visits), 2-column card grid, expiration badges, sections (Active/Expired/Used), empty state

### 5. Profile/Settings
**Layout**:
- Scrollable form
- Header: "Profile", settings gear icon
- **Safe areas**: Top: `Spacing.xl`, Bottom: `tabBarHeight + Spacing.xl`

**Components**: Avatar picker (chest themed), display name, stats summary, merchant tools card, settings list, logout button

### 6. Merchant Dashboard (Modal)
**Layout**:
- Modal header: "Schedule Loot Drop", cancel/submit buttons
- Scrollable form
- **Safe areas**: Top: `Spacing.xl`, Bottom: `insets.bottom + Spacing.xl`

**Components**: Location picker (map thumbnail), date/time picker, coupon selection, preview card, "Schedule Drop" button

## Design System

### Colors
**Primary**: `#FF6B35` (orange), Dark: `#E84A1F`  
**Secondary**: `#FFD23F` (gold)  
**Accent**: `#4ECDC4` (teal)  
**Background**: `#0F1419` (dark navy), Surface: `#1A1F26`, Surface Light: `#252C35`  
**Text**: Primary `#FFFFFF`, Secondary `#9BA4B5`  
**Border**: `#2D3540`  
**Semantic**: Success `#06D6A0`, Warning `#FFB627`, Error `#EF476F`, Info `#118AB2`  
**AR**: Overlay `rgba(15,20,25,0.6)`, Marker Active `#FF6B35` (glow), Inactive `#9BA4B5`

### Typography
**Font**: System default (SF Pro/Roboto)  
**Scale**:
- H1: 34pt Bold, -0.5pt spacing
- H2: 28pt Semibold
- H3: 22pt Semibold
- Body Large: 17pt Regular
- Body: 15pt Regular
- Caption: 13pt Regular
- Button: 16pt Semibold, +0.5pt spacing
- Timer: 24pt Monospace Bold

### Components

**Loot Box AR Marker**:
- 3D chest with float animation, pulsing glow (primary)
- Distance-based scale, 80x80pt tap area
- Haptic on approach (<50m)

**Map Marker**:
- 20x20pt category icon, countdown badge (top-right)
- Primary (active), Secondary (upcoming)
- Shadow: `{offset: {0,2}, opacity: 0.15, radius: 4}`

**Countdown Timer Badge**:
- Pill shape, Secondary bg, monospace font
- Format: "2h 15m" / "45s", updates/second
- Pulsing at <1min

**Coupon Card**:
- 16:9 ratio, 16pt border radius
- Logo (40x40pt circle, top-left), expiration badge (top-right)
- 1pt Primary border
- Shadow: `{offset: {0,2}, opacity: 0.10, radius: 2}`

**FAB (Map/AR Toggle)**:
- 56x56pt circle, 24x24pt icon, Primary bg
- Shadow: `{offset: {0,2}, opacity: 0.10, radius: 2}`
- Press: scale 0.95, opacity 0.9

**Minimap (AR Overlay)**:
- 120x120pt, 12pt radius, Surface 80% opacity
- User dot: 8pt Accent with pulse, Loot: 6pt Primary
- 1pt Border

**Category Filter Chips**:
- 36pt height, 12pt h-padding, 18pt radius (pill)
- Unselected: Surface Light bg, Text Secondary
- Selected: Primary bg, White text
- 16x16pt icon (left), haptic light on press

### Interactions

**Touch Feedback**:
- Buttons: opacity 0.7 + haptic light
- Cards: scale 0.98 + haptic selection
- FABs: scale 0.95 + haptic medium
- Destructive: haptic heavy

**AR**:
- Loot tap: haptic heavy + scale
- Discovery: haptic success + badge bounce
- Timer expiration: haptic notification + glow pulse

**Animations**:
- Transitions: 300ms ease-in-out
- Loot opening: 2s sequence
- Timers: instant (no animation)
- Map markers: fade + drop 400ms
- Filters: slide + bounce 250ms spring

### Accessibility

**Requirements**:
- VoiceOver for AR distance indicators
- Dynamic Type support
- High contrast: 2pt borders
- Min touch: 44x44pt
- Color blind safe: icons + text labels (not color alone)
- Timer announcements: VoiceOver at 60s/30s/10s
- Haptic alternatives: visual pulse animations
- Map markers: accessible labels ("Starbucks - drops in 2 hours")

## Critical Assets

**Generate**:
1. 3D loot box (gold metallic, 3 states: closed/opening/open)
2. 3 treasure avatars (gold/silver/bronze chest)
3. Category icons (24x24pt line): fork-knife, shopping bag, ticket, wrench
4. App icon: Loot chest + AR viewfinder, Primary/Secondary gradient

**Use Existing**: Feather icons (@expo/vector-icons), business logos (API), coupon graphics (API)