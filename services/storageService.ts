import AsyncStorage from "@react-native-async-storage/async-storage";
import { CollectedCoupon, LootBox } from "../types";
import { LogoService } from "./logoService";

const COLLECTED_COUPONS_KEY = "@lootdrop_collected_coupons";
const FAVORITE_LOCATIONS_KEY = "@lootdrop_favorites";
const ONBOARDING_KEY = "@lootdrop_onboarding_completed";

function ensureCouponHasLogo(coupon: CollectedCoupon): CollectedCoupon {
  if (!coupon.businessLogo && coupon.businessName) {
    return {
      ...coupon,
      businessLogo: LogoService.getBusinessLogo(coupon.businessName),
    };
  }
  return coupon;
}

export class StorageService {
  static async getCollectedCoupons(): Promise<CollectedCoupon[]> {
    try {
      const data = await AsyncStorage.getItem(COLLECTED_COUPONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting collected coupons:", error);
      return [];
    }
  }

  static async addCollectedCoupon(coupon: CollectedCoupon): Promise<void> {
    try {
      const enrichedCoupon = ensureCouponHasLogo(coupon);
      const coupons = await this.getCollectedCoupons();
      const existingIndex = coupons.findIndex((c) => c.id === enrichedCoupon.id);

      if (existingIndex >= 0) {
        coupons[existingIndex] = enrichedCoupon;
      } else {
        coupons.push(enrichedCoupon);
      }

      await AsyncStorage.setItem(COLLECTED_COUPONS_KEY, JSON.stringify(coupons));
    } catch (error) {
      console.error("Error adding collected coupon:", error);
    }
  }

  static async markCouponAsUsed(couponId: string): Promise<void> {
    try {
      const coupons = await this.getCollectedCoupons();
      const coupon = coupons.find((c) => c.id === couponId);

      if (coupon) {
        coupon.isUsed = true;
        await AsyncStorage.setItem(COLLECTED_COUPONS_KEY, JSON.stringify(coupons));
      }
    } catch (error) {
      console.error("Error marking coupon as used:", error);
    }
  }

  static async getFavoriteLocations(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(FAVORITE_LOCATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting favorites:", error);
      return [];
    }
  }

  static async toggleFavorite(lootBoxId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavoriteLocations();
      const index = favorites.indexOf(lootBoxId);

      if (index >= 0) {
        favorites.splice(index, 1);
        await AsyncStorage.setItem(FAVORITE_LOCATIONS_KEY, JSON.stringify(favorites));
        return false;
      } else {
        favorites.push(lootBoxId);
        await AsyncStorage.setItem(FAVORITE_LOCATIONS_KEY, JSON.stringify(favorites));
        return true;
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      return false;
    }
  }

  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      return completed === "true";
    } catch (error) {
      console.error("Error checking onboarding:", error);
      return false;
    }
  }

  static async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (error) {
      console.error("Error setting onboarding:", error);
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        COLLECTED_COUPONS_KEY,
        FAVORITE_LOCATIONS_KEY,
        ONBOARDING_KEY,
      ]);
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  }
}
