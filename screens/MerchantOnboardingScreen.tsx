import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "../constants/theme";
import { LocationService } from "../services/locationService";
import { supabase } from "../services/supabaseClient";
import { LocationCategory } from "../types";

const CATEGORIES: { value: LocationCategory; label: string; emoji: string }[] = [
  { value: "restaurant", label: "Restaurant / Cafe", emoji: "🍕" },
  { value: "retail", label: "Retail / Shopping", emoji: "🛍️" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "services", label: "Services / Fitness", emoji: "💪" },
];

interface Props {
  userId: string;
  onComplete: () => void;
}

export default function MerchantOnboardingScreen({ userId, onComplete }: Props) {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<LocationCategory | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const detectLocation = async () => {
    setLocationLoading(true);
    const loc = await LocationService.getCurrentLocation();
    if (loc) {
      setLocation({ lat: loc.latitude, lng: loc.longitude });
    } else {
      Alert.alert("Location Error", "Could not detect your location. Please enable GPS.");
    }
    setLocationLoading(false);
  };

  useEffect(() => {
    if (step === 3 && !location) {
      detectLocation();
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!businessName || !category || !location) {
      Alert.alert("Missing Info", "Please complete all steps.");
      return;
    }

    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          role: "merchant",
          business_name: businessName,
          business_category: category,
          business_lat: location.lat,
          business_lng: location.lng,
        })
        .eq("id", userId);

      if (error) throw error;

      Alert.alert(
        "Welcome, Merchant!",
        `${businessName} is now set up. Start creating loot drops!`,
        [{ text: "Let's Go", onPress: onComplete }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not save merchant profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenScrollView>
      {/* Progress */}
      <View style={styles.progress}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              {
                backgroundColor: s <= step ? theme.primary : theme.border,
                width: s === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Step 1: Business Name */}
      {step === 1 && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
          <ThemedText style={styles.stepEmoji}>🏪</ThemedText>
          <ThemedText type="h2" style={styles.stepTitle}>
            What's your business?
          </ThemedText>
          <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
            This is the name customers will see on loot drops.
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="e.g., Joe's Pizza"
            placeholderTextColor={theme.textSecondary}
            value={businessName}
            onChangeText={setBusinessName}
            autoFocus
          />
          <Button
            title="Next"
            onPress={() => {
              if (!businessName.trim()) {
                Alert.alert("Required", "Enter your business name.");
                return;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep(2);
            }}
          />
        </Animated.View>
      )}

      {/* Step 2: Category */}
      {step === 2 && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
          <ThemedText style={styles.stepEmoji}>📂</ThemedText>
          <ThemedText type="h2" style={styles.stepTitle}>
            Pick a category
          </ThemedText>
          <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
            Helps customers find your drops.
          </ThemedText>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(cat.value);
                }}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: category === cat.value ? theme.primary + "15" : theme.backgroundSecondary,
                    borderColor: category === cat.value ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText style={styles.categoryEmoji}>{cat.emoji}</ThemedText>
                <ThemedText style={[styles.categoryLabel, { color: category === cat.value ? theme.primary : theme.text }]}>
                  {cat.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.buttonRow}>
            <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={theme.textSecondary} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Button
                title="Next"
                onPress={() => {
                  if (!category) {
                    Alert.alert("Required", "Pick a category.");
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStep(3);
                }}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
          <ThemedText style={styles.stepEmoji}>📍</ThemedText>
          <ThemedText type="h2" style={styles.stepTitle}>
            Your location
          </ThemedText>
          <ThemedText style={[styles.stepDesc, { color: theme.textSecondary }]}>
            Drops will be placed at your business location. Customers must be nearby to claim.
          </ThemedText>
          <View style={[styles.locationBox, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            {location ? (
              <>
                <Feather name="check-circle" size={24} color={theme.success} />
                <ThemedText style={{ color: theme.text, fontWeight: "600" }}>
                  Location detected
                </ThemedText>
                <ThemedText style={{ color: theme.textSecondary, fontSize: 12 }}>
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </ThemedText>
              </>
            ) : (
              <>
                <Feather name={locationLoading ? "loader" : "map-pin"} size={24} color={theme.textSecondary} />
                <ThemedText style={{ color: theme.textSecondary }}>
                  {locationLoading ? "Detecting location..." : "Location not detected"}
                </ThemedText>
              </>
            )}
          </View>
          {!location && !locationLoading && (
            <Button title="Retry Location" onPress={detectLocation} variant="outline" />
          )}
          <View style={styles.buttonRow}>
            <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={theme.textSecondary} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Button
                title={submitting ? "Setting up..." : "Become a Merchant"}
                onPress={handleSubmit}
                disabled={!location || submitting}
              />
            </View>
          </View>
        </Animated.View>
      )}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: Spacing["2xl"],
    alignItems: "center",
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    gap: Spacing.lg,
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  stepEmoji: {
    fontSize: 48,
  },
  stepTitle: {
    textAlign: "center",
    fontFamily: Fonts?.display,
  },
  stepDesc: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
  },
  input: {
    width: "100%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  categoryGrid: {
    width: "100%",
    gap: Spacing.sm,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  locationBox: {
    width: "100%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
    alignItems: "center",
  },
  backBtn: {
    padding: Spacing.sm,
  },
});
