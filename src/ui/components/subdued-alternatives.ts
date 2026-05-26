import { formatDuration, formatTime, journeyDurationSeconds } from "../../lib/format";
import { t } from "../../i18n";
import { analyzeJourneyInsights } from "../../services/commute";
import { renderRouteSpine } from "./route-spine";
import type { Journey, WalkPace } from "../../types";

/** SECONDARY — subordinate spines, never equal to primary */
export function renderSubduedAlternatives(
  container: HTMLElement,
  journeys: Journey[],
  selectedIndex: number,
  walkPace: WalkPace,
  onPick: (index: number) => void
): void {
  const alts = journeys
    .map((j, i) => ({ j, i }))
    .filter((x) => x.i !== selectedIndex)
    .slice(0, 2);

  container.innerHTML = "";

  if (!alts.length) {
    container.classList.add("hidden");
    return;
  }

  container.classList.remove("hidden");
  const label = document.createElement("p");
  label.className = "alt-subdued__label";
  label.textContent = t("results.altsLabel");
  container.appendChild(label);

  alts.forEach(({ j, i }) => {
    const score = analyzeJourneyInsights(j, walkPace).reliabilityScore;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "alt-subdued";
    btn.innerHTML = `
      <div class="alt-subdued__spine">${renderRouteSpine(j, "subdued", walkPace, { showTimes: false })}</div>
      <div class="alt-subdued__copy">
        <span class="time-dominant time-dominant--sm">${formatDuration(journeyDurationSeconds(j))}</span>
        <span class="alt-subdued__meta">${formatTime(j.legs[0].departure)} · ${score}%</span>
      </div>`;
    btn.addEventListener("click", () => onPick(i));
    container.appendChild(btn);
  });
}
