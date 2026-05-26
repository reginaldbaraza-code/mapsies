import { t } from "../i18n";
import type { Confidence, DisruptionSummary, Journey, Remark } from "../types";

function collectRemarks(journey: Journey): Remark[] {
  const out: Remark[] = [];
  for (const leg of journey.legs) {
    if (leg.remarks) out.push(...leg.remarks);
  }
  return out;
}

function humanizeRemark(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("ausfall") || lower.includes("cancel")) return t("disruption.remark.cancel");
  if (lower.includes("gleis") && (lower.includes("geändert") || lower.includes("change")))
    return t("disruption.remark.platform");
  if (lower.includes("verspätung") || lower.includes("delay")) return t("disruption.remark.delay");
  if (lower.includes("bus") && (lower.includes("ersatz") || lower.includes("replacement")))
    return t("disruption.remark.bus");
  if (lower.includes("construction") || lower.includes("bauarbeit")) return t("disruption.remark.works");
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

export function analyzeJourney(journey: Journey): DisruptionSummary {
  const messages: string[] = [];
  const humanMessages: string[] = [];
  let hasCancellation = false;
  let hasMajorDelay = false;

  for (const leg of journey.legs) {
    const depDelay = leg.departureDelay ?? 0;
    const arrDelay = leg.arrivalDelay ?? 0;
    if (depDelay > 300 || arrDelay > 300) {
      hasMajorDelay = true;
      const mins = Math.round(Math.max(depDelay, arrDelay) / 60);
      const line = leg.line?.name ?? t("common.connection");
      const msg = t("disruption.delayLine", { line, mins });
      if (!messages.includes(msg)) messages.push(msg);
      if (!humanMessages.includes(msg)) humanMessages.push(msg);
    }
  }

  for (const r of collectRemarks(journey)) {
    const text = (r.summary ?? r.text ?? "").trim();
    if (!text) continue;
    const lower = text.toLowerCase();
    if (lower.includes("ausfall") || lower.includes("cancel")) {
      if (lower.includes("ausfall") || lower.includes("cancel")) hasCancellation = true;
    }
    if (!messages.includes(text)) messages.push(text);
    const human = humanizeRemark(text);
    if (!humanMessages.includes(human)) humanMessages.push(human);
  }

  let confidence: Confidence = "high";
  if (hasCancellation) confidence = "low";
  else if (hasMajorDelay || messages.length > 0) confidence = "medium";

  return {
    messages: messages.slice(0, 5),
    humanMessages: humanMessages.slice(0, 6),
    hasCancellation,
    hasMajorDelay,
    confidence,
  };
}

export function confidenceLabel(c: Confidence): string {
  return { high: t("confidence.high"), medium: t("confidence.medium"), low: t("confidence.low") }[c];
}
