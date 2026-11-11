import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { lineString, point, polygon } from "@turf/helpers";
import distance from "@turf/distance";
import circle from "@turf/circle";
import along from "@turf/along";
import length from "@turf/length";
import type { LngLat, Zone } from "./types";
import { PLACES } from "./fixtures";

type LL = { lat: number; lng: number };

export const km = (a: LL, b: LL) => distance(point([a.lng, a.lat]), point([b.lng, b.lat]));

export const inPolygon = (lng: number, lat: number, ring: LngLat[]) =>
  booleanPointInPolygon(point([lng, lat]), polygon([ring]));

export const inZone = (lng: number, lat: number, zone: Zone) => inPolygon(lng, lat, zone.polygon);

export function circleRing(center: LngLat, radiusKm: number): LngLat[] {
  return circle(center, radiusKm, { steps: 48, units: "kilometers" }).geometry.coordinates[0] as LngLat[];
}

export function pointAlong(path: LngLat[], fraction: number): LngLat {
  const ls = lineString(path);
  const L = length(ls);
  const f = Math.min(1, Math.max(0, fraction));
  return along(ls, L * f).geometry.coordinates as LngLat;
}

export const pathKm = (path: LngLat[]) => (path.length < 2 ? 0 : length(lineString(path)));

const EXTRA = [
  { name: "Gadog", lat: -6.662, lng: 106.862 },
  { name: "Cipayung", lat: -6.678, lng: 106.9 },
  { name: "Megamendung", lat: -6.683, lng: 106.92 },
  { name: "Cisarua", lat: -6.694, lng: 106.943 },
  { name: "Jl. Raya Tajur", lat: -6.634, lng: 106.827 },
];

export function nearLabel(lat: number, lng: number) {
  let best: { name: string; lat: number; lng: number } = PLACES[0];
  let d = Infinity;
  for (const p of [...PLACES, ...EXTRA]) {
    const k = km({ lat, lng }, p);
    if (k < d) { d = k; best = p; }
  }
  if (d < 0.4) return best.name;
  if (d < 3) return `dekat ${best.name}`;
  return `±${d.toFixed(0)} km dari ${best.name}`;
}

export function ringCenter(ring: LngLat[]): LngLat {
  const pts = ring.slice(0, -1);
  const x = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const y = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [x, y];
}
