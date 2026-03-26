import React, { useState, useEffect } from "react";
import { View, StyleSheet, Modal, Pressable, Image, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "./ThemedText";
import { BusinessLogo } from "./BusinessLogo";
import { CountdownTimer } from "./CountdownTimer";
import { Button } from "./Button";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts, WebShadows, Gradients } from "../constants/theme";
import { CollectedCoupon } from "../types";
import QRCode from "qrcode";

interface Props {
  visible: boolean;
  coupon: CollectedCoupon | null;
  onClose: () => void;
  onMarkUsed: (couponId: string) => void;
}

export function RedemptionModal({ visible, coupon, onClose, onMarkUsed }: Props) {
  const { theme } = useTheme();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!coupon) return;
    const payload = JSON.stringify({ claimId: coupon.id, code: coupon.code, v: 1 });
    QRCode.toDataURL(payload, {
      width: 200,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [coupon]);

  if (!coupon) return null;

  const isExpired = coupon.expiresAt < Date.now();
  const isUsed = coupon.isUsed;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
          <ThemedText type="h3">Redeem Coupon</ThemedText>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>

        <Animated.ScrollView
          entering={FadeInDown.duration(400)}
          contentContainerStyle={styles.content}
        >
          {/* Business */}
          <View style={styles.businessRow}>
            <BusinessLogo businessName={coupon.businessName} logoUrl={coupon.businessLogo} size={48} />
            <ThemedText type="h4">{coupon.businessName}</ThemedText>
          </View>

          {/* Value badge */}
          <View style={[styles.valueBadge, {
            backgroundColor: theme.primary,
            ...Platform.select({
              web: { boxShadow: WebShadows.neonOrange },
              default: {},
            }),
          }]}>
            <ThemedText style={styles.valueText}>{coupon.value}</ThemedText>
          </View>

          <ThemedText type="h4" style={{ textAlign: "center" }}>{coupon.title}</ThemedText>
          <ThemedText style={[styles.desc, { color: theme.textSecondary }]}>{coupon.description}</ThemedText>

          {/* QR Code */}
          {qrDataUrl && !isUsed && !isExpired && (
            <View style={[styles.qrContainer, { backgroundColor: "#FFF", borderColor: theme.border }]}>
              <Image source={{ uri: qrDataUrl }} style={styles.qrImage} />
            </View>
          )}

          {/* Instruction */}
          {!isUsed && !isExpired && (
            <View style={[styles.instruction, { backgroundColor: theme.accent + "10", borderColor: theme.accent + "30" }]}>
              <Feather name="smartphone" size={18} color={theme.accent} />
              <ThemedText style={[styles.instructionText, { color: theme.accent }]}>
                Show this screen to the cashier
              </ThemedText>
            </View>
          )}

          {/* Coupon Code */}
          <View style={[styles.codeBox, { borderColor: theme.primary + "40" }]}>
            <ThemedText style={[styles.codeLabel, { color: theme.textSecondary }]}>COUPON CODE</ThemedText>
            <ThemedText style={[styles.codeText, { color: theme.primary }]}>{coupon.code}</ThemedText>
          </View>

          {/* Countdown */}
          {!isUsed && !isExpired && (
            <View style={styles.timerRow}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
                Expires in{" "}
              </ThemedText>
              <CountdownTimer expiresAt={coupon.expiresAt} />
            </View>
          )}

          {/* Status */}
          {isUsed && (
            <View style={[styles.statusBadge, { backgroundColor: theme.textSecondary + "15" }]}>
              <Feather name="check-circle" size={18} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, fontWeight: "700" }}>
                Already Redeemed
              </ThemedText>
            </View>
          )}
          {isExpired && !isUsed && (
            <View style={[styles.statusBadge, { backgroundColor: theme.error + "15" }]}>
              <Feather name="x-circle" size={18} color={theme.error} />
              <ThemedText style={{ color: theme.error, fontWeight: "700" }}>
                Expired
              </ThemedText>
            </View>
          )}

          {/* Mark as Used button */}
          {!isUsed && !isExpired && (
            <Button
              title="Mark as Used"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onMarkUsed(coupon.id);
              }}
              variant="outline"
            />
          )}

          {/* Claim ID for merchant verification */}
          <View style={styles.claimIdRow}>
            <ThemedText style={[styles.claimIdLabel, { color: theme.textSecondary }]}>
              Claim ID
            </ThemedText>
            <ThemedText style={[styles.claimIdValue, { color: theme.textSecondary }]}>
              {coupon.id}
            </ThemedText>
          </View>
        </Animated.ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    alignItems: "center",
    paddingBottom: Spacing["4xl"],
  },
  businessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  valueBadge: {
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  valueText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: Fonts?.display,
    letterSpacing: 1,
  },
  desc: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
  },
  qrContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  instruction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: "100%",
    justifyContent: "center",
  },
  instructionText: {
    fontWeight: "700",
    fontSize: 14,
  },
  codeBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.xs,
    width: "100%",
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 28,
    fontWeight: "900",
    fontFamily: Fonts?.mono,
    letterSpacing: 2,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: "100%",
    justifyContent: "center",
  },
  claimIdRow: {
    alignItems: "center",
    gap: 2,
    marginTop: Spacing.lg,
  },
  claimIdLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  claimIdValue: {
    fontSize: 10,
    fontFamily: Fonts?.mono,
  },
});
