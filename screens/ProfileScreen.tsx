import React from "react";
import { View, StyleSheet, Pressable, Image, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Layout } from "../constants/theme";

export default function ProfileScreen() {
  const { theme } = useTheme();

  const handleScheduleDrop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Schedule Loot Drop",
      "This feature allows merchants to schedule loot drops at their business location.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () =>
            Alert.alert("Success", "Loot drop scheduled successfully!"),
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => Alert.alert("Signed Out", "You have been signed out."),
      },
    ]);
  };

  return (
    <ScreenScrollView>
      <View style={styles.avatarSection}>
        <Image
          source={require("../assets/avatars/gold_chest_avatar.png")}
          style={styles.avatar}
        />
        <ThemedText type="h2" style={styles.username}>
          Treasure Hunter
        </ThemedText>
        <ThemedText
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          Gold Tier Member
        </ThemedText>
      </View>

      <View
        style={[
          styles.statsCard,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Feather name="award" size={24} color={theme.secondary} />
            <ThemedText type="h3" style={styles.statValue}>
              12
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: theme.textSecondary }]}
            >
              Coupons
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="dollar-sign" size={24} color={theme.success} />
            <ThemedText type="h3" style={styles.statValue}>
              $247
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: theme.textSecondary }]}
            >
              Saved
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <Feather name="map-pin" size={24} color={theme.accent} />
            <ThemedText type="h3" style={styles.statValue}>
              8
            </ThemedText>
            <ThemedText
              style={[styles.statLabel, { color: theme.textSecondary }]}
            >
              Visits
            </ThemedText>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.merchantCard,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.primary,
          },
        ]}
      >
        <View style={styles.merchantHeader}>
          <Feather name="briefcase" size={24} color={theme.primary} />
          <ThemedText type="h3" style={styles.merchantTitle}>
            Merchant Tools
          </ThemedText>
        </View>
        <ThemedText
          style={[styles.merchantSubtext, { color: theme.textSecondary }]}
        >
          Schedule loot drops at your business location to attract customers
        </ThemedText>
        <Button onPress={handleScheduleDrop} style={styles.merchantButton}>
          Schedule Loot Drop
        </Button>
      </View>

      <View style={styles.menuSection}>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.backgroundDefault,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => Alert.alert("Settings", "Settings screen")}
        >
          <Feather name="settings" size={20} color={theme.text} />
          <ThemedText style={styles.menuText}>Settings</ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.backgroundDefault,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() =>
            Alert.alert(
              "Help",
              "For support, please contact support@lootdropar.com"
            )
          }
        >
          <Feather name="help-circle" size={20} color={theme.text} />
          <ThemedText style={styles.menuText}>Help & Support</ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            {
              backgroundColor: theme.backgroundDefault,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => Alert.alert("About", "LootDrop AR v1.0.0")}
        >
          <Feather name="info" size={20} color={theme.text} />
          <ThemedText style={styles.menuText}>About</ThemedText>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>

      <Button
        onPress={handleSignOut}
        style={[styles.signOutButton, { backgroundColor: theme.error }]}
      >
        Sign Out
      </Button>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.lg,
  },
  username: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing["2xl"],
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
  },
  merchantCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing["2xl"],
  },
  merchantHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  merchantTitle: {
    flex: 1,
  },
  merchantSubtext: {
    fontSize: 14,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  merchantButton: {
    marginTop: Spacing.sm,
  },
  menuSection: {
    marginBottom: Spacing["2xl"],
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  signOutButton: {
    marginTop: Spacing.lg,
  },
});
