import { analyzeJourneyInsights } from "../services/commute";
import { formatTime, countTransfers } from "../lib/format";
import type { Journey, JourneyInsights, WalkPace } from "../types";

export type DecisionUiState =
  | "urgent-leave"
  | "late"
  | "missed-risk"
  | "low-reliability"
  | "night"
  | "calm";

export interface DecisionPresentation {
  state: DecisionUiState;
  action: string;
  actionSub: string;
  successProbability: number;
  probabilityLabel: string;
}

export function minutesUntilFirstTransit(journey: Journey): number {
  const leg = journey.legs.find((l) => l.line && !l.walking && l.mode !== "walking") ?? journey.legs[0];
  if (!leg) return 999;
  const delay = leg.departureDelay ?? 0;
  return Math.round((new Date(leg.departure).getTime() + delay * 1000 - Date.now()) / 60000);
}

function firstTransitLeg(journey: Journey) {
  return journey.legs.find((l) => l.line && !l.walking && l.mode !== "walking") ?? journey.legs[0];
}

function isNightTravel(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 5;
}

export function resolveDecisionUiState(
  journey: Journey,
  insights: JourneyInsights
): DecisionUiState {
  const mins = minutesUntilFirstTransit(journey);
  const ins = insights;

  if (mins < 0) return "late";
  if (mins <= 8) return "urgent-leave";
  if (ins.overallTransferRisk === "high" || ins.missedWarnings.length > 0) return "missed-risk";
  if (ins.reliabilityScore < 55) return "low-reliability";
  if (isNightTravel()) return "night";
  return "calm";
}

export function buildDecisionPresentation(
  journey: Journey,
  walkPace: WalkPace
): DecisionPresentation {
  const insights = analyzeJourneyInsights(journey, walkPace);
  const state = resolveDecisionUiState(journey, insights);
  const leg = firstTransitLeg(journey);
  const mins = minutesUntilFirstTransit(journey);
  const line = leg?.line?.name ?? "Verbindung";
  const platform = leg?.departurePlatform;
  const depTime = leg ? formatTime(leg.departure) : "—";
  const transfers = countTransfers(journey.legs);

  let action: string;
  let actionSub: string;

  switch (state) {
    case "late":
      action = "Nächste Verbindung wählen";
      actionSub = "Abfahrt verpasst";
      break;
    case "urgent-leave":
      action = mins <= 3 ? "Jetzt los" : `In ${mins} Min. los`;
      actionSub = line ? `${line} nehmen` : `Los um ${depTime}`;
      if (platform) actionSub += ` · Gleis ${platform}`;
      break;
    case "missed-risk":
      action = "Beim Umsteigen aufpassen";
      actionSub =
        insights.transfers.find((t) => t.risk !== "ok")?.station ??
        `${transfers} Umstieg${transfers > 1 ? "e" : ""}`;
      break;
    case "low-reliability":
      action = "Schnellste Route nehmen";
      actionSub = "Mit Verspätung rechnen";
      break;
    case "night":
      action = mins <= 15 ? `In ${mins} Min. los` : `Um ${depTime} los`;
      actionSub = line ? `${line} nehmen · Nacht` : "Nachtverkehr";
      break;
    default:
      if (insights.canMakeNow === false && mins > 0) {
        action = "Zum Gleis gehen";
        actionSub = `${mins} Min. bis ${depTime}`;
      } else {
        action = line ? `${line} nehmen` : `Um ${depTime} los`;
        actionSub =
          transfers === 0 ? "Direkt" : `${transfers} Umstieg${transfers > 1 ? "e" : ""}`;
      }
      break;
  }

  const successProbability = insights.reliabilityScore;
  let probabilityLabel = "Wahrscheinlichkeit, dass du ankommst";
  if (state === "late") probabilityLabel = "Diese Verbindung nicht mehr nutzbar";
  else if (state === "missed-risk") probabilityLabel = "Umstiegsrisiko erhöht";
  else if (state === "low-reliability") probabilityLabel = "Mit Verzögerungen rechnen";

  return { state, action, actionSub, successProbability, probabilityLabel };
}
