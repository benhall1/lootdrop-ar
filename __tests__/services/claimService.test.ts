import { ClaimService } from "../../services/claimService";

jest.mock("../../services/supabaseClient", () => {
  const mockRpc = jest.fn();
  const mockFrom = jest.fn();
  const mockGetSession = jest.fn();

  return {
    supabase: {
      rpc: mockRpc,
      from: mockFrom,
      auth: {
        getSession: mockGetSession,
      },
    },
    __mockRpc: mockRpc,
    __mockFrom: mockFrom,
    __mockGetSession: mockGetSession,
  };
});

const {
  __mockRpc: mockRpc,
  __mockFrom: mockFrom,
  __mockGetSession: mockGetSession,
} = require("../../services/supabaseClient");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ClaimService.claimLootBox", () => {
  it("returns error when not signed in", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const result = await ClaimService.claimLootBox("box-1", 37.77, -122.41);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/signed in/i);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("calls claim_loot_box RPC with correct params", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
    });
    mockRpc.mockResolvedValue({
      data: {
        success: true,
        claim_id: "claim-1",
        coupon: { id: "claim-1", code: "SAVE20" },
      },
      error: null,
    });

    const result = await ClaimService.claimLootBox("box-1", 37.77, -122.41);

    expect(mockRpc).toHaveBeenCalledWith("claim_loot_box", {
      p_box_id: "box-1",
      p_user_id: "user-123",
      p_user_lat: 37.77,
      p_user_lng: -122.41,
    });
    expect(result.success).toBe(true);
    expect(result.coupon).toEqual({ id: "claim-1", code: "SAVE20" });
  });

  it("returns error on RPC failure", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
    });
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Internal error" },
    });

    const result = await ClaimService.claimLootBox("box-1", 37.77, -122.41);

    expect(result.success).toBe(false);
    expect(result.error).toBe("unknown");
  });

  it("returns server-side validation errors", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
    });
    mockRpc.mockResolvedValue({
      data: {
        success: false,
        error: "too_far",
        message: "Get closer! You need to be within 100m.",
      },
      error: null,
    });

    const result = await ClaimService.claimLootBox("box-1", 37.77, -122.41);

    expect(result.success).toBe(false);
    expect(result.error).toBe("too_far");
    expect(result.message).toMatch(/100m/);
  });

  it("returns already_claimed error", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
    });
    mockRpc.mockResolvedValue({
      data: {
        success: false,
        error: "already_claimed",
        message: "You already claimed this one!",
      },
      error: null,
    });

    const result = await ClaimService.claimLootBox("box-1", 37.77, -122.41);

    expect(result.success).toBe(false);
    expect(result.error).toBe("already_claimed");
  });

  it("handles network errors gracefully", async () => {
    mockGetSession.mockRejectedValue(new Error("Network timeout"));

    const result = await ClaimService.claimLootBox("box-1", 37.77, -122.41);

    expect(result.success).toBe(false);
    expect(result.error).toBe("unknown");
    expect(result.message).toMatch(/network/i);
  });
});

describe("ClaimService.markAsUsed", () => {
  it("updates the claim record", async () => {
    const mockQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockReturnValue(mockQuery);

    const success = await ClaimService.markAsUsed("claim-1");

    expect(success).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("claims");
    expect(mockQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ is_used: true })
    );
  });

  it("returns false on error", async () => {
    const mockQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: "fail" } }),
    };
    mockFrom.mockReturnValue(mockQuery);

    const success = await ClaimService.markAsUsed("claim-1");
    expect(success).toBe(false);
  });
});
