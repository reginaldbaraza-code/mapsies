export function isDbStopId(id: string | undefined): boolean {
  return !!id && /^80\d+$/.test(id);
}

export function isBvgStopId(id: string | undefined): boolean {
  return !!id && /^900\d+$/.test(id);
}

export function isBvgApi(apiBase: string): boolean {
  return apiBase.includes("bvg");
}

export function isInBerlin(place: { lat: number; lon: number }): boolean {
  const { south, north, west, east } = {
    south: 52.338,
    north: 52.675,
    west: 13.088,
    east: 13.761,
  };
  return place.lat >= south && place.lat <= north && place.lon >= west && place.lon <= east;
}
