import { describe, it, expect, afterEach } from "vitest";
import { setLocale, t } from "../src/i18n";

describe("i18n", () => {
  afterEach(() => {
    setLocale("de");
  });

  it("German strings", () => {
    setLocale("de");
    expect(t("home.cta")).toBe("Schnellste Verbindung");
    expect(t("error.originRequired")).toContain("Start");
  });

  it("English strings", () => {
    setLocale("en");
    expect(t("home.cta")).toBe("Find fastest route");
    expect(t("decision.urgent.in", { mins: 5 })).toBe("Leave in 5 min");
  });
});
