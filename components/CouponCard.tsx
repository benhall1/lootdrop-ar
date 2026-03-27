import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { BusinessLogo } from "./BusinessLogo";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Typography, Shadows, Fonts, WebShadows, Gradients } from "../constants/theme";
import { CollectedCoupon } from "../types";

interface CouponCardProps {
  coupon: CollectedCoupon;
  onPress?: () => void;
}

export function CouponCard({ coupon, onPress }: CouponCardProps) {
  const { theme } = useTheme();
  const isExpired = coupon.expiresAt < Date.now();
  const expiresIn = Math.floor((coupon.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

  const statusColor = coupon.isUsed
    ? theme.textSecondary
    : isExpired
    ? theme.error
    : theme.success;

  const statusText = coupon.isUsed ? "USED" : isExpired ? "EXPIRED" : `${expiresIn}d LEFT`;
  const statusIcon = coupon.isUsed ? "check" : isExpired ? "x" : "clock";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: coupon.isUsed ? theme.border : theme.primary + "30",
          opacity: pressed ? 0.85 : coupon.isUsed ? 0.5 : 1,
          ...Platform.select({
            web: !coupon.isUsed && !isExpired
              ? {
                  background: `${Gradients.web.cardSheen}, ${theme.backgroundDefault}`,
                  boxShadow: WebShadows.card,
                  transition: "transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease",
                }
              : {
                  boxShadow: WebShadows.insetGlow,
                  transition: "opacity 0.2s ease",
                },
            default: !coupon.isUsed && !isExpired ? Shadows.card : {},
          }),
        },
      ]}
    >
      {/* Decorative notch cutouts */}
      <View style={[styles.notchLeft, { backgroundColor: theme.backgroundRoot }]} />
      <View style={[styles.notchRight, { backgroundColor: theme.backgroundRoot }]} />

      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <BusinessLogo
            businessName={coupon.businessName}
            logoUrl={coupon.businessLogo}
            size={44}
          />
          <View style={styles.headerInfo}>
            <ThemedText
              style={[styles.businessName, { color: theme.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {coupon.businessName}
            </ThemedText>
            <ThemedText
              type="h4"
              style={styles.couponTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {coupon.title}
            </ThemedText>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
            <Feather name={statusIcon as any} size={12} color={statusColor} />
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Perforated line */}
      <View style={styles.perforation}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[styles.perfDot, { backgroundColor: theme.border }]}
          />
        ))}
      </View>

      <View style={styles.bottomSection}>
        <ThemedText
          style={[styles.value, { color: theme.primary, fontFamily: Fonts?.display }]}
        >
          {coupon.value}
        </ThemedText>
        <View style={[styles.codeBox, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <ThemedText
            style={[styles.codeText, { color: theme.text, fontFamily: Fonts?.mono }]}
          >
            {coupon.code}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  notchLeft: {
    position: "absolute",
    left: -10,
    top: "50%",
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 2,
  },
  notchRight: {
    position: "absolute",
    right: -10,
    top: "50%",
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 2,
  },
  topSection: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  businessName: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  couponTitle: {
    fontSize: 17,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  perforation: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginVertical: 2,
  },
  perfDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  value: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  codeBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  codeText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
