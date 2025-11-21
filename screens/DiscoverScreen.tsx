import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { FAB } from "../components/FAB";
import { ARCamera } from "../components/ARCamera";
import { useTheme } from "../hooks/useTheme";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing, Layout, BorderRadius } from "../constants/theme";
import { mockLootBoxes } from "../services/mockData";
import { calculateDistance, formatDistance } from "../services/geolocation";
import { LocationService } from "../services/locationService";
import { StorageService } from "../services/storageService";
import { UserLocation, LootBox, CollectedCoupon } from "../types";

export default function DiscoverScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyLootBoxes, setNearbyLootBoxes] = useState<LootBox[]>([]);
  const [closestLootBox, setClosestLootBox] = useState<LootBox | null>(null);
  const [showCamera, setShowCamera] = useState(true);

  useEffect(() => {
    let locationSubscription: any = null;

    const startLocationTracking = async () => {
      const currentLocation = await LocationService.getCurrentLocation();
      if (currentLocation) {
        setUserLocation(currentLocation);
        
        locationSubscription = await LocationService.watchLocation((location) => {
          setUserLocation(location);
        });
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (userLocation) {
      const nearby = mockLootBoxes
        .filter((box) => {
          const distance = calculateDistance(userLocation, {
            latitude: box.latitude,
            longitude: box.longitude,
          });
          return distance < 2;
        })
        .sort((a, b) => {
          const distA = calculateDistance(userLocation, {
            latitude: a.latitude,
            longitude: a.longitude,
          });
          const distB = calculateDistance(userLocation, {
            latitude: b.latitude,
            longitude: b.longitude,
          });
          return distA - distB;
        });

      setNearbyLootBoxes(nearby);
      if (nearby.length > 0) {
        setClosestLootBox(nearby[0]);
      }
    }
  }, [userLocation]);

  const handleDiscoverLootBox = async (lootBox: LootBox) => {
    if (lootBox && lootBox.isActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const collectedCoupon: CollectedCoupon = {
        ...lootBox.coupon,
        collectedAt: Date.now(),
        isUsed: false,
      };
      
      await StorageService.addCollectedCoupon(collectedCoupon);
      
      Alert.alert(
        "Loot Box Opened!",
        `You discovered: ${lootBox.coupon.title}\nCode: ${lootBox.coupon.code}`,
        [
          { 
            text: "View Collection", 
            onPress: () => navigation.navigate("Collection") 
          },
          { text: "OK", style: "cancel" }
        ]
      );
    } else {
      Alert.alert(
        "Not Available",
        "This loot box is not active yet. Check the timer!"
      );
    }
  };

  const getDistanceToClosest = () => {
    if (!userLocation || !closestLootBox) return null;
    const distance = calculateDistance(userLocation, {
      latitude: closestLootBox.latitude,
      longitude: closestLootBox.longitude,
    });
    return formatDistance(distance);
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.xl,
            backgroundColor: theme.arOverlay,
          },
        ]}
      >
        <Pressable
          style={styles.infoButton}
          onPress={() =>
            Alert.alert(
              "AR Discovery",
              "Point your camera around to discover loot boxes at nearby businesses!"
            )
          }
        >
          <Feather name="info" size={20} color={theme.text} />
        </Pressable>
      </View>

      {showCamera ? (
        <ARCamera
          nearbyLootBoxes={nearbyLootBoxes}
          onLootBoxTap={handleDiscoverLootBox}
        />
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Feather
            name="camera"
            size={64}
            color={theme.textSecondary}
            style={{ opacity: 0.3 }}
          />
          <ThemedText
            style={[styles.placeholderText, { color: theme.textSecondary }]}
          >
            AR Camera View
          </ThemedText>
          <ThemedText
            style={[styles.placeholderSubtext, { color: theme.textSecondary }]}
          >
            Camera access required for full AR experience
          </ThemedText>
        </View>
      )}

      {closestLootBox && (
        <View
          style={[
            styles.distanceIndicator,
            {
              top: insets.top + Spacing.xl + 50,
              backgroundColor: theme.backgroundDefault,
            },
          ]}
        >
          <Feather name="navigation" size={16} color={theme.primary} />
          <ThemedText style={styles.distanceText}>
            {getDistanceToClosest()}
          </ThemedText>
        </View>
      )}

      <View
        style={[
          styles.lootCounter,
          {
            top: insets.top + Spacing.xl + 50,
            backgroundColor: theme.primary,
          },
        ]}
      >
        <ThemedText style={styles.counterText}>
          {nearbyLootBoxes.filter((b) => b.isActive).length}
        </ThemedText>
      </View>

      <View
        style={[
          styles.minimap,
          {
            bottom: tabBarHeight + Spacing.xl,
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.minimapContent}>
          <View
            style={[styles.userDot, { backgroundColor: theme.accent }]}
          />
          {nearbyLootBoxes.slice(0, 5).map((box, index) => (
            <View
              key={box.id}
              style={[
                styles.lootDot,
                {
                  backgroundColor: box.isActive
                    ? theme.markerActive
                    : theme.markerInactive,
                  left: 40 + index * 15,
                  top: 40 + index * 10,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {closestLootBox && closestLootBox.isActive && (
        <Pressable
          onPress={() => handleDiscoverLootBox(closestLootBox)}
          style={[
            styles.discoverButton,
            {
              bottom: tabBarHeight + Spacing.xl,
              backgroundColor: theme.primary,
            },
          ]}
        >
          <Feather name="gift" size={24} color="#FFF" />
          <ThemedText style={styles.discoverButtonText}>
            Open Loot Box
          </ThemedText>
        </Pressable>
      )}

      <FAB
        icon="map"
        onPress={() => navigation.navigate("Map")}
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  infoButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: Spacing.lg,
    fontSize: 18,
    fontWeight: "600",
  },
  placeholderSubtext: {
    marginTop: Spacing.sm,
    fontSize: 14,
    opacity: 0.7,
  },
  distanceIndicator: {
    position: "absolute",
    left: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: "700",
  },
  lootCounter: {
    position: "absolute",
    right: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  counterText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  minimap: {
    position: "absolute",
    left: Spacing.lg,
    width: Layout.minimapSize,
    height: Layout.minimapSize,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  minimapContent: {
    flex: 1,
    position: "relative",
  },
  userDot: {
    position: "absolute",
    left: Layout.minimapSize / 2 - 4,
    top: Layout.minimapSize / 2 - 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lootDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  discoverButton: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  discoverButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
  },
});
