import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ScreenScrollView } from "../components/ScreenScrollView";
import { ThemedText } from "../components/ThemedText";
import { useTheme } from "../hooks/useTheme";
import { Spacing, BorderRadius } from "../constants/theme";
import { ApiService } from "../services/apiService";
import { UserService, User } from "../services/userService";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string };
  metadata?: { name?: string; popular?: string; savings?: string };
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata?: { features?: string };
  prices: Price[];
}

function PricingCard({
  price,
  productName,
  productDescription,
  features,
  isPopular,
  onSubscribe,
  isSubscribed,
  theme
}: {
  price: Price;
  productName: string;
  productDescription: string;
  features: string[];
  isPopular: boolean;
  onSubscribe: () => void;
  isSubscribed: boolean;
  theme: any;
}) {
  const amount = (price.unit_amount / 100).toFixed(2);
  const interval = price.recurring.interval;
  const savings = price.metadata?.savings;

  return (
    <View
      style={[
        styles.pricingCard,
        { backgroundColor: theme.backgroundDefault },
        isPopular && {
          borderColor: theme.primary,
          borderWidth: 2,
        },
      ]}
    >
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.popularText}>Most Popular</ThemedText>
        </View>
      )}

      {savings && (
        <View style={[styles.savingsBadge, { backgroundColor: theme.accent }]}>
          <ThemedText style={styles.savingsText}>Save {savings}</ThemedText>
        </View>
      )}

      <ThemedText type="h3" style={styles.pricingTitle}>
        {price.metadata?.name || interval.charAt(0).toUpperCase() + interval.slice(1)}
      </ThemedText>

      <View style={styles.priceContainer}>
        <ThemedText type="h1" style={[styles.priceAmount, { color: theme.primary }]}>
          ${amount}
        </ThemedText>
        <ThemedText style={[styles.priceInterval, { color: theme.textSecondary }]}>
          /{interval}
        </ThemedText>
      </View>

      <ThemedText style={[styles.productDescription, { color: theme.textSecondary }]}>
        {productDescription}
      </ThemedText>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Feather name="check-circle" size={16} color={theme.accent} />
            <ThemedText style={styles.featureText}>{feature}</ThemedText>
          </View>
        ))}
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSubscribe();
        }}
        style={[
          styles.subscribeButton,
          {
            backgroundColor: isSubscribed ? theme.backgroundSecondary : theme.primary,
            borderColor: isSubscribed ? theme.border : theme.primary,
          },
        ]}
        disabled={isSubscribed}
      >
        <ThemedText
          style={[
            styles.subscribeButtonText,
            { color: isSubscribed ? theme.textSecondary : "#FFFFFF" },
          ]}
        >
          {isSubscribed ? "Current Plan" : "Subscribe Now"}
        </ThemedText>
      </Pressable>
    </View>
  );
}

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      let currentUser = await UserService.getUser();
      
      if (!currentUser) {
        const guestId = UserService.generateGuestId();
        const result = await ApiService.createGuestUser(
          `${guestId}@guest.lootdrop.app`,
          "Guest User"
        );
        currentUser = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name || "Guest User",
          isPremium: result.user.is_premium || false,
        };
        await UserService.saveUser(currentUser);
      }

      setUser(currentUser);

      const subscriptionData = await ApiService.getSubscription(currentUser.id);
      setIsPremium(subscriptionData.isPremium || false);

      const productsData = await ApiService.getProductsWithPrices();
      setProducts(productsData);
    } catch (error) {
      console.error("Load data error:", error);
      Alert.alert("Error", "Failed to load subscription information");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      Alert.alert("Error", "Please try again");
      return;
    }

    try {
      const { url } = await ApiService.createCheckoutSession(
        user.id,
        priceId,
        user.email,
        user.name
      );

      await ApiService.openCheckout(url);

      Alert.alert(
        "Subscription Status",
        "Please refresh the app after completing your purchase to see your premium status.",
        [
          {
            text: "Refresh Now",
            onPress: () => loadData(),
          },
          { text: "Later", style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("Subscribe error:", error);
      Alert.alert("Error", "Failed to start checkout process");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScreenScrollView style={{ backgroundColor: theme.backgroundRoot }}>
      <View style={styles.header}>
        <ThemedText type="h1">Unlock Premium</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          Get unlimited access to all AR loot boxes and exclusive deals
        </ThemedText>
      </View>

      {isPremium && (
        <View style={[styles.premiumBadge, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="star" size={24} color={theme.primary} />
          <ThemedText style={[styles.premiumText, { color: theme.primary }]}>
            You're a Premium Member!
          </ThemedText>
        </View>
      )}

      {products.map((product) => {
        const features = product.metadata?.features
          ? JSON.parse(product.metadata.features)
          : [];

        const sortedPrices = [...product.prices].sort((a, b) => {
          if (a.recurring.interval === "month") return -1;
          if (b.recurring.interval === "month") return 1;
          return 0;
        });

        return sortedPrices.map((price) => {
          const isPopular = price.metadata?.popular === "true";

          return (
            <PricingCard
              key={price.id}
              price={price}
              productName={product.name}
              productDescription={product.description}
              features={features}
              isPopular={isPopular}
              onSubscribe={() => handleSubscribe(price.id)}
              isSubscribed={isPremium}
              theme={theme}
            />
          );
        });
      })}

      <View style={styles.footer}>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          Cancel anytime. Secure payment via Stripe.
        </ThemedText>
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
          Test with card: 4242 4242 4242 4242
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: 16,
    marginTop: Spacing.sm,
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  premiumText: {
    fontSize: 16,
    fontWeight: "600",
  },
  pricingCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    position: "relative",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  popularText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  savingsBadge: {
    position: "absolute",
    top: -12,
    left: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  savingsText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  pricingTitle: {
    marginBottom: Spacing.md,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.md,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: "700",
  },
  priceInterval: {
    fontSize: 18,
    marginLeft: Spacing.xs,
  },
  productDescription: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  featuresContainer: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  subscribeButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 2,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});
