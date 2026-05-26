import { DEBOUNCE_MS } from "./config";
import {
  applyStaticI18n,
  getLocale,
  onLocaleChange,
  setLocale,
  t,
} from "./i18n";
import { filterRecommendations } from "./services/places";
import { searchPlaces, resolveLocation } from "./services/places";
import { fetchFastestJourneys } from "./services/journey";
import { analyzeJourneyInsights } from "./services/commute";
import {
  loadRecent,
  saveRecent,
  loadShortcut,
  saveShortcut,
  loadWalkPace,
  HOME_KEY_EXPORT,
  WORK_KEY_EXPORT,
} from "./services/storage";
import { getMorningSuggestion } from "./services/morning";
import {
  parseRouteFromUrl,
  buildShareUrl,
  applyRouteToUrl,
  parseLandingPath,
} from "./services/url-state";
import { initRouter, navigate, getScreen } from "./ui/router";
import { renderDisruptionStrip } from "./ui/components/disruption-strip";
import {
  renderRouteDecisionCore,
  renderDecisionSkeleton,
} from "./ui/components/route-decision-core";
import { renderSubduedAlternatives } from "./ui/components/subdued-alternatives";
import { runInstantDecisionReveal, resetSecondaryReveal } from "./ui/instant-decision";
import {
  renderStationChips,
  renderSuggestList,
  chipLabelFromPlace,
} from "./ui/components/station-chip";
import { renderTransferTimeline } from "./ui/components/transfer-timeline";
import { trackRouteSearch, captureError, markPerformance } from "./lib/analytics";
import { hapticSuccess, hapticWarning } from "./lib/haptics";
import { formatDateTimeLocal, journeyDurationSeconds, countTransfers, formatLeg, formatTime, formatDuration } from "./lib/format";
import type { RouteMap } from "./ui/map";
import type { Journey, Place } from "./types";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const state = {
  origin: null as Place | null,
  destination: null as Place | null,
  journeys: [] as Journey[],
  selectedIndex: 0,
  walkPace: loadWalkPace(),
};

const els = {
  originInput: $<HTMLInputElement>("originInput"),
  destInput: $<HTMLInputElement>("destInput"),
  originSuggestions: $("originSuggestions"),
  destSuggestions: $("destSuggestions"),
  originChips: $("originChips"),
  destChips: $("destChips"),
  routeForm: $<HTMLFormElement>("routeForm"),
  departureInput: $<HTMLInputElement>("departureInput"),
  findRouteBtn: $<HTMLButtonElement>("findRouteBtn"),
  formSpinner: $("formSpinner"),
  homeError: $("homeError"),
  recentList: $("recentList"),
  homeRail: $("homeRail"),
  resultsRouteLabel: $("resultsRouteLabel"),
  routeDecisionCore: $("routeDecisionCore"),
  disruptionStrip: $("disruptionStrip"),
  altRoutes: $("altRoutes"),
  decisionSecondary: $("decisionSecondary"),
  mapExpandBtn: $("mapExpandBtn"),
  mapLayer: $("mapLayer"),
  transferTimeline: $("transferTimeline"),
  loadingSheet: $("loadingSheet"),
  loadingText: $("loadingText"),
  toast: $("toast"),
  swapBtn: $("swapBtn"),
  geoBtn: $("geoBtn"),
  homeBtn: $("homeBtn"),
  workBtn: $("workBtn"),
  backHomeBtn: $("backHomeBtn"),
  backResultsBtn: $("backResultsBtn"),
  openDetailBtn: $("openDetailBtn"),
  shareBtn: $("shareBtn"),
  shareLinkBtn: $("shareLinkBtn"),
  returnBtn: $("returnBtn"),
  morningBanner: $("morningBanner"),
  morningText: $("morningText"),
  morningGoBtn: $("morningGoBtn"),
  offlineBanner: $("offlineBanner"),
  langDeBtn: $<HTMLButtonElement>("langDeBtn"),
  langEnBtn: $<HTMLButtonElement>("langEnBtn"),
};

let routeMap: RouteMap | null = null;
const debounce = new Map<string, ReturnType<typeof setTimeout>>();

async function ensureMap(): Promise<RouteMap> {
  if (!routeMap) {
    const { RouteMap } = await import("./ui/map");
    routeMap = new RouteMap("map");
  }
  return routeMap;
}

function showToast(msg: string) {
  els.toast.textContent = msg;
  els.toast.classList.remove("hidden");
  setTimeout(() => els.toast.classList.add("hidden"), 2600);
}

function showHomeError(msg: string) {
  els.homeError.textContent = msg;
  els.homeError.classList.remove("hidden");
  hapticWarning();
}

function hideHomeError() {
  els.homeError.classList.add("hidden");
}

function setLoading(on: boolean) {
  els.formSpinner.classList.toggle("hidden", !on);
  els.findRouteBtn.disabled = on;
  els.loadingSheet.classList.toggle("is-open", on);
  els.loadingText.textContent = on ? t("loading.searching") : "";
}

function initDeparture() {
  const now = new Date();
  els.departureInput.value = formatDateTimeLocal(now);
  els.departureInput.min = formatDateTimeLocal(now);
}

function getDepartureIso() {
  const val = els.departureInput.value;
  return val ? new Date(val).toISOString() : new Date().toISOString();
}

function selectPlace(
  input: HTMLInputElement,
  suggest: HTMLElement,
  chips: HTMLElement,
  key: "origin" | "destination",
  place: Place
) {
  input.value = place.label;
  state[key] = place;
  suggest.hidden = true;
  suggest.innerHTML = "";
  chips.hidden = true;
  if (key === "origin" && getScreen() === "home") {
    els.destInput.focus();
  }
}

function buildChipSuggestions(key: "origin" | "destination", query: string) {
  const recs: { label: string; place?: Place; accent?: boolean }[] = filterRecommendations(query)
    .slice(0, 4)
    .map((r) => ({ label: r.short, place: { ...r } as Place }));
  if (key === "origin" && !query) {
    const home = loadShortcut(HOME_KEY_EXPORT);
    const work = loadShortcut(WORK_KEY_EXPORT);
    if (work) recs.unshift({ label: t("common.work"), place: work, accent: true });
    if (home) recs.unshift({ label: t("common.home"), place: home, accent: true });
  }
  return recs;
}

function setupInput(
  input: HTMLInputElement,
  suggest: HTMLElement,
  chips: HTMLElement,
  key: "origin" | "destination"
) {
  const refresh = async () => {
    const q = input.value.trim();
    renderStationChips(chips, buildChipSuggestions(key, q), (place, label) => {
      if (place) selectPlace(input, suggest, chips, key, place);
      else {
        input.value = label;
        state[key] = null;
      }
    });
    if (q.length >= 2) {
      const places = await searchPlaces(q);
      renderSuggestList(suggest, places.slice(0, 5), (p) => selectPlace(input, suggest, chips, key, p));
    } else {
      suggest.hidden = true;
    }
  };

  input.addEventListener("focus", () => void refresh());
  input.addEventListener("input", () => {
    state[key] = null;
    clearTimeout(debounce.get(key));
    debounce.set(key, setTimeout(() => void refresh(), DEBOUNCE_MS));
  });
  input.addEventListener("blur", () => {
    setTimeout(() => {
      suggest.hidden = true;
      chips.hidden = true;
    }, 160);
  });
}

function renderRecent() {
  const items = loadRecent();
  els.recentList.innerHTML = "";
  els.homeRail.classList.toggle("hidden", items.length === 0);
  items.slice(0, 5).forEach((trip) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `${trip.origin} → ${trip.destination}<span>${formatDuration(trip.durationSeconds)}</span>`;
    btn.addEventListener("click", () => {
      els.originInput.value = trip.origin;
      els.destInput.value = trip.destination;
      state.origin = trip.originPlace ?? null;
      state.destination = trip.destPlace ?? null;
      void findRoute();
    });
    li.appendChild(btn);
    els.recentList.appendChild(li);
  });
}

function openDetail() {
  renderDetailScreen();
  navigate("detail");
}

function renderSecondaryContext() {
  const journey = state.journeys[state.selectedIndex];
  if (!journey) return;
  renderDisruptionStrip(els.disruptionStrip, journey);
  renderSubduedAlternatives(
    els.altRoutes,
    state.journeys,
    state.selectedIndex,
    state.walkPace,
    (idx) => {
      state.selectedIndex = idx;
      renderRouteDecisionCore(els.routeDecisionCore, state.journeys[idx], state.walkPace, openDetail);
      renderSecondaryContext();
      if (els.mapLayer.classList.contains("is-expanded")) {
        void ensureMap().then((m) =>
          m.showJourney(state.origin!, state.destination!, state.journeys[idx])
        );
      }
      hapticSuccess();
    }
  );
}

function renderResultsScreen(instant = false) {
  const journey = state.journeys[state.selectedIndex];
  if (!journey || !state.origin || !state.destination) return;

  const short = (p: Place) => chipLabelFromPlace(p);
  els.resultsRouteLabel.textContent = `${short(state.origin)} → ${short(state.destination)}`;

  const showCore = () => {
    renderRouteDecisionCore(els.routeDecisionCore, journey, state.walkPace, openDetail);
  };

  if (instant) {
    runInstantDecisionReveal({
      showCore,
      showSecondary: renderSecondaryContext,
    });
  } else {
    showCore();
    els.decisionSecondary?.classList.remove("decision-secondary--pending");
    els.decisionSecondary?.classList.add("decision-secondary--visible");
    renderSecondaryContext();
  }
}

function prepareResultsShell() {
  const from = els.originInput.value.trim() || "…";
  const to = els.destInput.value.trim() || "…";
  els.resultsRouteLabel.textContent = `${from} → ${to}`;
  resetSecondaryReveal();
  els.mapLayer.classList.remove("is-expanded", "is-visible");
  renderDecisionSkeleton(els.routeDecisionCore);
  navigate("results");
}

function renderDetailScreen() {
  const journey = state.journeys[state.selectedIndex];
  if (!journey) return;
  renderTransferTimeline(els.transferTimeline, journey, state.walkPace);
}

export async function findRoute() {
  hideHomeError();
  const t0 = performance.now();

  try {
    let origin = state.origin;
    let dest = state.destination;

    if (!origin) {
      const text = els.originInput.value.trim();
      if (!text) throw new Error(t("error.originRequired"));
      origin = await resolveLocation(text);
      els.originInput.value = origin.label;
      state.origin = origin;
    }
    if (!dest) {
      const text = els.destInput.value.trim();
      if (!text) throw new Error(t("error.destRequired"));
      dest = await resolveLocation(text);
      els.destInput.value = dest.label;
      state.destination = dest;
    }

    prepareResultsShell();
    setLoading(true);

    const dep = getDepartureIso();
    state.journeys = await fetchFastestJourneys(origin, dest, dep);
    state.selectedIndex = 0;

    applyRouteToUrl(origin, dest, dep);
    saveRecent({
      origin: origin.label,
      destination: dest.label,
      durationSeconds: Math.round(journeyDurationSeconds(state.journeys[0])),
      timestamp: Date.now(),
      originPlace: origin,
      destPlace: dest,
    });
    renderRecent();

    renderResultsScreen(true);

    markPerformance("route_search", performance.now() - t0);
    trackRouteSearch(performance.now() - t0, true, countTransfers(state.journeys[0].legs));
    hapticSuccess();
  } catch (err) {
    const msg = err instanceof Error ? err.message : t("error.unknown");
    if (getScreen() === "results") navigate("home");
    showHomeError(msg);
    captureError(err, { phase: "route_search" });
    trackRouteSearch(performance.now() - t0, false, 0);
  } finally {
    setLoading(false);
  }
}

export async function bootstrapFromUrl(): Promise<void> {
  const landing = parseLandingPath(window.location.pathname);
  if (landing) {
    els.originInput.value = landing.from;
    els.destInput.value = landing.to;
  }
  const q = parseRouteFromUrl();
  if (q.from) els.originInput.value = q.from;
  if (q.to) els.destInput.value = q.to;
  if (q.dep) els.departureInput.value = formatDateTimeLocal(new Date(q.dep));
  if ((q.from && q.to) || landing) {
    state.origin = state.destination = null;
    await findRoute();
  }
}

function setupMorning() {
  const s = getMorningSuggestion();
  if (!s) {
    els.morningBanner.classList.add("hidden");
    return;
  }
  els.morningText.textContent = s.label;
  els.morningBanner.classList.remove("hidden");
  els.morningGoBtn.onclick = () => {
    els.originInput.value = s.origin.label;
    els.destInput.value = s.destination.label;
    state.origin = s.origin;
    state.destination = s.destination;
    initDeparture();
    void findRoute();
  };
}

function resetToHome() {
  state.journeys = [];
  state.selectedIndex = 0;
  routeMap?.resetView();
  navigate("home");
  hideHomeError();
}

function syncLangButtons() {
  const locale = getLocale();
  els.langDeBtn.classList.toggle("is-active", locale === "de");
  els.langEnBtn.classList.toggle("is-active", locale === "en");
  els.langDeBtn.setAttribute("aria-pressed", String(locale === "de"));
  els.langEnBtn.setAttribute("aria-pressed", String(locale === "en"));
}

function onLocaleUpdated() {
  applyStaticI18n();
  syncLangButtons();
  setupMorning();
  renderRecent();
  const screen = getScreen();
  if (screen === "results" && state.journeys.length) {
    renderResultsScreen(false);
  } else if (screen === "detail" && state.journeys.length) {
    renderDetailScreen();
  }
}

export function initApp(): void {
  applyStaticI18n();
  syncLangButtons();

  els.langDeBtn.addEventListener("click", () => setLocale("de"));
  els.langEnBtn.addEventListener("click", () => setLocale("en"));
  onLocaleChange(onLocaleUpdated);

  initRouter(
    { home: "screenHome", results: "screenResults", detail: "screenDetail" },
    "mapLayer"
  );

  initDeparture();
  renderRecent();
  setupMorning();
  setupInput(els.originInput, els.originSuggestions, els.originChips, "origin");
  setupInput(els.destInput, els.destSuggestions, els.destChips, "destination");

  els.routeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    void findRoute();
  });

  els.swapBtn.addEventListener("click", () => {
    [els.originInput.value, els.destInput.value] = [els.destInput.value, els.originInput.value];
    [state.origin, state.destination] = [state.destination, state.origin];
    hapticSuccess();
  });

  els.geoBtn.addEventListener("click", () => void useGeo());
  els.homeBtn.addEventListener("click", () => applyQuick(HOME_KEY_EXPORT, t("common.home")));
  els.workBtn.addEventListener("click", () => applyQuick(WORK_KEY_EXPORT, t("common.work")));

  els.backHomeBtn.addEventListener("click", resetToHome);
  els.backResultsBtn.addEventListener("click", () => navigate("results"));
  els.openDetailBtn.addEventListener("click", openDetail);

  let mapExpanded = false;
  els.mapExpandBtn.addEventListener("click", () => {
    mapExpanded = !mapExpanded;
    if (mapExpanded) {
      els.mapLayer.classList.add("is-expanded");
      els.mapExpandBtn.textContent = t("results.mapHide");
      void ensureMap().then((m) => {
        const j = state.journeys[state.selectedIndex];
        if (j && state.origin && state.destination) {
          m.showJourney(state.origin, state.destination, j);
          m.invalidate();
        }
      });
    } else {
      els.mapLayer.classList.remove("is-expanded");
      els.mapExpandBtn.textContent = t("results.mapShow");
    }
  });

  els.shareLinkBtn.addEventListener("click", () => {
    if (!state.origin || !state.destination) return;
    const url = buildShareUrl(state.origin, state.destination, getDepartureIso());
    void navigator.clipboard.writeText(url).then(() => showToast(t("toast.linkCopied")));
  });

  els.shareBtn.addEventListener("click", () => {
    const j = state.journeys[state.selectedIndex];
    if (!j || !state.origin || !state.destination) return;
    const ins = analyzeJourneyInsights(j, state.walkPace);
    const text = [
      t("share.header"),
      `${state.origin.label} → ${state.destination.label}`,
      formatDuration(journeyDurationSeconds(j)),
      t("share.reliabilityScore", { score: ins.reliabilityScore }),
      j.legs.map((leg, i) => `${i + 1}. ${formatLeg(leg)} ${formatTime(leg.departure)}`).join("\n"),
    ].join("\n");
    void navigator.clipboard.writeText(text).then(() => showToast(t("toast.copied")));
  });

  els.returnBtn.addEventListener("click", () => {
    [els.originInput.value, els.destInput.value] = [els.destInput.value, els.originInput.value];
    [state.origin, state.destination] = [state.destination, state.origin];
    initDeparture();
    navigate("home");
    void findRoute();
  });

  window.addEventListener("online", () => els.offlineBanner.classList.add("hidden"));
  window.addEventListener("offline", () => els.offlineBanner.classList.remove("hidden"));

  const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 600));
  idle(() => void ensureMap());
}

function applyQuick(key: typeof HOME_KEY_EXPORT | typeof WORK_KEY_EXPORT, label: string) {
  const place = loadShortcut(key);
  if (!place) {
    if (state.origin) {
      saveShortcut(key, state.origin);
      showToast(t("toast.savedLabel", { label }));
    } else showToast(t("toast.saveRouteHint", { label }));
    return;
  }
  els.originInput.value = place.label;
  state.origin = place;
  els.destInput.focus();
}

async function useGeo() {
  if (!navigator.geolocation) return showHomeError(t("error.locationUnavailable"));
  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
    );
    const places = await searchPlaces(`${pos.coords.latitude},${pos.coords.longitude}`);
    const place = places[0] ?? {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      label: t("suggest.myLocation"),
      type: "address" as const,
    };
    els.originInput.value = place.label;
    state.origin = place;
    els.destInput.focus();
    hapticSuccess();
  } catch {
    showHomeError(t("error.locationFailed"));
  }
}
