import type { Place } from "../types";

export interface Recommendation extends Place {
  short: string;
  group: string;
}

export const RECOMMENDATIONS: Recommendation[] = [
  { label: "Alexanderplatz, Berlin", short: "Alexanderplatz", bvgId: "900100003", lat: 52.521508, lon: 13.411267, type: "station", group: "Berlin" },
  { label: "Berlin Hbf", short: "Berlin Hbf", dbId: "8011160", bvgId: "900003201", lat: 52.525589, lon: 13.369548, type: "station", group: "Berlin" },
  { label: "Brandenburger Tor, Berlin", short: "Brandenburger Tor", bvgId: "900100025", lat: 52.51651, lon: 13.381936, type: "station", group: "Berlin" },
  { label: "Friedrichstraße, Berlin", short: "Friedrichstraße", bvgId: "900100023", lat: 52.520833, lon: 13.386944, type: "station", group: "Berlin" },
  { label: "S+U Zoologischer Garten, Berlin", short: "Zoo", bvgId: "900100020", lat: 52.507222, lon: 13.332778, type: "station", group: "Berlin" },
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
