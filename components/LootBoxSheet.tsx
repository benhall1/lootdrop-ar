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
import { Chest3D, ChestRarity } from "./Chest3D";
import { useTheme } from "../hooks/useTheme";
import {
  Spacing,
  BorderRadius,
  Fonts,
  Shadows,
  WebShadows,
} from "../constants/theme";
import { LootBox } from "../types";
import { formatDistance } from "../services/geolocation";

interface LootBoxSheetProps {
  visible: boolean;
  box: LootBox | null;
  distance: number;
  onClaim: () => void;
  onClose: () => void;
}

function rarityForDistance(distance: number, value: string): ChestRarity {
  const v = parseFloat(value.replace(/[^\d.]/g, "")) || 0;
  if (v >= 50) return "gold";
  if (v >= 25) return "epic";
  if (v >= 10) return "silver";
  return "bronze";
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

  const rarity = rarityForDistance(distance, box.coupon.value);
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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>

      <View
        style={[
          styles.sheet,
          {
            ...Platform.select({
              web: {
                background:
                  "linear-gradient(180deg, #181D38 0%, #0F1326 100%)",
                borderColor: "#353d6e",
                boxShadow: `0 -8px 40px rgba(0, 0, 0, 0.6), ${WebShadows.neonOrange}`,
              } as any,
              default: {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                ...Shadows.cardGlow,
              },
            }) as any,
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View
            style={[
              styles.handle,
              { backgroundColor: "rgba(255,255,255,0.2)" },
            ]}
          />
        </View>

        {/* Glow halo behind chest */}
        <View
          pointerEvents="none"
          style={[
            styles.haloGlow,
            Platform.select({
              web: {
                background:
                  "radial-gradient(circle, rgba(255,213,79,0.45), transparent 65%)",
              } as any,
              default: {},
            }) as any,
          ]}
        />

        {/* Chest */}
        <View style={styles.chestWrap}>
          <Chest3D size={120} rarity={rarity} floating={visible} />
        </View>

        {/* Rarity tag */}
        <View
          style={[
            styles.rarityTag,
            { borderColor: theme.secondary + "66" },
          ]}
        >
          <ThemedText
            style={[
              styles.rarityText,
              { color: theme.secondary, fontFamily: Fonts?.sans },
            ]}
          >
            ★ {rarity.toUpperCase()} DROP
          </ThemedText>
        </View>

        {/* Business name */}
        <ThemedText
          type="h3"
          style={[styles.businessName, { fontFamily: Fonts?.display }]}
        >
          {box.businessName}
        </ThemedText>

        {/* Distance badge */}
        <View
          style={[
            styles.distanceBadge,
            { backgroundColor: theme.accent + "18", borderColor: theme.accent + "55" },
          ]}
        >
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

        {/* Coupon value (huge) */}
        <ThemedText
          style={[
            styles.couponValue,
            {
              color: theme.secondary,
              fontFamily: Fonts?.display,
              ...Platform.select({
                web: {
                  textShadow:
                    "0 4px 0 rgba(0,0,0,0.4), 0 0 24px rgba(255, 213, 79, 0.55)",
                },
                default: {},
              }),
            } as any,
          ]}
        >
          {box.coupon.value}
        </ThemedText>

        <ThemedText
          style={[styles.couponTitle, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {box.coupon.title}
        </ThemedText>

        {hasExpiry && (
          <View style={styles.expiryRow}>
            <Feather name="clock" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.expiryText, { color: theme.textSecondary }]}>
              {daysLeft <= 1 ? "Expires today" : `Expires in ${daysLeft} days`}
            </ThemedText>
          </View>
        )}

        {/* Claim button */}
        <Pressable
          onPress={onClaim}
          style={({ pressed }) => [
            styles.claimButton,
            {
              opacity: pressed ? 0.92 : 1,
              transform: [{ translateY: pressed ? 3 : 0 }],
              ...Platform.select({
                web: {
                  background:
                    "linear-gradient(180deg, #FFE082 0%, #FFD54F 50%, #FFB300 100%)",
                  borderWidth: 1.5,
                  borderColor: "#FFECB3",
                  boxShadow: pressed
                    ? "inset 0 2px 0 rgba(255,255,255,0.4), 0 2px 0 #B8860B, 0 4px 12px rgba(255,213,79,0.4)"
                    : "inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -3px 0 rgba(0,0,0,0.18), 0 5px 0 #B8860B, 0 10px 24px rgba(255,213,79,0.5)",
                } as any,
                default: {
                  backgroundColor: theme.secondary,
                  ...Shadows.goldGlow,
                },
              }) as any,
            },
          ]}
        >
          <Feather name="gift" size={20} color="#5A3F00" style={{ marginRight: 8 }} />
          <ThemedText
            style={[styles.claimButtonText, { fontFamily: Fonts?.display }]}
          >
            CLAIM THIS LOOT
          </ThemedText>
        </Pressable>

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
    backgroundColor: "rgba(7, 9, 26, 0.75)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["4xl"],
    alignItems: "center",
  },
  handleRow: {
    width: "100%",
    alignItems: "center",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  haloGlow: {
    position: "absolute",
    top: 24,
    width: 240,
    height: 240,
    alignSelf: "center",
    borderRadius: 120,
  },
  chestWrap: {
    height: 130,
    width: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  rarityTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    backgroundColor: "rgba(0,0,0,0.3)",
    marginBottom: Spacing.sm,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  businessName: {
    textAlign: "center",
    marginBottom: Spacing.sm,
    fontSize: 24,
    letterSpacing: 0.5,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "700",
  },
  couponValue: {
    fontSize: 56,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: Spacing.xs,
    lineHeight: 56,
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
    marginBottom: Spacing.lg,
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
    borderRadius: 18,
    marginTop: Spacing.sm,
  },
  claimButtonText: {
    color: "#5A3F00",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.5,
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
