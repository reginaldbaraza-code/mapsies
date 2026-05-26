import { describe, it, expect } from "vitest";
import { getUpstreamPath } from "../api/lib/upstream-path.js";

describe("getUpstreamPath", () => {
  it("parses path from request URL", () => {
    expect(
      getUpstreamPath({ url: "/api/db/journeys?results=1" }, "/api/db")
    ).toBe("journeys");
  });

  it("falls back to query.path segments", () => {
    expect(
      getUpstreamPath({ url: "/api/db/journeys", query: { path: ["journeys"] } }, "/api/db")
    ).toBe("journeys");
  });
});
