export type Screen = "home" | "results" | "detail";

const screens: Record<Screen, HTMLElement | null> = {
  home: null,
  results: null,
  detail: null,
};

let mapLayer: HTMLElement | null = null;
let current: Screen = "home";

export function initRouter(ids: Record<Screen, string>, mapId: string): void {
  (Object.keys(screens) as Screen[]).forEach((key) => {
    screens[key] = document.getElementById(ids[key]);
  });
  mapLayer = document.getElementById(mapId);
}

export function navigate(to: Screen): void {
  if (to === current) return;

  screens[current]?.classList.remove("is-active");
  screens[current]?.setAttribute("hidden", "");

  current = to;
  const el = screens[to];
  if (!el) return;

  el.removeAttribute("hidden");
  requestAnimationFrame(() => el.classList.add("is-active"));

  if (to === "home") {
    mapLayer?.classList.remove("is-visible", "is-expanded");
  }
}

export function getScreen(): Screen {
  return current;
}
