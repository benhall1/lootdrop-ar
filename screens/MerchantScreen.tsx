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
import { AuthService, User } from "../services/authService";

type LootDrop = MerchantDrop;

const DURATION_OPTIONS = [1, 3, 7, 14, 30] as const;

function formatRelativeExpiry(expiresAt: number, now: number): { label: string; ended: boolean; urgent: boolean } {
  const diff = expiresAt - now;
  if (diff <= 0) return { label: "ENDED", ended: true, urgent: false };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const urgent = diff < 60 * 60 * 1000; // < 1h
  if (days > 0) return { label: `${days}d ${hours}h`, ended: false, urgent: false };
  if (hours > 0) return { label: `${hours}h ${minutes}m`, ended: false, urgent };
  if (minutes > 0) return { label: `${minutes}m ${seconds}s`, ended: false, urgent };
  return { label: `${seconds}s`, ended: false, urgent: true };
}

function formatExpiryDate(expiresAt: number): string {
  try {
    const d = new Date(expiresAt);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function DropCountdown({ expiresAt, ended }: { expiresAt: number; ended: boolean }) {
  const { theme } = useTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (ended) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ended]);

  const { label, urgent, ended: liveEnded } = formatRelativeExpiry(expiresAt, now);
  const isEnded = ended || liveEnded;

  const color = isEnded ? theme.textSecondary : urgent ? theme.warning : theme.primary;
  const bg = isEnded ? theme.backgroundTertiary : urgent ? theme.warning + "20" : theme.primary + "15";
  const border = isEnded ? theme.border : urgent ? theme.warning + "60" : theme.primary + "40";

  return (
    <View
      style={[
        merchantStyles.countdownBadge,
        {
          backgroundColor: bg,
          borderColor: border,
        },
      ]}
    >
      <Feather
        name={isEnded ? "x-circle" : "clock"}
        size={11}
        color={color}
      />
      <ThemedText
        style={[
          merchantStyles.countdownText,
          { color, fontFamily: Fonts?.mono },
        ]}
      >
        {isEnded ? "ENDED" : label}
      </ThemedText>
    </View>
  );
}

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
  const claimPct = Math.min(100, (drop.totalClaims / Math.max(1, drop.maxClaims)) * 100);
  const ended = drop.expiresAt > 0 && drop.expiresAt <= Date.now();

  return (
    <View
      style={[
        merchantStyles.dropCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: ended
            ? theme.border
            : drop.active
            ? theme.primary + "30"
            : theme.border,
          opacity: ended ? 0.6 : drop.active ? 1 : 0.75,
        },
      ]}
    >
      <View style={merchantStyles.dropHeader}>
        <View style={merchantStyles.dropInfo}>
          <ThemedText style={[merchantStyles.dropTitle, { fontFamily: Fonts?.sans }]}>
            {drop.title}
          </ThemedText>
          <View style={merchantStyles.dropMeta}>
            <View style={[merchantStyles.valueChip, { backgroundColor: theme.secondary + "20", borderColor: theme.secondary + "50" }]}>
              <ThemedText style={[merchantStyles.dropValue, { color: theme.secondary }]}>
                {drop.value}
              </ThemedText>
            </View>
            <ThemedText style={[merchantStyles.dropCode, { color: theme.textSecondary, fontFamily: Fonts?.mono }]}>
              {drop.code}
            </ThemedText>
          </View>
        </View>
        <View style={merchantStyles.dropRight}>
          <DropCountdown expiresAt={drop.expiresAt} ended={ended} />
          <Pressable
            onPress={onToggle}
            disabled={ended}
            style={[
              merchantStyles.toggleBtn,
              {
                backgroundColor: drop.active && !ended ? theme.success + "15" : theme.error + "15",
                opacity: ended ? 0.5 : 1,
              },
            ]}
          >
            <View
              style={[
                merchantStyles.toggleDot,
                {
                  backgroundColor: drop.active && !ended ? theme.success : theme.error,
                },
              ]}
            />
            <ThemedText
              style={[
                merchantStyles.toggleText,
                { color: drop.active && !ended ? theme.success : theme.error },
              ]}
            >
              {ended ? "Ended" : drop.active ? "Live" : "Off"}
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={merchantStyles.progressSection}>
        <View style={merchantStyles.progressHeader}>
          <ThemedText style={[merchantStyles.progressLabel, { color: theme.text }]}>
            <ThemedText style={{ fontWeight: "800", fontFamily: Fonts?.mono }}>
              {drop.totalClaims}
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {" "}/ {drop.maxClaims} claimed
            </ThemedText>
          </ThemedText>
          <ThemedText style={[merchantStyles.progressLabel, { color: theme.textSecondary }]}>
            {Math.round(claimPct)}%
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
  const [merchant, setMerchant] = useState<User | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [stats, setStats] = useState({ totalClaims: 0, activeDrops: 0, weeklyGrowth: "—" });
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);
  const [newDrop, setNewDrop] = useState({
    title: "",
    value: "",
    code: "",
    maxClaims: "100",
  });
  const [durationDays, setDurationDays] = useState<number>(7);

  const sortedDrops = React.useMemo(() => {
    const now = Date.now();
    const rank = (d: LootDrop) => {
      const ended = d.expiresAt > 0 && d.expiresAt <= now;
      if (!ended && d.active) return 0;
      if (!ended && !d.active) return 1;
      return 2;
    };
    return [...drops].sort((a, b) => {
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      return b.expiresAt - a.expiresAt;
    });
  }, [drops]);

  useEffect(() => {
    const load = async () => {
      const user = await AuthService.getCurrentUser();
      setMerchant(user);
      const merchantId = user?.role === "merchant" ? user.id : undefined;
      const [dropsData, statsData] = await Promise.all([
        MerchantService.getDrops(merchantId),
        MerchantService.getStats(merchantId),
      ]);
      setDrops(dropsData);
      setStats(statsData);
      setLoading(false);
    };
    load();
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
      durationDays,
      merchantId: merchant?.id || "00000000-0000-0000-0000-000000000001",
      businessName: merchant?.businessName || "My Business",
      category: merchant?.businessCategory || "restaurant",
      latitude: merchant?.businessLat || 37.7895,
      longitude: merchant?.businessLng || -122.4020,
    });
    if (created) {
      setDrops((prev) => [created, ...prev]);
    }
    setNewDrop({ title: "", value: "", code: "", maxClaims: "100" });
    setDurationDays(7);
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

          {/* Duration picker */}
          <View style={merchantStyles.durationSection}>
            <ThemedText style={[merchantStyles.durationLabel, { color: theme.textSecondary }]}>
              Drop duration
            </ThemedText>
            <View style={merchantStyles.durationRow}>
              {DURATION_OPTIONS.map((d) => {
                const selected = durationDays === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setDurationDays(d);
                    }}
                    style={[
                      merchantStyles.durationChip,
                      {
                        backgroundColor: selected ? theme.primary : theme.backgroundSecondary,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        merchantStyles.durationChipText,
                        { color: selected ? "#fff" : theme.text, fontFamily: Fonts?.mono },
                      ]}
                    >
                      {d}d
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <ThemedText style={[merchantStyles.durationPreview, { color: theme.accent, fontFamily: Fonts?.mono }]}>
              Expires {formatExpiryDate(Date.now() + durationDays * 86400000)}
            </ThemedText>
          </View>

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
        {!loading && sortedDrops.length === 0 ? (
          <View
            style={[
              merchantStyles.emptyCard,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.secondary + "50",
              },
            ]}
          >
            <ThemedText style={merchantStyles.emptyEmoji}>🎁</ThemedText>
            <ThemedText style={[merchantStyles.emptyTitle, { fontFamily: Fonts?.display }]}>
              No drops yet
            </ThemedText>
            <ThemedText style={[merchantStyles.emptyDesc, { color: theme.textSecondary }]}>
              Tap “+ New Drop” to launch your first one. Customers nearby will discover it.
            </ThemedText>
          </View>
        ) : (
          sortedDrops.map((drop, i) => (
            <Animated.View key={drop.id} entering={FadeInUp.duration(400).delay(300 + i * 80)}>
              <DropCard drop={drop} onToggle={() => toggleDrop(drop.id)} />
            </Animated.View>
          ))
        )}
      </Animated.View>

      {/* Verify Redemption */}
      <Animated.View entering={FadeInUp.duration(500).delay(400)} style={[merchantStyles.verifySection, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
        <ThemedText type="h4" style={{ fontFamily: Fonts?.display }}>
          Verify Redemption
        </ThemedText>
        <ThemedText style={{ color: theme.textSecondary, fontSize: 13 }}>
          Enter a customer's claim ID to verify their coupon.
        </ThemedText>
        <View style={merchantStyles.verifyRow}>
          <TextInput
            placeholder="Paste claim ID..."
            placeholderTextColor={theme.textSecondary}
            value={verifyId}
            onChangeText={setVerifyId}
            style={[
              merchantStyles.input,
              {
                flex: 1,
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
                fontFamily: Fonts?.mono,
              },
            ]}
          />
          <Button
            onPress={async () => {
              if (!verifyId.trim()) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const result = await MerchantService.verifyClaim(verifyId.trim(), merchant?.id || "");
              setVerifyResult(result);
              if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
          >
            Verify
          </Button>
        </View>
        {verifyResult && (
          <View style={[merchantStyles.verifyResult, { backgroundColor: verifyResult.success ? theme.success + "15" : theme.error + "15", borderColor: verifyResult.success ? theme.success + "30" : theme.error + "30" }]}>
            <Feather name={verifyResult.success ? "check-circle" : "x-circle"} size={18} color={verifyResult.success ? theme.success : theme.error} />
            <ThemedText style={{ color: verifyResult.success ? theme.success : theme.error, flex: 1 }}>
              {verifyResult.message}
            </ThemedText>
          </View>
        )}
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
  verifySection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginTop: Spacing["2xl"],
  },
  verifyRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  verifyResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dropRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  valueChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  durationSection: {
    gap: Spacing.xs,
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  durationRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  durationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    minWidth: 52,
    alignItems: "center",
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  durationPreview: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
