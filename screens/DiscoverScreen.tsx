import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Platform,
  RefreshControl,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "../components/ThemedText";
import { RadarView } from "../components/RadarView";
import { CameraARView } from "../components/CameraARView";
import { XPBar } from "../components/XPBar";
import { ClaimCelebration } from "../components/ClaimCelebration";
import { BusinessLogo } from "../components/BusinessLogo";
import { FAB } from "../components/FAB";
import { useTheme } from "../hooks/useTheme";
import {
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
  WebShadows,
  Gradients,
} from "../constants/theme";
import { LootBoxService } from "../services/lootBoxService";
import { ClaimService } from "../services/claimService";
import { DemoService } from "../services/demoService";
import { GamificationService, GamificationState, ClaimResult, DailyBonusResult } from "../services/gamificationService";
import { DailyBonusModal } from "../components/DailyBonusModal";
import { SoundService } from "../services/soundService";
import { calculateDistance, formatDistance } from "../services/geolocation";
import { LocationService } from "../services/locationService";
import { StorageService } from "../services/storageService";
import { CategoryChip } from "../components/CategoryChip";
import { useTour } from "../contexts/GuidedTourContext";
import { UserLocation, LootBox, LocationCategory } from "../types";

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍕",
  retail: "🛍️",
  entertainment: "🎮",
  services: "⚡",
};

function NearbyCard({
  box,
  distance,
  onPress,
}: {
  box: LootBox;
  distance: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        cardStyles.card,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: box.isActive ? theme.primary + "25" : theme.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          opacity: box.isActive ? 1 : 0.5,
          ...Platform.select({
            web: {
              background: box.isActive
                ? `${Gradients.web.cardSheen}, ${theme.backgroundDefault}`
                : theme.backgroundDefault,
              boxShadow: box.isActive ? WebShadows.card : WebShadows.insetGlow,
              transition: "transform 0.15s ease, box-shadow 0.2s ease",
            },
            default: box.isActive ? Shadows.card : {},
          }),
        },
      ]}
    >
      <BusinessLogo
        businessName={box.businessName}
        logoUrl={box.businessLogo}
        size={44}
      />
      <View style={cardStyles.info}>
        <ThemedText style={[cardStyles.name, { fontFamily: Fonts?.sans }]} numberOfLines={1} ellipsizeMode="tail">
          {box.businessName}
        </ThemedText>
        <View style={cardStyles.meta}>
          <ThemedText style={[cardStyles.distance, { color: theme.accent }]}>
            {formatDistance(distance)}
          </ThemedText>
          {box.isActive && (
            <ThemedText style={[cardStyles.value, { color: theme.secondary }]}>
              {box.coupon.value}
            </ThemedText>
          )}
        </View>
      </View>
      <View style={cardStyles.right}>
        <ThemedText style={cardStyles.emoji}>
          {CATEGORY_EMOJI[box.category || ""] || "📦"}
        </ThemedText>
        {box.isActive ? (
          <View style={[cardStyles.liveBadge, { backgroundColor: theme.primary + "20" }]}>
            <ThemedText style={[cardStyles.liveText, { color: theme.primary }]}>
              LIVE
            </ThemedText>
          </View>
        ) : (
          <ThemedText style={[cardStyles.cooldown, { color: theme.textSecondary }]}>
            ⏳
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  meta: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  distance: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts?.mono,
  },
  value: {
    fontSize: 12,
    fontWeight: "800",
  },
  right: {
    alignItems: "center",
    gap: 4,
  },
  emoji: {
    fontSize: 22,
  },
  liveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  liveText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  cooldown: {
    fontSize: 14,
  },
});

export default function DiscoverScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { isTourActive, currentStepData, startTour, nextStep, tourCompleted } = useTour();
  const [tourStarted, setTourStarted] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyLootBoxes, setNearbyLootBoxes] = useState<LootBox[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const categories: LocationCategory[] = ["restaurant", "retail", "entertainment", "services"];
  const [viewMode, setViewMode] = useState<"radar" | "camera">("radar");
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [celebration, setCelebration] = useState<{
    visible: boolean;
    box: LootBox | null;
    claimResult: ClaimResult | null;
  }>({ visible: false, box: null, claimResult: null });
  const [dailyBonus, setDailyBonus] = useState<DailyBonusResult | null>(null);

  // Scanning text shimmer
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + shimmer.value * 0.5,
  }));

  // Listen for device compass heading (for AR camera mode)
  useEffect(() => {
    if (Platform.OS !== "web" || viewMode !== "camera") return;

    const handler = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading for iOS Safari, alpha for others
      const heading = (e as any).webkitCompassHeading ?? (e.alpha !== null ? 360 - e.alpha : null);
      if (heading !== null) setCompassHeading(heading);
    };

    // iOS 13+ requires permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      (DeviceOrientationEvent as any).requestPermission().then((result: string) => {
        if (result === "granted") {
          window.addEventListener("deviceorientation", handler);
        }
      });
    } else {
      window.addEventListener("deviceorientation", handler);
    }

    return () => window.removeEventListener("deviceorientation", handler);
  }, [viewMode]);

  // Load gamification state + check daily bonus (skip if tour hasn't been completed yet)
  useEffect(() => {
    GamificationService.getState().then(setGamification);
    if (tourCompleted) {
      GamificationService.checkDailyBonus().then((result) => {
        if (result.awarded) {
          setDailyBonus(result);
          GamificationService.getState().then(setGamification);
        }
      });
    }
  }, [tourCompleted]);

  useEffect(() => {
    let sub: any = null;
    (async () => {
      const loc = await LocationService.getCurrentLocation();
      if (loc) {
        setUserLocation(loc);
        sub = await LocationService.watchLocation(setUserLocation);
      }
    })();
    return () => sub?.remove();
  }, []);

  // Default location used when GPS is unavailable (NYC)
  const DEFAULT_LOCATION = { latitude: 40.7128, longitude: -74.006 };

  const fetchNearby = useCallback(async () => {
    // Use real location if available, otherwise fall back to default for demo boxes
    const loc = userLocation || DEFAULT_LOCATION;
    try {
      let boxes: LootBox[] = [];
      if (userLocation) {
        boxes = await LootBoxService.getNearby(
          userLocation.latitude,
          userLocation.longitude,
          2
        );
      }
      if (boxes.length === 0) {
        // No real drops nearby (or no location yet) — switch to demo mode
        boxes = await DemoService.getDemoBoxes(loc.latitude, loc.longitude);
        setIsDemoMode(true);
      } else {
        setIsDemoMode(false);
      }
      const sorted = boxes.sort((a, b) => {
        const dA = calculateDistance(loc, { latitude: a.latitude, longitude: a.longitude });
        const dB = calculateDistance(loc, { latitude: b.latitude, longitude: b.longitude });
        return dA - dB;
      });
      setNearbyLootBoxes(sorted);
    } catch {
      const boxes = await DemoService.getDemoBoxes(loc.latitude, loc.longitude);
      setNearbyLootBoxes(boxes);
      setIsDemoMode(true);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  // Start guided tour after first load (loot boxes ready, daily bonus dismissed)
  useEffect(() => {
    if (!tourStarted && !tourCompleted && nearbyLootBoxes.length > 0 && !dailyBonus?.awarded) {
      setTourStarted(true);
      const timer = setTimeout(() => startTour(), 1000);
      return () => clearTimeout(timer);
    }
  }, [nearbyLootBoxes, tourStarted, tourCompleted, startTour, dailyBonus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNearby();
    setRefreshing(false);
  };

  const handleLootBoxTap = async (box: LootBox) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!box.isActive) {
      Alert.alert("Recharging ⏳", `${box.businessName}'s loot box is recharging. Check back soon!`);
      return;
    }
    if (!userLocation) {
      Alert.alert("Location Required", "Enable location to claim loot boxes.");
      return;
    }

    const distance = calculateDistance(userLocation, {
      latitude: box.latitude,
      longitude: box.longitude,
    });

    const isDemo = DemoService.isDemoBox(box.id);
    const claimRadius = isDemo ? 0.5 : 0.1; // 500m for demo, 100m for real

    if (distance > claimRadius) {
      Alert.alert(
        `${box.businessName}`,
        `🎁 ${box.coupon.value}\n📍 ${formatDistance(distance)} away\n\n${isDemo ? "Get within 500m to claim this demo drop!" : "Get closer to claim this loot box!"}`,
        [
          {
            text: "Get Directions",
            onPress: () => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${box.latitude},${box.longitude}`;
              if (Platform.OS === "web") {
                window.open(url, "_blank");
              }
            },
          },
          { text: "OK", style: "cancel" },
        ]
      );
      return;
    }

    // Close enough to claim
    SoundService.chestOpen();

    if (isDemo) {
      // Demo claim — skip Supabase, save locally
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const demoCoupon = {
        ...box.coupon,
        collectedAt: Date.now(),
        isUsed: false,
      };
      await StorageService.addCollectedCoupon(demoCoupon);

      const claimResult = await GamificationService.recordClaim(box.businessName);
      setGamification(await GamificationService.getState());

      SoundService.claimSuccess();
      if (claimResult.leveledUp) setTimeout(() => SoundService.levelUp(), 800);
      if (claimResult.newBadges.length > 0) setTimeout(() => SoundService.badgeUnlock(), 600);

      setCelebration({ visible: true, box, claimResult });
      // Advance tour when user claims a box on the "claim-box" step
      if (isTourActive && currentStepData?.id === "claim-box") {
        nextStep();
      }
      return;
    }

    // Real claim via Supabase
    const result = await ClaimService.claimLootBox(
      box.id,
      userLocation.latitude,
      userLocation.longitude
    );

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.coupon) {
        await StorageService.addCollectedCoupon(result.coupon);
      }

      const claimResult = await GamificationService.recordClaim(box.businessName);
      setGamification(await GamificationService.getState());

      SoundService.claimSuccess();
      if (claimResult.leveledUp) setTimeout(() => SoundService.levelUp(), 800);
      if (claimResult.newBadges.length > 0) setTimeout(() => SoundService.badgeUnlock(), 600);

      setCelebration({ visible: true, box, claimResult });
      // Advance tour when user claims a box on the "claim-box" step
      if (isTourActive && currentStepData?.id === "claim-box") {
        nextStep();
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      SoundService.error();
      Alert.alert("Claim Failed", result.message || "Could not claim this loot box.");
    }
  };

  const filteredLootBoxes = useMemo(() => {
    let result = nearbyLootBoxes;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => b.businessName.toLowerCase().includes(q));
    }
    if (selectedCategory) {
      result = result.filter((b) => b.category === selectedCategory);
    }
    return result;
  }, [nearbyLootBoxes, searchQuery, selectedCategory]);

  const activeCount = filteredLootBoxes.filter((b) => b.isActive).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: tabBarHeight + Spacing["2xl"] },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View>
            <ThemedText type="h2" style={{ fontFamily: Fonts?.display }}>
              Discover
            </ThemedText>
            <Animated.View style={shimmerStyle}>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                {userLocation ? `Scanning ${nearbyLootBoxes.length} locations...` : "Getting your location..."}
              </ThemedText>
            </Animated.View>
          </View>
          <View style={styles.headerRight}>
            {activeCount > 0 && (
              <View
                style={[
                  styles.activeBadge,
                  {
                    backgroundColor: theme.primary,
                    ...Platform.select({
                      web: { boxShadow: WebShadows.neonOrange },
                      default: Shadows.glow,
                    }),
                  },
                ]}
              >
                <ThemedText style={styles.activeBadgeText}>
                  {activeCount} 🔥
                </ThemedText>
              </View>
            )}
            {/* View mode toggle */}
            <Pressable
              onPress={() => {
                SoundService.tap();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode(viewMode === "radar" ? "camera" : "radar");
                // Advance tour when user taps AR toggle on the "try-ar" step
                if (isTourActive && currentStepData?.id === "try-ar") {
                  nextStep();
                }
              }}
              style={[
                styles.modeToggle,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.primary + "30",
                  ...Platform.select({
                    web: { boxShadow: WebShadows.insetGlow },
                    default: {},
                  }),
                },
              ]}
            >
              <Feather
                name={viewMode === "radar" ? "camera" : "radio"}
                size={16}
                color={theme.text}
              />
              <ThemedText style={[styles.modeToggleText, { color: theme.text }]}>
                {viewMode === "radar" ? "AR" : "Radar"}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Demo mode banner */}
        {isDemoMode && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={[styles.demoBanner, { backgroundColor: theme.accent + "15", borderColor: theme.accent + "30" }]}
          >
            <ThemedText style={[styles.demoBannerText, { color: theme.accent }]}>
              Demo Mode — sample drops to try the app
            </ThemedText>
          </Animated.View>
        )}

        {/* Search bar */}
        <Animated.View entering={FadeInDown.duration(400).delay(50)} style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
            <Feather name="search" size={16} color={theme.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search businesses..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Feather name="x" size={16} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={{ marginBottom: Spacing.md }}
        >
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              category={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            />
          ))}
        </ScrollView>

        {/* XP Bar */}
        {gamification && (
          <Animated.View entering={FadeInDown.duration(500).delay(50)} style={{ marginBottom: Spacing.xl }}>
            <XPBar state={gamification} compact />
          </Animated.View>
        )}

        {/* Radar or Camera AR */}
        {viewMode === "radar" ? (
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.radarSection}>
            <RadarView
              lootBoxes={filteredLootBoxes}
              userLocation={userLocation}
              onLootBoxTap={handleLootBoxTap}
            />
          </Animated.View>
        ) : (
          <View style={styles.cameraSection}>
            <CameraARView
              lootBoxes={filteredLootBoxes}
              userLocation={userLocation}
              onLootBoxTap={handleLootBoxTap}
              compassHeading={compassHeading}
            />
          </View>
        )}

        {/* Nearby list */}
        {filteredLootBoxes.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.listSection}>
            <ThemedText type="h4" style={styles.listTitle}>
              Nearby Loot
            </ThemedText>
            <View style={styles.cardList}>
              {filteredLootBoxes.map((box, i) => (
                <Animated.View
                  key={box.id}
                  entering={FadeInUp.duration(400).delay(400 + i * 80)}
                >
                  <NearbyCard
                    box={box}
                    distance={
                      userLocation
                        ? calculateDistance(userLocation, {
                            latitude: box.latitude,
                            longitude: box.longitude,
                          })
                        : 0
                    }
                    onPress={() => handleLootBoxTap(box)}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Empty state */}
        {filteredLootBoxes.length === 0 && userLocation && (
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.emptyState}>
            <ThemedText style={{ fontSize: 48 }}>{searchQuery || selectedCategory ? "🔎" : "🔍"}</ThemedText>
            <ThemedText type="h4" style={{ textAlign: "center" }}>
              {searchQuery || selectedCategory ? "No matches" : "No loot boxes nearby"}
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery || selectedCategory
                ? "Try a different search or clear filters"
                : "Try exploring a different area or check back later!"}
            </ThemedText>
          </Animated.View>
        )}
      </ScrollView>

      {/* Map FAB */}
      <FAB
        icon="map"
        onPress={() => navigation.navigate("Map")}
        style={{
          position: "absolute",
          right: Spacing.lg,
          bottom: tabBarHeight + Spacing.lg,
        }}
      />

      {/* Daily bonus modal */}
      <DailyBonusModal
        visible={!!dailyBonus?.awarded}
        xp={dailyBonus?.xp || 0}
        streak={dailyBonus?.currentStreak || 0}
        onClose={() => setDailyBonus(null)}
      />

      {/* Claim celebration modal */}
      <ClaimCelebration
        visible={celebration.visible}
        onClose={() => setCelebration({ visible: false, box: null, claimResult: null })}
        couponTitle={celebration.box?.coupon.title || ""}
        couponCode={celebration.box?.coupon.code || ""}
        couponValue={celebration.box?.coupon.value || ""}
        businessName={celebration.box?.businessName || ""}
        claimResult={celebration.claimResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  modeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  activeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },
  radarSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  cameraSection: {
    height: 400,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing["3xl"],
  },
  listSection: {
    gap: Spacing.md,
  },
  listTitle: {
    fontFamily: Fonts?.display,
  },
  cardList: {
    gap: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  demoBanner: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  demoBannerText: {
    fontSize: 12,
    fontWeight: "700",
  },
  searchRow: {
    marginBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  chipRow: {
    gap: Spacing.sm,
  },
});
