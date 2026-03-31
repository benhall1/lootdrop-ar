import React from "react";
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { BusinessLogo } from "./BusinessLogo";
import { useTheme } from "../hooks/useTheme";
import {
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
  WebShadows,
  Gradients,
} from "../constants/theme";
import { LootBox } from "../types";
import { formatDistance } from "../services/geolocation";

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "\u{1F355}",
  retail: "\u{1F6CD}\uFE0F",
  entertainment: "\u{1F3AE}",
  services: "\u26A1",
};

interface LootBoxSheetProps {
  visible: boolean;
  box: LootBox | null;
  distance: number;
  onClaim: () => void;
  onClose: () => void;
}

export function LootBoxSheet({
  visible,
  box,
  distance,
  onClaim,
  onClose,
}: LootBoxSheetProps) {
  const { theme } = useTheme();

  if (!box) return null;

  const emoji = CATEGORY_EMOJI[box.category || ""] || "\u{1F4E6}";
  const expiresAt = box.coupon.expiresAt;
  const now = Date.now();
  const msLeft = expiresAt - now;
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const hasExpiry = expiresAt > 0 && msLeft > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      {/* Sheet */}
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
            ...Platform.select({
              web: {
                boxShadow: `0 -8px 40px rgba(0, 0, 0, 0.5), ${WebShadows.neonOrange}`,
              },
              default: Shadows.cardGlow,
            }),
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.backgroundTertiary },
            ]}
          />
        </View>

        {/* Category emoji */}
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>

        {/* Business name */}
        <ThemedText
          type="h3"
          style={[styles.businessName, { fontFamily: Fonts?.display }]}
        >
          {box.businessName}
        </ThemedText>

        {/* Distance badge */}
        <View style={[styles.distanceBadge, { backgroundColor: theme.accent + "18" }]}>
          <Feather name="map-pin" size={14} color={theme.accent} />
          <ThemedText
            style={[
              styles.distanceText,
              { color: theme.accent, fontFamily: Fonts?.mono },
            ]}
          >
            {formatDistance(distance)} away
          </ThemedText>
        </View>

        {/* Coupon value */}
        <ThemedText
          style={[
            styles.couponValue,
            {
              color: theme.secondary,
              fontFamily: Fonts?.display,
              ...Platform.select({
                web: { textShadow: "0 0 20px rgba(255, 213, 79, 0.4)" },
                default: {},
              }),
            },
          ]}
        >
          {box.coupon.value}
        </ThemedText>

        {/* Coupon title */}
        <ThemedText
          style={[styles.couponTitle, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {box.coupon.title}
        </ThemedText>

        {/* Expiry info */}
        {hasExpiry && (
          <View style={styles.expiryRow}>
            <Feather name="clock" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.expiryText, { color: theme.textSecondary }]}>
              {daysLeft <= 1
                ? "Expires today"
                : `Expires in ${daysLeft} days`}
            </ThemedText>
          </View>
        )}

        {/* Claim button */}
        <Pressable
          onPress={onClaim}
          style={({ pressed }) => [
            styles.claimButton,
            {
              backgroundColor: theme.primary,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              ...Platform.select({
                web: {
                  boxShadow: WebShadows.neonOrange,
                  transition: "transform 0.12s ease, opacity 0.12s ease",
                },
                default: Shadows.glow,
              }),
            },
          ]}
        >
          <Feather name="gift" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <ThemedText style={styles.claimButtonText}>Claim This Deal</ThemedText>
        </Pressable>

        {/* Close text button */}
        <Pressable onPress={onClose} style={styles.closeButton}>
          <ThemedText style={[styles.closeButtonText, { color: theme.textSecondary }]}>
            Close
          </ThemedText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["4xl"],
    alignItems: "center",
  },
  handleRow: {
    width: "100%",
    alignItems: "center",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  businessName: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xl,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  couponValue: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  couponTitle: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.xl,
  },
  expiryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 56,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  claimButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  closeButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
