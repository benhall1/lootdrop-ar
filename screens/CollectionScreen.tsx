import React, { useState } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { CouponCard } from "../components/CouponCard";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import { mockCollectedCoupons } from "../services/mockData";

export default function CollectionScreen() {
  const { theme } = useTheme();
  const [coupons] = useState(mockCollectedCoupons);

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

  const handleCouponPress = (coupon: typeof coupons[0]) => {
    Alert.alert(
      coupon.title,
      `${coupon.description}\n\nCode: ${coupon.code}\n\nTerms: Valid at ${coupon.businessName}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark as Used",
          onPress: () => Alert.alert("Success", "Coupon marked as used!"),
        },
      ]
    );
  };

  return (
    <ScreenScrollView>
      <View
        style={[
          styles.statsCard,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.statItem}>
          <ThemedText type="h2">{coupons.length}</ThemedText>
          <ThemedText
            style={[styles.statLabel, { color: theme.textSecondary }]}
          >
            Total Coupons
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h2" style={{ color: theme.success }}>
            ${totalSavings}
          </ThemedText>
          <ThemedText
            style={[styles.statLabel, { color: theme.textSecondary }]}
          >
            Potential Savings
          </ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText type="h2">{activeCoupons.length}</ThemedText>
          <ThemedText
            style={[styles.statLabel, { color: theme.textSecondary }]}
          >
            Active
          </ThemedText>
        </View>
      </View>

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
        <View style={styles.emptyState}>
          <Feather name="inbox" size={64} color={theme.textSecondary} />
          <ThemedText
            type="h3"
            style={[styles.emptyText, { color: theme.textSecondary }]}
          >
            No coupons yet
          </ThemedText>
          <ThemedText
            style={[styles.emptySubtext, { color: theme.textSecondary }]}
          >
            Discover loot boxes to collect coupons
          </ThemedText>
        </View>
      )}
    </ScreenScrollView>
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
