import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts, Shadows } from "../constants/theme";
import { MerchantService, MerchantDrop } from "../services/merchantService";

type LootDrop = MerchantDrop;

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        merchantStyles.statCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: color + "30",
          ...Platform.select({
            web: { boxShadow: `0 2px 12px ${color}15` },
            default: {},
          }),
        },
      ]}
    >
      <View style={[merchantStyles.statIcon, { backgroundColor: color + "15" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <ThemedText style={[merchantStyles.statValue, { fontFamily: Fonts?.display }]}>
        {value}
      </ThemedText>
      <ThemedText style={[merchantStyles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

function DropCard({
  drop,
  onToggle,
}: {
  drop: LootDrop;
  onToggle: () => void;
}) {
  const { theme } = useTheme();
  const claimPct = (drop.totalClaims / drop.maxClaims) * 100;

  return (
    <View
      style={[
        merchantStyles.dropCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: drop.active ? theme.primary + "30" : theme.border,
          opacity: drop.active ? 1 : 0.7,
        },
      ]}
    >
      <View style={merchantStyles.dropHeader}>
        <View style={merchantStyles.dropInfo}>
          <ThemedText style={[merchantStyles.dropTitle, { fontFamily: Fonts?.sans }]}>
            {drop.title}
          </ThemedText>
          <View style={merchantStyles.dropMeta}>
            <ThemedText style={[merchantStyles.dropValue, { color: theme.secondary }]}>
              {drop.value}
            </ThemedText>
            <ThemedText style={[merchantStyles.dropCode, { color: theme.textSecondary, fontFamily: Fonts?.mono }]}>
              {drop.code}
            </ThemedText>
          </View>
        </View>
        <Pressable
          onPress={onToggle}
          style={[
            merchantStyles.toggleBtn,
            {
              backgroundColor: drop.active ? theme.success + "15" : theme.error + "15",
            },
          ]}
        >
          <View
            style={[
              merchantStyles.toggleDot,
              {
                backgroundColor: drop.active ? theme.success : theme.error,
              },
            ]}
          />
          <ThemedText
            style={[
              merchantStyles.toggleText,
              { color: drop.active ? theme.success : theme.error },
            ]}
          >
            {drop.active ? "Live" : "Off"}
          </ThemedText>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={merchantStyles.progressSection}>
        <View style={merchantStyles.progressHeader}>
          <ThemedText style={[merchantStyles.progressLabel, { color: theme.textSecondary }]}>
            {drop.totalClaims}/{drop.maxClaims} claimed
          </ThemedText>
          <ThemedText style={[merchantStyles.progressLabel, { color: theme.textSecondary }]}>
            {drop.expiresIn === "Expired" ? "Expired" : `${drop.expiresIn} left`}
          </ThemedText>
        </View>
        <View style={[merchantStyles.progressBg, { backgroundColor: theme.backgroundTertiary }]}>
          <View
            style={[
              merchantStyles.progressFill,
              {
                width: `${claimPct}%`,
                backgroundColor: claimPct >= 90 ? theme.warning : theme.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default function MerchantScreen() {
  const { theme } = useTheme();
  const [drops, setDrops] = useState<LootDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState({ totalClaims: 0, activeDrops: 0, weeklyGrowth: "—" });
  const [newDrop, setNewDrop] = useState({
    title: "",
    value: "",
    code: "",
    maxClaims: "100",
  });

  useEffect(() => {
    Promise.all([
      MerchantService.getDrops(),
      MerchantService.getStats(),
    ]).then(([dropsData, statsData]) => {
      setDrops(dropsData);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  const toggleDrop = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const drop = drops.find((d) => d.id === id);
    if (!drop) return;
    const newActive = !drop.active;
    setDrops((prev) =>
      prev.map((d) => (d.id === id ? { ...d, active: newActive } : d))
    );
    await MerchantService.toggleDrop(id, newActive);
  };

  const handleCreateDrop = async () => {
    if (!newDrop.title || !newDrop.value || !newDrop.code) {
      Alert.alert("Missing Info", "Fill in all fields to create a loot drop.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const created = await MerchantService.createDrop({
      title: newDrop.title,
      value: newDrop.value,
      code: newDrop.code,
      maxClaims: parseInt(newDrop.maxClaims) || 100,
      merchantId: "00000000-0000-0000-0000-000000000001", // demo merchant
      businessName: "My Business",
      category: "restaurant",
      latitude: 37.7895,
      longitude: -122.4020,
    });
    if (created) {
      setDrops((prev) => [created, ...prev]);
    }
    setNewDrop({ title: "", value: "", code: "", maxClaims: "100" });
    setShowCreate(false);
    Alert.alert("Drop Created!", `"${newDrop.title}" is now live for customers to discover.`);
  };

  const totalClaims = stats.totalClaims;
  const activeDrops = stats.activeDrops;

  return (
    <ScreenScrollView>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={merchantStyles.header}>
        <View>
          <ThemedText type="h2" style={{ fontFamily: Fonts?.display }}>
            Merchant Hub
          </ThemedText>
          <ThemedText style={[merchantStyles.subtitle, { color: theme.textSecondary }]}>
            Manage your loot drops
          </ThemedText>
        </View>
        <Button onPress={() => setShowCreate(!showCreate)}>+ New Drop</Button>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={merchantStyles.statsRow}>
        <StatCard icon="gift" label="Active Drops" value={String(activeDrops)} color={theme.primary} />
        <StatCard icon="users" label="Total Claims" value={String(totalClaims)} color={theme.accent} />
        <StatCard icon="trending-up" label="This Week" value={stats.weeklyGrowth} color={theme.success} />
      </Animated.View>

      {loading && <ActivityIndicator color={theme.primary} style={{ padding: Spacing.xl }} />}

      {/* Create form */}
      {showCreate && (
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[
            merchantStyles.createForm,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.primary + "40",
            },
          ]}
        >
          <ThemedText type="h4">Create Loot Drop</ThemedText>
          {[
            { placeholder: "Coupon title (e.g. 20% Off Pizza)", key: "title" },
            { placeholder: "Value shown (e.g. 20% OFF)", key: "value" },
            { placeholder: "Coupon code (e.g. PIZZA20)", key: "code" },
            { placeholder: "Max claims (default 100)", key: "maxClaims" },
          ].map((field) => (
            <TextInput
              key={field.key}
              placeholder={field.placeholder}
              placeholderTextColor={theme.textSecondary}
              value={(newDrop as any)[field.key]}
              onChangeText={(text) => setNewDrop((prev) => ({ ...prev, [field.key]: text }))}
              style={[
                merchantStyles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                  fontFamily: Fonts?.sans,
                },
              ]}
            />
          ))}
          <View style={merchantStyles.formActions}>
            <Pressable
              onPress={() => setShowCreate(false)}
              style={[merchantStyles.cancelBtn, { borderColor: theme.border }]}
            >
              <ThemedText style={{ color: theme.textSecondary, fontWeight: "600" }}>
                Cancel
              </ThemedText>
            </Pressable>
            <Button onPress={handleCreateDrop}>Create Drop 🎁</Button>
          </View>
        </Animated.View>
      )}

      {/* Drops list */}
      <Animated.View entering={FadeInUp.duration(500).delay(200)} style={merchantStyles.dropsSection}>
        <ThemedText type="h4" style={{ fontFamily: Fonts?.display }}>
          Your Drops
        </ThemedText>
        {drops.map((drop, i) => (
          <Animated.View key={drop.id} entering={FadeInUp.duration(400).delay(300 + i * 80)}>
            <DropCard drop={drop} onToggle={() => toggleDrop(drop.id)} />
          </Animated.View>
        ))}
      </Animated.View>
    </ScreenScrollView>
  );
}

const merchantStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  createForm: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  input: {
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  formActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
  },
  dropsSection: {
    gap: Spacing.md,
  },
  dropCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  dropHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dropInfo: {
    flex: 1,
    gap: 4,
  },
  dropTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  dropMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  dropValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  dropCode: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  progressSection: {
    gap: Spacing.xs,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
