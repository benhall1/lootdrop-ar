# LootDrop AR

A cross-platform mobile AR application for discovering geo-anchored loot boxes with real coupons at local businesses.

## Overview

LootDrop AR combines augmented reality, geolocation, and gamification to create an engaging treasure-hunt experience. Users discover digital "loot boxes" at real-world business locations, collecting valuable coupons and discounts by exploring their surroundings.

## Features

### Current Implementation (MVP Prototype)

#### 🎯 Discover (AR Camera View)
- AR camera interface with simulated AR discovery
- Real-time distance tracking to nearby loot boxes
- Interactive minimap showing user position and nearby loot
- Loot counter badge showing active drops
- Haptic feedback when opening loot boxes
- Active loot box opening with coupon rewards

#### 🗺️ Map View
- Interactive location browser with list view
- Category filtering (Restaurants, Retail, Entertainment, Services)
- Real-time countdown timers for scheduled loot drops
- Location cards showing business details and rewards
- "Switch to AR" floating action button
- Detailed loot box information callouts

#### 🎁 Collection
- Personal coupon collection management
- Statistics dashboard (total coupons, potential savings, active count)
- Organized sections: Active, Used, and Expired coupons
- Coupon detail views with redemption codes
- Expiration tracking and status badges

#### 👤 Profile
- User profile with treasure chest avatar system (Gold/Silver/Bronze tiers)
- Personal statistics tracking (coupons collected, money saved, visits)
- Merchant tools for scheduling loot drops
- Settings and account management
- Sign out functionality

### Core Technologies

- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation 7 with bottom tab navigation
- **UI/UX**: iOS 26 Liquid Glass design system
- **Geolocation**: Haversine distance calculations
- **State Management**: React hooks with in-memory data storage
- **Haptics**: Expo Haptics for tactile feedback
- **Icons**: Feather Icons from @expo/vector-icons

## Project Structure

```
├── assets/
│   ├── avatars/              # User avatar images (chest tiers)
│   └── images/               # App icon and splash assets
├── components/
│   ├── CategoryChip.tsx      # Location category filter
│   ├── CountdownTimer.tsx    # Real-time drop countdown
│   ├── CouponCard.tsx        # Coupon display component
│   ├── FAB.tsx               # Floating action button
│   └── [helper components]   # Themed components, scroll views, etc.
├── constants/
│   └── theme.ts              # Design tokens (colors, spacing, typography)
├── navigation/
│   └── MainTabNavigator.tsx  # 4-tab bottom navigation
├── screens/
│   ├── DiscoverScreen.tsx    # AR camera discovery view
│   ├── MapScreen.tsx         # Location browser with filters
│   ├── CollectionScreen.tsx  # Coupon collection manager
│   └── ProfileScreen.tsx     # User profile and settings
├── services/
│   ├── geolocation.ts        # Distance calculation utilities
│   └── mockData.ts           # Mock loot boxes and coupons
├── types/
│   └── index.ts              # TypeScript type definitions
└── App.tsx                   # Root application component
```

## Design System

### Color Palette
- **Primary**: #FF6B35 (Orange) - Active states, CTAs
- **Secondary**: #FFD23F (Gold) - Timers, rewards
- **Accent**: #4ECDC4 (Teal) - User position marker
- **Success**: #06D6A0 - Active loot boxes
- **Error**: #EF476F - Expired coupons
- **Background**: #0F1419 (Dark navy)
- **Surface**: #1A1F26, #252C35 (Elevated surfaces)

### Typography
- **H1**: 34pt Bold (Headers)
- **H2**: 28pt Semibold (Section titles)
- **H3**: 22pt Semibold (Card titles)
- **Body**: 15pt Regular (Content)
- **Caption**: 13pt Regular (Meta information)
- **Timer**: 24pt Monospace Bold (Countdown displays)

### Components
- **Countdown Timer**: Real-time countdown with pulsing animation when < 60s
- **Coupon Card**: 16:9 ratio cards with status badges and expiration tracking
- **Category Chips**: Pill-shaped filter buttons with icons
- **FAB**: 56x56pt circular action buttons with haptic feedback
- **Minimap**: 120x120pt overlay showing user position and nearby loot

## Data Model

### LootBox
```typescript
{
  id: string
  title: string
  latitude: number
  longitude: number
  category: "restaurant" | "retail" | "entertainment" | "services"
  businessName: string
  dropTime: number (Unix timestamp)
  isActive: boolean
  coupon: Coupon
}
```

### Coupon
```typescript
{
  id: string
  code: string
  title: string
  description: string
  discountType: "percentage" | "fixed" | "freeItem"
  value: string
  expiresAt: number (Unix timestamp)
  businessName: string
}
```

## Running the App

### Development
```bash
npm run dev
```

The Expo development server will start. You can:
- Scan the QR code with Expo Go (iOS/Android)
- Press 'w' to open in web browser
- Press 'a' for Android emulator
- Press 'i' for iOS simulator

### Testing
- The app uses simulated GPS coordinates (San Francisco: 37.7849, -122.4094)
- Mock loot boxes are pre-configured with various drop times and categories
- All features are fully functional with mock data

## Next Phase: Backend Integration

### Planned Features
1. **External API Integration**
   - RESTful backend API for loot box management
   - Real-time coupon data from free coupon APIs
   - Persistent database storage (PostgreSQL)

2. **Advanced AR Features**
   - Actual camera integration with expo-camera
   - Real-time location tracking with expo-location
   - Interactive map with react-native-maps

3. **AI-Powered Content**
   - OpenAI integration for loot box artwork generation
   - AI-generated promotional descriptions
   - Smart coupon recommendations

4. **Social & Engagement**
   - Push notifications for nearby drops
   - Leaderboards and achievements
   - Friend discovery and sharing

5. **Merchant Dashboard**
   - Full merchant portal for loot drop scheduling
   - Analytics and engagement metrics
   - ROI tracking and reporting

## Technical Notes

### Prototype Limitations
- **Location**: Uses simulated coordinates (production would use expo-location)
- **Maps**: List-based view (production would use react-native-maps)
- **Storage**: In-memory data (production would use AsyncStorage + backend)
- **Camera**: Placeholder view (production would use expo-camera for AR)

### Production Considerations
- Implement proper authentication (Apple Sign-In, Google OAuth)
- Add persistent local storage with AsyncStorage
- Integrate with external coupon aggregation APIs
- Set up backend infrastructure for multi-merchant support
- Implement real-time notifications for loot drop events
- Add comprehensive error handling and offline support

## Design Guidelines

For detailed design specifications, component guidelines, and interaction patterns, see:
- [design_guidelines.md](./design_guidelines.md)

## License

LootDrop AR v1.0.0

---

Built with ❤️ using Expo and React Native
