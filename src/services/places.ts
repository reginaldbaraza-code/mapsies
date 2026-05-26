import { API } from "../config";
import { RECOMMENDATIONS } from "../constants/recommendations";
import { fetchJson } from "../lib/http";
import { isBvgApi, isBvgStopId, isDbStopId } from "../lib/stop-ids";
import type { Place } from "../types";

function locationParams(prefix: string, place: Place, apiBase: string): string[] {
  if (isBvgApi(apiBase)) {
    const bvg = place.bvgId ?? (isBvgStopId(place.dbId) ? place.dbId : undefined);
    if (bvg) return [`${prefix}=${encodeURIComponent(bvg)}`];
  } else if (place.dbId && isDbStopId(place.dbId)) {
    return [`${prefix}=${encodeURIComponent(place.dbId)}`];
  }
  return [
    `${prefix}.latitude=${place.lat}`,
    `${prefix}.longitude=${place.lon}`,
    `${prefix}.address=${encodeURIComponent(place.label)}`,
  ];
}

export { locationParams };

interface HafasLocation {
  type?: string;
  id?: string;
  name?: string;
  location?: { latitude?: number; longitude?: number };
}

async function searchDbLocations(query: string, apiBase: string): Promise<Place[]> {
  const params = new URLSearchParams({
    query,
    results: "6",
    language: "de",
    stops: "true",
    addresses: "true",
    poi: "true",
  });
  try {
    const data = await fetchJson<HafasLocation[]>(`${apiBase}/locations?${params}`, { cache: true });
    return (Array.isArray(data) ? data : [])
      .map((loc) => ({
        lat: loc.location?.latitude ?? 0,
        lon: loc.location?.longitude ?? 0,
        label: loc.name ?? "",
        dbId: loc.type === "stop" && isDbStopId(loc.id) ? loc.id : undefined,
        bvgId: loc.type === "stop" && isBvgStopId(loc.id) ? loc.id : undefined,
        type: (loc.type === "stop" ? "station" : "place") as Place["type"],
      }))
      .filter((p) => p.lat && p.lon);
  } catch {
    return [];
  }
}

async function searchBvgLocations(query: string): Promise<Place[]> {
  const params = new URLSearchParams({ query, results: "6", language: "de" });
  try {
    const data = await fetchJson<HafasLocation[]>(`${API.bvg}/locations?${params}`, { cache: true });
    return (Array.isArray(data) ? data : [])
      .map((loc) => ({
        lat: loc.location?.latitude ?? 0,
        lon: loc.location?.longitude ?? 0,
        label: loc.name ?? "",
        bvgId: loc.type === "stop" && isBvgStopId(loc.id) ? loc.id : undefined,
        type: "station" as const,
      }))
      .filter((p) => p.lat && p.lon);
  } catch {
    return [];
  }
}

async function searchNominatim(query: string, limit = "6"): Promise<Place[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit,
    addressdetails: "1",
    countrycodes: "de",
  });
  try {
    const data = await fetchJson<Array<{ lat: string; lon: string; display_name: string }>>(
      `${API.nominatim}/search?${params}`,
      { cache: true }
    );
    return data.map((p) => ({
      lat: parseFloat(p.lat),
      lon: parseFloat(p.lon),
      label: p.display_name,
      type: "address",
    }));
  } catch {
    return [];
  }
}

function dedupePlaces(places: Place[]): Place[] {
  const map = new Map<string, Place>();
  for (const p of places) {
    const key = `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
    const ex = map.get(key);
    if (ex) {
      if (p.dbId) ex.dbId = p.dbId;
      if (p.bvgId) ex.bvgId = p.bvgId;
    } else {
      map.set(key, { ...p });
    }
  }
  return [...map.values()];
}

export function filterRecommendations(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return RECOMMENDATIONS;
  return RECOMMENDATIONS.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      r.short.toLowerCase().includes(q) ||
      r.group.toLowerCase().includes(q)
  );
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const recs = filterRecommendations(query).map((r) => ({ ...r }));
  if (query.length < 2) return recs;
  const [db, bvg, nom] = await Promise.all([
    searchDbLocations(query, API.db),
    searchBvgLocations(query),
    searchNominatim(query),
  ]);
  return dedupePlaces([...recs, ...db, ...bvg, ...nom]).slice(0, 10);
}

export async function resolveLocation(text: string): Promise<Place> {
  const places = await searchPlaces(text);
  if (places.length) return places[0];
  throw new Error(
    `„${text}" nicht gefunden. Wähle einen Vorschlag aus der Liste.`
  );
}
