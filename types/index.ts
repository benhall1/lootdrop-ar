export type LocationCategory = "restaurant" | "retail" | "entertainment" | "services";

export interface LootBox {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  category: LocationCategory;
  businessName: string;
  businessLogo?: string;
  dropTime: number;
  coupon: Coupon;
  isActive: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed" | "freeItem";
  value: string;
  expiresAt: number;
  businessName: string;
  businessLogo?: string;
  terms?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface CollectedCoupon extends Coupon {
  collectedAt: number;
  isUsed: boolean;
}
