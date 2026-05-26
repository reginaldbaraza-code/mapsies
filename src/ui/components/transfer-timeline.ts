import { formatTime, escapeHtml } from "../../lib/format";
import { analyzeTransfers } from "../../services/commute";
import { renderRouteSpine } from "./route-spine";
import type { Journey, JourneyLeg, WalkPace } from "../../types";

function isWalk(leg: JourneyLeg): boolean {
  return leg.mode === "walking" || leg.walking === true || !leg.line;
}

function verbForLeg(leg: JourneyLeg): string {
  if (isWalk(leg)) return `Geh nach ${leg.destination.name}`;
  const name = leg.line?.name ?? "Zug";
  return `${name} nehmen`;
}

/** TransferTimeline — spine-guided step flow */
export function renderTransferTimeline(
  container: HTMLElement,
  journey: Journey,
  walkPace: WalkPace
): void {
  const transfers = analyzeTransfers(journey, walkPace);
  container.className = "transfer-timeline";
  container.innerHTML = `
    <div class="transfer-timeline__spine-col">
      ${renderRouteSpine(journey, "primary", walkPace, { animate: true, showTimes: true })}
    </div>
    <div class="transfer-timeline__steps"></div>`;

  const steps = container.querySelector(".transfer-timeline__steps")!;
  let transferIdx = 0;

  journey.legs.forEach((leg, i) => {
    const walk = isWalk(leg);
    const delay = Math.max(leg.departureDelay ?? 0, leg.arrivalDelay ?? 0);
    const platform = leg.departurePlatform ?? leg.arrivalPlatform;

    const block = document.createElement("article");
    block.className = `timeline-step${walk ? " timeline-step--walk" : ""}`;
    block.innerHTML = `
      <time class="time-dominant time-dominant--sm">${formatTime(leg.departure)}</time>
      <h3 class="timeline-step__verb">${escapeHtml(verbForLeg(leg))}</h3>
      <p class="timeline-step__meta">
        ${escapeHtml(leg.destination.name)}
        ${platform ? ` · Gleis ${escapeHtml(platform)}` : ""}
        ${delay > 0 ? ` · +${Math.round(delay / 60)} Min.` : ""}
      </p>`;
    steps.appendChild(block);

    if (i < journey.legs.length - 1 && transfers[transferIdx]) {
      const t = transfers[transferIdx];
      const tr = document.createElement("div");
      tr.className = `timeline-transfer${t.risk !== "ok" ? ` timeline-transfer--${t.risk}` : ""}`;
      tr.textContent = t.message;
      steps.appendChild(tr);
      transferIdx++;
    }
  });
}
