import { API } from "../config";
import { fetchJson, TransitError } from "../lib/http";
import { isInBerlin } from "../lib/stop-ids";
import { journeyDurationSeconds } from "../lib/format";
import { analyzeJourneyInsights } from "./commute";
import { locationParams } from "./places";
import type { Journey, Place } from "../types";

function isDticketCompatible(journey: Journey): boolean {
  const forbidden = new Set(["nationalExpress", "national"]);
  return !journey.legs.some((l) => forbidden.has(l.line?.product ?? ""));
}

async function fetchJourneysFrom(apiBase: string, origin: Place, dest: Place, departureIso: string) {
  const query = [
    ...locationParams("from", origin, apiBase),
    ...locationParams("to", dest, apiBase),
    `departure=${encodeURIComponent(departureIso)}`,
    "deutschlandTicketConnectionsOnly=true",
    "nationalExpress=false",
    "national=false",
    "polylines=true",
    "stopovers=true",
    "results=5",
    "language=de",
    "remarks=true",
  ].join("&");

  return fetchJson<{ journeys?: Journey[] }>(`${apiBase}/journeys?${query}`);
}

export async function fetchFastestJourneys(
  origin: Place,
  dest: Place,
  departureIso: string
): Promise<Journey[]> {
  const berlin = isInBerlin(origin) && isInBerlin(dest);
  const apis = berlin ? [API.bvg, API.db, API.dbV5] : [API.db, API.dbV5];

  let last503 = false;
  let locationErrors = 0;

  for (const base of apis) {
    try {
      const data = await fetchJourneysFrom(base, origin, dest, departureIso);
      const journeys = (data.journeys ?? [])
        .filter(isDticketCompatible)
        .map((j) => ({
          ...j,
          reliabilityScore: analyzeJourneyInsights(j).reliabilityScore,
        }))
        .sort((a, b) => journeyDurationSeconds(a) - journeyDurationSeconds(b));
      if (journeys.length) return journeys;
    } catch (e) {
      if (e instanceof TransitError && e.code === "503") {
        last503 = true;
        continue;
      }
      if (e instanceof TransitError && e.code === "LOCATION") {
        locationErrors++;
        continue;
      }
      throw e;
    }
  }

  if (last503) {
    throw new Error("Routing-Server überlastet (503). In 30–60 Sekunden erneut versuchen.");
  }
  if (locationErrors > 0) {
    throw new Error("Haltestelle nicht erkannt. Bitte einen Vorschlag aus der Liste wählen.");
  }
  throw new Error("Keine Deutschlandticket-Verbindung gefunden. Anderes Datum oder Hauptbahnhof versuchen.");
}
