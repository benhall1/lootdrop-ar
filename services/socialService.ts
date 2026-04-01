import { supabase, isSupabaseConfigured } from "./supabaseClient";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
  tier: "bronze" | "silver" | "gold";
  claims: number;
  isCurrentUser?: boolean;
}

export interface ActivityItem {
  id: string;
  type: "claim" | "badge" | "streak" | "levelup" | "share";
  user: string;
  message: string;
  emoji: string;
  timeAgo: string;
}

// XP thresholds (same as gamificationService)
const XP_PER_LEVEL = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000,
  6500, 8000, 10000, 12500, 15000, 18000, 22000, 27000, 33000, 40000,
];

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

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: "🍕",
  retail: "🛍️",
  entertainment: "🎬",
  services: "💪",
};

// Mock fallbacks
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "TreasureKing", xp: 4200, level: 12, tier: "gold", claims: 87 },
  { rank: 2, name: "LootQueen22", xp: 3800, level: 11, tier: "gold", claims: 72 },
  { rank: 3, name: "DealHunterX", xp: 3100, level: 9, tier: "silver", claims: 65 },
  { rank: 4, name: "CouponNinja", xp: 2600, level: 8, tier: "silver", claims: 51 },
  { rank: 5, name: "SaverSam", xp: 1800, level: 7, tier: "silver", claims: 38 },
  { rank: 6, name: "BargainBoss", xp: 1200, level: 5, tier: "bronze", claims: 24 },
  { rank: 7, name: "LootLooper", xp: 900, level: 4, tier: "bronze", claims: 19 },
  { rank: 8, name: "ChestChaser", xp: 600, level: 3, tier: "bronze", claims: 12 },
  { rank: 9, name: "NewExplorer", xp: 100, level: 1, tier: "bronze", claims: 3 },
];

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "1", type: "claim", user: "TreasureKing", message: "claimed a loot box at Joe's Pizza", emoji: "🍕", timeAgo: "2m ago" },
  { id: "2", type: "badge", user: "LootQueen22", message: "unlocked Week Warrior badge", emoji: "⚡", timeAgo: "8m ago" },
  { id: "3", type: "streak", user: "DealHunterX", message: "hit a 7-day streak!", emoji: "🔥", timeAgo: "15m ago" },
  { id: "4", type: "claim", user: "CouponNinja", message: "claimed a loot box at GameStop", emoji: "🎮", timeAgo: "22m ago" },
  { id: "5", type: "levelup", user: "SaverSam", message: "reached Level 7!", emoji: "⭐", timeAgo: "35m ago" },
  { id: "6", type: "share", user: "BargainBoss", message: "shared a deal from Target", emoji: "🛍️", timeAgo: "42m ago" },
  { id: "7", type: "claim", user: "LootLooper", message: "claimed a loot box at Starbucks", emoji: "☕", timeAgo: "1h ago" },
  { id: "8", type: "badge", user: "ChestChaser", message: "unlocked Collector badge", emoji: "🏆", timeAgo: "1h ago" },
];

export class SocialService {
  static async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!isSupabaseConfigured) return MOCK_LEADERBOARD;

    try {
      // Fetch top users by XP with their claim counts
      const { data: users, error } = await supabase
        .from("users")
        .select("id, name, xp, avatar_tier, streak_count")
        .eq("role", "consumer")
        .order("xp", { ascending: false })
        .limit(20);

      if (error || !users?.length) return MOCK_LEADERBOARD;

      // Get claim counts for these users
      const userIds = users.map((u) => u.id);
      const { data: claimCounts } = await supabase
        .from("claims")
        .select("user_id")
        .in("user_id", userIds);

      const countMap: Record<string, number> = {};
      claimCounts?.forEach((c) => {
        countMap[c.user_id] = (countMap[c.user_id] || 0) + 1;
      });

      return users.map((u, i) => {
        const level = calculateLevel(u.xp);
        return {
          rank: i + 1,
          name: u.name || "Anonymous",
          xp: u.xp,
          level,
          tier: calculateTier(level),
          claims: countMap[u.id] || 0,
        };
      });
    } catch {
      return MOCK_LEADERBOARD;
    }
  }

  static async getActivityFeed(): Promise<ActivityItem[]> {
    if (!isSupabaseConfigured) return MOCK_ACTIVITY;

    try {
      // Fetch recent activity events with user names
      const { data: events, error } = await supabase
        .from("activity_events")
        .select("id, event_type, message, emoji, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error || !events?.length) return MOCK_ACTIVITY;

      // Fetch user names
      const userIds = [...new Set(events.map((e) => e.user_id))];
      const { data: users } = await supabase
        .from("users")
        .select("id, name")
        .in("id", userIds);

      const userMap: Record<string, string> = {};
      users?.forEach((u) => { userMap[u.id] = u.name || "Anonymous"; });

      return events.map((e) => ({
        id: e.id,
        type: e.event_type as ActivityItem["type"],
        user: userMap[e.user_id] || "Someone",
        message: e.message,
        emoji: e.emoji,
        timeAgo: formatTimeAgo(e.created_at),
      }));
    } catch {
      return MOCK_ACTIVITY;
    }
  }
}
