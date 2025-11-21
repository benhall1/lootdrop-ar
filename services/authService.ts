import * as AppleAuthentication from "expo-apple-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface User {
  id: string;
  name: string;
  email: string;
  provider: "apple" | "guest";
  avatarTier: "gold" | "silver" | "bronze";
}

const STORAGE_KEY = "@lootdrop_user";

export class AuthService {
  static async signInWithApple(): Promise<User | null> {
    try {
      if (Platform.OS !== "ios") {
        return null;
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return null;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const user: User = {
        id: credential.user,
        name:
          credential.fullName?.givenName ||
          credential.fullName?.familyName ||
          "Treasure Hunter",
        email: credential.email || "",
        provider: "apple",
        avatarTier: "gold",
      };

      await this.saveUser(user);
      return user;
    } catch (error: any) {
      if (error.code === "ERR_CANCELED") {
        return null;
      }
      throw error;
    }
  }

  static async signInAsGuest(): Promise<User> {
    const user: User = {
      id: `guest_${Date.now()}`,
      name: "Guest User",
      email: "",
      provider: "guest",
      avatarTier: "bronze",
    };

    await this.saveUser(user);
    return user;
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEY);
      if (!userJson) return null;
      return JSON.parse(userJson);
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  static async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Error saving user:", error);
    }
  }

  static async signOut(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  static async isSignedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}
