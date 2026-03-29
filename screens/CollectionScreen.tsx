import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, Alert, Platform, RefreshControl } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { CouponCard } from "../components/CouponCard";
import { RedemptionModal } from "../components/RedemptionModal";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts, WebShadows, Gradients } from "../constants/theme";
import { StorageService } from "../services/storageService";
import { ClaimService } from "../services/claimService";
import { isSupabaseConfigured } from "../services/supabaseClient";
import { CollectedCoupon } from "../types";

export default function CollectionScreen() {
  const { theme } = useTheme();
  const [coupons, setCoupons] = useState<CollectedCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CollectedCoupon | null>(null);
  const [showRedemption, setShowRedemption] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadCoupons();
    }, [])
  );

  const loadCoupons = async () => {
    // Use Supabase when configured, fall back to local storage
    if (isSupabaseConfigured) {
      const claimed = await ClaimService.getClaimedCoupons();
      if (claimed.length > 0) {
        setCoupons(claimed);
        return;
      }
    }
    const collected = await StorageService.getCollectedCoupons();
    setCoupons(collected);
  };

  const activeCoupons = coupons.filter(
    (c) => !c.isUsed && c.expiresAt > Date.now()
  );
  const expiredCoupons = coupons.filter((c) => c.expiresAt <= Date.now());
  const usedCoupons = coupons.filter((c) => c.isUsed);

  const totalSavings = coupons.reduce((sum, coupon) => {
    if (coupon.discountType === "fixed" && !coupon.isUsed) {
      const value = parseFloat(coupon.value.replace("$", ""));
      return sum + value;
    }
    return sum;
  }, 0);

  const handleCouponPress = (coupon: CollectedCoupon) => {
    setSelectedCoupon(coupon);
    setShowRedemption(true);
  };

  const handleMarkUsed = async (couponId: string) => {
    if (isSupabaseConfigured) {
      await ClaimService.markAsUsed(couponId);
    } else {
      await StorageService.markCouponAsUsed(couponId);
    }
    setShowRedemption(false);
    setSelectedCoupon(null);
    await loadCoupons();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCoupons();
    setRefreshing(false);
  }, []);

  return (
    <>
    <ScreenScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      {/* Hero stats */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.primary + "20",
              ...Platform.select({
                web: {
                  background: `${Gradients.web.cardSheen}, ${theme.backgroundDefault}`,
                  boxShadow: WebShadows.sectionCard,
                },
                default: {},
              }),
            },
          ]}
        >
          <View style={styles.statItem}>
            <ThemedText style={{ fontSize: 20 }}>🎁</ThemedText>
            <ThemedText type="h2" style={{ fontFamily: Fonts?.display }}>{coupons.length}</ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: theme.textSecondary }]}
            >
              Collected
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText style={{ fontSize: 20 }}>💰</ThemedText>
            <ThemedText type="h2" style={{ color: theme.success, fontFamily: Fonts?.display }}>
              ${totalSavings}
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: theme.textSecondary }]}
            >
              Savings
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <ThemedText style={{ fontSize: 20 }}>⚡</ThemedText>
            <ThemedText type="h2" style={{ fontFamily: Fonts?.display }}>{activeCoupons.length}</ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: theme.textSecondary }]}
            >
              Active
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      {activeCoupons.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="check-circle" size={20} color={theme.success} />
            <ThemedText type="h3" style={styles.sectionTitle}>
              Active Coupons
            </ThemedText>
          </View>
          {activeCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onPress={() => handleCouponPress(coupon)}
            />
          ))}
        </View>
      )}

      {usedCoupons.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="check" size={20} color={theme.textSecondary} />
            <ThemedText type="h3" style={styles.sectionTitle}>
              Used
            </ThemedText>
          </View>
          {usedCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onPress={() => handleCouponPress(coupon)}
            />
          ))}
        </View>
      )}

      {expiredCoupons.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="x-circle" size={20} color={theme.error} />
            <ThemedText type="h3" style={styles.sectionTitle}>
              Expired
            </ThemedText>
          </View>
          {expiredCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onPress={() => handleCouponPress(coupon)}
            />
          ))}
        </View>
      )}

      {coupons.length === 0 && (
        <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.emptyState}>
          <ThemedText style={{ fontSize: 80 }}>🎁</ThemedText>
          <ThemedText
            type="h3"
            style={[styles.emptyText, { fontFamily: Fonts?.display }]}
          >
            No Loot Yet
          </ThemedText>
          <ThemedText
            style={[styles.emptySubtext, { color: theme.textSecondary }]}
          >
            Head to the Discover tab and tap a loot box to claim your first deal. They're closer than you think!
          </ThemedText>
        </Animated.View>
      )}
    </ScreenScrollView>

    <RedemptionModal
      visible={showRedemption}
      coupon={selectedCoupon}
      onClose={() => {
        setShowRedemption(false);
        setSelectedCoupon(null);
      }}
      onMarkUsed={handleMarkUsed}
    />
    </>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    marginTop: Spacing.sm,
    fontSize: 14,
  },
});
