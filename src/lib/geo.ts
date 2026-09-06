import { feature } from "topojson-client";
import { geoContains } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import topo from "world-atlas/countries-110m.json";

type CountryProps = { name?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const world = topo as any;

export const countries = feature(world, world.objects.countries) as unknown as FeatureCollection<
  Geometry,
  CountryProps
>;

export type Point = { lat: number; lng: number };

export function antipode(p: Point): Point {
  const lng = p.lng > 0 ? p.lng - 180 : p.lng + 180;
  return { lat: -p.lat, lng };
}

export function countryAt(p: Point): string | null {
  for (const f of countries.features) {
    if (geoContains(f, [p.lng, p.lat])) return f.properties?.name ?? "Land";
  }
  return null;
}

/** Rough but sensible ocean / sea naming for water points. */
export function oceanAt({ lat, lng }: Point): string {
  if (lat <= -60) return "Southern Ocean";
  if (lat >= 66) return "Arctic Ocean";

  if (lng >= 20 && lng <= 147 && lat < 31) return "Indian Ocean";
  if (lng > 147 || lng < -70) {
    return lat >= 0 ? "North Pacific Ocean" : "South Pacific Ocean";
  }
  if (lng >= -70 && lng < 20) {
    if (lat > 30 && lng > -6 && lng < 37) return "Mediterranean Sea";
    return lat >= 0 ? "North Atlantic Ocean" : "South Atlantic Ocean";
  }
  return "Open Ocean";
}

export type Verdict = {
  place: string;
  isLand: boolean;
};

export function describe(p: Point): Verdict {
  const c = countryAt(p);
  return c ? { place: c, isLand: true } : { place: oceanAt(p), isLand: false };
}

export function formatCoord({ lat, lng }: Point): string {
  const la = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}`;
  const lo = `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? "E" : "W"}`;
  return `${la}, ${lo}`;
}

export const LAYERS = [
  {
    name: "Continental Crust",
    depth: 35,
    temp: "20–400 °C",
    note: "Rock you could hold. The thinnest skin on the planet.",
  },
  {
    name: "Upper Mantle",
    depth: 660,
    temp: "500–900 °C",
    note: "Solid rock that creeps like cold honey over millennia.",
  },
  {
    name: "Lower Mantle",
    depth: 2890,
    temp: "900–3 700 °C",
    note: "Silicate under 1.3 million atmospheres of pressure.",
  },
  {
    name: "Outer Core",
    depth: 5150,
    temp: "4 400–5 000 °C",
    note: "Liquid iron churning fast enough to generate Earth's magnetic field.",
  },
  {
    name: "Inner Core",
    depth: 6371,
    temp: "≈ 5 400 °C",
    note: "A solid iron ball as hot as the surface of the Sun.",
  },
] as const;

export const EARTH_RADIUS_KM = 6371;
export const THROUGH_KM = EARTH_RADIUS_KM * 2;

/** Temperature (°C) at a given depth along the drill, mirrored past the centre. */
export function tempAtDepth(km: number): number {
  const d = km > EARTH_RADIUS_KM ? THROUGH_KM - km : km;
  const t = d / EARTH_RADIUS_KM;
  return Math.round(15 + 5385 * Math.pow(t, 0.62));
}
