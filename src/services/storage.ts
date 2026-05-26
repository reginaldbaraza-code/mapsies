import { RECENT_LIMIT } from "../config";
import type { Place, RecentTrip, WalkPace } from "../types";

const RECENT_KEY = "fastroute_recent";
const HOME_KEY = "fastroute_home";
const WORK_KEY = "fastroute_work";

export function loadRecent(): RecentTrip[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveRecent(entry: RecentTrip): void {
  const stored = loadRecent().filter(
    (e) => !(e.origin === entry.origin && e.destination === entry.destination)
  );
  stored.unshift(entry);
  localStorage.setItem(RECENT_KEY, JSON.stringify(stored.slice(0, RECENT_LIMIT)));
}

export function loadWalkPace(): WalkPace {
  const v = localStorage.getItem("fastroute_walk_pace");
  if (v === "slow" || v === "fast") return v;
  return "normal";
}

export function saveWalkPace(pace: WalkPace): void {
  localStorage.setItem("fastroute_walk_pace", pace);
}

export function loadShortcut(key: typeof HOME_KEY | typeof WORK_KEY): Place | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Place) : null;
  } catch {
    return null;
  }
}

export function saveShortcut(key: typeof HOME_KEY | typeof WORK_KEY, place: Place): void {
  localStorage.setItem(key, JSON.stringify(place));
}

export const HOME_KEY_EXPORT = HOME_KEY;
export const WORK_KEY_EXPORT = WORK_KEY;
