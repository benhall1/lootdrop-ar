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
import { Spacing, BorderRadius, Fonts, Shadows } from "../constants/theme";
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

    setIsLoading(true);
    try {
      const user = await AuthService.signInWithEmail(email.trim(), password);
      if (user) {
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
      {/* Ambient glow orbs */}
      <GlowingOrb delay={0} size={200} color={theme.primaryGlow} style={{ top: "5%", left: "-15%" }} />
      <GlowingOrb delay={1000} size={160} color={theme.secondaryGlow} style={{ top: "15%", right: "-10%" }} />
      <GlowingOrb delay={2000} size={240} color={theme.accentGlow} style={{ bottom: "10%", left: "-20%" }} />
      <GlowingOrb delay={500} size={120} color={theme.primaryGlow} style={{ bottom: "25%", right: "-8%" }} />

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(800).delay(200)}>
          <FloatingChest />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(400)} style={styles.titleBlock}>
          <ThemedText
            type="h1"
            style={[styles.title, { fontFamily: Fonts?.display }]}
          >
            LootDrop
          </ThemedText>
          <View style={[styles.tagBadge, { backgroundColor: theme.primary }]}>
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
            { icon: "crosshair", label: "Discover", color: theme.primary },
            { icon: "map-pin", label: "Explore", color: theme.secondary },
            { icon: "gift", label: "Collect", color: theme.accent },
          ].map((f, i) => (
            <View key={f.label} style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + "20" }]}>
                <Feather name={f.icon as any} size={22} color={f.color} />
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
              <TextInput
                placeholder="Password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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
                borderColor: theme.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="zap" size={18} color={theme.textSecondary} />
            <ThemedText style={[styles.guestText, { color: theme.textSecondary }]}>
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
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 109, 58, 0.15)",
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 32,
  },
  titleBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 42,
    letterSpacing: -1.5,
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
