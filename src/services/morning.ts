import { t } from "../i18n";
import { loadShortcut, HOME_KEY_EXPORT, WORK_KEY_EXPORT } from "./storage";
import type { Place } from "../types";

export interface MorningSuggestion {
  origin: Place;
  destination: Place;
  label: string;
}

export function getMorningSuggestion(): MorningSuggestion | null {
  const hour = new Date().getHours();
  if (hour < 5 || hour > 11) return null;

  const home = loadShortcut(HOME_KEY_EXPORT);
  const work = loadShortcut(WORK_KEY_EXPORT);
  if (!home || !work) return null;

  return {
    origin: home,
    destination: work,
    label: t("morning.label"),
  };
}

export function isCommuteMonitoringEnabled(): boolean {
  return localStorage.getItem("fastroute_commute_monitor") === "1";
}

export function setCommuteMonitoring(on: boolean): void {
  localStorage.setItem("fastroute_commute_monitor", on ? "1" : "0");
}
