import { analyzeJourneyInsights } from "../services/commute";
import { formatTime, countTransfers } from "../lib/format";
import { t } from "../i18n";
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

function transferCountLabel(transfers: number): string {
  if (transfers === 0) return t("common.direct");
  const key = transfers > 1 ? "common.transfers" : "common.transfer";
  return `${transfers} ${t(key)}`;
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
  const line = leg?.line?.name ?? t("common.connection");
  const platform = leg?.departurePlatform;
  const depTime = leg ? formatTime(leg.departure) : "—";
  const transfers = countTransfers(journey.legs);

  let action: string;
  let actionSub: string;

  switch (state) {
    case "late":
      action = t("decision.late.action");
      actionSub = t("decision.late.sub");
      break;
    case "urgent-leave":
      action = mins <= 3 ? t("decision.urgent.now") : t("decision.urgent.in", { mins });
      actionSub = line ? t("decision.takeLineSub", { line }) : t("decision.leaveAt", { time: depTime });
      if (platform) actionSub += t("decision.platformSuffix", { platform });
      break;
    case "missed-risk":
      action = t("decision.missed.action");
      actionSub =
        insights.transfers.find((tr) => tr.risk !== "ok")?.station ?? transferCountLabel(transfers);
      break;
    case "low-reliability":
      action = t("decision.low.action");
      actionSub = t("decision.low.sub");
      break;
    case "night":
      action =
        mins <= 15 ? t("decision.urgent.in", { mins }) : t("decision.leaveAtNight", { time: depTime });
      actionSub = line ? t("decision.night.line", { line }) : t("decision.night.service");
      break;
    default:
      if (insights.canMakeNow === false && mins > 0) {
        action = t("decision.rush.platform");
        actionSub = t("decision.rush.until", { mins, time: depTime });
      } else {
        action = line ? t("decision.takeLine", { line }) : t("decision.leaveAt", { time: depTime });
        actionSub = transferCountLabel(transfers);
      }
      break;
  }

  const successProbability = insights.reliabilityScore;
  let probabilityLabel = t("decision.prob.default");
  if (state === "late") probabilityLabel = t("decision.late.prob");
  else if (state === "missed-risk") probabilityLabel = t("decision.prob.missed");
  else if (state === "low-reliability") probabilityLabel = t("decision.low.prob");

  return { state, action, actionSub, successProbability, probabilityLabel };
}
