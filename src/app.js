import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const API = {
  db: "/api/db",
  dbV5: "/api/db-v5",
  bvg: "https://v6.bvg.transport.rest",
  nominatim: "/api/nominatim",
};

const DEBOUNCE_MS = 300;
const RECENT_KEY = "fastroute_recent";
const RECENT_LIMIT = 8;
const DEFAULT_CENTER = [51.1657, 10.4515];
const DEFAULT_ZOOM = 6;
const BERLIN_BBOX = { south: 52.338, north: 52.675, west: 13.088, east: 13.761 };

/** Curated stops — tap to select without typing. dbId = faster routing. */
const RECOMMENDATIONS = [
  { label: "Alexanderplatz, Berlin", short: "Alexanderplatz", dbId: "900100003", lat: 52.521508, lon: 13.411267, type: "station", group: "Berlin" },
  { label: "Berlin Hbf", short: "Berlin Hbf", dbId: "8011160", lat: 52.525589, lon: 13.369548, type: "station", group: "Berlin" },
  { label: "Brandenburger Tor, Berlin", short: "Brandenburger Tor", dbId: "900100025", lat: 52.51651, lon: 13.381936, type: "station", group: "Berlin" },
  { label: "Friedrichstraße, Berlin", short: "Friedrichstraße", dbId: "900100023", lat: 52.520833, lon: 13.386944, type: "station", group: "Berlin" },
  { label: "S+U Zoologischer Garten, Berlin", short: "Zoo", dbId: "900100020", lat: 52.507222, lon: 13.332778, type: "station", group: "Berlin" },
  { label: "Hamburg Hbf", short: "Hamburg", dbId: "8002549", lat: 53.552736, lon: 10.006909, type: "station", group: "Cities" },
  { label: "München Hbf", short: "München", dbId: "8000261", lat: 48.140228, lon: 11.558338, type: "station", group: "Cities" },
  { label: "Köln Hbf", short: "Köln", dbId: "8000207", lat: 50.943214, lon: 6.958729, type: "station", group: "Cities" },
  { label: "Frankfurt (Main) Hbf", short: "Frankfurt", dbId: "8000105", lat: 50.107145, lon: 8.663789, type: "station", group: "Cities" },
  { label: "Leipzig Hbf", short: "Leipzig", dbId: "8010205", lat: 51.345472, lon: 12.383333, type: "station", group: "Cities" },
  { label: "Dresden Hbf", short: "Dresden", dbId: "8010085", lat: 51.040534, lon: 13.731389, type: "station", group: "Cities" },
  { label: "Hannover Hbf", short: "Hannover", dbId: "8000152", lat: 52.377189, lon: 9.741806, type: "station", group: "Cities" },
  { label: "Stuttgart Hbf", short: "Stuttgart", dbId: "8000096", lat: 48.783333, lon: 9.181667, type: "station", group: "Cities" },
  { label: "Nürnberg Hbf", short: "Nürnberg", dbId: "8000284", lat: 49.445615, lon: 11.082989, type: "station", group: "Cities" },
  { label: "Bremen Hbf", short: "Bremen", dbId: "8000050", lat: 53.082592, lon: 8.813194, type: "station", group: "Cities" },
  { label: "Potsdam Hbf", short: "Potsdam", dbId: "8012666", lat: 52.391667, lon: 13.063889, type: "station", group: "Cities" },
];

const PRODUCT_LABELS = {
  subway: "U-Bahn",
  suburban: "S-Bahn",
  bus: "Bus",
  tram: "Tram",
  regional: "RB",
  regionalExpress: "RE",
  ferry: "Fähre",
};

let db = null;
try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    db = getFirestore(initializeApp(firebaseConfig));
  }
} catch {
  console.warn("Firebase not configured.");
}

const state = {
  origin: null,
  destination: null,
  journeys: [],
  selectedIndex: 0,
  routeLayer: null,
  originMarker: null,
  destMarker: null,
};

const $ = (id) => document.getElementById(id);

const els = {
  originInput: $("originInput"),
  destInput: $("destInput"),
  originSuggestions: $("originSuggestions"),
  destSuggestions: $("destSuggestions"),
  originRecommendations: $("originRecommendations"),
  destRecommendations: $("destRecommendations"),
  originRecChips: $("originRecChips"),
  destRecChips: $("destRecChips"),
  routeForm: $("routeForm"),
  departureInput: $("departureInput"),
  findRouteBtn: $("findRouteBtn"),
  newSearchBtn: $("newSearchBtn"),
  formSpinner: $("formSpinner"),
  mapLoading: $("mapLoading"),
  errorPanel: $("errorPanel"),
  errorText: $("errorText"),
  retryBtn: $("retryBtn"),
  fastestBadge: $("fastestBadge"),
  summaryCard: $("summaryCard"),
  summaryDuration: $("summaryDuration"),
  summaryDepart: $("summaryDepart"),
  summaryArrive: $("summaryArrive"),
  summaryTransfers: $("summaryTransfers"),
  directionsCard: $("directionsCard"),
  directionsList: $("directionsList"),
  directionsToggle: $("directionsToggle"),
  alternativesCard: $("alternativesCard"),
  alternativesList: $("alternativesList"),
  recentList: $("recentList"),
  sidebar: $("sidebar"),
  sidebarBackdrop: $("sidebarBackdrop"),
  sidebarToggle: $("sidebarToggle"),
  openSidebarBtn: $("openSidebarBtn"),
  swapBtn: $("swapBtn"),
  geoBtn: $("geoBtn"),
  shareBtn: $("shareBtn"),
  toast: $("toast"),
};

const map = L.map("map", { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 20,
}).addTo(map);

window.addEventListener("resize", () => map.invalidateSize());

const debounceTimers = new Map();

function isInBerlin(place) {
  return (
    place.lat >= BERLIN_BBOX.south &&
    place.lat <= BERLIN_BBOX.north &&
    place.lon >= BERLIN_BBOX.west &&
    place.lon <= BERLIN_BBOX.east
  );
}

function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove("hidden");
  setTimeout(() => els.toast.classList.add("hidden"), 2800);
}

function showError(message) {
  els.errorText.textContent = message;
  els.errorPanel.classList.remove("hidden");
}

function hideError() {
  els.errorPanel.classList.add("hidden");
}

function setLoading(on) {
  els.mapLoading.classList.toggle("hidden", !on);
  els.formSpinner.classList.toggle("hidden", !on);
  els.findRouteBtn.disabled = on;
}

function formatDuration(seconds) {
  const t = Math.round(seconds);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function formatDistance(m) {
  return m > 0 ? `${(m / 1000).toFixed(1)} km` : "—";
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTimeLocal(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

function initDepartureInput() {
  els.departureInput.value = formatDateTimeLocal(new Date());
  els.departureInput.min = formatDateTimeLocal(new Date());
}

function getDepartureIso() {
  const val = els.departureInput.value;
  if (!val) return new Date().toISOString();
  return new Date(val).toISOString();
}

function setDepartureOffset(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  els.departureInput.value = formatDateTimeLocal(d);
  document.querySelectorAll(".chip").forEach((c) => {
    c.classList.toggle("active", Number(c.dataset.offset) === minutes);
  });
}

async function safeFetch(url, options = {}) {
  try {
    return await fetch(url, options);
  } catch (err) {
    const isNetwork = err.message === "Failed to fetch" || err.name === "TypeError";
    if (isNetwork) {
      const hint =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
          ? " Run `python3 serve.py` locally, or deploy to Vercel for the built-in API proxy."
          : " Check your connection or try again — the routing service may be down.";
      throw new Error(`Network error — could not reach the server.${hint}`);
    }
    throw err;
  }
}

async function fetchJson(url) {
  const res = await safeFetch(url);
  if (res.status === 503) throw new Error("503");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json();
}

async function searchDbLocations(query, apiBase = API.db) {
  const params = new URLSearchParams({
    query,
    results: "6",
    language: "de",
    stops: "true",
    addresses: "true",
    poi: "true",
  });
  try {
    const data = await fetchJson(`${apiBase}/locations?${params}`);
    return (Array.isArray(data) ? data : [])
      .map((loc) => ({
        lat: loc.location?.latitude,
        lon: loc.location?.longitude,
        label: loc.name,
        dbId: loc.type === "stop" ? loc.id : undefined,
        type: loc.type === "stop" ? "station" : "place",
      }))
      .filter((p) => p.lat && p.lon);
  } catch (e) {
    if (e.message === "503") return [];
    return [];
  }
}

async function searchNominatim(query, limit = "6") {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit,
    addressdetails: "1",
    countrycodes: "de",
  });
  try {
    const data = await fetchJson(`${API.nominatim}/search?${params}`);
    return (Array.isArray(data) ? data : []).map((p) => ({
      lat: parseFloat(p.lat),
      lon: parseFloat(p.lon),
      label: p.display_name,
      type: "address",
    }));
  } catch {
    return [];
  }
}

async function searchBvgLocations(query) {
  const params = new URLSearchParams({ query, results: "6", language: "de" });
  try {
    const res = await safeFetch(`${API.bvg}/locations?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : [])
      .map((loc) => ({
        lat: loc.location?.latitude,
        lon: loc.location?.longitude,
        label: loc.name,
        dbId: loc.type === "stop" ? loc.id : undefined,
        type: "station",
      }))
      .filter((p) => p.lat && p.lon);
  } catch {
    return [];
  }
}

function dedupePlaces(places) {
  const seen = new Set();
  return places.filter((p) => {
    const key = `${p.label}|${p.lat?.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filterRecommendations(query) {
  const q = query.trim().toLowerCase();
  if (!q) return RECOMMENDATIONS;
  return RECOMMENDATIONS.filter(
    (r) =>
      r.label.toLowerCase().includes(q) ||
      r.short.toLowerCase().includes(q) ||
      r.group.toLowerCase().includes(q)
  );
}

function recommendationToPlace(rec) {
  return {
    lat: rec.lat,
    lon: rec.lon,
    label: rec.label,
    dbId: rec.dbId,
    type: rec.type,
  };
}

async function searchPlaces(query) {
  const recs = filterRecommendations(query).map(recommendationToPlace);

  if (query.length < 2) return recs;

  const [db, bvg, nom] = await Promise.all([
    searchDbLocations(query),
    searchBvgLocations(query),
    searchNominatim(query),
  ]);

  return dedupePlaces([...recs, ...db, ...bvg, ...nom]).slice(0, 10);
}

async function resolveLocation(text) {
  const places = await searchPlaces(text);
  if (places.length) return places[0];

  throw new Error(
    `Could not find "${text}" in Germany. Pick a suggestion from the list or try "City Hbf".`
  );
}

function locationParams(prefix, place) {
  if (place.dbId) return [`${prefix}=${encodeURIComponent(place.dbId)}`];
  return [
    `${prefix}.latitude=${place.lat}`,
    `${prefix}.longitude=${place.lon}`,
    `${prefix}.address=${encodeURIComponent(place.label)}`,
  ];
}

function journeyDurationSeconds(journey) {
  const dep = new Date(journey.legs[0].departure);
  const arr = new Date(journey.legs[journey.legs.length - 1].arrival);
  return Math.max(0, (arr - dep) / 1000);
}

function countTransfers(legs) {
  return Math.max(0, legs.filter((l) => l.line).length - 1);
}

function isDticketCompatible(journey) {
  const forbidden = new Set(["nationalExpress", "national"]);
  return !journey.legs.some((l) => forbidden.has(l.line?.product));
}

function formatLeg(leg) {
  if (leg.mode === "walking" || (!leg.line && leg.walking)) {
    return `Walk · ${leg.origin.name} → ${leg.destination.name}`;
  }
  const product = PRODUCT_LABELS[leg.line?.product] || "";
  const line = leg.line?.name || "";
  const dir = leg.direction ? ` → ${leg.direction}` : "";
  return `${product} ${line}${dir}`.trim();
}

function legBadgeClass(leg) {
  if (leg.mode === "walking" || !leg.line) return "walk";
  return leg.line?.product || "default";
}

function legBadgeText(leg) {
  if (leg.mode === "walking" || !leg.line) return "🚶";
  return leg.line?.productName || leg.line?.name?.slice(0, 3) || "•";
}

async function fetchJourneysFrom(apiBase, origin, dest) {
  const departure = encodeURIComponent(getDepartureIso());
  const query = [
    ...locationParams("from", origin),
    ...locationParams("to", dest),
    `departure=${departure}`,
    "deutschlandTicketConnectionsOnly=true",
    "nationalExpress=false",
    "national=false",
    "polylines=true",
    "stopovers=true",
    "results=5",
    "language=de",
    "remarks=true",
  ].join("&");

  return fetchJson(`${apiBase}/journeys?${query}`);
}

async function fetchJourneys(origin, dest) {
  const apis = [API.db, API.dbV5];
  if (isInBerlin(origin) && isInBerlin(dest)) apis.push(API.bvg);

  let last503 = false;
  for (const base of apis) {
    try {
      const data = await fetchJourneysFrom(base, origin, dest);
      const journeys = (data.journeys || [])
        .filter(isDticketCompatible)
        .sort((a, b) => journeyDurationSeconds(a) - journeyDurationSeconds(b));
      if (journeys.length) return journeys;
    } catch (e) {
      if (e.message === "503") {
        last503 = true;
        continue;
      }
      throw e;
    }
  }

  if (last503) {
    throw new Error(
      "DB routing is overloaded (503). Wait 30–60 seconds and retry. Berlin trips may work sooner via BVG."
    );
  }
  throw new Error("No Deutschlandticket route found. Try a nearby station (e.g. City Hbf) or a different time.");
}

function clearMap() {
  if (state.routeLayer) {
    map.removeLayer(state.routeLayer);
    state.routeLayer = null;
  }
  [state.originMarker, state.destMarker].forEach((m) => {
    if (m) map.removeLayer(m);
  });
  state.originMarker = state.destMarker = null;
}

function displayJourney(origin, dest, journey) {
  clearMap();
  const layers = [];

  journey.legs.forEach((leg) => {
    if (leg.polyline?.features) {
      const layer = L.geoJSON(leg.polyline, {
        style: { color: "#00ff88", weight: 5, opacity: 0.9 },
      });
      layer.addTo(map);
      layers.push(layer);
    }
  });
  state.routeLayer = layers.length ? L.layerGroup(layers) : null;

  state.originMarker = L.circleMarker([origin.lat, origin.lon], {
    radius: 9,
    fillColor: "#00ff88",
    color: "#0a0e14",
    weight: 2,
    fillOpacity: 1,
  })
    .addTo(map)
    .bindPopup("<strong>Start</strong>");

  state.destMarker = L.circleMarker([dest.lat, dest.lon], {
    radius: 9,
    fillColor: "#ff6b6b",
    color: "#0a0e14",
    weight: 2,
    fillOpacity: 1,
  })
    .addTo(map)
    .bindPopup("<strong>Ziel</strong>");

  const pts = [
    [origin.lat, origin.lon],
    [dest.lat, dest.lon],
  ];
  journey.legs.forEach((leg) => {
    if (leg.origin?.location) pts.push([leg.origin.location.latitude, leg.origin.location.longitude]);
    if (leg.destination?.location) pts.push([leg.destination.location.latitude, leg.destination.location.longitude]);
  });
  map.fitBounds(pts, { padding: [48, 48] });
}

function renderSummary(journey) {
  const legs = journey.legs;
  els.summaryDuration.textContent = formatDuration(journeyDurationSeconds(journey));
  els.summaryDepart.textContent = formatTime(legs[0].departure);
  els.summaryArrive.textContent = formatTime(legs[legs.length - 1].arrival);
  els.summaryTransfers.textContent = String(countTransfers(legs));
  els.summaryCard.classList.remove("hidden");
  els.fastestBadge.classList.remove("hidden");
}

function renderTimeline(journey) {
  els.directionsList.innerHTML = "";
  journey.legs.forEach((leg, i) => {
    const delay = (leg.departureDelay || 0) + (leg.arrivalDelay || 0);
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="leg-badge ${legBadgeClass(leg)}">${escapeHtml(legBadgeText(leg))}</span>
      <div>
        <div class="leg-text">${escapeHtml(formatLeg(leg))}</div>
        <div class="leg-meta">${formatTime(leg.departure)} – ${formatTime(leg.arrival)}${delay > 0 ? `<span class="leg-delay"> · +${Math.round(delay / 60)} min delay</span>` : ""}</div>
      </div>
    `;
    els.directionsList.appendChild(li);
  });
  els.directionsCard.classList.remove("hidden");
  els.directionsToggle.setAttribute("aria-expanded", "true");
  els.directionsList.classList.remove("collapsed");
}

function renderAlternatives() {
  els.alternativesList.innerHTML = "";
  if (state.journeys.length <= 1) {
    els.alternativesCard.classList.add("hidden");
    return;
  }

  state.journeys.forEach((j, i) => {
    if (i === 0) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `alt-item${i === state.selectedIndex ? " active" : ""}`;
    btn.innerHTML = `<strong>${formatDuration(journeyDurationSeconds(j))}</strong><span>${countTransfers(j.legs)} transfers · depart ${formatTime(j.legs[0].departure)}</span>`;
    btn.addEventListener("click", () => selectJourney(i));
    els.alternativesList.appendChild(btn);
  });
  els.alternativesCard.classList.remove("hidden");
}

function selectJourney(index) {
  state.selectedIndex = index;
  const journey = state.journeys[index];
  if (!journey || !state.origin || !state.destination) return;

  displayJourney(state.origin, state.destination, journey);
  renderSummary(journey);
  renderTimeline(journey);
  renderAlternatives();
}

async function saveRecent(origin, dest, journey) {
  const entry = {
    origin: origin.label,
    destination: dest.label,
    durationSeconds: Math.round(journeyDurationSeconds(journey)),
    distanceMeters: 0,
    timestamp: Date.now(),
  };

  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    const filtered = stored.filter((e) => !(e.origin === entry.origin && e.destination === entry.destination));
    filtered.unshift(entry);
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, RECENT_LIMIT)));
  } catch {
    localStorage.setItem(RECENT_KEY, JSON.stringify([entry]));
  }

  if (db) {
    try {
      await addDoc(collection(db, "routes"), {
        ...entry,
        timestamp: serverTimestamp(),
      });
    } catch {
      /* local only */
    }
  }
  renderRecentList();
}

function renderRecentList() {
  let items = [];
  try {
    items = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    items = [];
  }

  els.recentList.innerHTML = "";
  if (!items.length) {
    els.recentList.innerHTML = '<li class="recent-empty">No trips yet — search a route to get started.</li>';
    return;
  }

  items.slice(0, RECENT_LIMIT).forEach((data) => {
    const li = document.createElement("li");
    li.className = "recent-item";
    li.innerHTML = `
      <div class="recent-item-origin">${escapeHtml(data.origin)}</div>
      <div class="recent-item-dest">→ ${escapeHtml(data.destination)}</div>
      <div class="recent-item-meta">${formatDuration(data.durationSeconds)}</div>
    `;
    li.addEventListener("click", () => {
      els.originInput.value = data.origin;
      els.destInput.value = data.destination;
      state.origin = state.destination = null;
      closeSidebar();
      findRoute();
    });
    els.recentList.appendChild(li);
  });
}

function resetSearch() {
  hideError();
  els.originInput.value = "";
  els.destInput.value = "";
  state.origin = state.destination = null;
  state.journeys = [];
  clearMap();
  els.summaryCard.classList.add("hidden");
  els.directionsCard.classList.add("hidden");
  els.alternativesCard.classList.add("hidden");
  els.fastestBadge.classList.add("hidden");
  initDepartureInput();
  map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
}

async function findRoute() {
  hideError();
  setLoading(true);

  try {
    let origin = state.origin;
    let dest = state.destination;

    if (!origin) {
      const t = els.originInput.value.trim();
      if (!t) throw new Error("Enter where you're leaving from.");
      origin = await resolveLocation(t);
      els.originInput.value = origin.label;
      state.origin = origin;
    }

    if (!dest) {
      const t = els.destInput.value.trim();
      if (!t) throw new Error("Enter your destination.");
      dest = await resolveLocation(t);
      els.destInput.value = dest.label;
      state.destination = dest;
    }

    state.journeys = await fetchJourneys(origin, dest);
    state.selectedIndex = 0;
    const journey = state.journeys[0];

    displayJourney(origin, dest, journey);
    renderSummary(journey);
    renderTimeline(journey);
    renderAlternatives();
    await saveRecent(origin, dest, journey);
    map.invalidateSize();
  } catch (err) {
    showError(err.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

function selectPlace(input, listEl, recPanel, key, place) {
  input.value = place.label;
  state[key] = place;
  listEl.innerHTML = "";
  if (recPanel) recPanel.hidden = true;
}

function renderRecChips(container, recPanel, input, listEl, key, query = "") {
  const items = filterRecommendations(query);
  container.innerHTML = "";

  items.forEach((rec) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rec-chip";
    btn.title = rec.label;
    btn.innerHTML = `${escapeHtml(rec.short)}<span class="rec-region">· ${escapeHtml(rec.group)}</span>`;
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      selectPlace(input, listEl, recPanel, key, recommendationToPlace(rec));
    });
    container.appendChild(btn);
  });

  recPanel.hidden = items.length === 0;
}

function renderSuggestionList(listEl, input, recPanel, key, places, placesRef) {
  listEl.innerHTML = "";
  placesRef.current = [];
  if (!places.length) return;

  const recLabels = new Set(RECOMMENDATIONS.map((r) => r.label));
  const recPlaces = places.filter((p) => recLabels.has(p.label));
  const otherPlaces = places.filter((p) => !recLabels.has(p.label));

  if (recPlaces.length) {
    const head = document.createElement("li");
    head.className = "autocomplete-section";
    head.textContent = "Suggestions";
    listEl.appendChild(head);
    recPlaces.forEach((place, i) => {
      placesRef.current.push(place);
      const li = document.createElement("li");
      li.role = "option";
      li.dataset.index = String(placesRef.current.length - 1);
      li.innerHTML = `<span class="suggestion-type">★</span><span>${escapeHtml(place.label)}</span>`;
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectPlace(input, listEl, recPanel, key, place);
      });
      listEl.appendChild(li);
    });
  }

  if (otherPlaces.length) {
    if (recPlaces.length) {
      const head = document.createElement("li");
      head.className = "autocomplete-section";
      head.textContent = "More results";
      listEl.appendChild(head);
    }
    otherPlaces.forEach((place) => {
      placesRef.current.push(place);
      const li = document.createElement("li");
      li.role = "option";
      li.dataset.index = String(placesRef.current.length - 1);
      li.innerHTML = `<span class="suggestion-type">${place.type === "station" ? "Stop" : "Addr"}</span><span>${escapeHtml(place.label)}</span>`;
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        selectPlace(input, listEl, recPanel, key, place);
      });
      listEl.appendChild(li);
    });
  }

  listEl.dataset.activeIndex = "-1";
}

function setupLocationInput(input, listEl, recPanel, chipsEl, key) {
  const placesRef = { current: [] };

  const refresh = async () => {
    const q = input.value.trim();
    renderRecChips(chipsEl, recPanel, input, listEl, key, q);
    const places = await searchPlaces(q);
    renderSuggestionList(listEl, input, recPanel, key, places, placesRef);
  };

  input.addEventListener("focus", () => {
    recPanel.hidden = false;
    refresh();
  });

  input.addEventListener("input", () => {
    state[key] = null;
    clearTimeout(debounceTimers.get(key));
    debounceTimers.set(key, setTimeout(refresh, DEBOUNCE_MS));
  });

  input.addEventListener("keydown", (e) => {
    const items = [...listEl.querySelectorAll("li[role='option']")];
    if (!items.length) return;

    let active = parseInt(listEl.dataset.activeIndex ?? "-1", 10);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      active = Math.min(active + 1, items.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      active = Math.max(active - 1, 0);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const place = placesRef.current[active];
      if (place) selectPlace(input, listEl, recPanel, key, place);
      return;
    } else if (e.key === "Escape") {
      listEl.innerHTML = "";
      recPanel.hidden = true;
      return;
    } else return;

    listEl.dataset.activeIndex = String(active);
    items.forEach((li) => {
      const idx = parseInt(li.dataset.index, 10);
      li.classList.toggle("active", idx === active);
    });
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      listEl.innerHTML = "";
      recPanel.hidden = true;
    }, 180);
  });
}

function closeSidebar() {
  els.sidebar.classList.remove("open");
  els.sidebarBackdrop.classList.add("hidden");
}

function openSidebar() {
  els.sidebar.classList.add("open");
  els.sidebarBackdrop.classList.remove("hidden");
}

function swapLocations() {
  [els.originInput.value, els.destInput.value] = [els.destInput.value, els.originInput.value];
  [state.origin, state.destination] = [state.destination, state.origin];
}

async function useGeolocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported in this browser.");
    return;
  }
  els.geoBtn.disabled = true;
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 12000, maximumAge: 60000 })
    );
    const place = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      label: "My location",
      type: "address",
    };
    const rev = await searchNominatim(`${place.lat},${place.lon}`, "1");
    if (rev[0]) {
      place.label = rev[0].label;
    }
    els.originInput.value = place.label;
    state.origin = place;
    showToast("Origin set to your location");
  } catch {
    showError("Could not get your location. Allow GPS access or type an address.");
  } finally {
    els.geoBtn.disabled = false;
  }
}

function copyTrip() {
  const j = state.journeys[state.selectedIndex];
  if (!j || !state.origin || !state.destination) return;
  const text = [
    `FastRoute — Deutschlandticket`,
    `${state.origin.label} → ${state.destination.label}`,
    `Duration: ${formatDuration(journeyDurationSeconds(j))}`,
    `Depart: ${formatTime(j.legs[0].departure)} · Arrive: ${formatTime(j.legs[j.legs.length - 1].arrival)}`,
    `Transfers: ${countTransfers(j.legs)}`,
    j.legs.map((leg, i) => `${i + 1}. ${formatLeg(leg)} (${formatTime(leg.departure)})`).join("\n"),
  ].join("\n");

  navigator.clipboard.writeText(text).then(
    () => showToast("Trip copied to clipboard"),
    () => showError("Could not copy — check browser permissions.")
  );
}

/* Events */
els.routeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  findRoute();
});

els.newSearchBtn.addEventListener("click", resetSearch);
els.retryBtn.addEventListener("click", findRoute);
els.swapBtn.addEventListener("click", swapLocations);
els.geoBtn.addEventListener("click", useGeolocation);
els.shareBtn.addEventListener("click", copyTrip);
els.openSidebarBtn?.addEventListener("click", openSidebar);
els.sidebarToggle.addEventListener("click", closeSidebar);
els.sidebarBackdrop.addEventListener("click", closeSidebar);

els.directionsToggle.addEventListener("click", () => {
  const open = els.directionsToggle.getAttribute("aria-expanded") === "true";
  els.directionsToggle.setAttribute("aria-expanded", String(!open));
  els.directionsList.classList.toggle("collapsed", open);
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => setDepartureOffset(Number(chip.dataset.offset)));
});

setupLocationInput(
  els.originInput,
  els.originSuggestions,
  els.originRecommendations,
  els.originRecChips,
  "origin"
);
setupLocationInput(
  els.destInput,
  els.destSuggestions,
  els.destRecommendations,
  els.destRecChips,
  "destination"
);

initDepartureInput();
renderRecentList();
