import { supabase } from "./supabaseClient";
import { CollectedCoupon } from "../types";

export interface GamificationResult {
  xp_earned: number;
  total_xp: number;
  xp_events: Array<{ type: string; amount: number; message: string }>;
  new_badges: Array<{ id: string; name: string; emoji: string }>;
  leveled_up: boolean;
  previous_level: number;
  new_level: number;
  tier_changed: boolean;
  new_tier: "bronze" | "silver" | "gold";
  streak: number;
}

export interface ClaimResult {
  success: boolean;
  coupon?: CollectedCoupon;
  error?: "not_found" | "expired" | "already_claimed" | "too_far" | "max_claims" | "rate_limited" | "unknown";
  message?: string;
  gamification?: GamificationResult;
}

/**
 * Service for claiming loot boxes and managing collected coupons.
 *
 *   claimLootBox(boxId, userLat, userLng)
 *       │
 *       ▼
 *   Supabase RPC: claim_loot_box (PostgreSQL function)
 *       │
 *       ├── Check: box exists + active + not expired
 *       ├── Check: UNIQUE(user_id, box_id) → no double-claim
 *       ├── Check: ST_Distance < 100m → must be nearby
 *       ├── Check: claims_count < max_claims
 *       ├── INSERT claim + UPDATE claims_count + UPDATE user XP
 *       │
 *       ▼
 *   ClaimResult { success, coupon, error }
 */
export class ClaimService {
  /**
   * Attempt to claim a loot box.
   * Calls the server-side RPC function which validates distance + uniqueness.
   */
  static async claimLootBox(
    boxId: string,
    userLatitude: number,
    userLongitude: number
  ): Promise<ClaimResult> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return {
          success: false,
          error: "unknown",
          message: "You must be signed in to claim a loot box.",
        };
      }

      const { data, error } = await supabase.rpc("claim_loot_box", {
        p_box_id: boxId,
        p_user_id: session.user.id,
        p_user_lat: userLatitude,
        p_user_lng: userLongitude,
      });

      if (error) {
        return {
          success: false,
          error: "unknown",
          message: error.message || "Failed to claim loot box",
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || "unknown",
          message: data.message || "Could not claim this loot box",
        };
      }

      return {
        success: true,
        coupon: data.coupon,
        gamification: data.gamification || undefined,
      };
    } catch (error: any) {
      console.error("Claim error:", error);
      return {
        success: false,
        error: "unknown",
        message: "Network error. Please check your connection and try again.",
      };
    }
  }

  /**
   * Get all coupons claimed by the current user.
   */
  static async getClaimedCoupons(): Promise<CollectedCoupon[]> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return [];

      const { data, error } = await supabase
        .from("claims")
        .select(
          `
          id,
          is_used,
          used_at,
          created_at,
          loot_boxes (
            id, coupon_code, coupon_title, coupon_desc,
            discount_type, discount_value, expires_at,
            business_name, business_logo
          )
        `
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapClaimToCoupon);
    } catch (error) {
      console.error("Error fetching claimed coupons:", error);
      return [];
    }
  }

  /**
   * Mark a claimed coupon as used.
   */
  static async markAsUsed(claimId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("claims")
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq("id", claimId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error marking coupon as used:", error);
      return false;
    }
  }
}

function mapClaimToCoupon(claim: any): CollectedCoupon {
  const box = claim.loot_boxes;
  return {
    id: claim.id,
    code: box.coupon_code,
    title: box.coupon_title,
    description: box.coupon_desc || "",
    discountType: box.discount_type,
    value:
      box.discount_type === "percentage"
        ? `${box.discount_value}%`
        : box.discount_type === "fixed"
        ? `$${box.discount_value}`
        : "Free",
    expiresAt: new Date(box.expires_at).getTime(),
    businessName: box.business_name,
    businessLogo: box.business_logo,
    collectedAt: new Date(claim.created_at).getTime(),
    isUsed: claim.is_used,
  };
}
