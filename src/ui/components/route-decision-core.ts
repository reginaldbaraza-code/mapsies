import {
  formatDuration,
  formatTime,
  journeyDurationSeconds,
} from "../../lib/format";
import { buildDecisionPresentation } from "../decision-state";
import { renderRouteSpine, renderSpineSkeleton } from "./route-spine";
import { renderDepartureTimer } from "./departure-timer";
import type { Journey, WalkPace } from "../../types";

export function renderDecisionSkeleton(container: HTMLElement): void {
  container.className = "route-decision-core is-skeleton";
  container.innerHTML = `
    <div class="route-decision-core__layout">
      ${renderSpineSkeleton()}
      <div class="route-decision-core__body">
        <div class="departure-timer departure-timer--skeleton" aria-hidden="true"></div>
        <div class="route-decision-core__skeleton-line" aria-hidden="true"></div>
        <p class="route-decision-core__loading-copy">Entscheidung…</p>
      </div>
    </div>`;
}

export function renderRouteDecisionCore(
  container: HTMLElement,
  journey: Journey,
  walkPace: WalkPace,
  onOpenDetail: () => void
): void {
  const d = buildDecisionPresentation(journey, walkPace);
  const legs = journey.legs;
  const duration = formatDuration(journeyDurationSeconds(journey));

  container.className = `route-decision-core state-${d.state}`;
  container.innerHTML = `
    <div class="route-decision-core__layout">
      ${renderRouteSpine(journey, d.state === "missed-risk" ? "risk" : "primary", walkPace, { animate: true, showTimes: false })}
      <div class="route-decision-core__body">
        <div class="departure-timer-slot"></div>
        <p class="route-decision-core__action">${escapeHtml(d.action)}</p>
        <p class="route-decision-core__action-sub">${escapeHtml(d.actionSub)}</p>
        <div class="route-decision-core__times-block">
          <span class="time-dominant time-dominant--duration">${duration}</span>
          <span class="route-decision-core__times-range">
            <span class="time-dominant time-dominant--sm">${formatTime(legs[0].departure)}</span>
            <span aria-hidden="true">→</span>
            <span class="time-dominant time-dominant--sm">${formatTime(legs[legs.length - 1].arrival)}</span>
          </span>
        </div>
        <div class="route-decision-core__probability" role="status">
          <span class="route-decision-core__prob-value time-dominant time-dominant--prob">${d.successProbability}%</span>
          <span class="route-decision-core__prob-label">${escapeHtml(d.probabilityLabel)}</span>
        </div>
        <button type="button" class="route-decision-core__detail">Fahrtverlauf öffnen</button>
      </div>
    </div>`;

  const timerSlot = container.querySelector(".departure-timer-slot");
  if (timerSlot) renderDepartureTimer(timerSlot as HTMLElement, journey);

  container.querySelector(".route-decision-core__detail")?.addEventListener("click", (e) => {
    e.stopPropagation();
    onOpenDetail();
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
