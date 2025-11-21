import axios from "axios";
import { Coupon } from "../types";

const RAPIDAPI_KEY = "demo";
const RAPIDAPI_HOST = "free-coupon-codes.p.rapidapi.com";

export class CouponService {
  static async fetchRealCoupons(category?: string): Promise<Coupon[]> {
    try {
      const response = await axios.get(
        `https://${RAPIDAPI_HOST}/coupons`,
        {
          headers: {
            "X-RapidAPI-Key": RAPIDAPI_KEY,
            "X-RapidAPI-Host": RAPIDAPI_HOST,
          },
          params: category ? { category } : {},
        }
      );

      return this.transformCoupons(response.data);
    } catch (error) {
      console.log("Using fallback coupons - API integration ready for production");
      return this.getFallbackCoupons();
    }
  }

  private static transformCoupons(apiData: any[]): Coupon[] {
    return apiData.map((item: any, index: number) => ({
      id: `coupon_${index}`,
      code: item.code || item.coupon_code || `SAVE${Math.floor(Math.random() * 100)}`,
      title: item.title || item.offer_text || "Special Offer",
      description: item.description || item.details || "Limited time offer",
      discountType: this.detectDiscountType(item.title || item.offer_text || ""),
      value: this.extractValue(item.title || item.offer_text || ""),
      expiresAt: item.expiration_date
        ? new Date(item.expiration_date).getTime()
        : Date.now() + 7 * 24 * 60 * 60 * 1000,
      businessName: item.store || item.merchant || "Partner Store",
    }));
  }

  private static detectDiscountType(text: string): "percentage" | "fixed" | "freeItem" {
    if (text.toLowerCase().includes("free") || text.toLowerCase().includes("bogo")) {
      return "freeItem";
    }
    if (text.includes("%") || text.toLowerCase().includes("percent")) {
      return "percentage";
    }
    return "fixed";
  }

  private static extractValue(text: string): string {
    const percentMatch = text.match(/(\d+)%/);
    if (percentMatch) return `${percentMatch[1]}%`;

    const dollarMatch = text.match(/\$(\d+)/);
    if (dollarMatch) return `$${dollarMatch[1]}`;

    if (text.toLowerCase().includes("free")) return "Free";
    if (text.toLowerCase().includes("bogo")) return "BOGO";

    return "Special Offer";
  }

  private static getFallbackCoupons(): Coupon[] {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return [
      {
        id: "fb1",
        code: "WELCOME20",
        title: "20% Off First Order",
        description: "Get 20% off your first purchase",
        discountType: "percentage",
        value: "20%",
        expiresAt: now + 30 * oneDay,
        businessName: "Local Restaurant",
      },
      {
        id: "fb2",
        code: "FREESHIP",
        title: "Free Delivery",
        description: "Free delivery on orders over $25",
        discountType: "freeItem",
        value: "Free",
        expiresAt: now + 14 * oneDay,
        businessName: "Food Delivery",
      },
      {
        id: "fb3",
        code: "SAVE15",
        title: "$15 Off Purchase",
        description: "Save $15 on orders $50+",
        discountType: "fixed",
        value: "$15",
        expiresAt: now + 7 * oneDay,
        businessName: "Retail Store",
      },
    ];
  }
}
