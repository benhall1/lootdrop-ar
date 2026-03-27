import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, Platform, Alert, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { ThemedText } from "../components/ThemedText";
import { ThemedView } from "../components/ThemedView";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts, Shadows, Gradients, WebShadows } from "../constants/theme";
import { AuthService } from "../services/authService";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

function GlowingOrb({ delay, size, color, style }: { delay: number; size: number; color: string; style?: any }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

function FloatingChest() {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  return (
    <Animated.View style={[styles.logoWrapper, animatedStyle]}>
      <View style={styles.logoGlow} />
      <Image
        source={require("../assets/images/icon.png")}
        style={styles.logo}
      />
    </Animated.View>
  );
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { theme } = useTheme();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      await AuthService.signInWithApple();
    } catch (error) {
      Alert.alert("Sign In Failed", "Could not sign in with Apple. Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await AuthService.signInWithGoogle();
    } catch (error) {
      Alert.alert("Sign In Failed", "Could not sign in with Google. Please try again.");
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.signInWithEmail(email.trim(), password);
      if (result?.needsConfirmation) {
        Alert.alert(
          "Check Your Email",
          "We sent a confirmation link to " + email.trim() + ". Tap the link to activate your account, then sign in."
        );
      } else if (result?.user) {
        onLoginSuccess();
      }
    } catch (error: any) {
      Alert.alert(
        "Sign In Failed",
        error.message || "Could not sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
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
      {/* Atmospheric gradient mesh background (web) */}
      {Platform.OS === "web" && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              background: Gradients.web.heroMesh,
            } as any,
          ]}
        />
      )}

      {/* Ambient glow orbs */}
      <GlowingOrb delay={0} size={220} color={theme.primaryGlow} style={{ top: "3%", left: "-18%" }} />
      <GlowingOrb delay={1200} size={180} color={theme.secondaryGlow} style={{ top: "12%", right: "-12%" }} />
      <GlowingOrb delay={2500} size={260} color={theme.accentGlow} style={{ bottom: "8%", left: "-22%" }} />
      <GlowingOrb delay={600} size={140} color={theme.primaryGlow} style={{ bottom: "28%", right: "-10%" }} />

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(900).delay(200)}>
          <FloatingChest />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.titleBlock}>
          <ThemedText
            type="h1"
            style={[styles.title, { fontFamily: Fonts?.display }]}
          >
            LootDrop
          </ThemedText>
          <View
            style={[
              styles.tagBadge,
              {
                backgroundColor: theme.primary,
                ...Platform.select({
                  web: { boxShadow: WebShadows.neonOrange },
                  default: {},
                }),
              },
            ]}
          >
            <ThemedText style={styles.tagText}>AR</ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(600)}>
          <ThemedText
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            Hunt treasure. Find deals.{"\n"}Collect real rewards nearby.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(800)} style={styles.features}>
          {[
            { icon: "crosshair", label: "Discover", color: theme.primary, emoji: "🎯" },
            { icon: "map-pin", label: "Explore", color: theme.secondary, emoji: "🗺️" },
            { icon: "gift", label: "Collect", color: theme.accent, emoji: "🎁" },
          ].map((f, i) => (
            <View key={f.label} style={styles.feature}>
              <View
                style={[
                  styles.featureIcon,
                  {
                    backgroundColor: f.color + "18",
                    borderWidth: 1,
                    borderColor: f.color + "30",
                    ...Platform.select({
                      web: { boxShadow: `0 0 20px ${f.color}20` },
                      default: {},
                    }),
                  },
                ]}
              >
                <ThemedText style={{ fontSize: 22 }}>{f.emoji}</ThemedText>
              </View>
              <ThemedText style={[styles.featureText, { fontFamily: Fonts?.sans }]}>
                {f.label}
              </ThemedText>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(1000)} style={styles.authButtons}>
          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={BorderRadius.md}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}

          <Pressable
            onPress={handleGoogleSignIn}
            style={({ pressed }) => [
              styles.socialButton,
              {
                backgroundColor: "#FFFFFF",
                borderColor: theme.border,
                borderWidth: 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText style={[styles.socialButtonText, { color: "#333" }]}>
              Continue with Google
            </ThemedText>
          </Pressable>

          {showEmailForm ? (
            <View style={styles.emailForm}>
              <TextInput
                placeholder="Email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.text,
                    borderColor: theme.border,
                    fontFamily: Fonts?.sans,
                  },
                ]}
              />
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      color: theme.text,
                      borderColor: theme.border,
                      fontFamily: Fonts?.sans,
                    },
                  ]}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.textSecondary}
                  />
                </Pressable>
              </View>
              <Button
                onPress={handleEmailSignIn}
                style={[styles.emailButton, { opacity: isLoading ? 0.6 : 1 }]}
              >
                {isLoading ? "Signing in..." : "Let's Go!"}
              </Button>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowEmailForm(true)}
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="mail" size={20} color={theme.text} />
              <ThemedText style={[styles.socialButtonText, { color: theme.text }]}>
                Continue with Email
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            onPress={handleGuestSignIn}
            style={({ pressed }) => [
              styles.guestButton,
              {
                borderColor: theme.primary + "40",
                opacity: pressed ? 0.7 : 1,
                ...Platform.select({
                  web: {
                    boxShadow: `0 0 16px ${theme.primaryGlow}`,
                    animation: "lootdrop-border-glow 3s ease-in-out infinite",
                  },
                  default: {},
                }),
              },
            ]}
          >
            <ThemedText style={{ fontSize: 16 }}>⚡</ThemedText>
            <ThemedText style={[styles.guestText, { color: theme.primary }]}>
              Quick Play as Guest
            </ThemedText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(1200)}>
          <ThemedText
            style={[styles.disclaimer, { color: theme.textSecondary }]}
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </ThemedText>
        </Animated.View>
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
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["2xl"],
  },
  logoGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 109, 58, 0.12)",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 36,
  },
  titleBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 48,
    letterSpacing: -2,
  },
  tagBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    marginTop: -8,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 17,
    lineHeight: 26,
    marginBottom: Spacing["3xl"],
  },
  features: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing["3xl"],
    marginBottom: Spacing["4xl"],
  },
  feature: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  authButtons: {
    width: "100%",
    gap: Spacing.md,
  },
  appleButton: {
    width: "100%",
    height: 54,
  },
  socialButton: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: BorderRadius.md,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emailForm: {
    width: "100%",
    gap: Spacing.sm,
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  passwordWrapper: {
    width: "100%",
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  emailButton: {
    marginTop: Spacing.xs,
  },
  guestButton: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  guestText: {
    fontSize: 15,
    fontWeight: "600",
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
    lineHeight: 18,
  },
});
