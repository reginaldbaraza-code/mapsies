import { analyzeTransfers } from "../../services/commute";
import { formatTime } from "../../lib/format";
import type { Journey, JourneyLeg } from "../../types";
import type { WalkPace } from "../../types";

export type SpineVariant = "primary" | "subdued" | "risk";

interface SpineNode {
  kind: "transit" | "walk" | "break";
  risk?: "ok" | "tight" | "missed";
}

function isWalk(leg: JourneyLeg): boolean {
  return leg.mode === "walking" || leg.walking === true || !leg.line;
}

function buildNodes(journey: Journey, walkPace: WalkPace): SpineNode[] {
  const transfers = analyzeTransfers(journey, walkPace);
  const nodes: SpineNode[] = [];
  let ti = 0;

  journey.legs.forEach((leg, i) => {
    nodes.push({ kind: isWalk(leg) ? "walk" : "transit" });
    if (i < journey.legs.length - 1) {
      const t = transfers[ti];
      nodes.push({ kind: "break", risk: t?.risk ?? "ok" });
      ti++;
    }
  });
  return nodes;
}

/** Route Spine — FastRoute visual signature */
export function renderRouteSpine(
  journey: Journey,
  variant: SpineVariant,
  walkPace: WalkPace = "normal",
  opts?: { animate?: boolean; showTimes?: boolean }
): string {
  const nodes = buildNodes(journey, walkPace);
  const animate = opts?.animate ?? false;
  const showTimes = opts?.showTimes ?? variant === "primary";

  const segments = nodes
    .map((n) => {
      if (n.kind === "break") {
        const riskClass =
          n.risk === "missed" ? "route-spine__break--fail" : n.risk === "tight" ? "route-spine__break--warn" : "";
        return `<div class="route-spine__break ${riskClass}" aria-hidden="true"></div>`;
      }
      const cls =
        n.kind === "walk"
          ? "route-spine__segment route-spine__segment--walk"
          : "route-spine__segment route-spine__segment--transit";
      return `<div class="${cls}"></div>`;
    })
    .join("");

  const dep = formatTime(journey.legs[0].departure);
  const arr = formatTime(journey.legs[journey.legs.length - 1].arrival);

  const times = showTimes
    ? `<div class="route-spine__times">
        <span class="time-dominant">${dep}</span>
        <span class="route-spine__times-sep" aria-hidden="true">↓</span>
        <span class="time-dominant time-dominant--end">${arr}</span>
      </div>`
    : "";

  return `<div class="route-spine route-spine--${variant}${animate ? " route-spine--draw" : ""}" role="presentation">
    <div class="route-spine__track">${segments}</div>
    ${times}
  </div>`;
}

export function renderSpineSkeleton(): string {
  return `<div class="route-spine route-spine--primary route-spine--skeleton" aria-hidden="true">
    <div class="route-spine__track">
      <div class="route-spine__segment route-spine__segment--transit"></div>
      <div class="route-spine__break"></div>
      <div class="route-spine__segment route-spine__segment--transit"></div>
    </div>
  </div>`;
}
