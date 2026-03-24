import React, { useEffect } from "react";
import { View, StyleSheet, Modal, Pressable, Platform } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { ClaimResult } from "../services/gamificationService";

interface ClaimCelebrationProps {
  visible: boolean;
  onClose: () => void;
  couponTitle: string;
  couponCode: string;
  couponValue: string;
  businessName: string;
  claimResult: ClaimResult | null;
}

export function ClaimCelebration({
  visible,
  onClose,
  couponTitle,
  couponCode,
  couponValue,
  businessName,
  claimResult,
}: ClaimCelebrationProps) {
  const { theme } = useTheme();

  // Chest bounce animation
  const chestScale = useSharedValue(0);
  const chestRotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      chestScale.value = withSequence(
        withSpring(1.3, { damping: 4, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 150 })
      );
      chestRotate.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    } else {
      chestScale.value = 0;
    }
  }, [visible]);

  const chestStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: chestScale.value },
      { rotate: `${chestRotate.value}deg` },
    ],
  }));

  // Sparkle particles
  const sparkles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 80 + Math.random() * 40;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      delay: i * 50,
      emoji: ["✨", "⭐", "💫", "🌟"][i % 4],
    };
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.overlay,
            {
              ...Platform.select({
                web: { backdropFilter: "blur(12px)" },
                default: {},
              }),
            },
          ]}
        />

        <View style={styles.content}>
          {/* Sparkle particles */}
          {sparkles.map((s, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.duration(600)
                .delay(200 + s.delay)
                .springify()
                .damping(6)}
              style={[
                styles.sparkle,
                { transform: [{ translateX: s.x }, { translateY: s.y }] },
              ]}
            >
              <ThemedText style={{ fontSize: 20 }}>{s.emoji}</ThemedText>
            </Animated.View>
          ))}

          {/* Chest icon */}
          <Animated.View style={[styles.chestContainer, chestStyle]}>
            <ThemedText style={styles.chestEmoji}>🎁</ThemedText>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.duration(500).delay(300)}>
            <ThemedText
              type="h2"
              style={[styles.title, { fontFamily: Fonts?.display }]}
            >
              Loot Claimed!
            </ThemedText>
          </Animated.View>

          {/* Coupon card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(500)}
            style={[
              styles.couponCard,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.primary + "40",
                ...Platform.select({
                  web: { boxShadow: `0 8px 32px ${theme.primaryGlow}` },
                  default: {},
                }),
              },
            ]}
          >
            <ThemedText style={[styles.businessName, { color: theme.textSecondary }]}>
              {businessName}
            </ThemedText>
            <ThemedText
              style={[
                styles.couponValue,
                { color: theme.secondary, fontFamily: Fonts?.display },
              ]}
            >
              {couponValue}
            </ThemedText>
            <ThemedText style={[styles.couponTitle, { color: theme.text }]}>
              {couponTitle}
            </ThemedText>
            <View style={[styles.codeBox, { borderColor: theme.border }]}>
              <ThemedText
                style={[styles.codeText, { color: theme.primary, fontFamily: Fonts?.mono }]}
              >
                {couponCode}
              </ThemedText>
            </View>
          </Animated.View>

          {/* XP events */}
          {claimResult && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(700)}
              style={styles.xpSection}
            >
              {claimResult.xpEvents.map((ev, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInUp.duration(300).delay(800 + i * 100)}
                  style={styles.xpRow}
                >
                  <ThemedText style={[styles.xpAmount, { color: theme.xpBar }]}>
                    +{ev.amount} XP
                  </ThemedText>
                  <ThemedText style={[styles.xpMessage, { color: theme.textSecondary }]}>
                    {ev.message}
                  </ThemedText>
                </Animated.View>
              ))}

              {claimResult.leveledUp && (
                <Animated.View
                  entering={FadeInUp.duration(400).delay(1000)}
                  style={[styles.levelUp, { backgroundColor: theme.secondary + "20" }]}
                >
                  <ThemedText style={[styles.levelUpText, { color: theme.secondary }]}>
                    🎉 LEVEL UP! → Lv.{claimResult.newLevel}
                  </ThemedText>
                </Animated.View>
              )}

              {claimResult.newBadges.map((badge, i) => (
                <Animated.View
                  key={badge.id}
                  entering={FadeInUp.duration(400).delay(1100 + i * 150)}
                  style={[styles.badgeUnlock, { backgroundColor: theme.primary + "15" }]}
                >
                  <ThemedText style={styles.badgeEmoji}>{badge.emoji}</ThemedText>
                  <View>
                    <ThemedText style={[styles.badgeName, { color: theme.primary }]}>
                      {badge.name}
                    </ThemedText>
                    <ThemedText style={[styles.badgeDesc, { color: theme.textSecondary }]}>
                      {badge.description}
                    </ThemedText>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Close button */}
          <Animated.View entering={FadeInUp.duration(400).delay(1000)}>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.closeBtnText}>Awesome!</ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 15, 26, 0.85)",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    zIndex: 1,
  },
  sparkle: {
    position: "absolute",
  },
  chestContainer: {
    marginBottom: Spacing.lg,
  },
  chestEmoji: {
    fontSize: 72,
  },
  title: {
    color: "#FFF",
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  couponCard: {
    width: "100%",
    maxWidth: 300,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  businessName: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  couponValue: {
    fontSize: 32,
    fontWeight: "800",
  },
  couponTitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  codeBox: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: BorderRadius.sm,
  },
  codeText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
  xpSection: {
    width: "100%",
    maxWidth: 300,
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  xpAmount: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: Fonts?.mono,
    minWidth: 60,
  },
  xpMessage: {
    fontSize: 13,
    fontWeight: "600",
  },
  levelUp: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  levelUpText: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: Fonts?.display,
  },
  badgeUnlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: "800",
  },
  badgeDesc: {
    fontSize: 12,
  },
  closeBtn: {
    paddingHorizontal: Spacing["3xl"],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  closeBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
