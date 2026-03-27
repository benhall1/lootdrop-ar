import React, { useEffect } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { useTheme } from "../hooks/useTheme";
import { ThemedText } from "./ThemedText";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";

interface DailyBonusModalProps {
  visible: boolean;
  xp: number;
  streak: number;
  onClose: () => void;
}

export function DailyBonusModal({ visible, xp, streak, onClose }: DailyBonusModalProps) {
  const { theme } = useTheme();

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.secondary + "40" }]}
        >
          <Animated.View entering={FadeIn.duration(600).delay(200)}>
            <ThemedText style={styles.emoji}>🌟</ThemedText>
          </Animated.View>
          <ThemedText type="h3" style={{ fontFamily: Fonts?.display, textAlign: "center" }}>
            Welcome Back!
          </ThemedText>
          <ThemedText style={[styles.xpText, { color: theme.secondary }]}>
            +{xp} XP
          </ThemedText>
          {streak > 1 && (
            <ThemedText style={[styles.streakText, { color: theme.textSecondary }]}>
              {streak}-day streak 🔥
            </ThemedText>
          )}
          <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
            Open the app daily to earn bonus XP!
          </ThemedText>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  xpText: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: Fonts?.display,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
