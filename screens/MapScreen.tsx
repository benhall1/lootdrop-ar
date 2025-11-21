import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { CategoryChip } from "../components/CategoryChip";
import { CountdownTimer } from "../components/CountdownTimer";
import { FAB } from "../components/FAB";
import { BusinessLogo } from "../components/BusinessLogo";
import { SimpleMapView } from "../components/SimpleMapView";
import { useTheme } from "../hooks/useTheme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing, BorderRadius } from "../constants/theme";
import { mockLootBoxes } from "../services/mockData";
import { LocationService } from "../services/locationService";
import { StorageService } from "../services/storageService";
import { LocationCategory, LootBox, UserLocation } from "../types";

function DistanceBadge({ distance, theme }: { distance: number; theme: any }) {
  return (
    <View
      style={[
        styles.distanceBadge,
        { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
      ]}
    >
      <Feather name="map-pin" size={12} color={theme.textSecondary} />
      <ThemedText style={[styles.distanceText, { color: theme.textSecondary }]}>
        {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
      </ThemedText>
    </View>
  );
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedLootBox, setSelectedLootBox] = useState<LootBox | null>(null);

  const categories: LocationCategory[] = ["restaurant", "retail", "entertainment", "services"];

  const filteredLootBoxes = selectedCategory
    ? mockLootBoxes.filter((box) => box.category === selectedCategory)
    : mockLootBoxes;

  const sortedLootBoxes = userLocation
    ? [...filteredLootBoxes].sort((a, b) => {
        const distA = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          a.latitude,
          a.longitude
        );
        const distB = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          b.latitude,
          b.longitude
        );
        return distA - distB;
      })
    : filteredLootBoxes;

  useEffect(() => {
    const loadLocation = async () => {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        setUserLocation(location);
      }
    };

    const loadFavorites = async () => {
      const favs = await StorageService.getFavoriteLocations();
      setFavorites(favs);
    };

    loadLocation();
    loadFavorites();
  }, []);

  const handleToggleFavorite = async (lootBoxId: string) => {
    const isFavorite = await StorageService.toggleFavorite(lootBoxId);
    const favs = await StorageService.getFavoriteLocations();
    setFavorites(favs);
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: Spacing.xl,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <ThemedText type="h3">Loot Drops Nearby</ThemedText>
        {userLocation && (
          <ThemedText style={[styles.locationText, { color: theme.textSecondary }]}>
            <Feather name="navigation" size={14} /> Sorted by distance
          </ThemedText>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.categoryContainer, { paddingTop: Spacing.xl }]}
        style={[styles.categoryScroll, { backgroundColor: theme.backgroundRoot }]}
      >
        {categories.map((category) => (
          <CategoryChip
            key={category}
            category={category}
            selected={selectedCategory === category}
            onPress={() =>
              setSelectedCategory(selectedCategory === category ? null : category)
            }
          />
        ))}
      </ScrollView>

      <View style={[styles.mapWrapper, { backgroundColor: theme.backgroundRoot }]}>
        <SimpleMapView
          lootBoxes={filteredLootBoxes}
          userLocation={userLocation}
          onLootBoxPress={(lootBox) => {
            const index = sortedLootBoxes.findIndex(box => box.id === lootBox.id);
            if (index !== -1) {
              setSelectedLootBox(lootBox);
            }
          }}
        />
      </View>

      {selectedLootBox && (
        <View
          style={[
            styles.selectedCard,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.primary,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.businessInfo}>
              <BusinessLogo
                businessName={selectedLootBox.businessName}
                logoUrl={selectedLootBox.businessLogo}
                size={40}
              />
              <View style={styles.businessText}>
                <ThemedText type="h4" numberOfLines={1}>
                  {selectedLootBox.businessName}
                </ThemedText>
                <ThemedText
                  style={[styles.couponTitle, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {selectedLootBox.coupon.title}
                </ThemedText>
              </View>
            </View>
            <Pressable onPress={() => setSelectedLootBox(null)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          {selectedLootBox.isActive && (
            <CountdownTimer targetTime={selectedLootBox.dropTime} style={styles.selectedTimer} />
          )}
        </View>
      )}

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing["2xl"] * 2 },
        ]}
      >
        {sortedLootBoxes.map((lootBox) => {
          const distance = userLocation
            ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                lootBox.latitude,
                lootBox.longitude
              )
            : null;

          return (
            <View
              key={lootBox.id}
              style={[
                styles.lootBoxCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: lootBox.isActive ? theme.primary : theme.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.businessInfo}>
                  <BusinessLogo
                    businessName={lootBox.businessName}
                    logoUrl={lootBox.businessLogo}
                    size={40}
                  />
                  <View style={styles.businessText}>
                    <ThemedText type="h4" numberOfLines={1}>
                      {lootBox.businessName}
                    </ThemedText>
                    <ThemedText
                      style={[styles.couponTitle, { color: theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {lootBox.coupon.title}
                    </ThemedText>
                  </View>
                </View>
                <Pressable onPress={() => handleToggleFavorite(lootBox.id)}>
                  <Feather
                    name="heart"
                    size={24}
                    color={favorites.includes(lootBox.id) ? theme.primary : theme.textSecondary}
                    style={{ opacity: favorites.includes(lootBox.id) ? 1 : 0.5 }}
                  />
                </Pressable>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.cardMetadata}>
                  {distance !== null && <DistanceBadge distance={distance} theme={theme} />}
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: lootBox.isActive
                          ? theme.primary + "20"
                          : theme.backgroundSecondary,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: lootBox.isActive ? theme.primary : theme.textSecondary },
                      ]}
                    />
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: lootBox.isActive ? theme.primary : theme.textSecondary },
                      ]}
                    >
                      {lootBox.isActive ? "Active" : "Expired"}
                    </ThemedText>
                  </View>
                </View>
                {lootBox.isActive && (
                  <CountdownTimer targetTime={lootBox.dropTime} style={styles.cardTimer} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <FAB
        icon="camera"
        onPress={() => navigation.navigate("Discover")}
        style={[styles.fab, { bottom: tabBarHeight + Spacing.xl }]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
  },
  locationText: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  mapWrapper: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  selectedCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  selectedTimer: {
    marginTop: Spacing.md,
    alignSelf: "flex-start",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.lg,
  },
  lootBoxCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  businessInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.sm,
  },
  businessText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  couponTitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMetadata: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardTimer: {
    alignSelf: "flex-end",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
  },
});
