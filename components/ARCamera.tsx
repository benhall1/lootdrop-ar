import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Camera, CameraView } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";
import { BusinessLogo } from "./BusinessLogo";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import { LootBox } from "../types";

interface ARCameraProps {
  nearbyLootBoxes: LootBox[];
  onLootBoxTap: (lootBox: LootBox) => void;
}

export function ARCamera({ nearbyLootBoxes, onLootBoxTap }: ARCameraProps) {
  const { theme } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleLootBoxTap = (lootBox: LootBox) => {
    if (lootBox.isActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLootBoxTap(lootBox);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ThemedText>Requesting camera permission...</ThemedText>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Feather name="camera-off" size={64} color={theme.textSecondary} />
        <ThemedText style={[styles.noPermissionText, { color: theme.textSecondary }]}>
          Camera permission denied
        </ThemedText>
        <ThemedText style={[styles.noPermissionSubtext, { color: theme.textSecondary }]}>
          Enable camera access in Settings to use AR features
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        {nearbyLootBoxes.slice(0, 3).map((lootBox, index) => {
          const horizontalPosition = 20 + index * 30;
          const verticalPosition = 30 + index * 25;

          return (
            <View
              key={lootBox.id}
              style={[
                styles.arLootBox,
                {
                  left: `${horizontalPosition}%`,
                  top: `${verticalPosition}%`,
                },
              ]}
              onTouchEnd={() => handleLootBoxTap(lootBox)}
            >
              <View
                style={[
                  styles.lootBoxIcon,
                  {
                    backgroundColor: lootBox.isActive ? theme.primary : theme.backgroundSecondary,
                  },
                ]}
              >
                <BusinessLogo
                  businessName={lootBox.businessName}
                  logoUrl={lootBox.businessLogo}
                  size={50}
                />
              </View>

              {lootBox.isActive && (
                <View style={[styles.activePulse, { borderColor: theme.primary }]} />
              )}

              <View
                style={[
                  styles.lootBoxLabel,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.labelText, { color: theme.text }]} numberOfLines={1}>
                  {lootBox.businessName}
                </Text>
              </View>
            </View>
          );
        })}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  noPermissionText: {
    marginTop: Spacing.lg,
    fontSize: 18,
    fontWeight: "600",
  },
  noPermissionSubtext: {
    marginTop: Spacing.sm,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  arLootBox: {
    position: "absolute",
    alignItems: "center",
  },
  lootBoxIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  activePulse: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    opacity: 0.5,
  },
  lootBoxLabel: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    maxWidth: 120,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
