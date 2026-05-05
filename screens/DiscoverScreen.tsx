import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  TextInput,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "../components/ThemedText";
import { ARHud } from "../components/ARHud";
import { ClaimCelebration } from "../components/ClaimCelebration";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { LootBoxService } from "../services/lootBoxService";
import { ClaimService } from "../services/claimService";
import { DemoService } from "../services/demoService";
import {
  GamificationService,
  GamificationState,
  ClaimResult,
  DailyBonusResult,
} from "../services/gamificationService";
import { DailyBonusModal } from "../components/DailyBonusModal";
import { SoundService } from "../services/soundService";
import { calculateDistance, formatDistance } from "../services/geolocation";
import { LocationService } from "../services/locationService";
import { StorageService } from "../services/storageService";
import { CategoryChip } from "../components/CategoryChip";
import { LootBoxSheet } from "../components/LootBoxSheet";
import { useTour } from "../contexts/GuidedTourContext";
import { useToast } from "../contexts/ToastContext";
import { UserLocation, LootBox, LocationCategory } from "../types";

export default function DiscoverScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { tourCompleted, isTourActive, currentStepData, completeAction } = useTour();
  const toast = useToast();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyLootBoxes, setNearbyLootBoxes] = useState<LootBox[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const categories: LocationCategory[] = ["restaurant", "retail", "entertainment", "services"];
  const [gamification, setGamification] = useState<GamificationState | null>(null);
  const [celebration, setCelebration] = useState<{
    visible: boolean;
    box: LootBox | null;
    claimResult: ClaimResult | null;
  }>({ visible: false, box: null, claimResult: null });
  const [dailyBonus, setDailyBonus] = useState<DailyBonusResult | null>(null);
  const [selectedBox, setSelectedBox] = useState<{ box: LootBox; distance: number } | null>(null);

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

  const DEFAULT_LOCATION = { latitude: 40.7128, longitude: -74.006 };

  const fetchNearby = useCallback(async () => {
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

  const handleLootBoxTap = async (box: LootBox) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!box.isActive) {
      toast.info(`${box.businessName}'s loot box is recharging. Check back soon!`);
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
    const claimRadius = isDemo ? 0.5 : 0.1;
    const isTourClaim = isTourActive && currentStepData?.actionRequired === "claim-lootbox";

    if (distance > claimRadius && !isTourClaim) {
      // Open detail sheet instead of alert — feels more game-like
      setSelectedBox({ box, distance });
      return;
    }

    SoundService.chestOpen();

    if (isDemo) {
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
      if (isTourActive && currentStepData?.actionRequired === "claim-lootbox") {
        completeAction("claim-lootbox");
      }
      return;
    }

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

      const claimResult = result.gamification
        ? await GamificationService.processServerClaimResult(result.gamification)
        : await GamificationService.recordClaim(box.businessName);
      setGamification(await GamificationService.getState());

      SoundService.claimSuccess();
      if (claimResult.leveledUp) setTimeout(() => SoundService.levelUp(), 800);
      if (claimResult.newBadges.length > 0) setTimeout(() => SoundService.badgeUnlock(), 600);

      setCelebration({ visible: true, box, claimResult });
      if (isTourActive && currentStepData?.actionRequired === "claim-lootbox") {
        completeAction("claim-lootbox");
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

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0d1c" }}>
      <ARHud
        lootBoxes={filteredLootBoxes}
        userLocation={userLocation}
        gamification={gamification}
        onLootBoxTap={handleLootBoxTap}
        onMapPress={() => navigation.navigate("Map")}
        onSearchPress={() => {
          Haptics.selectionAsync();
          setSearchVisible((v) => !v);
        }}
      />

      {/* Search/category overlay */}
      {searchVisible && (
        <View
          style={[
            styles.searchOverlay,
            {
              top: insets.top + 60,
            },
          ]}
        >
          <View style={[styles.searchBar, { backgroundColor: "rgba(15,19,38,0.9)", borderColor: "rgba(0,229,255,0.4)" }]}>
            <Feather name="search" size={16} color="#00E5FF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search businesses..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={[styles.searchInput, { color: "#fff", fontFamily: Fonts?.sans }]}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Feather name="x" size={16} color="#fff" />
              </Pressable>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={{ marginTop: Spacing.sm }}
          >
            {categories.map((cat) => (
              <CategoryChip
                key={cat}
                category={cat}
                selected={selectedCategory === cat}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(selectedCategory === cat ? null : cat);
                }}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Demo mode banner */}
      {isDemoMode && (
        <View
          style={[
            styles.demoBanner,
            {
              bottom: tabBarHeight + 100,
            },
          ]}
        >
          <ThemedText style={styles.demoBannerText}>
            Demo Mode — sample drops to try the app
          </ThemedText>
        </View>
      )}

      {/* Daily bonus modal */}
      <DailyBonusModal
        visible={!!dailyBonus?.awarded}
        xp={dailyBonus?.xp || 0}
        streak={dailyBonus?.currentStreak || 0}
        onClose={() => setDailyBonus(null)}
      />

      {/* Loot box detail sheet */}
      <LootBoxSheet
        visible={!!selectedBox}
        box={selectedBox?.box || null}
        distance={selectedBox?.distance || 0}
        onClaim={() => {
          if (selectedBox) {
            const closeFirst = selectedBox;
            setSelectedBox(null);
            // Force-claim path: bypass distance gate by calling handler with synthetic close-distance
            // We re-invoke handleLootBoxTap with the same box — the user has already seen distance in sheet.
            handleLootBoxTap(closeFirst.box);
          }
        }}
        onClose={() => setSelectedBox(null)}
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
  searchOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 40,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(0,229,255,0.2)",
      } as any,
      default: {},
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  chipRow: {
    gap: Spacing.sm,
  },
  demoBanner: {
    position: "absolute",
    left: 14,
    right: 14,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.4)",
    backgroundColor: "rgba(0,229,255,0.1)",
    alignItems: "center",
    zIndex: 35,
  },
  demoBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#00E5FF",
  },
});
