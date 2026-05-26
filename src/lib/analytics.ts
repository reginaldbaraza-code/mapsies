declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
  }
}

let sentryReady = false;

export function initAnalytics(): void {
  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  if (domain && !document.querySelector("[data-plausible]")) {
    const s = document.createElement("script");
    s.defer = true;
    s.dataset.plausible = "true";
    s.dataset.domain = domain;
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (dsn) void initSentry(dsn);
}

async function initSentry(dsn: string): Promise<void> {
  try {
    const Sentry = await import("@sentry/browser");
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
    });
    sentryReady = true;
  } catch {
    /* optional dependency */
  }
}

export function track(event: string, props?: Record<string, string>): void {
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    /* ignore */
  }
}

export function trackRouteSearch(durationMs: number, ok: boolean, transfers: number): void {
  track("route_search", {
    ok: ok ? "1" : "0",
    ms: String(Math.round(durationMs)),
    transfers: String(transfers),
  });
}

export function captureError(error: unknown, context?: Record<string, string>): void {
  if (!sentryReady) return;
  void import("@sentry/browser").then((Sentry) => {
    Sentry.captureException(error, { extra: context });
  });
}

export function markPerformance(name: string, ms: number): void {
  track("perf", { name, ms: String(Math.round(ms)) });
  try {
    performance.measure(name, { start: 0, duration: ms });
  } catch {
    /* ignore */
  }
}
