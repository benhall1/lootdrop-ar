import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ScrollView,
  Platform,
  RefreshControl,
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
} from "../constants/theme";
import { mockLootBoxes } from "../services/mockData";
import { LootBoxService } from "../services/lootBoxService";
import { ClaimService } from "../services/claimService";
import { GamificationService, GamificationState, ClaimResult } from "../services/gamificationService";
import { SoundService } from "../services/soundService";
import { calculateDistance, formatDistance } from "../services/geolocation";
import { LocationService } from "../services/locationService";
import { StorageService } from "../services/storageService";
import { UserLocation, LootBox } from "../types";

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
          borderColor: box.isActive ? theme.primary + "30" : theme.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          opacity: box.isActive ? 1 : 0.6,
          ...Platform.select({
            web: box.isActive
              ? { boxShadow: `0 4px 20px ${theme.primaryGlow}` }
              : {},
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
        <ThemedText style={[cardStyles.name, { fontFamily: Fonts?.sans }]}>
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
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyLootBoxes, setNearbyLootBoxes] = useState<LootBox[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"radar" | "camera">("radar");
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [celebration, setCelebration] = useState<{
    visible: boolean;
    box: LootBox | null;
    claimResult: ClaimResult | null;
  }>({ visible: false, box: null, claimResult: null });

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

  // Load gamification state
  useEffect(() => {
    GamificationService.getState().then(setGamification);
  }, []);

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

  const fetchNearby = useCallback(async () => {
    if (!userLocation) return;
    try {
      let boxes = await LootBoxService.getNearby(
        userLocation.latitude,
        userLocation.longitude,
        2
      );
      if (boxes.length === 0) {
        boxes = mockLootBoxes.filter(
          (box) =>
            calculateDistance(userLocation, {
              latitude: box.latitude,
              longitude: box.longitude,
            }) < 2
        );
      }
      const sorted = boxes.sort((a, b) => {
        const dA = calculateDistance(userLocation, { latitude: a.latitude, longitude: a.longitude });
        const dB = calculateDistance(userLocation, { latitude: b.latitude, longitude: b.longitude });
        return dA - dB;
      });
      setNearbyLootBoxes(sorted);
    } catch {
      setNearbyLootBoxes(mockLootBoxes);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

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

    if (distance > 0.1) {
      Alert.alert(
        `${box.businessName}`,
        `🎁 ${box.coupon.value}\n📍 ${formatDistance(distance)} away\n\nGet closer to claim this loot box!`,
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

      // Record in gamification system
      const claimResult = await GamificationService.recordClaim(box.businessName);
      setGamification(await GamificationService.getState());

      // Play celebration sounds
      SoundService.claimSuccess();
      if (claimResult.leveledUp) setTimeout(() => SoundService.levelUp(), 800);
      if (claimResult.newBadges.length > 0) setTimeout(() => SoundService.badgeUnlock(), 600);

      // Show celebration modal
      setCelebration({ visible: true, box, claimResult });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      SoundService.error();
      Alert.alert("Claim Failed", result.message || "Could not claim this loot box.");
    }
  };

  const activeCount = nearbyLootBoxes.filter((b) => b.isActive).length;

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
              <View style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
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
              }}
              style={[
                styles.modeToggle,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.border,
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
              lootBoxes={nearbyLootBoxes}
              userLocation={userLocation}
              onLootBoxTap={handleLootBoxTap}
            />
          </Animated.View>
        ) : (
          <View style={styles.cameraSection}>
            <CameraARView
              lootBoxes={nearbyLootBoxes}
              userLocation={userLocation}
              onLootBoxTap={handleLootBoxTap}
              compassHeading={compassHeading}
            />
          </View>
        )}

        {/* Nearby list */}
        {nearbyLootBoxes.length > 0 && (
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.listSection}>
            <ThemedText type="h4" style={styles.listTitle}>
              Nearby Loot
            </ThemedText>
            <View style={styles.cardList}>
              {nearbyLootBoxes.map((box, i) => (
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
        {nearbyLootBoxes.length === 0 && userLocation && (
          <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.emptyState}>
            <ThemedText style={{ fontSize: 48 }}>🔍</ThemedText>
            <ThemedText type="h4" style={{ textAlign: "center" }}>
              No loot boxes nearby
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Try exploring a different area or check back later!
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
});
