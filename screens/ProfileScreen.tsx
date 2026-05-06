import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Image, Alert, Modal, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Layout, Shadows, Fonts, WebShadows, Gradients } from "../constants/theme";
import { AuthService, User } from "../services/authService";
import { StorageService } from "../services/storageService";
import { useAuth } from "../App";
import ChatScreen from "./ChatScreen";
import MerchantScreen from "./MerchantScreen";
import MerchantOnboardingScreen from "./MerchantOnboardingScreen";
import SettingsScreen from "./SettingsScreen";

function StatBadge({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        statStyles.item,
        {
          backgroundColor: color + "10",
          borderWidth: 1,
          borderColor: color + "18",
          ...Platform.select({
            web: { boxShadow: `0 0 20px ${color}12` },
            default: {},
          }),
        },
      ]}
    >
      <View style={[statStyles.iconCircle, { backgroundColor: color + "20" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <ThemedText style={[statStyles.value, { fontFamily: Fonts?.display }]}>
        {value}
      </ThemedText>
      <ThemedText style={[statStyles.label, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  value: {
    fontSize: 24,
    fontWeight: "800",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: theme.backgroundDefault,
          borderColor: theme.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.menuIconBg, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={icon as any} size={18} color={theme.text} />
      </View>
      <ThemedText style={[styles.menuText, { fontFamily: Fonts?.sans }]}>
        {label}
      </ThemedText>
      <Feather name="chevron-right" size={18} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<User | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const isMerchant = user?.role === "merchant";
  const [stats, setStats] = useState({ coupons: 0, savings: 0, visits: 0 });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const currentUser = await AuthService.getCurrentUser();
    setUser(currentUser);

    const collectedCoupons = await StorageService.getCollectedCoupons();
    const savings = collectedCoupons.reduce((sum, coupon) => {
      if (coupon.discountType === "fixed" && coupon.isUsed) {
        const value = parseFloat(coupon.value.replace("$", ""));
        return sum + value;
      }
      return sum;
    }, 0);

    setStats({
      coupons: collectedCoupons.length,
      savings: Math.round(savings),
      visits: collectedCoupons.filter((c) => c.isUsed).length,
    });
  };

  const tierConfig = {
    gold: { label: "GOLD", color: "#FFD54F", emoji: "👑" },
    silver: { label: "SILVER", color: "#B0BEC5", emoji: "⚡" },
    bronze: { label: "BRONZE", color: "#FF8A65", emoji: "🔥" },
  };
  const tier = tierConfig[user?.avatarTier || "bronze"];

  const handleMerchantPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isMerchant) {
      setShowMerchantModal(true);
    } else {
      setShowOnboardingModal(true);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <ScreenScrollView>
      {/* Avatar & Name */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.avatarSection}>
        <View style={styles.avatarWrapper}>
          <View
            style={[
              styles.avatarGlow,
              {
                backgroundColor: tier.color + "25",
                ...Platform.select({
                  web: {
                    boxShadow: `0 0 60px ${tier.color}40, 0 0 120px ${tier.color}15`,
                    animation: "lootdrop-pulse 4s ease-in-out infinite",
                  },
                  default: {},
                }),
              },
            ]}
          />
          <Image
            source={require("../assets/avatars/gold_chest_avatar.png")}
            style={[
              styles.avatar,
              {
                borderColor: tier.color,
                ...Platform.select({
                  web: { boxShadow: `0 0 24px ${tier.color}50` },
                  default: {},
                }),
              },
            ]}
          />
          <View
            style={[
              styles.tierBadge,
              {
                backgroundColor: tier.color,
                ...Platform.select({
                  web: { boxShadow: `0 2px 12px ${tier.color}60` },
                  default: {},
                }),
              },
            ]}
          >
            <ThemedText style={styles.tierText}>
              {tier.emoji} {tier.label}
            </ThemedText>
          </View>
        </View>
        <ThemedText
          type="h2"
          style={[styles.username, { fontFamily: Fonts?.display }]}
        >
          {user?.name || "Treasure Hunter"}
        </ThemedText>
        <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
          {user?.email || "Guest Explorer"}
        </ThemedText>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.statsRow}>
        <StatBadge icon="gift" value={String(stats.coupons)} label="Claimed" color={theme.secondary} />
        <StatBadge icon="dollar-sign" value={`$${stats.savings}`} label="Saved" color={theme.success} />
        <StatBadge icon="map-pin" value={String(stats.visits)} label="Used" color={theme.accent} />
      </Animated.View>

      {/* Merchant Card */}
      <Animated.View entering={FadeInDown.duration(500).delay(200)}>
        <Pressable
          onPress={handleMerchantPress}
          style={({ pressed }) => [
            styles.merchantCard,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.primary + "30",
              transform: [{ scale: pressed ? 0.98 : 1 }],
              ...Platform.select({
                web: {
                  background: `${Gradients.web.cardSheen}, ${theme.backgroundDefault}`,
                  boxShadow: pressed ? WebShadows.card : WebShadows.cardGlow,
                  transition: "transform 0.15s ease, box-shadow 0.2s ease",
                },
                default: {},
              }),
            },
            Platform.OS !== "web" ? Shadows.card : {},
          ]}
        >
          <View style={styles.merchantLeft}>
            <View style={[styles.merchantIcon, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="briefcase" size={22} color={theme.primary} />
            </View>
            <View style={styles.merchantInfo}>
              <ThemedText type="h4">{isMerchant ? "Merchant Hub" : "Become a Merchant"}</ThemedText>
              <ThemedText style={[styles.merchantSub, { color: theme.textSecondary }]}>
                {isMerchant ? `Manage ${user?.businessName || "your"} drops` : "Start creating loot drops for your business"}
              </ThemedText>
            </View>
          </View>
          <Feather name="arrow-right" size={20} color={theme.primary} />
        </Pressable>
      </Animated.View>

      {/* Menu */}
      <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.menuSection}>
        <MenuItem icon="settings" label="Settings" onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowSettingsModal(true);
        }} />
        <MenuItem
          icon="help-circle"
          label="Help & Support"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowChatModal(true);
          }}
        />
        <MenuItem icon="info" label="About" onPress={() => Alert.alert("About", "LootDrop AR v1.0.0")} />
      </Animated.View>

      {/* Sign Out */}
      <Animated.View entering={FadeInDown.duration(500).delay(400)}>
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutButton,
            {
              borderColor: theme.error + "60",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="log-out" size={18} color={theme.error} />
          <ThemedText style={[styles.signOutText, { color: theme.error }]}>
            Sign Out
          </ThemedText>
        </Pressable>
      </Animated.View>

      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowChatModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: theme.backgroundDefault,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <ThemedText type="h3">Help & Support</ThemedText>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowChatModal(false);
              }}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <ChatScreen />
        </View>
      </Modal>

      <Modal
        visible={showMerchantModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMerchantModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: theme.backgroundDefault,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <ThemedText type="h3">Merchant Hub</ThemedText>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowMerchantModal(false);
              }}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <MerchantScreen />
        </View>
      </Modal>

      <Modal
        visible={showOnboardingModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowOnboardingModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#0a0d1c" }}>
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: "rgba(15, 19, 38, 0.95)",
                borderBottomColor: "rgba(0, 229, 255, 0.2)",
              },
            ]}
          >
            <ThemedText type="h3" style={{ color: "#fff" }}>Become a Merchant</ThemedText>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowOnboardingModal(false);
              }}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color="#fff" />
            </Pressable>
          </View>
          <MerchantOnboardingScreen
            userId={user?.id || ""}
            onComplete={() => {
              setShowOnboardingModal(false);
              loadProfile(); // Reload to pick up merchant role
            }}
          />
        </View>
      </Modal>

      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: theme.backgroundDefault,
                borderBottomColor: theme.border,
              },
            ]}
          >
            <ThemedText type="h3">Settings</ThemedText>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSettingsModal(false);
              }}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
          <SettingsScreen
            onReplayTour={() => {
              setShowSettingsModal(false);
              setTimeout(() => navigation.navigate("Discover"), 300);
            }}
          />
        </View>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 32,
    borderWidth: 3,
  },
  tierBadge: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  tierText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
  username: {
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  merchantCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing["2xl"],
  },
  merchantLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  merchantIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  merchantInfo: {
    flex: 1,
    gap: 2,
  },
  merchantSub: {
    fontSize: 13,
  },
  menuSection: {
    marginBottom: Spacing["2xl"],
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: Spacing["3xl"],
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "700",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
});
