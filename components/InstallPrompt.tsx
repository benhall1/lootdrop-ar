import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

const DISMISS_KEY = "@lootdrop_install_dismissed";

/**
 * PWA install banner — only renders on web when the browser
 * fires `beforeinstallprompt` and the user hasn't dismissed it.
 */
export function InstallPrompt() {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (Platform.OS !== "web") return;

    let mounted = true;

    // Check if user previously dismissed
    AsyncStorage.getItem(DISMISS_KEY).then((val) => {
      if (val === "true") return;

      const handler = (e: Event) => {
        e.preventDefault();
        if (!mounted) return;
        setDeferredPrompt(e);
        setVisible(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }).start();
      };

      window.addEventListener("beforeinstallprompt", handler as any);

      return () => {
        window.removeEventListener("beforeinstallprompt", handler as any);
      };
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = async () => {
    await AsyncStorage.setItem(DISMISS_KEY, "true");
    Animated.timing(slideAnim, {
      toValue: 80,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (Platform.OS !== "web" || !visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundSecondary,
          borderColor: theme.border,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.icon}>🎯</Text>
      <Text style={[styles.label, { color: theme.text }]}>
        Install LootDrop
      </Text>
      <Pressable
        onPress={handleInstall}
        style={[styles.installButton, { backgroundColor: theme.primary }]}
      >
        <Text style={[styles.installText, { color: theme.buttonText }]}>
          Install
        </Text>
      </Pressable>
      <Pressable onPress={handleDismiss} style={styles.dismissButton}>
        <Text style={[styles.dismissText, { color: theme.textSecondary }]}>
          ✕
        </Text>
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    zIndex: 9999,
  },
  icon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  installButton: {
    borderRadius: BorderRadius.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginRight: Spacing.sm,
  },
  installText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dismissButton: {
    padding: Spacing.sm,
  },
  dismissText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
