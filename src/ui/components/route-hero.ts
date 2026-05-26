import {
  formatDuration,
  formatTime,
  journeyDurationSeconds,
  countTransfers,
} from "../../lib/format";
import { t } from "../../i18n";
import { analyzeJourneyInsights, reliabilityLabel } from "../../services/commute";
import type { Journey, WalkPace } from "../../types";

export function renderRouteHero(
  el: HTMLElement,
  journey: Journey,
  walkPace: WalkPace,
  onSelect: () => void
): void {
  const legs = journey.legs;
  const ins = analyzeJourneyInsights(journey, walkPace);
  const transfers = countTransfers(legs);

  el.className = "route-hero";
  el.innerHTML = `
    <div class="route-hero__duration">${formatDuration(journeyDurationSeconds(journey))}</div>
    <div class="route-hero__times">
      <span>${formatTime(legs[0].departure)}</span>
      <span class="route-hero__arrow">→</span>
      <span>${formatTime(legs[legs.length - 1].arrival)}</span>
    </div>
    <div class="route-hero__meta">
      <span>${transfers === 0 ? t("common.direct") : `${transfers} ${transfers > 1 ? t("common.transfers") : t("common.transfer")}`} · ${t("common.dticket")}</span>
      <span class="route-hero__reliability">${ins.reliabilityScore}% · ${reliabilityLabel(ins.reliabilityScore)}</span>
    </div>`;

  el.onclick = onSelect;
  el.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };
}

export function renderAltRoute(
  journey: Journey,
  index: number,
  walkPace: WalkPace,
  isSelected: boolean,
  onPick: (i: number) => void
): HTMLButtonElement {
  const ins = analyzeJourneyInsights(journey, walkPace);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "alt-route";
  if (isSelected) btn.style.borderColor = "var(--accent-strong)";
  btn.innerHTML = `
    <div>
      <strong>${formatDuration(journeyDurationSeconds(journey))}</strong>
      <span>${formatTime(journey.legs[0].departure)} · ${ins.reliabilityScore}%</span>
    </div>
    <span>→</span>`;
  btn.addEventListener("click", () => onPick(index));
  return btn;
}
