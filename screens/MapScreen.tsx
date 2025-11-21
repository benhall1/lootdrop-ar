import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { CategoryChip } from "../components/CategoryChip";
import { CountdownTimer } from "../components/CountdownTimer";
import { FAB } from "../components/FAB";
import { useTheme } from "../hooks/useTheme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing, BorderRadius } from "../constants/theme";
import { mockLootBoxes } from "../services/mockData";
import { LocationService } from "../services/locationService";
import { StorageService } from "../services/storageService";
import { LocationCategory, LootBox, UserLocation } from "../types";

export default function MapScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | null>(null);
  const [selectedLootBox, setSelectedLootBox] = useState<LootBox | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const categories: LocationCategory[] = ["restaurant", "retail", "entertainment", "services"];

  const filteredLootBoxes = selectedCategory
    ? mockLootBoxes.filter((box) => box.category === selectedCategory)
    : mockLootBoxes;

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
        <MapView
          style={styles.map}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: userLocation?.latitude || 37.7849,
            longitude: userLocation?.longitude || -122.4094,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          region={userLocation ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          } : undefined}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {filteredLootBoxes.map((lootBox) => (
            <Marker
              key={lootBox.id}
              coordinate={{
                latitude: lootBox.latitude,
                longitude: lootBox.longitude,
              }}
              onPress={() => setSelectedLootBox(lootBox)}
              pinColor={lootBox.isActive ? theme.primary : theme.textSecondary}
            >
              <View
                style={[
                  styles.customMarker,
                  {
                    backgroundColor: lootBox.isActive
                      ? theme.primary
                      : theme.backgroundSecondary,
                  },
                ]}
              >
                <Feather
                  name="gift"
                  size={20}
                  color={lootBox.isActive ? "#FFF" : theme.textSecondary}
                />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {selectedLootBox && (
        <View
          style={[
            styles.callout,
            {
              bottom: tabBarHeight + Spacing.xl,
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.calloutHeader}>
            <ThemedText type="h3" numberOfLines={1}>
              {selectedLootBox.businessName}
            </ThemedText>
            <View style={styles.calloutActions}>
              <Pressable onPress={() => handleToggleFavorite(selectedLootBox.id)}>
                <Feather
                  name={favorites.includes(selectedLootBox.id) ? "heart" : "heart"}
                  size={20}
                  color={favorites.includes(selectedLootBox.id) ? theme.primary : theme.textSecondary}
                  style={{ opacity: favorites.includes(selectedLootBox.id) ? 1 : 0.5 }}
                />
              </Pressable>
              <Pressable onPress={() => setSelectedLootBox(null)}>
                <Feather name="x" size={20} color={theme.text} />
              </Pressable>
            </View>
          </View>
          <ThemedText
            style={[styles.calloutSubtext, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {selectedLootBox.coupon.title}
          </ThemedText>
          <CountdownTimer targetTime={selectedLootBox.dropTime} style={styles.calloutTimer} />
        </View>
      )}

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
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  callout: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  calloutActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  calloutSubtext: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  calloutTimer: {
    alignSelf: "flex-start",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
  },
});
