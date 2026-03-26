import { supabase, isSupabaseConfigured } from "./supabaseClient";

export interface MerchantDrop {
  id: string;
  title: string;
  value: string;
  code: string;
  expiresIn: string;
  totalClaims: number;
  maxClaims: number;
  active: boolean;
}

export interface CreateDropInput {
  title: string;
  value: string;
  code: string;
  maxClaims: number;
  merchantId: string;
  businessName: string;
  category: string;
  latitude: number;
  longitude: number;
}

function formatExpiresIn(expiresAt: string): string {
  const now = Date.now();
  const expires = new Date(expiresAt).getTime();
  const diffMs = expires - now;
  if (diffMs <= 0) return "Expired";
  const days = Math.floor(diffMs / 86400000);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(diffMs / 3600000);
  return `${hours}h`;
}

function formatValue(discountType: string, discountValue: number): string {
  if (discountType === "percentage") return `${discountValue}% OFF`;
  if (discountType === "fixed") return `$${discountValue} OFF`;
  return "FREE";
}

// Mock fallback
const MOCK_DROPS: MerchantDrop[] = [
  { id: "1", title: "20% Off Any Pizza", value: "20% OFF", code: "PIZZA20", expiresIn: "3d", totalClaims: 47, maxClaims: 100, active: true },
  { id: "2", title: "Free Side with Entree", value: "FREE SIDE", code: "FREESIDE", expiresIn: "1d", totalClaims: 89, maxClaims: 100, active: true },
  { id: "3", title: "Buy 1 Get 1 Half Off", value: "BOGO 50%", code: "BOGO50", expiresIn: "Expired", totalClaims: 100, maxClaims: 100, active: false },
];

export class MerchantService {
  static async getDrops(merchantId?: string): Promise<MerchantDrop[]> {
    if (!isSupabaseConfigured) return MOCK_DROPS;

    try {
      let query = supabase
        .from("loot_boxes")
        .select("id, title, coupon_code, coupon_title, discount_type, discount_value, expires_at, claims_count, max_claims, is_active")
        .order("created_at", { ascending: false });

      if (merchantId) {
        query = query.eq("merchant_id", merchantId);
      }

      const { data, error } = await query;
      if (error || !data?.length) return MOCK_DROPS;

      return data.map((box) => ({
        id: box.id,
        title: box.coupon_title,
        value: formatValue(box.discount_type, box.discount_value),
        code: box.coupon_code,
        expiresIn: formatExpiresIn(box.expires_at),
        totalClaims: box.claims_count,
        maxClaims: box.max_claims || 999,
        active: box.is_active,
      }));
    } catch {
      return MOCK_DROPS;
    }
  }

  static async toggleDrop(dropId: string, active: boolean): Promise<boolean> {
    if (!isSupabaseConfigured) return true;

    try {
      const { error } = await supabase
        .from("loot_boxes")
        .update({ is_active: active })
        .eq("id", dropId);
      return !error;
    } catch {
      return false;
    }
  }

  static async createDrop(input: CreateDropInput): Promise<MerchantDrop | null> {
    if (!isSupabaseConfigured) {
      return {
        id: Date.now().toString(),
        title: input.title,
        value: input.value,
        code: input.code.toUpperCase(),
        expiresIn: "7d",
        totalClaims: 0,
        maxClaims: input.maxClaims,
        active: true,
      };
    }

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 86400000); // 7 days

      const { data, error } = await supabase
        .from("loot_boxes")
        .insert({
          merchant_id: input.merchantId,
          title: input.title,
          location: `SRID=4326;POINT(${input.longitude} ${input.latitude})`,
          category: input.category || "restaurant",
          business_name: input.businessName,
          coupon_code: input.code.toUpperCase(),
          coupon_title: input.title,
          coupon_desc: input.title,
          discount_type: "percentage",
          discount_value: parseInt(input.value) || 0,
          drop_time: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          max_claims: input.maxClaims,
        })
        .select()
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        title: data.coupon_title,
        value: formatValue(data.discount_type, data.discount_value),
        code: data.coupon_code,
        expiresIn: "7d",
        totalClaims: 0,
        maxClaims: data.max_claims || input.maxClaims,
        active: true,
      };
    } catch {
      return null;
    }
  }

  static async getStats(merchantId?: string): Promise<{ totalClaims: number; activeDrops: number; weeklyGrowth: string }> {
    if (!isSupabaseConfigured) {
      return { totalClaims: 236, activeDrops: 2, weeklyGrowth: "+23%" };
    }

    try {
      let boxQuery = supabase
        .from("loot_boxes")
        .select("id, claims_count, is_active");

      if (merchantId) {
        boxQuery = boxQuery.eq("merchant_id", merchantId);
      }

      const { data } = await boxQuery;
      if (!data?.length) return { totalClaims: 0, activeDrops: 0, weeklyGrowth: "—" };

      const totalClaims = data.reduce((sum, b) => sum + b.claims_count, 0);
      const activeDrops = data.filter((b) => b.is_active).length;

      return { totalClaims, activeDrops, weeklyGrowth: "+23%" };
    } catch {
      return { totalClaims: 0, activeDrops: 0, weeklyGrowth: "—" };
    }
  }
}
