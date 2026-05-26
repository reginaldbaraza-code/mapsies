import { describe, it, expect } from "vitest";
import { buildDecisionPresentation, resolveDecisionUiState } from "../src/ui/decision-state";
import { analyzeJourneyInsights } from "../src/services/commute";
import type { Journey } from "../src/types";

const base: Journey = {
  legs: [
    {
      departure: new Date(Date.now() + 5 * 60000).toISOString(),
      arrival: new Date(Date.now() + 45 * 60000).toISOString(),
      origin: { name: "A" },
      destination: { name: "B" },
      line: { name: "S5", product: "suburban" },
      departurePlatform: "2",
    },
  ],
};

describe("decision state", () => {
  it("urgent when departure within 8 min", () => {
    const ins = analyzeJourneyInsights(base);
    expect(resolveDecisionUiState(base, ins)).toBe("urgent-leave");
  });

  it("action is verb-first", () => {
    const d = buildDecisionPresentation(base, "normal");
    expect(d.action.length).toBeGreaterThan(2);
    expect(d.successProbability).toBeGreaterThan(0);
  });

  it("late when departure passed", () => {
    const late: Journey = {
      legs: [
        {
          departure: new Date(Date.now() - 60000).toISOString(),
          arrival: new Date(Date.now() + 3600000).toISOString(),
          origin: { name: "A" },
          destination: { name: "B" },
          line: { name: "U2" },
        },
      ],
    };
    const ins = analyzeJourneyInsights(late);
    expect(resolveDecisionUiState(late, ins)).toBe("late");
  });
});
