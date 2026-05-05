import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Platform,
  RefreshControl,
  ScrollView,
  Pressable,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { CouponCard } from "../components/CouponCard";
import { Coupon3D } from "../components/Coupon3D";
import { Chest3D } from "../components/Chest3D";
import { RedemptionModal } from "../components/RedemptionModal";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts, WebShadows } from "../constants/theme";
import { StorageService } from "../services/storageService";
import { ClaimService } from "../services/claimService";
import { isSupabaseConfigured } from "../services/supabaseClient";
import { CollectedCoupon } from "../types";

const PALETTE = ["#FF6D3A", "#9D4EDD", "#00B8D4", "#34D399", "#E89B5E", "#FF3DCB"];

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function shortLogo(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function deriveRarity(coupon: CollectedCoupon): "common" | "rare" | "epic" | "legendary" {
  if (coupon.discountType === "percentage") {
    const v = parseFloat(coupon.value.replace(/[^\d.]/g, "")) || 0;
    if (v >= 50) return "legendary";
    if (v >= 25) return "epic";
    return "rare";
  }
  if (coupon.discountType === "freeItem") return "epic";
  if (coupon.discountType === "fixed") {
    const v = parseFloat(coupon.value.replace(/[^\d.]/g, "")) || 0;
    return v >= 20 ? "epic" : "rare";
  }
  return "common";
}

function formatExpiry(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CollectionScreen() {
  const { theme } = useTheme();
  const [coupons, setCoupons] = useState<CollectedCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CollectedCoupon | null>(null);
  const [showRedemption, setShowRedemption] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"active" | "used" | "expired">("active");
  const [view, setView] = useState<"grid" | "vault">("grid");
  const [showcaseIdx, setShowcaseIdx] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadCoupons();
    }, [])
  );

  const loadCoupons = async () => {
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

  const activeCoupons = coupons.filter((c) => !c.isUsed && c.expiresAt > Date.now());
  const expiredCoupons = coupons.filter((c) => c.expiresAt <= Date.now() && !c.isUsed);
  const usedCoupons = coupons.filter((c) => c.isUsed);

  const totalSavings = coupons.reduce((sum, coupon) => {
    if (coupon.discountType === "fixed" && !coupon.isUsed) {
      const value = parseFloat(coupon.value.replace("$", "")) || 0;
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

  const tabCounts = { active: activeCoupons.length, used: usedCoupons.length, expired: expiredCoupons.length };
  const filtered = tab === "active" ? activeCoupons : tab === "used" ? usedCoupons : expiredCoupons;

  const showcase = useMemo(() => {
    if (activeCoupons.length === 0) return null;
    const c = activeCoupons[showcaseIdx % activeCoupons.length];
    return c;
  }, [activeCoupons, showcaseIdx]);

  // Vault (showcase) mode is web-only since 3D transforms don't render on native
  const canShowcase = Platform.OS === "web" && activeCoupons.length > 0;

  return (
    <>
      <ScreenScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Title row */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <ThemedText
              style={[styles.title, { color: theme.text, fontFamily: Fonts?.display }]}
            >
              MY LOOT
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              {coupons.length} coupons · ${totalSavings} unlocked
            </ThemedText>
          </View>
          {canShowcase && (
            <View style={styles.viewToggle}>
              <Pressable
                onPress={() => setView("grid")}
                style={[
                  styles.viewToggleBtn,
                  view === "grid" && {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Feather
                  name="grid"
                  size={14}
                  color={view === "grid" ? "#fff" : theme.textSecondary}
                />
              </Pressable>
              <Pressable
                onPress={() => setView("vault")}
                style={[
                  styles.viewToggleBtn,
                  view === "vault" && {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Feather
                  name="layers"
                  size={14}
                  color={view === "vault" ? "#fff" : theme.textSecondary}
                />
              </Pressable>
            </View>
          )}
        </Animated.View>

        {/* Arcade stat blocks */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(80)}
          style={styles.statsRow}
        >
          <StatBlock value={String(coupons.length)} label="Coupons" color={theme.secondary} />
          <StatBlock
            value={`$${totalSavings}`}
            label="Saved"
            color={theme.accent}
          />
          <StatBlock
            value={String(activeCoupons.length)}
            label="Active"
            color={theme.primary}
          />
        </Animated.View>

        {/* Latest drop banner */}
        {activeCoupons.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(140)}>
            <Pressable
              onPress={() => handleCouponPress(activeCoupons[0])}
              style={({ pressed }) => [
                styles.latestBanner,
                {
                  borderColor: "#353d6e",
                  opacity: pressed ? 0.9 : 1,
                  ...Platform.select({
                    web: {
                      background:
                        "linear-gradient(180deg, #1d2347 0%, #11152c 100%)",
                      boxShadow:
                        "inset 0 1.5px 0 rgba(255,255,255,0.12), 0 6px 0 #0a0d1c, 0 10px 24px rgba(0,0,0,0.5)",
                    } as any,
                    default: {
                      backgroundColor: theme.backgroundDefault,
                    },
                  }) as any,
                },
              ]}
            >
              <View style={styles.latestChestWrap}>
                <Chest3D size={50} rarity="gold" floating />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={[
                    styles.latestTag,
                    { color: theme.secondary, fontFamily: Fonts?.sans },
                  ]}
                >
                  LATEST DROP
                </ThemedText>
                <ThemedText
                  style={[
                    styles.latestTitle,
                    { color: theme.text, fontFamily: Fonts?.display },
                  ]}
                  numberOfLines={1}
                >
                  {activeCoupons[0].businessName} · {activeCoupons[0].value}
                </ThemedText>
                <ThemedText
                  style={[styles.latestSub, { color: theme.textSecondary }]}
                >
                  Tap to view & redeem
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </Animated.View>
        )}

        {/* Showcase (web-only vault mode) */}
        {canShowcase && view === "vault" && showcase && (
          <Animated.View
            entering={FadeInUp.duration(500).delay(180)}
            style={styles.showcaseWrap}
          >
            <View style={styles.coupon3dWrap}>
              <Coupon3D
                data={{
                  business: showcase.businessName,
                  deal: showcase.value,
                  sub: showcase.title,
                  code: showcase.code,
                  expires: formatExpiry(showcase.expiresAt),
                  logo: shortLogo(showcase.businessName),
                  color: hashColor(showcase.businessName),
                  rarity: deriveRarity(showcase),
                }}
                width={280}
                height={380}
                autoSpin
              />
            </View>

            <ThemedText style={[styles.dragHint, { color: theme.textSecondary }]}>
              DRAG TO SPIN · TAP A CARD BELOW
            </ThemedText>

            {/* Horizontal selector strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stripScroll}
            >
              {activeCoupons.map((c, i) => {
                const color = hashColor(c.businessName);
                const rarity = deriveRarity(c);
                const isSelected = i === showcaseIdx;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setShowcaseIdx(i)}
                    style={[
                      styles.stripCard,
                      {
                        ...Platform.select({
                          web: {
                            background: `linear-gradient(135deg, ${color}, ${color}88)`,
                            boxShadow: isSelected
                              ? `0 0 16px ${color}aa, 0 4px 0 #0a0d1c`
                              : "0 4px 0 #0a0d1c",
                          } as any,
                          default: { backgroundColor: color },
                        }) as any,
                        borderColor: isSelected ? color : "rgba(255,255,255,0.15)",
                        borderWidth: isSelected ? 2.5 : 1.5,
                        transform: [{ translateY: isSelected ? -4 : 0 }],
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.stripDeal,
                        { fontFamily: Fonts?.display },
                      ]}
                    >
                      {c.value}
                    </ThemedText>
                    <ThemedText style={styles.stripBusiness} numberOfLines={1}>
                      {c.businessName.split(" ")[0]}
                    </ThemedText>
                    <View
                      style={[
                        styles.stripRarityDot,
                        {
                          backgroundColor:
                            rarity === "legendary"
                              ? "#FFD54F"
                              : rarity === "epic"
                              ? "#C77DFF"
                              : rarity === "rare"
                              ? "#00E5FF"
                              : "#8E96C8",
                        },
                      ]}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Grid mode */}
        {(view === "grid" || !canShowcase) && (
          <>
            {/* Tabs */}
            <View
              style={[
                styles.tabsRow,
                {
                  backgroundColor: "rgba(15,19,38,0.6)",
                  borderColor: "rgba(255,255,255,0.08)",
                },
              ]}
            >
              {(["active", "used", "expired"] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[
                    styles.tabBtn,
                    tab === t && {
                      ...Platform.select({
                        web: {
                          background:
                            "linear-gradient(180deg, #FF8859, #FF6D3A)",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 0 #8B2B0C",
                        } as any,
                        default: { backgroundColor: theme.primary },
                      }) as any,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      { fontFamily: Fonts?.display },
                      tab === t
                        ? { color: "#fff" }
                        : { color: theme.textSecondary },
                    ]}
                  >
                    {t.toUpperCase()}{" "}
                    <ThemedText style={{ opacity: 0.7, fontSize: 11 }}>
                      ({tabCounts[t]})
                    </ThemedText>
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {filtered.length > 0 ? (
              <View style={styles.grid}>
                {filtered.map((coupon) => (
                  <View key={coupon.id} style={styles.gridItem}>
                    <CouponCard
                      coupon={coupon}
                      onPress={() => handleCouponPress(coupon)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <Animated.View
                entering={FadeInUp.duration(500)}
                style={styles.emptyState}
              >
                <View style={{ marginBottom: Spacing.lg }}>
                  <Chest3D size={100} rarity="silver" floating />
                </View>
                <ThemedText
                  type="h3"
                  style={[styles.emptyText, { fontFamily: Fonts?.display }]}
                >
                  {tab === "active"
                    ? "NO ACTIVE LOOT"
                    : tab === "used"
                    ? "NOTHING REDEEMED YET"
                    : "NO EXPIRED DROPS"}
                </ThemedText>
                <ThemedText
                  style={[styles.emptySubtext, { color: theme.textSecondary }]}
                >
                  Head to Discover to find loot boxes near you.
                </ThemedText>
              </Animated.View>
            )}
          </>
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

function StatBlock({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.statBlock,
        {
          borderColor: "#353d6e",
          ...Platform.select({
            web: {
              background:
                "linear-gradient(180deg, #232A4D 0%, #181D38 100%)",
              boxShadow:
                "inset 0 1.5px 0 rgba(255,255,255,0.1), 0 4px 0 #0a0d1c",
            } as any,
            default: { backgroundColor: theme.backgroundDefault },
          }) as any,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.statValue,
          {
            color,
            fontFamily: Fonts?.display,
            ...Platform.select({
              web: {
                textShadow: `0 0 12px ${color}88, 0 2px 0 rgba(0,0,0,0.4)`,
              },
              default: {},
            }),
          } as any,
        ]}
      >
        {value}
      </ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    letterSpacing: 0.5,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(15,19,38,0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 3,
  },
  viewToggleBtn: {
    width: 32,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.lg,
  },
  statBlock: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 6,
    fontWeight: "800",
  },
  latestBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  latestChestWrap: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  latestTag: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  latestTitle: {
    fontSize: 16,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  latestSub: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  showcaseWrap: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  coupon3dWrap: {
    paddingVertical: Spacing.lg,
  },
  dragHint: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 12,
  },
  stripScroll: {
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  stripCard: {
    width: 72,
    height: 92,
    borderRadius: 12,
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  stripDeal: {
    fontSize: 18,
    color: "#fff",
    lineHeight: 18,
  },
  stripBusiness: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  stripRarityDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  gridItem: {
    width: "50%",
    paddingHorizontal: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 18,
    letterSpacing: 1,
  },
  emptySubtext: {
    marginTop: Spacing.sm,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
