import { test, expect } from "@playwright/test";

test("loads home decision screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("FastRoute")).toBeVisible();
  await expect(page.getByRole("button", { name: /Schnellste Verbindung/i })).toBeVisible();
});

test("shows station chips on focus", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Von").focus();
  await expect(page.locator(".station-chip").first()).toBeVisible({ timeout: 5000 });
});
