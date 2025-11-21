# LootDrop AR - Project Documentation

## Overview
LootDrop AR is a cross-platform mobile AR application that combines location-based gaming with real-world business promotions. Users discover geo-anchored "loot boxes" at restaurants, retail stores, and other businesses, collecting valuable coupons and discounts through an engaging treasure-hunt experience.

## Project Status
**Current Phase**: MVP Frontend + Subscription Backend
**Version**: 1.1.0
**Last Updated**: November 21, 2024

## Technology Stack

### Frontend (Expo React Native)
- **Framework**: Expo SDK 54 with React Native
- **Navigation**: React Navigation 7 (Bottom Tabs)
- **UI Design**: iOS 26 Liquid Glass design system
- **State Management**: React Hooks + AsyncStorage
- **TypeScript**: Strict type checking enabled
- **Icons**: Feather Icons (@expo/vector-icons)
- **Payments**: Stripe Checkout via expo-web-browser

### Backend (Express + PostgreSQL)
- **Server**: Express with TypeScript
- **Database**: PostgreSQL (Neon-backed via Replit)
- **Payment Processing**: Stripe with stripe-replit-sync
- **ORM**: Drizzle ORM for user data
- **Webhooks**: Stripe managed webhooks for subscription sync

### Key Features Implemented
1. **Discover Screen**: AR camera view with loot discovery, distance tracking, minimap
2. **Map Screen**: Interactive live map with real GPS, loot markers, and turn-by-turn directions
3. **Collection Screen**: Coupon management with statistics dashboard
4. **Premium Screen**: Subscription management with pricing tiers and Stripe checkout
5. **Profile Screen**: User profile, merchant tools, Help & Support chatbot modal

### Subscription Features
- **Pricing Tiers**: Monthly ($9.99) and Annual ($79.99 with 33% savings)
- **Guest User Creation**: Automatic guest account generation for testing
- **Stripe Integration**: Full checkout flow with test mode
- **Premium Status Tracking**: Database-backed subscription status
- **Error Handling**: Comprehensive error states with retry functionality

## Project Structure
```
├── components/         # Reusable UI components (FAB, CouponCard, CategoryChip, etc.)
├── screens/           # Main app screens (Discover, Map, Collection, Premium, Profile)
├── navigation/        # Tab navigation configuration
├── services/          # Business logic (apiService, userService, geolocation, mock data)
├── server/            # Express backend (index, routes, storage, stripeClient, webhookHandlers)
├── shared/            # Shared schemas (database models)
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

### 2024-11-21: Live Map with GPS & Directions
- ✅ Integrated react-native-maps for interactive map view
- ✅ Added real GPS location tracking with expo-location
- ✅ Replaced list-based map with actual MapView component
- ✅ Added loot box markers with custom styling (active vs. expired)
- ✅ Implemented tap-to-select marker functionality
- ✅ Created "Get Directions" feature (opens Apple Maps/Google Maps)
- ✅ Added recenter button to return to user's location
- ✅ Integrated real-time distance calculation from user position
- ✅ Shows live location with blue navigation marker

### 2024-11-21: UI/UX Enhancements
- ✅ Added Help & Support chatbot modal in Profile screen
- ✅ Implemented loot box tap animations (burst effect for active boxes)
- ✅ Made Premium tab work offline with demo pricing
- ✅ Maintained 5-tab navigation structure

### 2024-11-21: Subscription Feature & Backend
- ✅ Built Premium subscription screen with pricing tiers
- ✅ Integrated Stripe payment processing with checkout flow
- ✅ Created Express backend server with API routes
- ✅ Set up PostgreSQL database with users table
- ✅ Implemented stripe-replit-sync for webhook processing
- ✅ Created apiService for backend communication
- ✅ Created userService for AsyncStorage persistence
- ✅ Added comprehensive error handling and retry logic
- ✅ Seeded subscription products in Stripe (Pro Plan)
- ✅ Added Premium tab to bottom navigation

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
- **Real GPS Location**: Using expo-location for live user tracking
- **Interactive Map**: react-native-maps with custom markers and controls
- **Turn-by-Turn Directions**: Native integration with Apple Maps and Google Maps
- **Mock Data**: 6 pre-configured loot boxes across 4 categories (backend integration pending)

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

## Known Limitations (MVP)
- Camera is placeholder (no actual AR rendering yet)
- Data is not persisted to backend (mock data only)
- Coupons are mock data (real API integration pending)
- Backend server requires manual startup for subscription features

## Dependencies

### Frontend (Expo Go compatible)
- @expo/vector-icons
- @react-navigation/bottom-tabs
- @react-navigation/native
- @react-native-async-storage/async-storage
- expo-blur
- expo-haptics
- expo-image
- expo-location
- expo-status-bar
- expo-web-browser
- react-native-maps
- react-native-safe-area-context
- react-native-gesture-handler

### Backend
- express
- stripe
- stripe-replit-sync
- drizzle-orm
- postgres
- cors
- tsx

## Testing

### Frontend Testing
- Run `npm run dev` to start Expo development server
- Scan QR code with Expo Go app
- Test all 5 tabs (Discover, Map, Collection, Premium, Profile)
- Verify countdown timers update in real-time
- Test category filtering on Map screen
- Test coupon detail views in Collection
- Test subscription screen with error states

### Backend Testing
- Run `tsx server/index.ts` to start Express backend (port 5000)
- Backend initializes Stripe schema and webhooks
- Test API endpoints:
  - POST /api/auth/guest - Create guest user
  - GET /api/subscription/:userId - Get subscription status
  - GET /api/products-with-prices - List products with prices
  - POST /api/checkout - Create Stripe checkout session
- Use Stripe test card: 4242 4242 4242 4242

### Integration Testing
- For full-stack testing, both servers must run simultaneously
- Expo frontend on port 8081 (Metro bundler)
- Express backend on port 5000 (public API)

## Notes
- Bundle identifier: com.lootdrop.ar (do not change)
- App name: LootDrop AR
- Supports iOS, Android, and Web
- Dark mode only (optimized for nighttime use)
- All mock data uses San Francisco coordinates
- Stripe integration uses test mode (sandbox)
- Database: PostgreSQL via Replit (DATABASE_URL)

## Deployment Configuration

### Current State
The application consists of two services that need to run concurrently:
1. **Frontend**: Expo Metro bundler (port 8081)
2. **Backend**: Express API server (port 5000)

### Running Locally
```bash
# Terminal 1: Start backend
tsx server/index.ts

# Terminal 2: Start frontend
npm run dev
```

### Production Deployment
For production deployment on Replit:
- Configure workflows to run both services
- Frontend workflow: `npm run dev`
- Backend workflow: `tsx server/index.ts`
- Ensure DATABASE_URL and Stripe credentials are configured
- First port opened (5000) binds to public domain for API access
- Expo can run on internal port 8081

### Known Issues
- Backend initialization may take time during Stripe schema setup
- syncBackfill() can be slow on first run (syncs all Stripe data)
- Consider running syncBackfill() in background to speed up startup
