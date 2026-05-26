export const API = {
  db: "/api/db",
  dbV5: "/api/db-v5",
  bvg: "https://v6.bvg.transport.rest",
  nominatim: "/api/nominatim",
} as const;

export const DEBOUNCE_MS = 300;
export const RECENT_LIMIT = 8;
export const DEFAULT_CENTER: [number, number] = [51.1657, 10.4515];
export const DEFAULT_ZOOM = 6;
export const BERLIN_BBOX = { south: 52.338, north: 52.675, west: 13.088, east: 13.761 };
export const CACHE_TTL_MS = 5 * 60 * 1000;

export const PRODUCT_LABELS: Record<string, string> = {
  subway: "U-Bahn",
  suburban: "S-Bahn",
  bus: "Bus",
  tram: "Tram",
  regional: "RB",
  regionalExpress: "RE",
  ferry: "Fähre",
};
