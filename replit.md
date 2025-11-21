# LootDrop AR - Project Documentation

## Overview
LootDrop AR is a cross-platform mobile AR application that combines location-based gaming with real-world business promotions. Users discover geo-anchored "loot boxes" at restaurants, retail stores, and other businesses, collecting valuable coupons and discounts through an engaging treasure-hunt experience.

## Project Status
**Current Phase**: MVP Frontend Prototype (Completed)
**Version**: 1.0.0
**Last Updated**: November 21, 2024

## Technology Stack

### Frontend (Expo React Native)
- **Framework**: Expo SDK 54 with React Native
- **Navigation**: React Navigation 7 (Bottom Tabs)
- **UI Design**: iOS 26 Liquid Glass design system
- **State Management**: React Hooks (in-memory for prototype)
- **TypeScript**: Strict type checking enabled
- **Icons**: Feather Icons (@expo/vector-icons)

### Key Features Implemented
1. **Discover Screen**: AR camera view with loot discovery, distance tracking, minimap
2. **Map Screen**: Location browser with category filters and countdown timers
3. **Collection Screen**: Coupon management with statistics dashboard
4. **Profile Screen**: User profile, merchant tools, settings

## Project Structure
```
├── components/         # Reusable UI components (FAB, CouponCard, CategoryChip, etc.)
├── screens/           # Main app screens (Discover, Map, Collection, Profile)
├── navigation/        # Tab navigation configuration
├── services/          # Business logic (geolocation, mock data)
├── types/             # TypeScript type definitions
├── constants/         # Theme (colors, spacing, typography, shadows)
└── assets/           # Images, avatars, icons
```

## Design System

### Color Scheme
- Primary: #FF6B35 (Orange)
- Secondary: #FFD23F (Gold)
- Accent: #4ECDC4 (Teal)
- Background: #0F1419 (Dark Navy)
- Success: #06D6A0
- Error: #EF476F

### Components
- CountdownTimer: Real-time loot drop countdown
- CouponCard: Coupon display with status badges
- CategoryChip: Location category filters
- FAB: Floating action buttons for view switching

## Recent Changes

### 2024-11-21: Initial Implementation
- ✅ Created complete design system based on iOS 26 Liquid Glass
- ✅ Implemented 4-screen tab navigation
- ✅ Built Discover screen with AR camera placeholder and minimap
- ✅ Built Map screen with category filtering and location list
- ✅ Built Collection screen with coupon management
- ✅ Built Profile screen with user stats and merchant tools
- ✅ Integrated geolocation calculations (Haversine formula)
- ✅ Created mock data service with 6 sample loot boxes
- ✅ Generated app icon and avatar assets using AI
- ✅ Configured app permissions for camera and location
- ✅ Removed unused template files

## User Preferences

### Design Preferences
- Modern, gamified UI with liquid glass effects
- Dark theme optimized for nighttime exploration
- Vibrant accent colors for active states
- Clean, minimal card-based layouts

### Feature Priorities
1. Interactive map with Apple/Google Maps integration
2. Real coupon integration from free coupon APIs
3. Countdown timers showing when loot drops become available
4. Location-based discovery at restaurants and businesses

## Architecture Decisions

### MVP Design Decisions
- **Simulated Location**: Using fixed San Francisco coordinates (production will use expo-location)
- **List-Based Map**: FlatList with location cards (production will use react-native-maps)
- **In-Memory Storage**: No persistence in prototype (production will use AsyncStorage + backend)
- **Mock Data**: 6 pre-configured loot boxes across 4 categories

### Rationale
- Focus on UI/UX polish and functionality demonstration
- Enable rapid iteration without external dependencies
- Prepare architecture for seamless backend integration

## Next Phase: Backend & Advanced Features

### Planned Backend Development
1. **API Integration**
   - RESTful backend for loot box CRUD operations
   - Free coupon API integration (RapidAPI, CouponAPI)
   - Real-time location services
   
2. **Advanced Features**
   - Actual camera integration (expo-camera)
   - Real maps (react-native-maps)
   - Persistent storage (AsyncStorage, PostgreSQL)
   - Push notifications for nearby drops
   
3. **AI Integration**
   - OpenAI via Replit AI Integrations for artwork generation
   - AI-powered loot box descriptions
   - Smart coupon recommendations

4. **Social & Merchant Tools**
   - Leaderboards and achievements
   - Merchant dashboard with analytics
   - User authentication (Apple/Google Sign-In)

## Known Limitations (Prototype)
- Camera is placeholder (no actual AR rendering)
- Location is simulated (no real GPS tracking)
- Maps show list view (not interactive map)
- Data is not persisted (resets on app restart)
- Coupons are mock data (not from real APIs)

## Dependencies
All dependencies are Expo Go compatible:
- @expo/vector-icons
- @react-navigation/bottom-tabs
- @react-navigation/native
- expo-blur
- expo-haptics
- expo-image
- expo-status-bar
- react-native-safe-area-context
- react-native-gesture-handler

## Testing
- Run `npm run dev` to start Expo development server
- Scan QR code with Expo Go app
- Test all 4 tabs and interactions
- Verify countdown timers update in real-time
- Test category filtering on Map screen
- Test coupon detail views in Collection

## Notes
- Bundle identifier: com.lootdrop.ar (do not change)
- App name: LootDrop AR
- Supports iOS, Android, and Web
- Dark mode only (optimized for nighttime use)
- All mock data uses San Francisco coordinates
