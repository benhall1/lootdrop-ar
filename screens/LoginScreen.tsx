import React from "react";
import { View, StyleSheet, Image, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import { AuthService } from "../services/authService";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { theme } = useTheme();

  const handleAppleSignIn = async () => {
    try {
      const user = await AuthService.signInWithApple();
      if (user) {
        onLoginSuccess();
      }
    } catch (error) {
      Alert.alert("Sign In Failed", "Could not sign in with Apple. Please try again.");
    }
  };

  const handleGuestSignIn = async () => {
    try {
      await AuthService.signInAsGuest();
      onLoginSuccess();
    } catch (error) {
      Alert.alert("Error", "Could not continue as guest. Please try again.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
        />

        <ThemedText type="h1" style={styles.title}>
          LootDrop AR
        </ThemedText>

        <ThemedText
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          Discover treasure boxes at real-world locations and collect exclusive
          coupons and deals
        </ThemedText>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Feather name="camera" size={24} color={theme.primary} />
            <ThemedText style={styles.featureText}>AR Discovery</ThemedText>
          </View>
          <View style={styles.feature}>
            <Feather name="map" size={24} color={theme.secondary} />
            <ThemedText style={styles.featureText}>Location-Based</ThemedText>
          </View>
          <View style={styles.feature}>
            <Feather name="gift" size={24} color={theme.accent} />
            <ThemedText style={styles.featureText}>Real Rewards</ThemedText>
          </View>
        </View>

        <View style={styles.authButtons}>
          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={BorderRadius.md}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          <Button
            onPress={handleGuestSignIn}
            style={[
              styles.guestButton,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather name="user" size={20} color={theme.text} />
            <ThemedText style={styles.guestButtonText}>
              Continue as Guest
            </ThemedText>
          </Button>
        </View>

        <ThemedText
          style={[styles.disclaimer, { color: theme.textSecondary }]}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing["2xl"],
  },
  title: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing["3xl"],
  },
  features: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: Spacing["4xl"],
  },
  feature: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "600",
  },
  authButtons: {
    width: "100%",
    gap: Spacing.lg,
  },
  appleButton: {
    width: "100%",
    height: 52,
  },
  guestButton: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
  },
});
