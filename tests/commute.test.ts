import { describe, it, expect } from "vitest";
import { analyzeTransfers, analyzeJourneyInsights, canMakeFirstLeg } from "../src/services/commute";
import type { Journey } from "../src/types";

const tightJourney: Journey = {
  legs: [
    {
      departure: "2026-05-26T10:00:00+02:00",
      arrival: "2026-05-26T10:20:00+02:00",
      origin: { name: "A" },
      destination: { name: "B" },
      line: { product: "suburban", name: "S5" },
      arrivalPlatform: "3",
    },
    {
      departure: "2026-05-26T10:23:00+02:00",
      arrival: "2026-05-26T10:50:00+02:00",
      origin: { name: "B" },
      destination: { name: "C" },
      line: { product: "regional", name: "RE1" },
      departurePlatform: "7",
    },
  ],
};

describe("commute intelligence", () => {
  it("flags tight transfer", () => {
    const transfers = analyzeTransfers(tightJourney);
    expect(transfers[0]?.risk).toBe("tight");
  });

  it("detects platform change", () => {
    const transfers = analyzeTransfers(tightJourney);
    expect(transfers[0]?.platformChanged).toBe(true);
  });

  it("scores reliability", () => {
    const ins = analyzeJourneyInsights(tightJourney);
    expect(ins.reliabilityScore).toBeLessThan(90);
    expect(ins.delayProbability).toBeGreaterThan(0);
  });

  it("can make first leg in future", () => {
    const future: Journey = {
      legs: [
        {
          departure: new Date(Date.now() + 3600000).toISOString(),
          arrival: new Date(Date.now() + 7200000).toISOString(),
          origin: { name: "X" },
          destination: { name: "Y" },
          line: { name: "U2" },
        },
      ],
    };
    expect(canMakeFirstLeg(future)).toBe(true);
  });
});
