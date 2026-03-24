import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@lootdrop_gamification";

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastClaimDate: string | null; // ISO date string YYYY-MM-DD
  totalClaims: number;
  totalRedemptions: number;
  badges: Badge[];
  tier: "bronze" | "silver" | "gold";
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlockedAt: string | null; // ISO datetime or null if locked
}

export const ALL_BADGES: Badge[] = [
  { id: "first_loot", name: "First Find", description: "Claim your first loot box", emoji: "🎁", unlockedAt: null },
  { id: "streak_3", name: "On a Roll", description: "3-day claim streak", emoji: "🔥", unlockedAt: null },
  { id: "streak_7", name: "Week Warrior", description: "7-day claim streak", emoji: "⚡", unlockedAt: null },
  { id: "streak_30", name: "Legendary", description: "30-day claim streak", emoji: "👑", unlockedAt: null },
  { id: "claims_5", name: "Collector", description: "Claim 5 loot boxes", emoji: "🏆", unlockedAt: null },
  { id: "claims_25", name: "Treasure Hunter", description: "Claim 25 loot boxes", emoji: "💎", unlockedAt: null },
  { id: "claims_100", name: "Loot Legend", description: "Claim 100 loot boxes", emoji: "🌟", unlockedAt: null },
  { id: "redeemed_1", name: "Saver", description: "Redeem your first coupon", emoji: "💰", unlockedAt: null },
  { id: "redeemed_10", name: "Smart Shopper", description: "Redeem 10 coupons", emoji: "🛒", unlockedAt: null },
  { id: "explorer", name: "Explorer", description: "Claim from 5 different businesses", emoji: "🗺️", unlockedAt: null },
];

// XP thresholds per level
const XP_PER_LEVEL = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000,
  6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000, 40000,
];

// XP awards
const XP_CLAIM = 25;
const XP_STREAK_BONUS = 10; // per streak day
const XP_REDEEM = 15;
const XP_BADGE = 50;

function getDefaultState(): GamificationState {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    longestStreak: 0,
    lastClaimDate: null,
    totalClaims: 0,
    totalRedemptions: 0,
    badges: ALL_BADGES.map((b) => ({ ...b })),
    tier: "bronze",
  };
}

function calculateLevel(xp: number): number {
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (xp >= XP_PER_LEVEL[i]) return i + 1;
  }
  return 1;
}

function calculateTier(level: number): "bronze" | "silver" | "gold" {
  if (level >= 15) return "gold";
  if (level >= 7) return "silver";
  return "bronze";
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export interface XPEvent {
  type: "claim" | "redeem" | "badge" | "streak";
  amount: number;
  message: string;
}

export interface ClaimResult {
  xpEvents: XPEvent[];
  newBadges: Badge[];
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  tierChanged: boolean;
  newTier: "bronze" | "silver" | "gold";
  streak: number;
}

export class GamificationService {
  static async getState(): Promise<GamificationState> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return getDefaultState();
  }

  static async saveState(state: GamificationState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /**
   * Call when user claims a loot box.
   * Updates XP, streak, badges, level, tier.
   */
  static async recordClaim(businessId?: string): Promise<ClaimResult> {
    const state = await this.getState();
    const xpEvents: XPEvent[] = [];
    const newBadges: Badge[] = [];
    const previousLevel = state.level;

    // Update claim count
    state.totalClaims += 1;

    // XP for claim
    state.xp += XP_CLAIM;
    xpEvents.push({ type: "claim", amount: XP_CLAIM, message: "Loot box claimed!" });

    // Update streak
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    if (state.lastClaimDate === today) {
      // Already claimed today — no streak change
    } else if (state.lastClaimDate === yesterday) {
      // Continue streak
      state.streak += 1;
      const streakBonus = XP_STREAK_BONUS * state.streak;
      state.xp += streakBonus;
      xpEvents.push({
        type: "streak",
        amount: streakBonus,
        message: `${state.streak}-day streak! 🔥`,
      });
    } else {
      // Streak broken or first claim
      state.streak = 1;
    }
    state.lastClaimDate = today;
    state.longestStreak = Math.max(state.longestStreak, state.streak);

    // Check badge unlocks
    const badgeChecks: Array<{ id: string; condition: boolean }> = [
      { id: "first_loot", condition: state.totalClaims >= 1 },
      { id: "streak_3", condition: state.streak >= 3 },
      { id: "streak_7", condition: state.streak >= 7 },
      { id: "streak_30", condition: state.streak >= 30 },
      { id: "claims_5", condition: state.totalClaims >= 5 },
      { id: "claims_25", condition: state.totalClaims >= 25 },
      { id: "claims_100", condition: state.totalClaims >= 100 },
    ];

    for (const check of badgeChecks) {
      const badge = state.badges.find((b) => b.id === check.id);
      if (badge && !badge.unlockedAt && check.condition) {
        badge.unlockedAt = new Date().toISOString();
        state.xp += XP_BADGE;
        newBadges.push(badge);
        xpEvents.push({
          type: "badge",
          amount: XP_BADGE,
          message: `Badge unlocked: ${badge.emoji} ${badge.name}`,
        });
      }
    }

    // Recalculate level and tier
    const newLevel = calculateLevel(state.xp);
    const leveledUp = newLevel > previousLevel;
    state.level = newLevel;

    const newTier = calculateTier(newLevel);
    const tierChanged = newTier !== state.tier;
    state.tier = newTier;

    await this.saveState(state);

    return {
      xpEvents,
      newBadges,
      leveledUp,
      previousLevel,
      newLevel,
      tierChanged,
      newTier,
      streak: state.streak,
    };
  }

  /**
   * Call when user redeems a coupon at a business.
   */
  static async recordRedemption(): Promise<ClaimResult> {
    const state = await this.getState();
    const xpEvents: XPEvent[] = [];
    const newBadges: Badge[] = [];
    const previousLevel = state.level;

    state.totalRedemptions += 1;
    state.xp += XP_REDEEM;
    xpEvents.push({ type: "redeem", amount: XP_REDEEM, message: "Coupon redeemed!" });

    // Badge checks
    const redeemChecks: Array<{ id: string; condition: boolean }> = [
      { id: "redeemed_1", condition: state.totalRedemptions >= 1 },
      { id: "redeemed_10", condition: state.totalRedemptions >= 10 },
    ];

    for (const check of redeemChecks) {
      const badge = state.badges.find((b) => b.id === check.id);
      if (badge && !badge.unlockedAt && check.condition) {
        badge.unlockedAt = new Date().toISOString();
        state.xp += XP_BADGE;
        newBadges.push(badge);
        xpEvents.push({
          type: "badge",
          amount: XP_BADGE,
          message: `Badge unlocked: ${badge.emoji} ${badge.name}`,
        });
      }
    }

    const newLevel = calculateLevel(state.xp);
    const leveledUp = newLevel > previousLevel;
    state.level = newLevel;
    const newTier = calculateTier(newLevel);
    const tierChanged = newTier !== state.tier;
    state.tier = newTier;

    await this.saveState(state);

    return {
      xpEvents,
      newBadges,
      leveledUp,
      previousLevel,
      newLevel,
      tierChanged,
      newTier,
      streak: state.streak,
    };
  }

  /**
   * XP needed for next level.
   */
  static getXPForNextLevel(level: number): number {
    if (level >= XP_PER_LEVEL.length) return XP_PER_LEVEL[XP_PER_LEVEL.length - 1] + 5000;
    return XP_PER_LEVEL[level]; // level is 1-indexed, so XP_PER_LEVEL[level] = next threshold
  }

  /**
   * XP threshold for current level.
   */
  static getXPForCurrentLevel(level: number): number {
    if (level <= 1) return 0;
    return XP_PER_LEVEL[level - 1];
  }

  /**
   * Reset state (for testing).
   */
  static async reset(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
