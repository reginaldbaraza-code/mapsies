import { minutesUntilFirstTransit } from "../decision-state";
import { formatTime } from "../../lib/format";
import type { Journey } from "../../types";

/** PRIMARY urgency — time-dominant, verb-first */
export function renderDepartureTimer(container: HTMLElement, journey: Journey): void {
  const leg = journey.legs.find((l) => l.line && !l.walking && l.mode !== "walking") ?? journey.legs[0];
  if (!leg) {
    container.innerHTML = "";
    container.className = "departure-timer";
    return;
  }

  const mins = minutesUntilFirstTransit(journey);
  const time = formatTime(leg.departure);
  const line = leg.line?.name ?? "";

  container.className = "departure-timer";
  container.classList.remove("departure-timer--urgent", "departure-timer--late");

  if (mins < 0) {
    container.classList.add("departure-timer--late");
    container.innerHTML = `<span class="time-dominant time-dominant--sm">Verpasst</span>`;
    return;
  }

  if (mins <= 10) {
    container.classList.add("departure-timer--urgent");
    const verb = mins <= 3 ? "Jetzt los" : `In ${mins} Min. los`;
    container.innerHTML = `
      <span class="time-dominant">${verb}</span>
      <span class="departure-timer__meta">${line ? `${line} · ` : ""}${time}</span>`;
    return;
  }

  container.innerHTML = `
    <span class="time-dominant time-dominant--md">${time}</span>
    <span class="departure-timer__meta">Abfahrt · ${mins} Min.</span>`;
}
