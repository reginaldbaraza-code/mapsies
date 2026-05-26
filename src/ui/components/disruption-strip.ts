import { analyzeJourney } from "../../services/disruptions";
import { escapeHtml } from "../../lib/format";
import type { Journey } from "../../types";

export function renderDisruptionStrip(container: HTMLElement, journey: Journey): void {
  const analysis = analyzeJourney(journey);
  const lines = analysis.humanMessages.slice(0, 2);

  if (!lines.length && !analysis.hasMajorDelay) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  const text =
    lines.length > 0
      ? lines.join(" · ")
      : "Verspätungen auf der Strecke — Zeitpuffer einplanen.";

  container.classList.remove("hidden");
  container.className = "disruption-strip";
  container.innerHTML = escapeHtml(text);
}
