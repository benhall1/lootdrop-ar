import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Typography, Shadows } from "../constants/theme";
import { CollectedCoupon } from "../types";

interface CouponCardProps {
  coupon: CollectedCoupon;
  onPress?: () => void;
}

export function CouponCard({ coupon, onPress }: CouponCardProps) {
  const { theme } = useTheme();
  const isExpired = coupon.expiresAt < Date.now();
  const expiresIn = Math.floor((coupon.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: coupon.isUsed ? theme.border : theme.primary,
          opacity: pressed ? 0.8 : 1,
        },
        Shadows.card,
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: theme.backgroundSecondary,
            },
          ]}
        >
          <Feather name="gift" size={20} color={theme.primary} />
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: coupon.isUsed
                ? theme.border
                : isExpired
                  ? theme.error
                  : theme.success,
            },
          ]}
        >
          <ThemedText style={styles.badgeText}>
            {coupon.isUsed ? "USED" : isExpired ? "EXPIRED" : `${expiresIn}d`}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="h3" style={styles.title} numberOfLines={1}>
        {coupon.title}
      </ThemedText>
      <ThemedText
        style={[styles.business, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        {coupon.businessName}
      </ThemedText>

      <View style={styles.footer}>
        <ThemedText
          style={[styles.value, { color: theme.primary }]}
          numberOfLines={1}
        >
          {coupon.value}
        </ThemedText>
        <ThemedText
          style={[styles.code, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {coupon.code}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF",
  },
  title: {
    marginBottom: Spacing.xs,
  },
  business: {
    fontSize: Typography.caption.fontSize,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  value: {
    fontSize: Typography.h3.fontSize,
    fontWeight: "700",
  },
  code: {
    fontSize: Typography.caption.fontSize,
    fontFamily: "monospace",
  },
});
