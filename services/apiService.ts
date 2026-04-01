import * as WebBrowser from "expo-web-browser";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export class ApiService {
  /**
   * Get user's subscription status from the users table.
   */
  static async getSubscription(userId: string) {
    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("is_premium, subscription_status, stripe_subscription_id")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Get subscription error:", error);
      throw error;
    }
  }

  /**
   * List active products with prices from Stripe via Edge Function.
   */
  static async getProductsWithPrices() {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase.functions.invoke(
        "stripe-checkout",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (error) throw error;
      return data?.data || [];
    } catch (error) {
      console.error("Get products error:", error);
      throw error;
    }
  }

  /**
   * Create a Stripe Checkout session via Edge Function.
   */
  static async createCheckoutSession(
    userId: string,
    priceId: string,
    email: string,
    name: string
  ) {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase not configured");
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "stripe-checkout",
        {
          body: {
            userId,
            priceId,
            email,
            name,
            successUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/`,
            cancelUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/`,
          },
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Checkout error:", error);
      throw error;
    }
  }

  /**
   * Open a checkout URL in the browser.
   */
  static async openCheckout(checkoutUrl: string) {
    try {
      const result = await WebBrowser.openBrowserAsync(checkoutUrl);
      return result;
    } catch (error) {
      console.error("Open checkout error:", error);
      throw error;
    }
  }
}
