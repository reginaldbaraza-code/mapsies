/** Instant Decision Mode — primary answer first, context after, map last */

export function runInstantDecisionReveal(phases: {
  showCore: () => void;
  showSecondary: () => void;
  showMap?: () => void;
}): void {
  phases.showCore();

  requestAnimationFrame(() => {
    window.setTimeout(() => {
      phases.showSecondary();
      const secondary = document.getElementById("decisionSecondary");
      secondary?.classList.remove("decision-secondary--pending");
      secondary?.classList.add("decision-secondary--visible");
    }, 140);

    if (phases.showMap) {
      window.setTimeout(() => phases.showMap!(), 400);
    }
  });
}

export function resetSecondaryReveal(): void {
  const secondary = document.getElementById("decisionSecondary");
  secondary?.classList.add("decision-secondary--pending");
  secondary?.classList.remove("decision-secondary--visible");
}
