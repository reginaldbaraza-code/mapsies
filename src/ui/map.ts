import L from "leaflet";
import type { CircleMarker, Layer, LayerGroup, Map } from "leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../config";
import type { Journey, Place } from "../types";

export class RouteMap {
  private readonly map: Map;
  private routeLayer: LayerGroup | null = null;
  private originMarker: CircleMarker | null = null;
  private destMarker: CircleMarker | null = null;

  constructor(el: string) {
    this.map = L.map(el, { zoomControl: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OSM &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(this.map);
    window.addEventListener("resize", () => this.map.invalidateSize());
  }

  clear(): void {
    if (this.routeLayer) this.map.removeLayer(this.routeLayer);
    if (this.originMarker) this.map.removeLayer(this.originMarker);
    if (this.destMarker) this.map.removeLayer(this.destMarker);
    this.routeLayer = this.originMarker = this.destMarker = null;
  }

  showJourney(origin: Place, dest: Place, journey: Journey): void {
    this.clear();
    const layers: Layer[] = [];
    for (const leg of journey.legs) {
      if (leg.polyline?.features) {
        const layer = L.geoJSON(leg.polyline as GeoJsonObject, {
          style: { color: "#00e87a", weight: 5, opacity: 0.9 },
        });
        layer.addTo(this.map);
        layers.push(layer);
      }
    }
    if (layers.length) this.routeLayer = L.layerGroup(layers);

    this.originMarker = L.circleMarker([origin.lat, origin.lon], {
      radius: 9,
      fillColor: "#00e87a",
      color: "#0a0e14",
      weight: 2,
      fillOpacity: 1,
    })
      .addTo(this.map)
      .bindPopup("Start");

    this.destMarker = L.circleMarker([dest.lat, dest.lon], {
      radius: 9,
      fillColor: "#ff6b6b",
      color: "#0a0e14",
      weight: 2,
      fillOpacity: 1,
    })
      .addTo(this.map)
      .bindPopup("Ziel");

    const pts: [number, number][] = [
      [origin.lat, origin.lon],
      [dest.lat, dest.lon],
    ];
    for (const leg of journey.legs) {
      if (leg.origin?.location) pts.push([leg.origin.location.latitude, leg.origin.location.longitude]);
      if (leg.destination?.location) pts.push([leg.destination.location.latitude, leg.destination.location.longitude]);
    }
    this.map.fitBounds(pts, { padding: [48, 48] });
  }

  resetView(): void {
    this.clear();
    this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }

  invalidate(): void {
    this.map.invalidateSize();
  }
}
