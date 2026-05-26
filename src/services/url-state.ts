import type { Place } from "../types";

export interface RouteUrlState {
  from?: string;
  to?: string;
  dep?: string;
}

export function parseRouteFromUrl(href = window.location.href): RouteUrlState {
  const u = new URL(href);
  return {
    from: u.searchParams.get("from") ?? undefined,
    to: u.searchParams.get("to") ?? undefined,
    dep: u.searchParams.get("dep") ?? undefined,
  };
}

export function buildShareUrl(
  origin: Place,
  dest: Place,
  departureIso?: string
): string {
  const u = new URL(window.location.origin + window.location.pathname);
  u.searchParams.set("from", origin.label);
  u.searchParams.set("to", dest.label);
  if (origin.lat) u.searchParams.set("flat", String(origin.lat));
  if (origin.lon) u.searchParams.set("flon", String(origin.lon));
  if (dest.lat) u.searchParams.set("tlat", String(dest.lat));
  if (dest.lon) u.searchParams.set("tlon", String(dest.lon));
  if (departureIso) u.searchParams.set("dep", departureIso);
  return u.toString();
}

export function applyRouteToUrl(origin: Place, dest: Place, departureIso?: string): void {
  const next = buildShareUrl(origin, dest, departureIso);
  window.history.replaceState({}, "", next);
}

/** SEO slugs: /berlin-to-hamburg-deutschlandticket */
export function parseLandingPath(pathname: string): { from: string; to: string } | null {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  if (!slug || slug === "index.html") return null;

  const known: Record<string, { from: string; to: string }> = {
    "berlin-to-hamburg-deutschlandticket": { from: "Berlin Hbf", to: "Hamburg Hbf" },
    "berlin-to-munich-deutschlandticket": { from: "Berlin Hbf", to: "München Hbf" },
    "munich-commute": { from: "München Hbf", to: "München Marienplatz" },
    "berlin-commute": { from: "Alexanderplatz, Berlin", to: "Berlin Hbf" },
    "cologne-to-frankfurt-deutschlandticket": { from: "Köln Hbf", to: "Frankfurt (Main) Hbf" },
  };
  if (known[slug]) return known[slug];

  const m = slug.match(/^(.+)-to-(.+)-deutschlandticket$/);
  if (!m) return null;
  const from = m[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const to = m[2].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { from: `${from} Hbf`, to: `${to} Hbf` };
}

export function setLandingMeta(from: string, to: string): void {
  const title = `${from} → ${to} · Deutschlandticket | FastRoute`;
  document.title = title;
  const desc = `Schnellste Deutschlandticket-Verbindung von ${from} nach ${to}. Ohne ICE/IC.`;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", desc);
  setOg("og:title", title);
  setOg("og:description", desc);
}

function setOg(prop: string, content: string) {
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", prop);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
