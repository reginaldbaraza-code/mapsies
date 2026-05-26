import { describe, it, expect } from "vitest";
import { isBvgStopId, isDbStopId, isInBerlin } from "../src/lib/stop-ids";

describe("stop IDs", () => {
  it("detects DB ids", () => {
    expect(isDbStopId("8011160")).toBe(true);
    expect(isDbStopId("900100003")).toBe(false);
  });

  it("detects BVG ids", () => {
    expect(isBvgStopId("900100003")).toBe(true);
    expect(isBvgStopId("8011160")).toBe(false);
  });

  it("Berlin bbox", () => {
    expect(isInBerlin({ lat: 52.52, lon: 13.4 })).toBe(true);
    expect(isInBerlin({ lat: 48.14, lon: 11.56 })).toBe(false);
  });
});
