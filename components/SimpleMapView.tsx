import React from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { BusinessLogo } from "./BusinessLogo";
import { useTheme } from "../hooks/useTheme";
import { Spacing } from "../constants/theme";
import { LootBox, UserLocation } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAP_SIZE = SCREEN_WIDTH - Spacing.lg * 2;

interface SimpleMapViewProps {
  lootBoxes: LootBox[];
  userLocation: UserLocation | null;
  onLootBoxPress: (lootBox: LootBox) => void;
}

function AnimatedMarker({ isActive, theme }: { isActive: boolean; theme: any }) {
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (isActive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (isActive) {
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
  return null;
}

export function SimpleMapView({ lootBoxes, userLocation, onLootBoxPress }: SimpleMapViewProps) {
  const { theme } = useTheme();

  const allLocations = [...lootBoxes];
  if (userLocation) {
    allLocations.push({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    } as any);
  }

  const minLat = Math.min(...allLocations.map(l => l.latitude));
  const maxLat = Math.max(...allLocations.map(l => l.latitude));
  const minLon = Math.min(...allLocations.map(l => l.longitude));
  const maxLon = Math.max(...allLocations.map(l => l.longitude));

  const latRange = maxLat - minLat || 0.01;
  const lonRange = maxLon - minLon || 0.01;

  const getPosition = (lat: number, lon: number) => {
    const x = ((lon - minLon) / lonRange) * (MAP_SIZE - 80) + 40;
    const y = ((maxLat - lat) / latRange) * (MAP_SIZE - 80) + 40;
    return { x, y };
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.mapGrid}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              styles.horizontalLine,
              { top: (i * MAP_SIZE) / 10, backgroundColor: theme.border },
            ]}
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              styles.verticalLine,
              { left: (i * MAP_SIZE) / 10, backgroundColor: theme.border },
            ]}
          />
        ))}
      </View>

      {userLocation && (
        <View
          style={[
            styles.userMarker,
            {
              left: getPosition(userLocation.latitude, userLocation.longitude).x - 10,
              top: getPosition(userLocation.latitude, userLocation.longitude).y - 10,
              backgroundColor: theme.primary,
            },
          ]}
        >
          <Feather name="navigation" size={12} color="#FFFFFF" />
        </View>
      )}

      {lootBoxes.map((lootBox) => {
        const pos = getPosition(lootBox.latitude, lootBox.longitude);
        return (
          <Pressable
            key={lootBox.id}
            style={[
              styles.lootBoxMarker,
              {
                left: pos.x - 18,
                top: pos.y - 18,
                borderColor: lootBox.isActive ? theme.primary : theme.border,
              },
            ]}
            onPress={() => onLootBoxPress(lootBox)}
          >
            <BusinessLogo
              businessName={lootBox.businessName}
              logoUrl={lootBox.businessLogo}
              size={28}
            />
            {lootBox.isActive && <AnimatedMarker isActive={lootBox.isActive} theme={theme} />}
          </Pressable>
        );
      })}

      <View style={[styles.legend, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]}>
            <Feather name="navigation" size={8} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.legendText}>You</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 2 }]} />
          <ThemedText style={styles.legendText}>Active</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, borderWidth: 2 }]} />
          <ThemedText style={styles.legendText}>Expired</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    borderRadius: Spacing.md,
    overflow: "hidden",
    position: "relative",
  },
  mapGrid: {
    width: "100%",
    height: "100%",
  },
  gridLine: {
    position: "absolute",
    opacity: 0.1,
  },
  horizontalLine: {
    width: "100%",
    height: 1,
  },
  verticalLine: {
    height: "100%",
    width: 1,
  },
  userMarker: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  lootBoxMarker: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  markerPulse: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    opacity: 0.4,
  },
  legend: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.sm,
    borderRadius: Spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  legendText: {
    fontSize: 10,
  },
});
