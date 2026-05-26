import { PRODUCT_LABELS } from "../config";
import type { Journey, JourneyLeg } from "../types";

export function formatDuration(seconds: number): string {
  const t = Math.round(seconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function formatDistance(m: number): string {
  return m > 0 ? `${(m / 1000).toFixed(1)} km` : "—";
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTimeLocal(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function journeyDurationSeconds(journey: Journey): number {
  const dep = new Date(journey.legs[0].departure);
  const arr = new Date(journey.legs[journey.legs.length - 1].arrival);
  return Math.max(0, (arr.getTime() - dep.getTime()) / 1000);
}

export function countTransfers(legs: JourneyLeg[]): number {
  return Math.max(0, legs.filter((l) => l.line).length - 1);
}

export function formatLeg(leg: JourneyLeg): string {
  if (leg.mode === "walking" || (!leg.line && leg.walking)) {
    return `Zu Fuß · ${leg.origin.name}`;
  }
  const product = PRODUCT_LABELS[leg.line?.product ?? ""] ?? "";
  const line = leg.line?.name ?? "";
  const dir = leg.direction ? ` → ${leg.direction}` : "";
  return `${product} ${line}${dir}`.trim();
}

export function legBadgeClass(leg: JourneyLeg): string {
  if (leg.mode === "walking" || !leg.line) return "walk";
  return leg.line.product ?? "default";
}

export function legBadgeText(leg: JourneyLeg): string {
  if (leg.mode === "walking" || !leg.line) return "🚶";
  return leg.line.productName ?? leg.line.name?.slice(0, 3) ?? "•";
}

export function escapeHtml(text: string): string {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}
