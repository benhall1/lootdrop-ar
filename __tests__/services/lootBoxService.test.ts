import { LootBoxService } from "../../services/lootBoxService";

// Mock the Supabase client
jest.mock("../../services/supabaseClient", () => {
  const mockRpc = jest.fn();
  const mockFrom = jest.fn();

  return {
    supabase: {
      rpc: mockRpc,
      from: mockFrom,
    },
    __mockRpc: mockRpc,
    __mockFrom: mockFrom,
  };
});

const { __mockRpc: mockRpc, __mockFrom: mockFrom } = require("../../services/supabaseClient");

const sampleRow = {
  id: "box-1",
  title: "Test Box",
  latitude: 37.7749,
  longitude: -122.4194,
  category: "restaurant",
  business_name: "Test Biz",
  business_logo: null,
  coupon_code: "SAVE20",
  coupon_title: "20% Off",
  coupon_desc: "Save on your order",
  discount_type: "percentage",
  discount_value: 20,
  expires_at: "2030-01-01T00:00:00Z",
  drop_time: "2025-01-01T00:00:00Z",
  is_active: true,
  distance_m: 150,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LootBoxService.getNearby", () => {
  it("calls supabase.rpc with correct parameters", async () => {
    mockRpc.mockResolvedValue({ data: [sampleRow], error: null });

    await LootBoxService.getNearby(37.7749, -122.4194, 2);

    expect(mockRpc).toHaveBeenCalledWith("nearby_loot_boxes", {
      user_lat: 37.7749,
      user_lng: -122.4194,
      radius_m: 2000,
    });
  });

  it("maps database rows to LootBox objects", async () => {
    mockRpc.mockResolvedValue({ data: [sampleRow], error: null });

    const boxes = await LootBoxService.getNearby(37.7749, -122.4194);

    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toEqual(
      expect.objectContaining({
        id: "box-1",
        title: "Test Box",
        latitude: 37.7749,
        longitude: -122.4194,
        category: "restaurant",
        businessName: "Test Biz",
        isActive: true,
        coupon: expect.objectContaining({
          code: "SAVE20",
          title: "20% Off",
          discountType: "percentage",
          value: "20%",
        }),
      })
    );
  });

  it("returns empty array on error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const boxes = await LootBoxService.getNearby(37.7749, -122.4194);
    expect(boxes).toEqual([]);
  });

  it("returns empty array when data is null", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const boxes = await LootBoxService.getNearby(37.7749, -122.4194);
    expect(boxes).toEqual([]);
  });
});

describe("LootBoxService.getAll", () => {
  it("queries with category filter when provided", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    };
    // The order() call returns the final promise after category eq is applied
    // Flow: from → select → eq(is_active) → gte → order → eq(category) → resolves
    // Actually the code does: query = query.eq("category", ...) after order, then awaits query
    // Let's make the chain resolve at the end
    mockQuery.eq
      .mockReturnValueOnce(mockQuery) // is_active
      .mockResolvedValueOnce({ data: [sampleRow], error: null }); // category filter (terminal)
    mockFrom.mockReturnValue(mockQuery);

    const boxes = await LootBoxService.getAll("restaurant");

    expect(mockFrom).toHaveBeenCalledWith("loot_boxes");
    expect(mockQuery.eq).toHaveBeenCalledWith("is_active", true);
    expect(mockQuery.eq).toHaveBeenCalledWith("category", "restaurant");
    expect(boxes).toHaveLength(1);
  });

  it("returns empty array on error", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: "fail" } }),
    };
    mockFrom.mockReturnValue(mockQuery);

    const boxes = await LootBoxService.getAll();
    expect(boxes).toEqual([]);
  });
});

describe("LootBoxService.getById", () => {
  it("returns a single loot box", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: sampleRow, error: null }),
    };
    mockFrom.mockReturnValue(mockQuery);

    const box = await LootBoxService.getById("box-1");

    expect(box).not.toBeNull();
    expect(box!.id).toBe("box-1");
    expect(box!.businessName).toBe("Test Biz");
  });

  it("returns null when not found", async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
    };
    mockFrom.mockReturnValue(mockQuery);

    const box = await LootBoxService.getById("nonexistent");
    expect(box).toBeNull();
  });
});
