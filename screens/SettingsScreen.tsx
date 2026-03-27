import React, { useState, useEffect } from "react";
import { View, StyleSheet, Switch, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../contexts/ToastContext";
import { PushService } from "../services/pushService";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { useTour } from "../contexts/GuidedTourContext";

const PREFS_KEY = "@lootdrop_settings";

interface Preferences {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  pushEnabled: boolean;
}

const DEFAULT_PREFS: Preferences = {
  soundEnabled: true,
  hapticsEnabled: true,
  pushEnabled: false,
};

async function loadPrefs(): Promise<Preferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

async function savePrefs(prefs: Preferences) {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

function SettingRow({
  icon,
  label,
  description,
  value,
  onToggle,
}: {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={icon as any} size={18} color={theme.text} />
      </View>
      <View style={styles.rowText}>
        <ThemedText style={[styles.rowLabel, { fontFamily: Fonts?.sans }]}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.rowDesc, { color: theme.textSecondary }]} numberOfLines={2}>
          {description}
        </ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.backgroundTertiary, true: theme.primary + "60" }}
        thumbColor={value ? theme.primary : theme.textSecondary}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const toast = useToast();
  const { resetTour } = useTour();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);

  useEffect(() => {
    loadPrefs().then(setPrefs);
  }, []);

  const updatePref = (key: keyof Preferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
    if (prefs.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const supported = await PushService.isSupported();
      if (!supported) {
        toast.error("Push notifications not supported in this browser");
        return;
      }
      const success = await PushService.subscribe();
      if (!success) {
        toast.error("Could not enable notifications. Check browser permissions.");
        return;
      }
      toast.success("Notifications enabled");
    } else {
      await PushService.unsubscribe();
      toast.info("Notifications disabled");
    }
    updatePref("pushEnabled", enabled);
  };

  return (
    <ScreenScrollView>
      <Animated.View entering={FadeInDown.duration(400)}>
        <ThemedText type="h3" style={{ fontFamily: Fonts?.display, marginBottom: Spacing.lg }}>
          Settings
        </ThemedText>
      </Animated.View>

      {/* Preferences */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)}>
        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          PREFERENCES
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <SettingRow
            icon="volume-2"
            label="Sound Effects"
            description="Play sounds when discovering and claiming loot"
            value={prefs.soundEnabled}
            onToggle={(v) => updatePref("soundEnabled", v)}
          />
          <SettingRow
            icon="smartphone"
            label="Haptic Feedback"
            description="Vibrate on interactions"
            value={prefs.hapticsEnabled}
            onToggle={(v) => updatePref("hapticsEnabled", v)}
          />
          <SettingRow
            icon="bell"
            label="Push Notifications"
            description="Get notified about new drops nearby"
            value={prefs.pushEnabled}
            onToggle={handlePushToggle}
          />
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)}>
        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          ACTIONS
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Pressable
            onPress={async () => {
              await resetTour();
              toast.success("Tour restarted!");
            }}
            style={[styles.actionRow, { borderColor: theme.border }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="play-circle" size={18} color={theme.text} />
            </View>
            <View style={styles.rowText}>
              <ThemedText style={[styles.rowLabel, { fontFamily: Fonts?.sans }]}>
                Replay Tour
              </ThemedText>
              <ThemedText style={[styles.rowDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                Walk through the app features again
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
      </Animated.View>

      {/* About */}
      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          ABOUT
        </ThemedText>
        <View style={[styles.section, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <View style={[styles.aboutRow, { borderColor: theme.border }]}>
            <ThemedText style={styles.aboutLabel}>Version</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>1.0.0</ThemedText>
          </View>
          <View style={[styles.aboutRow, { borderColor: theme.border }]}>
            <ThemedText style={styles.aboutLabel}>Platform</ThemedText>
            <ThemedText style={{ color: theme.textSecondary }}>
              {Platform.OS === "web" ? "Web (PWA)" : Platform.OS}
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <ThemedText style={[styles.footer, { color: theme.textSecondary }]}>
          LootDrop AR — Hunt treasure. Find deals.
        </ThemedText>
      </Animated.View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing["2xl"],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 0.5,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowDesc: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 0.5,
  },
  aboutLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: Spacing.lg,
    marginBottom: Spacing["3xl"],
  },
});
