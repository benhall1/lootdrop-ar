import { calculateDistance, formatDistance } from "../../services/geolocation";

describe("calculateDistance", () => {
  it("returns 0 for the same point", () => {
    const point = { latitude: 37.7749, longitude: -122.4194 };
    expect(calculateDistance(point, point)).toBe(0);
  });

  it("calculates distance between SF and LA (~559km)", () => {
    const sf = { latitude: 37.7749, longitude: -122.4194 };
    const la = { latitude: 34.0522, longitude: -118.2437 };
    const distance = calculateDistance(sf, la);
    // Should be roughly 559km
    expect(distance).toBeGreaterThan(540);
    expect(distance).toBeLessThan(580);
  });

  it("calculates short distance (~1km)", () => {
    const a = { latitude: 37.7749, longitude: -122.4194 };
    // ~1km north
    const b = { latitude: 37.7839, longitude: -122.4194 };
    const distance = calculateDistance(a, b);
    expect(distance).toBeGreaterThan(0.9);
    expect(distance).toBeLessThan(1.1);
  });

  it("is symmetric (A→B == B→A)", () => {
    const sf = { latitude: 37.7749, longitude: -122.4194 };
    const la = { latitude: 34.0522, longitude: -118.2437 };
    expect(calculateDistance(sf, la)).toBeCloseTo(calculateDistance(la, sf));
  });

  it("handles negative coordinates", () => {
    const a = { latitude: -33.8688, longitude: 151.2093 }; // Sydney
    const b = { latitude: 51.5074, longitude: -0.1278 }; // London
    const distance = calculateDistance(a, b);
    expect(distance).toBeGreaterThan(16000);
    expect(distance).toBeLessThan(18000);
  });
});

describe("formatDistance", () => {
  it("formats distances under 1km in meters", () => {
    expect(formatDistance(0.5)).toBe("500m");
    expect(formatDistance(0.1)).toBe("100m");
    expect(formatDistance(0.05)).toBe("50m");
  });

  it("formats distances over 1km with one decimal", () => {
    expect(formatDistance(1.5)).toBe("1.5km");
    expect(formatDistance(10.0)).toBe("10.0km");
    expect(formatDistance(2.34)).toBe("2.3km");
  });

  it("formats exactly 1km", () => {
    expect(formatDistance(1.0)).toBe("1.0km");
  });

  it("rounds meters to nearest whole number", () => {
    expect(formatDistance(0.0564)).toBe("56m");
  });
});
