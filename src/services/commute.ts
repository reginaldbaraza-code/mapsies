import { t } from "../i18n";
import type { Journey, JourneyInsights, TransferInsight, TransferRisk, WalkPace } from "../types";

const TRANSFER_BUFFER_SEC = 120;
const DEFAULT_WALK_SEC = 180;

export const WALK_MPS: Record<WalkPace, number> = {
  slow: 1.1,
  normal: 1.4,
  fast: 1.8,
};

function legDurationSec(leg: { departure: string; arrival: string }): number {
  return Math.max(0, (new Date(leg.arrival).getTime() - new Date(leg.departure).getTime()) / 1000);
}

function walkSecondsForLeg(
  leg: Journey["legs"][0],
  pace: WalkPace
): number {
  if (leg.distance && leg.distance > 0) {
    return Math.ceil(leg.distance / WALK_MPS[pace]);
  }
  return legDurationSec(leg);
}

function defaultWalkBetween(stationA: string, stationB: string): number {
  const a = stationA.toLowerCase().trim();
  const b = stationB.toLowerCase().trim();
  if (a === b || a.includes(b) || b.includes(a)) return DEFAULT_WALK_SEC;
  return 300;
}

function platformFromLeg(leg: Journey["legs"][0], kind: "dep" | "arr"): string | undefined {
  const p = kind === "dep" ? leg.departurePlatform : leg.arrivalPlatform;
  if (p) return p;
  for (const r of leg.remarks ?? []) {
    const text = (r.summary ?? r.text ?? "").toLowerCase();
    const m = text.match(/gleis\s*(\d+[a-z]?)/i) ?? text.match(/platform\s*(\d+[a-z]?)/i);
    if (m) return m[1];
  }
  return undefined;
}

function buildTransferMessage(
  risk: TransferRisk,
  station: string,
  availMin: number,
  walkMin: number,
  platformFrom?: string,
  platformTo?: string
): string {
  const params = { station, avail: availMin, walk: walkMin };
  let message: string;
  if (risk === "missed") message = t("transfer.missed", params);
  else if (risk === "tight") message = t("transfer.tight", params);
  else message = t("transfer.ok", params);

  if (platformFrom && platformTo && platformFrom !== platformTo) {
    message += t("transfer.platform", { from: platformFrom, to: platformTo });
  }
  return message;
}

export function analyzeTransfers(journey: Journey, pace: WalkPace = "normal"): TransferInsight[] {
  const legs = journey.legs;
  const out: TransferInsight[] = [];

  for (let i = 0; i < legs.length - 1; i++) {
    const cur = legs[i];
    const next = legs[i + 1];
    const station = cur.destination?.name ?? next.origin?.name ?? t("transfer.stationDefault");

    const arrMs =
      new Date(cur.arrival).getTime() + (cur.arrivalDelay ?? 0) * 1000;
    const depMs =
      new Date(next.departure).getTime() + (next.departureDelay ?? 0) * 1000;
    const availableSeconds = Math.max(0, Math.round((depMs - arrMs) / 1000));

    let walkSeconds: number;
    if (next.mode === "walking" || next.walking) {
      walkSeconds = walkSecondsForLeg(next, pace);
    } else if (cur.mode === "walking" || cur.walking) {
      walkSeconds = walkSecondsForLeg(cur, pace);
    } else {
      walkSeconds = defaultWalkBetween(cur.destination.name, next.origin.name);
    }

    const platformFrom = platformFromLeg(cur, "arr");
    const platformTo = platformFromLeg(next, "dep");
    const platformChanged = Boolean(
      platformFrom && platformTo && platformFrom !== platformTo
    );

    let risk: TransferRisk = "ok";
    if (availableSeconds < walkSeconds) risk = "missed";
    else if (availableSeconds < walkSeconds + TRANSFER_BUFFER_SEC) risk = "tight";

    const message = buildTransferMessage(
      risk,
      station,
      Math.round(availableSeconds / 60),
      Math.round(walkSeconds / 60),
      platformFrom,
      platformTo
    );

    out.push({
      index: out.length,
      station,
      availableSeconds,
      walkSeconds,
      risk,
      platformFrom,
      platformTo,
      platformChanged,
      message,
    });
  }

  return out;
}

export function scoreReliability(journey: Journey, transfers: TransferInsight[]): number {
  let score = 100;
  for (const tr of transfers) {
    if (tr.risk === "missed") score -= 35;
    else if (tr.risk === "tight") score -= 12;
    if (tr.platformChanged) score -= 4;
  }
  for (const leg of journey.legs) {
    const d = Math.max(leg.departureDelay ?? 0, leg.arrivalDelay ?? 0);
    if (d > 300) score -= 8;
    else if (d > 60) score -= 3;
    for (const r of leg.remarks ?? []) {
      const text = (r.summary ?? r.text ?? "").toLowerCase();
      if (text.includes("ausfall") || text.includes("cancel")) score -= 25;
    }
  }
  return Math.max(0, Math.min(100, score));
}

export function estimateDelayProbability(journey: Journey): number {
  let p = 8;
  for (const leg of journey.legs) {
    const d = Math.max(leg.departureDelay ?? 0, leg.arrivalDelay ?? 0);
    p += Math.min(25, Math.round(d / 60) * 4);
    p += (leg.remarks?.length ?? 0) * 3;
    for (const r of leg.remarks ?? []) {
      const text = (r.summary ?? r.text ?? "").toLowerCase();
      if (text.includes("ausfall")) p += 30;
    }
  }
  return Math.min(95, p);
}

/** Can user still make the first departing leg from now? */
export function canMakeFirstLeg(journey: Journey, pace: WalkPace = "normal"): boolean | null {
  const first = journey.legs[0];
  if (!first) return null;
  if (first.mode === "walking" || first.walking) return true;

  const depMs = new Date(first.departure).getTime() + (first.departureDelay ?? 0) * 1000;
  const now = Date.now();
  const untilDepSec = (depMs - now) / 1000;
  if (untilDepSec < 0) return false;
  const walkToStart = first.distance ? Math.ceil(first.distance / WALK_MPS[pace]) : 240;
  return untilDepSec >= walkToStart + 60;
}

export function analyzeJourneyInsights(
  journey: Journey,
  pace: WalkPace = "normal"
): JourneyInsights {
  const transfers = analyzeTransfers(journey, pace);
  const reliabilityScore = scoreReliability(journey, transfers);
  const delayProbability = estimateDelayProbability(journey);

  const missedWarnings = transfers.filter((tr) => tr.risk === "missed").map((tr) => tr.message);
  const platformAlerts = transfers
    .filter((tr) => tr.platformChanged)
    .map((tr) =>
      t("insights.platformAlert", {
        station: tr.station,
        from: tr.platformFrom ?? "",
        to: tr.platformTo ?? "",
      })
    );

  const canMakeNow = canMakeFirstLeg(journey, pace);
  let makeConnectionHint: string | null = null;
  if (canMakeNow === false) {
    makeConnectionHint = t("insights.missedFirst");
  } else if (canMakeNow === true && transfers.some((tr) => tr.risk === "tight")) {
    makeConnectionHint = t("insights.tightTransfer");
  } else if (canMakeNow === true) {
    makeConnectionHint = t("insights.makeFirst");
  }

  let overallTransferRisk: JourneyInsights["overallTransferRisk"] = "low";
  if (transfers.some((tr) => tr.risk === "missed")) overallTransferRisk = "high";
  else if (transfers.some((tr) => tr.risk === "tight")) overallTransferRisk = "medium";

  return {
    transfers,
    overallTransferRisk,
    reliabilityScore,
    delayProbability,
    missedWarnings,
    platformAlerts,
    canMakeNow,
    makeConnectionHint,
  };
}

export function rankJourneys(journeys: Journey[], pace: WalkPace = "normal"): Journey[] {
  return [...journeys]
    .map((j) => {
      const ins = analyzeJourneyInsights(j, pace);
      return { ...j, reliabilityScore: ins.reliabilityScore };
    })
    .sort((a, b) => {
      const scoreDiff = (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0);
      if (Math.abs(scoreDiff) >= 8) return scoreDiff;
      const da =
        new Date(a.legs[a.legs.length - 1].arrival).getTime() -
        new Date(a.legs[0].departure).getTime();
      const db =
        new Date(b.legs[b.legs.length - 1].arrival).getTime() -
        new Date(b.legs[0].departure).getTime();
      return da - db;
    });
}

export function reliabilityLabel(score: number): string {
  if (score >= 85) return t("reliability.veryHigh");
  if (score >= 70) return t("reliability.high");
  if (score >= 50) return t("reliability.uncertain");
  return t("reliability.risky");
}
