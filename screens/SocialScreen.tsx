import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Share, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { XPBar } from "../components/XPBar";
import { Leaderboard } from "../components/Leaderboard";
import { ActivityFeed } from "../components/ActivityFeed";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { GamificationService, GamificationState } from "../services/gamificationService";
import { SoundService } from "../services/soundService";

type Tab = "leaderboard" | "activity" | "badges";

export default function SocialScreen() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("leaderboard");
  const [gamification, setGamification] = useState<GamificationState | null>(null);

  useEffect(() => {
    GamificationService.getState().then(setGamification);
  }, []);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    SoundService.tap();
    try {
      await Share.share({
        message: `I'm Level ${gamification?.level || 1} on LootDrop AR! 🎁 Discover deals at local businesses near you. Check it out!`,
        url: "https://lootdrop-ar.vercel.app",
      });
    } catch {}
  };

  return (
    <ScreenScrollView>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View>
          <ThemedText type="h2" style={{ fontFamily: Fonts?.display }}>
            Community
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            See what's happening nearby
          </ThemedText>
        </View>
        <Pressable
          onPress={handleShare}
          style={[styles.shareBtn, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "30" }]}
        >
          <Feather name="share-2" size={16} color={theme.primary} />
          <ThemedText style={[styles.shareBtnText, { color: theme.primary }]}>
            Share
          </ThemedText>
        </Pressable>
      </Animated.View>

      {/* Your stats */}
      {gamification && (
        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={{ marginBottom: Spacing.xl }}>
          <XPBar state={gamification} />
        </Animated.View>
      )}

      {/* Tab bar */}
      <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.tabBar}>
        {([
          { key: "leaderboard", label: "Leaderboard", icon: "award" },
          { key: "activity", label: "Activity", icon: "activity" },
          { key: "badges", label: "Badges", icon: "star" },
        ] as const).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              SoundService.tap();
              setActiveTab(tab.key);
            }}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === tab.key ? theme.primary + "15" : "transparent",
                borderColor:
                  activeTab === tab.key ? theme.primary + "40" : "transparent",
              },
            ]}
          >
            <Feather
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? theme.primary : theme.textSecondary}
            />
            <ThemedText
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.key ? theme.primary : theme.textSecondary,
                },
              ]}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </Animated.View>

      {/* Tab content */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        {activeTab === "leaderboard" && (
          <Leaderboard
            userXP={gamification?.xp}
            userLevel={gamification?.level}
            userTier={gamification?.tier}
            userClaims={gamification?.totalClaims}
          />
        )}

        {activeTab === "activity" && <ActivityFeed />}

        {activeTab === "badges" && gamification && (
          <View style={styles.badgeGrid}>
            {gamification.badges.map((badge, i) => (
              <Animated.View
                key={badge.id}
                entering={FadeInDown.duration(300).delay(i * 60)}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: badge.unlockedAt
                      ? theme.backgroundDefault
                      : theme.backgroundSecondary,
                    borderColor: badge.unlockedAt
                      ? theme.secondary + "40"
                      : theme.border,
                    opacity: badge.unlockedAt ? 1 : 0.5,
                  },
                ]}
              >
                <ThemedText style={styles.badgeEmoji}>
                  {badge.unlockedAt ? badge.emoji : "🔒"}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.badgeName,
                    { color: badge.unlockedAt ? theme.text : theme.textSecondary },
                  ]}
                >
                  {badge.name}
                </ThemedText>
                <ThemedText style={[styles.badgeDesc, { color: theme.textSecondary }]}>
                  {badge.description}
                </ThemedText>
                {badge.unlockedAt && (
                  <ThemedText style={[styles.badgeDate, { color: theme.success }]}>
                    ✓ Unlocked
                  </ThemedText>
                )}
              </Animated.View>
            ))}
          </View>
        )}
      </Animated.View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
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
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badgeCard: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  badgeEmoji: {
    fontSize: 32,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: 11,
    textAlign: "center",
  },
  badgeDate: {
    fontSize: 10,
    fontWeight: "700",
  },
});
