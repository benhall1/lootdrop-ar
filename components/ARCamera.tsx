import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, Platform, Pressable, Modal } from "react-native";
import { Camera, CameraView } from "expo-camera";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { BusinessLogo } from "./BusinessLogo";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import { LootBox } from "../types";

interface ARCameraProps {
  nearbyLootBoxes: LootBox[];
  onLootBoxTap: (lootBox: LootBox) => void;
}

function LootBoxPrizeModal({ 
  visible, 
  lootBox, 
  onClose 
}: { 
  visible: boolean; 
  lootBox: LootBox | null; 
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(0);
  const confettiScale = useSharedValue(0);
  const confettiRotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      confettiScale.value = withSequence(
        withTiming(1.5, { duration: 500 }),
        withTiming(1, { duration: 300 })
      );
      confettiRotate.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      scale.value = 0;
      confettiScale.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: confettiScale.value },
      { rotate: `${confettiRotate.value}deg` }
    ],
  }));

  if (!lootBox) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent, 
            { backgroundColor: theme.backgroundDefault },
            animatedStyle
          ]}
        >
          <Animated.View style={[styles.confettiContainer, confettiStyle]}>
            <Text style={styles.confettiEmoji}>🎉</Text>
            <Text style={styles.confettiEmoji}>✨</Text>
            <Text style={styles.confettiEmoji}>🎁</Text>
          </Animated.View>

          <View style={styles.prizeHeader}>
            <BusinessLogo
              businessName={lootBox.businessName}
              logoUrl={lootBox.businessLogo}
              size={60}
            />
          </View>

          <ThemedText type="h2" style={styles.congratsText}>
            Loot Claimed!
          </ThemedText>

          <View style={[styles.couponCard, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText type="h3" style={styles.couponTitle}>
              {lootBox.coupon.title}
            </ThemedText>
            <ThemedText style={[styles.couponDescription, { color: theme.textSecondary }]}>
              {lootBox.coupon.description}
            </ThemedText>
            <View style={[styles.couponCode, { backgroundColor: theme.primary + "20" }]}>
              <ThemedText style={[styles.couponCodeText, { color: theme.primary }]}>
                CODE: {lootBox.coupon.code}
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={styles.closeButtonText}>Awesome!</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

function AnimatedLootBox({
  lootBox,
  horizontalPosition,
  verticalPosition,
  onTap,
  theme,
}: {
  lootBox: LootBox;
  horizontalPosition: number;
  verticalPosition: number;
  onTap: () => void;
  theme: any;
}) {
  const float = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value },
      { scale: pulse.value }
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value - 0.5,
  }));

  return (
    <Pressable
      onPress={onTap}
      style={[
        styles.arLootBox,
        {
          left: `${horizontalPosition}%`,
          top: `${verticalPosition}%`,
        },
      ]}
    >
      <Animated.View style={floatStyle}>
        <View
          style={[
            styles.lootBoxIcon,
            {
              backgroundColor: lootBox.isActive ? theme.primary : theme.backgroundSecondary,
              borderColor: theme.primary,
              borderWidth: 2,
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
          <Animated.View 
            style={[
              styles.activePulse, 
              { borderColor: theme.primary },
              glowStyle
            ]} 
          />
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
            Tap to Claim!
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function ARCamera({ nearbyLootBoxes, onLootBoxTap }: ARCameraProps) {
  const { theme } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showPrize, setShowPrize] = useState(false);
  const [selectedLootBox, setSelectedLootBox] = useState<LootBox | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleLootBoxTap = (lootBox: LootBox) => {
    if (lootBox.isActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedLootBox(lootBox);
      setShowPrize(true);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleClosePrize = () => {
    setShowPrize(false);
    if (selectedLootBox) {
      onLootBoxTap(selectedLootBox);
    }
    setTimeout(() => setSelectedLootBox(null), 300);
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

  const activeLootBoxes = nearbyLootBoxes.filter(box => box.isActive).slice(0, 1);

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back">
        {activeLootBoxes.length > 0 ? (
          activeLootBoxes.map((lootBox, index) => {
            const horizontalPosition = 50;
            const verticalPosition = 40;

            return (
              <AnimatedLootBox
                key={lootBox.id}
                lootBox={lootBox}
                horizontalPosition={horizontalPosition}
                verticalPosition={verticalPosition}
                onTap={() => handleLootBoxTap(lootBox)}
                theme={theme}
              />
            );
          })
        ) : (
          <View style={styles.noLootBoxes}>
            <Feather name="gift" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.noLootBoxesText, { color: theme.textSecondary }]}>
              No loot boxes nearby
            </ThemedText>
            <ThemedText style={[styles.noLootBoxesSubtext, { color: theme.textSecondary }]}>
              Check the Map tab to find loot drops
            </ThemedText>
          </View>
        )}
      </CameraView>

      <LootBoxPrizeModal
        visible={showPrize}
        lootBox={selectedLootBox}
        onClose={handleClosePrize}
      />
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
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  activePulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
  },
  lootBoxLabel: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  noLootBoxes: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  noLootBoxesText: {
    marginTop: Spacing.md,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  noLootBoxesSubtext: {
    marginTop: Spacing.sm,
    fontSize: 14,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  confettiContainer: {
    position: "absolute",
    top: -40,
    flexDirection: "row",
    gap: Spacing.md,
  },
  confettiEmoji: {
    fontSize: 40,
  },
  prizeHeader: {
    marginBottom: Spacing.lg,
  },
  congratsText: {
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  couponCard: {
    width: "100%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  couponTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  couponDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  couponCode: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  couponCodeText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
  },
  closeButton: {
    width: "100%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
