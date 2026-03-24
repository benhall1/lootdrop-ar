import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
  FadeIn,
  interpolate,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { LootBox, UserLocation } from "../types";
import { calculateDistance, formatDistance } from "../services/geolocation";

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍕",
  retail: "🛍️",
  entertainment: "🎮",
  services: "⚡",
};

interface ARMarker {
  box: LootBox;
  distance: number;
  bearing: number; // degrees from north
  screenX: number; // 0-1 horizontal position
  screenY: number; // 0-1 vertical position
}

function getBearingDeg(
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
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

interface CameraARViewProps {
  lootBoxes: LootBox[];
  userLocation: UserLocation | null;
  onLootBoxTap: (box: LootBox) => void;
  compassHeading: number | null; // degrees from north, null if unavailable
}

function ARLootMarker({
  marker,
  onTap,
  screenWidth,
  screenHeight,
}: {
  marker: ARMarker;
  onTap: () => void;
  screenWidth: number;
  screenHeight: number;
}) {
  const { theme } = useTheme();
  const emoji = CATEGORY_EMOJI[marker.box.category || ""] || "📦";
  const isActive = marker.box.isActive;

  // Float animation
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(1, { duration: 2000 + Math.random() * 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Glow pulse
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const markerStyle = useAnimatedStyle(() => {
    const yOffset = interpolate(floatY.value, [0, 1], [-8, 8]);
    const scale = interpolate(glow.value, [0, 1], [0.95, 1.05]);
    return {
      transform: [{ translateY: yOffset }, { scale }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glow.value, [0, 1], [0.3, 0.7]);
    const s = interpolate(glow.value, [0, 1], [1, 1.4]);
    return { opacity, transform: [{ scale: s }] };
  });

  // Size based on distance — closer = bigger
  const sizeScale = Math.max(0.6, Math.min(1.3, 1.2 - marker.distance * 0.5));
  const markerSize = 60 * sizeScale;

  const left = marker.screenX * screenWidth - markerSize / 2;
  const top = marker.screenY * screenHeight - markerSize / 2;

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[
        arStyles.marker,
        {
          left,
          top,
          width: markerSize,
        },
        markerStyle,
      ]}
    >
      <Pressable onPress={onTap} style={arStyles.markerPressable}>
        {/* Glow ring behind */}
        {isActive && (
          <Animated.View
            style={[
              arStyles.glowRing,
              {
                width: markerSize * 1.4,
                height: markerSize * 1.4,
                borderRadius: markerSize * 0.7,
                backgroundColor: theme.primary + "30",
              },
              glowStyle,
            ]}
          />
        )}

        {/* Main marker */}
        <View
          style={[
            arStyles.markerBody,
            {
              width: markerSize * 0.8,
              height: markerSize * 0.8,
              borderRadius: markerSize * 0.25,
              backgroundColor: isActive
                ? theme.primary
                : theme.backgroundTertiary,
              ...Platform.select({
                web: isActive
                  ? { boxShadow: `0 4px 20px ${theme.primaryGlow}` }
                  : {},
                default: {},
              }),
            },
          ]}
        >
          <ThemedText style={{ fontSize: markerSize * 0.35 }}>{emoji}</ThemedText>
        </View>

        {/* Info label */}
        <View
          style={[
            arStyles.infoLabel,
            {
              backgroundColor: theme.backgroundDefault + "E0",
              ...Platform.select({
                web: { backdropFilter: "blur(8px)" },
                default: {},
              }),
            },
          ]}
        >
          <ThemedText
            style={[arStyles.labelName, { color: theme.text }]}
            numberOfLines={1}
          >
            {marker.box.businessName}
          </ThemedText>
          <ThemedText
            style={[
              arStyles.labelDistance,
              { color: isActive ? theme.accent : theme.textSecondary, fontFamily: Fonts?.mono },
            ]}
          >
            {formatDistance(marker.distance)}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function CameraARView({
  lootBoxes,
  userLocation,
  onLootBoxTap,
  compassHeading,
}: CameraARViewProps) {
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  // FOV for mapping bearings to screen positions
  const HORIZONTAL_FOV = 70; // degrees

  // Start camera
  useEffect(() => {
    if (Platform.OS !== "web") return;

    let stream: MediaStream | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: any) {
        setCameraError(err.message || "Camera access denied");
      }
    })();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Calculate AR marker positions
  const markers: ARMarker[] = React.useMemo(() => {
    if (!userLocation || compassHeading === null) return [];

    return lootBoxes
      .map((box) => {
        const distance = calculateDistance(userLocation, {
          latitude: box.latitude,
          longitude: box.longitude,
        });
        const bearing = getBearingDeg(
          userLocation.latitude,
          userLocation.longitude,
          box.latitude,
          box.longitude
        );

        // Calculate angle difference from compass heading
        let angleDiff = bearing - compassHeading;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;

        // Only show markers within our FOV
        if (Math.abs(angleDiff) > HORIZONTAL_FOV / 2 + 10) {
          return null;
        }

        // Map to screen position
        const screenX = 0.5 + angleDiff / HORIZONTAL_FOV;
        // Vertical: closer items are lower on screen (perspective)
        const screenY = 0.3 + Math.min(distance, 2) * 0.15;

        return { box, distance, bearing, screenX, screenY };
      })
      .filter((m): m is ARMarker => m !== null && m.distance < 2)
      .sort((a, b) => b.distance - a.distance); // Render far ones first
  }, [lootBoxes, userLocation, compassHeading]);

  if (Platform.OS !== "web") {
    return (
      <View style={[arStyles.fallback, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText style={{ fontSize: 48 }}>📸</ThemedText>
        <ThemedText type="h4">Camera AR</ThemedText>
        <ThemedText style={{ color: theme.textSecondary, textAlign: "center" }}>
          Camera AR is available on mobile web browsers
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[arStyles.container, { backgroundColor: "#000" }]}>
      {/* Camera feed */}
      {Platform.OS === "web" && (
        <video
          ref={videoRef as any}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          } as any}
          playsInline
          muted
        />
      )}

      {/* Camera error fallback */}
      {cameraError && (
        <View style={[arStyles.fallback, { backgroundColor: theme.backgroundRoot }]}>
          <ThemedText style={{ fontSize: 48 }}>📷</ThemedText>
          <ThemedText type="h4">Camera Unavailable</ThemedText>
          <ThemedText style={{ color: theme.textSecondary, textAlign: "center", paddingHorizontal: Spacing.xl }}>
            {cameraError}. Use the Radar view instead!
          </ThemedText>
        </View>
      )}

      {/* Compass heading unavailable */}
      {cameraActive && compassHeading === null && (
        <View style={arStyles.compassWarning}>
          <View
            style={[
              arStyles.compassPill,
              {
                backgroundColor: theme.backgroundDefault + "CC",
                ...Platform.select({
                  web: { backdropFilter: "blur(8px)" },
                  default: {},
                }),
              },
            ]}
          >
            <ThemedText style={{ color: theme.warning, fontSize: 13, fontWeight: "600" }}>
              🧭 Move your phone to calibrate compass
            </ThemedText>
          </View>
        </View>
      )}

      {/* AR markers */}
      {markers.map((marker) => (
        <ARLootMarker
          key={marker.box.id}
          marker={marker}
          onTap={() => onLootBoxTap(marker.box)}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
        />
      ))}

      {/* HUD overlay */}
      <View style={arStyles.hudTop}>
        <View
          style={[
            arStyles.hudPill,
            {
              backgroundColor: theme.backgroundDefault + "CC",
              ...Platform.select({
                web: { backdropFilter: "blur(8px)" },
                default: {},
              }),
            },
          ]}
        >
          <ThemedText style={[arStyles.hudText, { color: theme.text }]}>
            {markers.filter((m) => m.box.isActive).length} loot boxes in view
          </ThemedText>
        </View>
        {compassHeading !== null && (
          <View
            style={[
              arStyles.hudPill,
              {
                backgroundColor: theme.backgroundDefault + "CC",
                ...Platform.select({
                  web: { backdropFilter: "blur(8px)" },
                  default: {},
                }),
              },
            ]}
          >
            <ThemedText style={[arStyles.hudText, { color: theme.accent, fontFamily: Fonts?.mono }]}>
              🧭 {Math.round(compassHeading)}°
            </ThemedText>
          </View>
        )}
      </View>

      {/* Crosshair */}
      <View style={arStyles.crosshair} pointerEvents="none">
        <View style={[arStyles.crosshairLine, arStyles.crosshairH, { backgroundColor: theme.accent + "40" }]} />
        <View style={[arStyles.crosshairLine, arStyles.crosshairV, { backgroundColor: theme.accent + "40" }]} />
        <View style={[arStyles.crosshairDot, { borderColor: theme.accent + "60" }]} />
      </View>
    </View>
  );
}

const arStyles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  marker: {
    position: "absolute",
    alignItems: "center",
    zIndex: 5,
  },
  markerPressable: {
    alignItems: "center",
  },
  glowRing: {
    position: "absolute",
  },
  markerBody: {
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    marginTop: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    maxWidth: 120,
  },
  labelName: {
    fontSize: 11,
    fontWeight: "700",
  },
  labelDistance: {
    fontSize: 10,
    fontWeight: "600",
  },
  hudTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    zIndex: 10,
  },
  hudPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  hudText: {
    fontSize: 13,
    fontWeight: "700",
  },
  compassWarning: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  compassPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  crosshair: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  crosshairLine: {
    position: "absolute",
  },
  crosshairH: {
    width: 40,
    height: 1,
  },
  crosshairV: {
    width: 1,
    height: 40,
  },
  crosshairDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
});
