import { describe, it, expect } from "vitest";
import { analyzeJourney } from "../src/services/disruptions";
import type { Journey } from "../src/types";

const baseJourney: Journey = {
  legs: [
    {
      departure: "2026-05-26T10:00:00+02:00",
      arrival: "2026-05-26T10:15:00+02:00",
      origin: { name: "A" },
      destination: { name: "B" },
      line: { product: "subway", name: "U5" },
    },
  ],
};

describe("disruptions", () => {
  it("high confidence when clean", () => {
    const a = analyzeJourney(baseJourney);
    expect(a.confidence).toBe("high");
    expect(a.humanMessages?.length ?? 0).toBeGreaterThanOrEqual(0);
  });

  it("low on cancellation remark", () => {
    const j: Journey = {
      legs: [
        {
          ...baseJourney.legs[0],
          remarks: [{ summary: "Zugausfall aufgrund Störung" }],
        },
      ],
    };
    expect(analyzeJourney(j).confidence).toBe("low");
  });
});
