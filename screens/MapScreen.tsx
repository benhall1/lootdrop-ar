import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Pressable, Linking, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { CategoryChip } from "../components/CategoryChip";
import { CountdownTimer } from "../components/CountdownTimer";
import { BusinessLogo } from "../components/BusinessLogo";
import { Button } from "../components/Button";
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
  const mapRef = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedLootBox, setSelectedLootBox] = useState<LootBox | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
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
        setMapRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        const defaultLocation = mockLootBoxes[0];
        setMapRegion({
          latitude: defaultLocation.latitude,
          longitude: defaultLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
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
    await StorageService.toggleFavorite(lootBoxId);
    const favs = await StorageService.getFavoriteLocations();
    setFavorites(favs);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleGetDirections = (lootBox: LootBox) => {
    const destination = `${lootBox.latitude},${lootBox.longitude}`;
    const label = encodeURIComponent(lootBox.businessName);

    let url = "";
    if (Platform.OS === "ios") {
      url = `maps://app?daddr=${destination}&q=${label}`;
    } else {
      url = `google.navigation:q=${destination}`;
    }

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
        Linking.openURL(browserUrl);
      }
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
            <Feather name="navigation" size={14} /> Live location enabled
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

      <View style={styles.mapContainer}>
        <SimpleMapView
          lootBoxes={filteredLootBoxes}
          userLocation={userLocation}
          onLootBoxPress={(lootBox) => {
            setSelectedLootBox(lootBox);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                size={48}
              />
              <View style={styles.businessDetails}>
                <ThemedText type="h4" numberOfLines={1}>
                  {selectedLootBox.businessName}
                </ThemedText>
                <ThemedText style={[styles.categoryText, { color: theme.textSecondary }]}>
                  {selectedLootBox.category.charAt(0).toUpperCase() + 
                   selectedLootBox.category.slice(1)}
                </ThemedText>
                {userLocation && (
                  <DistanceBadge
                    distance={calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      selectedLootBox.latitude,
                      selectedLootBox.longitude
                    )}
                    theme={theme}
                  />
                )}
              </View>
            </View>
            <Pressable
              onPress={() => handleToggleFavorite(selectedLootBox.id)}
              style={styles.favoriteButton}
            >
              <Feather
                name={favorites.includes(selectedLootBox.id) ? "heart" : "heart"}
                size={24}
                color={favorites.includes(selectedLootBox.id) ? theme.error : theme.textSecondary}
                fill={favorites.includes(selectedLootBox.id) ? theme.error : "none"}
              />
            </Pressable>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.statusRow}>
              {selectedLootBox.isActive ? (
                <>
                  <View style={[styles.statusBadge, { backgroundColor: theme.success + "20" }]}>
                    <Feather name="check-circle" size={16} color={theme.success} />
                    <ThemedText style={[styles.statusText, { color: theme.success }]}>
                      Available Now
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.rewardText, { color: theme.secondary }]}>
                    {selectedLootBox.coupon.value}
                  </ThemedText>
                </>
              ) : (
                <>
                  <View style={[styles.statusBadge, { backgroundColor: theme.error + "20" }]}>
                    <Feather name="clock" size={16} color={theme.error} />
                    <ThemedText style={[styles.statusText, { color: theme.error }]}>
                      Recharging
                    </ThemedText>
                  </View>
                  <CountdownTimer
                    targetTime={selectedLootBox.dropTime}
                  />
                </>
              )}
            </View>

            <Button
              onPress={() => handleGetDirections(selectedLootBox)}
              style={[styles.directionsButton, { backgroundColor: theme.primary }]}
            >
              <Feather name="navigation" size={18} color="#FFFFFF" />
              <ThemedText style={styles.directionsButtonText}>
                Get Directions
              </ThemedText>
            </Button>

            <Pressable
              onPress={() => setSelectedLootBox(null)}
              style={styles.closeButton}
            >
              <ThemedText style={[styles.closeText, { color: theme.textSecondary }]}>
                Close
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: 14,
  },
  categoryScroll: {
    maxHeight: 60,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterButton: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  selectedCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 2,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  businessInfo: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.md,
  },
  businessDetails: {
    flex: 1,
    gap: Spacing.xs,
  },
  categoryText: {
    fontSize: 14,
  },
  favoriteButton: {
    padding: Spacing.sm,
  },
  cardContent: {
    gap: Spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  rewardText: {
    fontSize: 18,
    fontWeight: "700",
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  directionsButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    alignItems: "center",
    padding: Spacing.sm,
  },
  closeText: {
    fontSize: 14,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
