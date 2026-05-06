import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ThemedText } from "../components/ThemedText";
import { Button } from "../components/Button";
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
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {Platform.OS === "web" && (
        <View style={styles.glowBackdrop as any} pointerEvents="none" />
      )}

      <View style={styles.progress}>
        {[1, 2, 3].map((s) => {
          const active = s <= step;
          const current = s === step;
          return (
            <View
              key={s}
              style={[
                styles.progressDot,
                {
                  backgroundColor: active ? "#FF6D3A" : "rgba(0, 229, 255, 0.15)",
                  width: current ? 28 : 8,
                  ...Platform.select({
                    web: {
                      boxShadow: active
                        ? "0 0 12px rgba(255, 109, 58, 0.6)"
                        : "none",
                    },
                    default: {},
                  }),
                },
              ]}
            />
          );
        })}
      </View>
      <ThemedText style={styles.stepLabel}>STEP {step} OF 3</ThemedText>

      {step === 1 && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
          <View style={styles.emojiHalo}>
            <ThemedText style={styles.stepEmoji}>🏪</ThemedText>
          </View>
          <ThemedText style={styles.stepTitle}>What's your business?</ThemedText>
          <ThemedText style={styles.stepDesc}>
            This is the name customers will see on loot drops.
          </ThemedText>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="e.g., Joe's Pizza"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={businessName}
              onChangeText={setBusinessName}
              autoFocus
            />
          </View>
          <Button
            onPress={() => {
              if (!businessName.trim()) {
                Alert.alert("Required", "Enter your business name.");
                return;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep(2);
            }}
            style={styles.primaryBtn}
          >
            Next →
          </Button>
        </Animated.View>
      )}

      {step === 2 && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
          <View style={styles.emojiHalo}>
            <ThemedText style={styles.stepEmoji}>📂</ThemedText>
          </View>
          <ThemedText style={styles.stepTitle}>Pick a category</ThemedText>
          <ThemedText style={styles.stepDesc}>Helps customers find your drops.</ThemedText>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const selected = category === cat.value;
              return (
                <Pressable
                  key={cat.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(cat.value);
                  }}
                  style={[
                    styles.categoryCard,
                    selected ? styles.categoryCardSelected : null,
                  ]}
                >
                  <ThemedText style={styles.categoryEmoji}>{cat.emoji}</ThemedText>
                  <ThemedText
                    style={[
                      styles.categoryLabel,
                      { color: selected ? "#FFD54F" : "#fff" },
                    ]}
                  >
                    {cat.label}
                  </ThemedText>
                  {selected && (
                    <View style={styles.categoryCheck}>
                      <Feather name="check" size={14} color="#0a0d1c" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.buttonRow}>
            <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color="#00E5FF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Button
                onPress={() => {
                  if (!category) {
                    Alert.alert("Required", "Pick a category.");
                    return;
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStep(3);
                }}
                style={styles.primaryBtn}
              >
                Next →
              </Button>
            </View>
          </View>
        </Animated.View>
      )}

      {step === 3 && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.stepContainer}>
          <View style={styles.emojiHalo}>
            <ThemedText style={styles.stepEmoji}>📍</ThemedText>
          </View>
          <ThemedText style={styles.stepTitle}>Your location</ThemedText>
          <ThemedText style={styles.stepDesc}>
            Drops will be placed at your business location. Customers must be nearby to claim.
          </ThemedText>
          <View
            style={[
              styles.locationBox,
              location ? styles.locationBoxFound : styles.locationBoxPending,
            ]}
          >
            {location ? (
              <>
                <Feather name="check-circle" size={28} color="#34D399" />
                <ThemedText style={styles.locationLabel}>LOCATION LOCKED</ThemedText>
                <ThemedText style={styles.locationCoords}>
                  {location.lat.toFixed(4)}° · {location.lng.toFixed(4)}°
                </ThemedText>
              </>
            ) : (
              <>
                <Feather
                  name={locationLoading ? "loader" : "map-pin"}
                  size={28}
                  color={locationLoading ? "#00E5FF" : "rgba(255,255,255,0.5)"}
                />
                <ThemedText style={styles.locationLabel}>
                  {locationLoading ? "SCANNING..." : "AWAITING SIGNAL"}
                </ThemedText>
                <ThemedText style={styles.locationCoords}>
                  {locationLoading ? "----, ----" : "GPS not detected"}
                </ThemedText>
              </>
            )}
          </View>
          {!location && !locationLoading && (
            <Pressable onPress={detectLocation} style={styles.outlineBtn}>
              <Feather name="refresh-cw" size={16} color="#00E5FF" />
              <ThemedText style={styles.outlineBtnText}>Retry Location</ThemedText>
            </Pressable>
          )}
          <View style={styles.buttonRow}>
            <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color="#00E5FF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Button
                onPress={handleSubmit}
                disabled={!location || submitting}
                style={styles.primaryBtn}
              >
                {submitting ? "Setting up..." : "Become a Merchant 🚀"}
              </Button>
            </View>
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollRoot: {
    flex: 1,
    backgroundColor: "#0a0d1c",
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  glowBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    ...Platform.select({
      web: {
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(255, 109, 58, 0.18) 0%, transparent 60%), " +
          "radial-gradient(ellipse at 80% 20%, rgba(0, 229, 255, 0.12) 0%, transparent 50%)",
      } as any,
      default: {},
    }),
  },
  progress: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: Spacing.sm,
    alignItems: "center",
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  stepLabel: {
    textAlign: "center",
    color: "#00E5FF",
    fontFamily: Fonts?.mono as any,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: Spacing["2xl"],
  },
  stepContainer: {
    gap: Spacing.lg,
    alignItems: "center",
  },
  emojiHalo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255, 109, 58, 0.12)",
    borderWidth: 2,
    borderColor: "rgba(255, 109, 58, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow:
          "0 0 32px rgba(255, 109, 58, 0.35), inset 0 0 24px rgba(255, 109, 58, 0.15)",
      } as any,
      default: {
        shadowColor: "#FF6D3A",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  stepEmoji: {
    fontSize: 44,
  },
  stepTitle: {
    textAlign: "center",
    fontFamily: Fonts?.display as any,
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    ...Platform.select({
      web: {
        textShadow: "0 0 20px rgba(255, 109, 58, 0.4)",
      } as any,
      default: {},
    }),
  },
  stepDesc: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
    maxWidth: "85%",
  },
  inputWrap: {
    width: "100%",
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: "rgba(0, 229, 255, 0.4)",
    backgroundColor: "rgba(15, 19, 38, 0.85)",
    ...Platform.select({
      web: {
        boxShadow:
          "0 0 16px rgba(0, 229, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
      } as any,
      default: {},
    }),
  },
  input: {
    width: "100%",
    padding: Spacing.md,
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    fontFamily: Fonts?.sans as any,
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
    backgroundColor: "rgba(15, 19, 38, 0.85)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  categoryCardSelected: {
    borderColor: "#FFD54F",
    backgroundColor: "rgba(255, 213, 79, 0.1)",
    ...Platform.select({
      web: {
        boxShadow:
          "0 0 20px rgba(255, 213, 79, 0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
      } as any,
      default: {},
    }),
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    fontFamily: Fonts?.sans as any,
  },
  categoryCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFD54F",
    alignItems: "center",
    justifyContent: "center",
  },
  locationBox: {
    width: "100%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: "center",
    gap: Spacing.xs,
  },
  locationBoxFound: {
    backgroundColor: "rgba(52, 211, 153, 0.08)",
    borderColor: "rgba(52, 211, 153, 0.5)",
    ...Platform.select({
      web: {
        boxShadow:
          "0 0 24px rgba(52, 211, 153, 0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
      } as any,
      default: {},
    }),
  },
  locationBoxPending: {
    backgroundColor: "rgba(15, 19, 38, 0.85)",
    borderColor: "rgba(0, 229, 255, 0.3)",
    borderStyle: "dashed",
  },
  locationLabel: {
    fontFamily: Fonts?.mono as any,
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 2,
    marginTop: 4,
  },
  locationCoords: {
    fontFamily: Fonts?.mono as any,
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: "#00E5FF",
    backgroundColor: "rgba(0, 229, 255, 0.08)",
    width: "100%",
    ...Platform.select({
      web: {
        boxShadow: "0 0 12px rgba(0, 229, 255, 0.25)",
      } as any,
      default: {},
    }),
  },
  outlineBtnText: {
    fontFamily: Fonts?.sans as any,
    color: "#00E5FF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  primaryBtn: {
    width: "100%",
    ...Platform.select({
      web: {
        boxShadow:
          "0 0 24px rgba(255, 109, 58, 0.5), 0 4px 16px rgba(0,0,0,0.3)",
      } as any,
      default: {},
    }),
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
    alignItems: "center",
  },
  backBtn: {
    width: 44,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: "rgba(0, 229, 255, 0.3)",
    backgroundColor: "rgba(15, 19, 38, 0.85)",
  },
});
