import { supabase } from "./supabaseClient";
import { LootBox } from "../types";

/**
 * Service for querying loot boxes from Supabase.
 * Replaces the hardcoded mockData.ts for production use.
 *
 *   getNearby(lat, lng, radiusKm)
 *       │
 *       ▼
 *   Supabase RPC: nearby_loot_boxes
 *       │
 *       ├── ST_DWithin(location, point, radius)
 *       ├── is_active = true
 *       └── expires_at > now()
 *       │
 *       ▼
 *   LootBox[] sorted by distance
 */
export class LootBoxService {
  /**
   * Fetch active loot boxes near a location.
   * Uses PostGIS ST_DWithin for efficient spatial query.
   */
  static async getNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 2
  ): Promise<LootBox[]> {
    try {
      const { data, error } = await supabase.rpc("nearby_loot_boxes", {
        user_lat: latitude,
        user_lng: longitude,
        radius_m: radiusKm * 1000,
      });

      if (error) throw error;
      return (data || []).map(mapRowToLootBox);
    } catch (error) {
      console.error("Error fetching nearby loot boxes:", error);
      return [];
    }
  }

  /**
   * Fetch all loot boxes (no location filter).
   * Used when location is unavailable.
   */
  static async getAll(category?: string): Promise<LootBox[]> {
    try {
      let query = supabase
        .from("loot_boxes")
        .select("*")
        .eq("is_active", true)
        .gte("expires_at", new Date().toISOString())
        .order("drop_time", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapRowToLootBox);
    } catch (error) {
      console.error("Error fetching loot boxes:", error);
      return [];
    }
  }

  /**
   * Fetch a single loot box by ID.
   */
  static async getById(id: string): Promise<LootBox | null> {
    try {
      const { data, error } = await supabase
        .from("loot_boxes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data ? mapRowToLootBox(data) : null;
    } catch (error) {
      console.error("Error fetching loot box:", error);
      return null;
    }
  }
}

/**
 * Map a Supabase row to the app's LootBox interface.
 */
function mapRowToLootBox(row: any): LootBox {
  return {
    id: row.id,
    title: row.title,
    latitude: row.latitude ?? extractLat(row.location),
    longitude: row.longitude ?? extractLng(row.location),
    category: row.category,
    businessName: row.business_name,
    businessLogo: row.business_logo,
    dropTime: new Date(row.drop_time).getTime(),
    isActive: row.is_active,
    coupon: {
      id: `coupon_${row.id}`,
      code: row.coupon_code,
      title: row.coupon_title,
      description: row.coupon_desc || "",
      discountType: row.discount_type,
      value:
        row.discount_type === "percentage"
          ? `${row.discount_value}%`
          : row.discount_type === "fixed"
          ? `$${row.discount_value}`
          : "Free",
      expiresAt: new Date(row.expires_at).getTime(),
      businessName: row.business_name,
      businessLogo: row.business_logo,
    },
  };
}

/**
 * Extract latitude from a PostGIS GEOGRAPHY point.
 * PostGIS returns points as "POINT(lng lat)" or as GeoJSON.
 */
function extractLat(location: any): number {
  if (!location) return 0;
  if (typeof location === "object" && location.coordinates) {
    return location.coordinates[1]; // GeoJSON: [lng, lat]
  }
  // EWKT: POINT(lng lat)
  const match = String(location).match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
  return match ? parseFloat(match[2]) : 0;
}

function extractLng(location: any): number {
  if (!location) return 0;
  if (typeof location === "object" && location.coordinates) {
    return location.coordinates[0];
  }
  const match = String(location).match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
  return match ? parseFloat(match[1]) : 0;
}
