import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { CategoryChip } from "../components/CategoryChip";
import { CountdownTimer } from "../components/CountdownTimer";
import { FAB } from "../components/FAB";
import { BusinessLogo } from "../components/BusinessLogo";
import { useTheme } from "../hooks/useTheme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing, BorderRadius } from "../constants/theme";
import { mockLootBoxes } from "../services/mockData";
import { LocationService } from "../services/locationService";
import { StorageService } from "../services/storageService";
import { LocationCategory, LootBox, UserLocation } from "../types";

function AnimatedMarkerPulse({ theme }: { theme: any }) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.markerPulse,
        { borderColor: theme.primary },
        animatedStyle,
      ]}
    />
  );
}

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
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.customMarker,
                    {
                      backgroundColor: lootBox.isActive
                        ? theme.primary
                        : theme.backgroundSecondary,
                      borderColor: lootBox.isActive ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <BusinessLogo
                    businessName={lootBox.businessName}
                    logoUrl={lootBox.businessLogo}
                    size={28}
                  />
                </View>
                {lootBox.isActive && <AnimatedMarkerPulse theme={theme} />}
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
            <View style={styles.calloutTitleRow}>
              <BusinessLogo
                businessName={selectedLootBox.businessName}
                logoUrl={selectedLootBox.businessLogo}
                size={32}
              />
              <ThemedText type="h3" numberOfLines={1} style={{ flex: 1, marginLeft: Spacing.sm }}>
                {selectedLootBox.businessName}
              </ThemedText>
            </View>
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
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
  markerPulse: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    opacity: 0.3,
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
  calloutTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  calloutActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginLeft: Spacing.sm,
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
