import { initAnalytics } from "./lib/analytics";
import { initApp, bootstrapFromUrl } from "./app";
import { parseLandingPath, setLandingMeta } from "./services/url-state";

initAnalytics();

async function boot(): Promise<void> {
  const landing = parseLandingPath(window.location.pathname);
  if (landing) setLandingMeta(landing.from, landing.to);

  initApp();
  await bootstrapFromUrl();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void boot());
} else {
  void boot();
}
