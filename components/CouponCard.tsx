import React from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { ThemedText } from "./ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { CollectedCoupon } from "../types";

interface CouponCardProps {
  coupon: CollectedCoupon;
  onPress?: () => void;
}

type Rarity = "common" | "rare" | "epic" | "legendary";

const RARITY: Record<Rarity, { c: string; g: string; label: string }> = {
  legendary: { c: "#FFD54F", g: "rgba(255,213,79,0.5)", label: "★ LEGENDARY" },
  epic: { c: "#C77DFF", g: "rgba(199,125,255,0.5)", label: "★ EPIC" },
  rare: { c: "#00E5FF", g: "rgba(0,229,255,0.5)", label: "RARE" },
  common: { c: "#8E96C8", g: "rgba(142,150,200,0.4)", label: "COMMON" },
};

const PALETTE = ["#FF6D3A", "#9D4EDD", "#00B8D4", "#34D399", "#E89B5E", "#FF3DCB"];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function deriveRarity(coupon: CollectedCoupon): Rarity {
  if (coupon.discountType === "percentage") {
    const v = parseFloat(coupon.value.replace(/[^\d.]/g, "")) || 0;
    if (v >= 50) return "legendary";
    if (v >= 25) return "epic";
    return "rare";
  }
  if (coupon.discountType === "freeItem") return "epic";
  if (coupon.discountType === "fixed") {
    const v = parseFloat(coupon.value.replace(/[^\d.]/g, "")) || 0;
    if (v >= 20) return "epic";
    return "rare";
  }
  return "common";
}

function shortLogo(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CouponCard({ coupon, onPress }: CouponCardProps) {
  const { theme } = useTheme();
  const isExpired = coupon.expiresAt < Date.now();
  const expiresIn = Math.max(0, Math.floor((coupon.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
  const rarity = deriveRarity(coupon);
  const r = RARITY[rarity];
  const color = hashColor(coupon.businessName);
  const dimmed = coupon.isUsed || isExpired;
  const statusLabel = coupon.isUsed
    ? "REDEEMED"
    : isExpired
    ? "EXPIRED"
    : `EXP ${expiresIn}d`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.outer,
        {
          opacity: pressed ? 0.9 : 1,
          transform: pressed ? [{ translateY: 1 }] : undefined,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            borderColor: dimmed ? theme.border : r.c + "66",
            ...Platform.select({
              web: {
                background: dimmed
                  ? "linear-gradient(135deg, #232A4D 0%, #181D38 130%)"
                  : `linear-gradient(135deg, ${color} 0%, ${color}cc 50%, #181D38 130%)`,
                boxShadow: dimmed
                  ? "0 4px 0 #0a0d1c"
                  : `0 4px 0 #0a0d1c, 0 0 24px ${r.g}, inset 0 2px 0 rgba(255,255,255,0.2)`,
                filter: dimmed ? "grayscale(0.7) brightness(0.6)" : undefined,
              },
              default: {
                backgroundColor: dimmed ? theme.backgroundSecondary : color,
              },
            }),
          },
        ]}
      >
        {/* Shine overlay */}
        {!dimmed && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              Platform.select({
                web: {
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.1) 100%)",
                } as any,
                default: { opacity: 0 },
              }) as any,
            ]}
          />
        )}

        {/* Notch cutouts */}
        <View
          style={[
            styles.notchLeft,
            { backgroundColor: theme.backgroundRoot },
          ]}
        />
        <View
          style={[
            styles.notchRight,
            { backgroundColor: theme.backgroundRoot },
          ]}
        />

        {/* Perforation */}
        <View style={styles.perforation}>
          {Array.from({ length: 24 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.perfDot,
                { backgroundColor: "rgba(255,255,255,0.4)" },
              ]}
            />
          ))}
        </View>

        {/* Top: rarity tag + logo */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.logo,
              {
                ...Platform.select({
                  web: {
                    background: "rgba(255,255,255,0.25)",
                    backdropFilter: "blur(8px)",
                  } as any,
                  default: { backgroundColor: "rgba(255,255,255,0.25)" },
                }) as any,
              },
            ]}
          >
            <ThemedText
              style={[styles.logoText, { fontFamily: Fonts?.display }]}
            >
              {shortLogo(coupon.businessName)}
            </ThemedText>
          </View>
          <View
            style={[
              styles.rarityTag,
              {
                borderColor: r.c + "66",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.rarityText,
                { color: r.c, fontFamily: Fonts?.sans },
              ]}
            >
              {r.label}
            </ThemedText>
          </View>
        </View>

        {/* Big deal value */}
        <ThemedText
          style={[styles.deal, { fontFamily: Fonts?.display }]}
          numberOfLines={1}
        >
          {coupon.value}
        </ThemedText>
        <ThemedText style={styles.sub} numberOfLines={1}>
          {coupon.title}
        </ThemedText>

        {/* Status overlay */}
        {dimmed && (
          <View
            style={[
              styles.statusStamp,
              {
                backgroundColor: coupon.isUsed
                  ? "rgba(52,211,153,0.9)"
                  : "rgba(255,85,119,0.9)",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.statusStampText,
                { fontFamily: Fonts?.display },
              ]}
            >
              {coupon.isUsed ? "REDEEMED" : "EXPIRED"}
            </ThemedText>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerRow}>
          <ThemedText
            style={[
              styles.businessName,
              { fontFamily: Fonts?.sans },
            ]}
            numberOfLines={1}
          >
            {coupon.businessName}
          </ThemedText>
          <ThemedText
            style={[
              styles.expiry,
              { fontFamily: Fonts?.mono },
            ]}
          >
            {statusLabel}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: Spacing.lg,
  },
  card: {
    position: "relative",
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    overflow: "hidden",
    minHeight: 180,
  },
  notchLeft: {
    position: "absolute",
    left: -10,
    bottom: 56,
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 2,
  },
  notchRight: {
    position: "absolute",
    right: -10,
    bottom: 56,
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 2,
  },
  perforation: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    opacity: 0.7,
  },
  perfDot: {
    width: 4,
    height: 1.5,
    borderRadius: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    zIndex: 3,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  rarityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  deal: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1.5,
    lineHeight: 44,
    marginTop: Spacing.lg,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  sub: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 2,
  },
  statusStamp: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 4,
    zIndex: 5,
    transform: [{ rotate: "-12deg" }],
  },
  statusStampText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
    paddingTop: 24,
    zIndex: 3,
  },
  businessName: {
    flex: 1,
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  expiry: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "700",
  },
});
