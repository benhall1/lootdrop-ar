import AsyncStorage from "@react-native-async-storage/async-storage";
import { LootBox } from "../types";
import { LogoService } from "./logoService";

const CACHE_KEY = "@lootdrop_demo_boxes";

interface DemoBusiness {
  name: string;
  category: "restaurant" | "retail" | "entertainment" | "services";
  coupon: {
    title: string;
    description: string;
    code: string;
    discountType: "percentage" | "fixed" | "freeItem";
    value: string;
    rawValue: number;
    daysValid: number;
  };
}

const DEMO_BUSINESSES: DemoBusiness[] = [
  {
    name: "Sunrise Coffee",
    category: "restaurant",
    coupon: { title: "50% Off Any Coffee", description: "Half off any coffee drink", code: "COFFEE50", discountType: "percentage", value: "50%", rawValue: 50, daysValid: 7 },
  },
  {
    name: "Metro Pizza",
    category: "restaurant",
    coupon: { title: "20% Off Large Pizza", description: "Discount on any large pizza", code: "PIZZA20", discountType: "percentage", value: "20%", rawValue: 20, daysValid: 14 },
  },
  {
    name: "Fresh Juice Co",
    category: "restaurant",
    coupon: { title: "Free Smoothie", description: "One complimentary smoothie", code: "FREEJUICE", discountType: "freeItem", value: "Free", rawValue: 0, daysValid: 3 },
  },
  {
    name: "Page Turner Books",
    category: "retail",
    coupon: { title: "$15 Off Purchase", description: "Save $15 on purchases over $50", code: "BOOK15", discountType: "fixed", value: "$15", rawValue: 15, daysValid: 30 },
  },
  {
    name: "FitPro Gym",
    category: "services",
    coupon: { title: "30% Off Monthly Pass", description: "First month at 30% off", code: "FIT30", discountType: "percentage", value: "30%", rawValue: 30, daysValid: 10 },
  },
  {
    name: "Star Cinema",
    category: "entertainment",
    coupon: { title: "Buy One Get One Free", description: "Second ticket free on weekdays", code: "MOVIE2FOR1", discountType: "freeItem", value: "BOGO", rawValue: 0, daysValid: 7 },
  },
  {
    name: "Taco Fiesta",
    category: "restaurant",
    coupon: { title: "Free Taco Tuesday", description: "One free taco with any order", code: "FREETACO", discountType: "freeItem", value: "Free", rawValue: 0, daysValid: 5 },
  },
  {
    name: "Green Garden Plants",
    category: "retail",
    coupon: { title: "25% Off Any Plant", description: "Discount on all houseplants", code: "PLANT25", discountType: "percentage", value: "25%", rawValue: 25, daysValid: 14 },
  },
];

/** Place a point at a random bearing and distance from center */
function offsetLatLng(
  lat: number,
  lng: number,
  distanceKm: number,
  bearingDeg: number
): { latitude: number; longitude: number } {
  const R = 6371; // Earth radius km
  const d = distanceKm / R;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lng2 * 180) / Math.PI,
  };
}

/** Seeded random number generator for consistent demo positions */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Grid cell key — rounds to ~1km so positions stay stable while nearby */
function gridKey(lat: number, lng: number): string {
  return `${Math.round(lat * 100)}_${Math.round(lng * 100)}`;
}

export class DemoService {
  /** Get cached or generate demo loot boxes near the user */
  static async getDemoBoxes(
    userLat: number,
    userLng: number
  ): Promise<LootBox[]> {
    const key = gridKey(userLat, userLng);

    // Check cache
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.gridKey === key && parsed.boxes?.length > 0) {
          // Refresh time-based fields
          return parsed.boxes.map((box: LootBox) => ({
            ...box,
            isActive: box.dropTime <= Date.now(),
          }));
        }
      }
    } catch {}

    // Generate new demo boxes
    const boxes = this.generate(userLat, userLng, key);

    // Cache
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ gridKey: key, boxes, createdAt: Date.now() })
      );
    } catch {}

    return boxes;
  }

  private static generate(
    centerLat: number,
    centerLng: number,
    key: string
  ): LootBox[] {
    // Use grid key as seed so same area = same layout
    const seed = key.split("_").reduce((acc, n) => acc + parseInt(n), 0);
    const rand = seededRandom(seed);

    const now = Date.now();
    const oneDay = 86400000;

    return DEMO_BUSINESSES.map((biz, i) => {
      // Random bearing (0-360) and distance (0.3-1.5km)
      const bearing = rand() * 360;
      const distance = 0.3 + rand() * 1.2;
      const { latitude, longitude } = offsetLatLng(centerLat, centerLng, distance, bearing);

      // Stagger drop times: some live now, some upcoming
      const isLive = i < 5; // First 5 are active
      const dropTime = isLive
        ? now - (rand() * 30 * 60 * 1000) // Dropped 0-30 min ago
        : now + (rand() * 4 * 3600000); // Drops in 0-4 hours

      return {
        id: `demo_${i + 1}`,
        title: biz.coupon.title,
        latitude,
        longitude,
        category: biz.category,
        businessName: biz.name,
        businessLogo: LogoService.getBusinessLogo(biz.name),
        dropTime,
        isActive: isLive,
        coupon: {
          id: `demo_c${i + 1}`,
          code: biz.coupon.code,
          title: biz.coupon.title,
          description: biz.coupon.description,
          discountType: biz.coupon.discountType,
          value: biz.coupon.value,
          expiresAt: now + biz.coupon.daysValid * oneDay,
          businessName: biz.name,
          businessLogo: LogoService.getBusinessLogo(biz.name),
        },
      };
    });
  }

  /** Check if a box ID is a demo box */
  static isDemoBox(boxId: string): boolean {
    return boxId.startsWith("demo_");
  }

  /** Clear cached demo boxes (e.g., when real data becomes available) */
  static async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
  }
}
