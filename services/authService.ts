import { Platform } from "react-native";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { Session } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  provider: "apple" | "google" | "email" | "guest";
  avatarTier: "gold" | "silver" | "bronze";
  isPremium: boolean;
  role: "consumer" | "merchant";
  businessName?: string;
  businessCategory?: string;
  businessLat?: number;
  businessLng?: number;
}

export class AuthService {
  /**
   * Sign in with Apple via Supabase Auth.
   * Falls back to guest if not on iOS.
   */
  static async signInWithApple(): Promise<User | null> {
    if (Platform.OS !== "ios") return null;

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: "lootdrop://auth/callback" },
      });

      if (error) throw error;
      // OAuth flow will redirect — session picked up by onAuthStateChange
      return null;
    } catch (error: any) {
      if (error.code === "ERR_CANCELED") return null;
      throw error;
    }
  }

  /**
   * Sign in with Google via Supabase Auth.
   */
  static async signInWithGoogle(): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: "lootdrop://auth/callback" },
      });

      if (error) throw error;
      return null;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  }

  /**
   * Sign in with email + password.
   * Creates account if it doesn't exist (signUp), otherwise signs in.
   */
  static async signInWithEmail(
    email: string,
    password: string
  ): Promise<User | null> {
    // Try sign in first
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInData.session) {
      return await this.sessionToUser(signInData.session);
    }

    // If sign-in fails, try sign up
    if (signInError) {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({ email, password });

      if (signUpError) throw signUpError;
      if (signUpData.session) {
        return await this.sessionToUser(signUpData.session);
      }
    }

    return null;
  }

  /**
   * Continue as guest — signs in anonymously via Supabase.
   */
  static async signInAsGuest(): Promise<User> {
    if (!isSupabaseConfigured) {
      return {
        id: this.generateGuestId(),
        name: "Guest User",
        email: "",
        provider: "guest",
        avatarTier: "bronze",
        isPremium: false,
        role: "consumer",
      };
    }
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      return {
        id: this.generateGuestId(),
        name: "Guest User",
        email: "",
        provider: "guest",
        avatarTier: "bronze",
        isPremium: false,
        role: "consumer",
      };
    }

    return {
      id: data.user?.id || this.generateGuestId(),
      name: "Guest User",
      email: "",
      provider: "guest",
      avatarTier: "bronze",
      isPremium: false,
      role: "consumer",
    };
  }

  /**
   * Get the currently signed-in user from Supabase session.
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return null;
      return await this.sessionToUser(session);
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  /**
   * Sign out from Supabase.
   */
  static async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  /**
   * Check if user is signed in.
   */
  static async isSignedIn(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session !== null;
    } catch {
      return false;
    }
  }

  /**
   * Update premium status in the users table.
   */
  static async updatePremiumStatus(isPremium: boolean): Promise<void> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from("users")
        .update({ is_premium: isPremium, updated_at: new Date().toISOString() })
        .eq("id", session.user.id);
    } catch (error) {
      console.error("Error updating premium status:", error);
    }
  }

  /**
   * Listen to auth state changes (sign in, sign out, token refresh).
   * Returns an unsubscribe function.
   */
  static onAuthStateChange(
    callback: (session: Session | null) => void
  ): () => void {
    if (!isSupabaseConfigured) {
      callback(null);
      return () => {};
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
    return () => subscription.unsubscribe();
  }

  static generateGuestId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert a Supabase session into our app's User interface.
   */
  private static async sessionToUser(session: Session): Promise<User> {
    const supaUser = session.user;
    const provider = (supaUser.app_metadata?.provider || "email") as User["provider"];

    const baseUser: User = {
      id: supaUser.id,
      name:
        supaUser.user_metadata?.full_name ||
        supaUser.user_metadata?.name ||
        "Treasure Hunter",
      email: supaUser.email || "",
      provider:
        provider === "apple"
          ? "apple"
          : provider === "google"
          ? "google"
          : "email",
      avatarTier: "bronze",
      isPremium: false,
      role: "consumer",
    };

    // Enrich with DB profile data
    try {
      const { data } = await supabase
        .from("users")
        .select("role, business_name, business_category, business_lat, business_lng, avatar_tier")
        .eq("id", supaUser.id)
        .single();

      if (data) {
        baseUser.role = data.role || "consumer";
        baseUser.businessName = data.business_name || undefined;
        baseUser.businessCategory = data.business_category || undefined;
        baseUser.businessLat = data.business_lat || undefined;
        baseUser.businessLng = data.business_lng || undefined;
        baseUser.avatarTier = data.avatar_tier || "bronze";
      }
    } catch {}

    return baseUser;
  }
}
