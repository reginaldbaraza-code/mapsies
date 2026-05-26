import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:8765",
    headless: true,
  },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:8765",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
