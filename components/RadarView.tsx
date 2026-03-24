import React, { useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Platform, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  interpolate,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Fonts, Spacing, BorderRadius, WebShadows } from "../constants/theme";
import { LootBox, UserLocation } from "../types";
import { calculateDistance } from "../services/geolocation";

const RADAR_SIZE = 300;
const RADAR_RADIUS = RADAR_SIZE / 2;
const MAX_RANGE_KM = 2; // 2km radar range

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍕",
  retail: "🛍️",
  entertainment: "🎮",
  services: "⚡",
};

interface RadarBlip {
  box: LootBox;
  distance: number;
  angle: number; // bearing from user to box in radians
  x: number;
  y: number;
}

function getBearing(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  return Math.atan2(y, x);
}

interface RadarViewProps {
  lootBoxes: LootBox[];
  userLocation: UserLocation | null;
  onLootBoxTap: (box: LootBox) => void;
  maxRange?: number;
}

function RadarBlipDot({
  blip,
  onTap,
  sweepRotation,
}: {
  blip: RadarBlip;
  onTap: () => void;
  sweepRotation: Animated.SharedValue<number>;
}) {
  const { theme } = useTheme();
  const emoji = CATEGORY_EMOJI[blip.box.category || ""] || "📦";
  const isActive = blip.box.isActive;

  // Blip pulses when the sweep passes over it
  const pulseAnim = useSharedValue(0);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const blipStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [0.9, 1.1]);
    return {
      transform: [{ scale }],
      opacity: isActive ? 1 : 0.4,
    };
  });

  return (
    <Animated.View
      entering={FadeIn.duration(600).delay(Math.random() * 400)}
      style={[
        radarStyles.blip,
        {
          left: RADAR_RADIUS + blip.x - 20,
          top: RADAR_RADIUS + blip.y - 20,
        },
      ]}
    >
      <Pressable onPress={onTap}>
        <Animated.View
          style={[
            radarStyles.blipInner,
            {
              backgroundColor: isActive
                ? theme.primary + "30"
                : theme.backgroundTertiary,
              borderColor: isActive ? theme.primary : theme.border,
              ...Platform.select({
                web: isActive
                  ? { boxShadow: `0 0 12px ${theme.primaryGlow}` }
                  : {},
                default: {},
              }),
            },
            blipStyle,
          ]}
        >
          <ThemedText style={radarStyles.blipEmoji}>{emoji}</ThemedText>
        </Animated.View>
        <ThemedText
          style={[
            radarStyles.blipDistance,
            { color: isActive ? theme.secondary : theme.textSecondary },
          ]}
        >
          {blip.distance < 1
            ? `${Math.round(blip.distance * 1000)}m`
            : `${blip.distance.toFixed(1)}km`}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export function RadarView({
  lootBoxes,
  userLocation,
  onLootBoxTap,
  maxRange = MAX_RANGE_KM,
}: RadarViewProps) {
  const { theme } = useTheme();
  const sweepRotation = useSharedValue(0);

  // Radar sweep animation — continuous rotation
  useEffect(() => {
    sweepRotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sweepRotation.value}deg` }],
  }));

  // Calculate blip positions
  const blips: RadarBlip[] = useMemo(() => {
    if (!userLocation) return [];

    return lootBoxes
      .map((box) => {
        const distance = calculateDistance(userLocation, {
          latitude: box.latitude,
          longitude: box.longitude,
        });
        const angle = getBearing(
          userLocation.latitude,
          userLocation.longitude,
          box.latitude,
          box.longitude
        );
        // Map distance to radar pixel position
        const radarDist = Math.min(distance / maxRange, 1) * (RADAR_RADIUS - 30);
        const x = Math.sin(angle) * radarDist;
        const y = -Math.cos(angle) * radarDist; // negative because screen Y is inverted

        return { box, distance, angle, x, y };
      })
      .filter((b) => b.distance <= maxRange)
      .sort((a, b) => a.distance - b.distance);
  }, [lootBoxes, userLocation, maxRange]);

  // Ring pulse animation
  const ringPulse = useSharedValue(0);
  useEffect(() => {
    ringPulse.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const pulseRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(ringPulse.value, [0, 1], [0.2, 1.2]);
    const opacity = interpolate(ringPulse.value, [0, 0.8, 1], [0.6, 0.1, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={radarStyles.container}>
      {/* Radar circle */}
      <View
        style={[
          radarStyles.radarCircle,
          {
            backgroundColor: theme.backgroundDefault + "60",
            borderColor: theme.primary + "35",
            ...Platform.select({
              web: {
                backdropFilter: "blur(24px)",
                boxShadow: `0 0 80px ${theme.primaryGlow}, inset 0 0 80px ${theme.primaryGlow}, 0 0 2px ${theme.primary}40`,
                background: `radial-gradient(circle, ${theme.backgroundDefault}90 0%, ${theme.backgroundDefault}40 100%)`,
              },
              default: {},
            }),
          },
        ]}
      >
        {/* Concentric range rings */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <View
            key={pct}
            style={[
              radarStyles.rangeRing,
              {
                width: RADAR_SIZE * pct,
                height: RADAR_SIZE * pct,
                borderRadius: (RADAR_SIZE * pct) / 2,
                borderColor: theme.primary + "15",
              },
            ]}
          />
        ))}

        {/* Range labels */}
        <ThemedText
          style={[
            radarStyles.rangeLabel,
            { bottom: RADAR_RADIUS - (RADAR_SIZE * 0.5) / 2 - 16, color: theme.textSecondary },
          ]}
        >
          {maxRange / 2}km
        </ThemedText>
        <ThemedText
          style={[
            radarStyles.rangeLabel,
            { bottom: 4, color: theme.textSecondary },
          ]}
        >
          {maxRange}km
        </ThemedText>

        {/* Crosshair lines */}
        <View
          style={[
            radarStyles.crosshairH,
            { backgroundColor: theme.primary + "12" },
          ]}
        />
        <View
          style={[
            radarStyles.crosshairV,
            { backgroundColor: theme.primary + "12" },
          ]}
        />

        {/* Sweep line */}
        <Animated.View style={[radarStyles.sweepAnchor, sweepStyle]}>
          <View
            style={[
              radarStyles.sweepLine,
              {
                ...Platform.select({
                  web: {
                    background: `linear-gradient(to top, ${theme.primary}00, ${theme.primary}CC)`,
                  },
                  default: { backgroundColor: theme.primary + "80" },
                }),
              },
            ]}
          />
          {/* Sweep cone / glow */}
          <View
            style={[
              radarStyles.sweepCone,
              {
                ...Platform.select({
                  web: {
                    background: `conic-gradient(from -30deg, ${theme.primary}30, ${theme.primary}05 60deg, transparent 60deg)`,
                  },
                  default: {},
                }),
              },
            ]}
          />
        </Animated.View>

        {/* Expanding pulse ring from center */}
        <Animated.View
          style={[
            radarStyles.pulseRing,
            {
              borderColor: theme.primary + "40",
            },
            pulseRingStyle,
          ]}
        />

        {/* Center dot (user) */}
        <View
          style={[
            radarStyles.centerDot,
            {
              backgroundColor: theme.accent,
              ...Platform.select({
                web: {
                  boxShadow: `0 0 20px ${theme.accentGlow}, 0 0 6px ${theme.accent}`,
                  animation: "lootdrop-pulse 2s ease-in-out infinite",
                },
                default: {},
              }),
            },
          ]}
        />

        {/* Loot box blips */}
        {blips.map((blip) => (
          <RadarBlipDot
            key={blip.box.id}
            blip={blip}
            onTap={() => onLootBoxTap(blip.box)}
            sweepRotation={sweepRotation}
          />
        ))}
      </View>

      {/* Status bar below radar */}
      <View style={radarStyles.statusBar}>
        <View style={radarStyles.statusItem}>
          <View
            style={[radarStyles.statusDot, { backgroundColor: theme.primary }]}
          />
          <ThemedText style={[radarStyles.statusText, { color: theme.textSecondary }]}>
            {blips.filter((b) => b.box.isActive).length} active
          </ThemedText>
        </View>
        <View style={radarStyles.statusItem}>
          <View
            style={[radarStyles.statusDot, { backgroundColor: theme.accent }]}
          />
          <ThemedText style={[radarStyles.statusText, { color: theme.textSecondary }]}>
            {blips.length} nearby
          </ThemedText>
        </View>
        {blips.length > 0 && (
          <View style={radarStyles.statusItem}>
            <ThemedText style={[radarStyles.statusText, { color: theme.secondary }]}>
              ⚡ Closest:{" "}
              {blips[0].distance < 1
                ? `${Math.round(blips[0].distance * 1000)}m`
                : `${blips[0].distance.toFixed(1)}km`}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const radarStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  radarCircle: {
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rangeRing: {
    position: "absolute",
    borderWidth: 1,
  },
  rangeLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    right: RADAR_RADIUS - 20,
  },
  crosshairH: {
    position: "absolute",
    width: RADAR_SIZE,
    height: 1,
  },
  crosshairV: {
    position: "absolute",
    width: 1,
    height: RADAR_SIZE,
  },
  sweepAnchor: {
    position: "absolute",
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    alignItems: "center",
  },
  sweepLine: {
    position: "absolute",
    width: 2,
    height: RADAR_RADIUS,
    top: 0,
  },
  sweepCone: {
    position: "absolute",
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
  },
  pulseRing: {
    position: "absolute",
    width: RADAR_SIZE,
    height: RADAR_SIZE,
    borderRadius: RADAR_SIZE / 2,
    borderWidth: 2,
  },
  centerDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFF",
    zIndex: 10,
  },
  blip: {
    position: "absolute",
    width: 40,
    height: 40,
    alignItems: "center",
    zIndex: 5,
  },
  blipInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  blipEmoji: {
    fontSize: 18,
  },
  blipDistance: {
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 1,
    fontFamily: Fonts?.mono,
  },
  statusBar: {
    flexDirection: "row",
    gap: Spacing.lg,
    alignItems: "center",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
