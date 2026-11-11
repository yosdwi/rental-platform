import type { World } from "./types";

const BUFFER = 30 * 60_000;

function blocks(world: World, vehicleId: string, now: number, ignore?: string) {
  const out: [number, number][] = [];
  const v = world.vehicles.find((x) => x.id === vehicleId);
  if (v?.maintenance) out.push([v.maintenance.since, v.maintenance.until ?? Number.POSITIVE_INFINITY]);
  if (v?.inspection) out.push([now - 1, now + 90 * 60_000]);
  for (const b of world.bookings) {
    if (b.vehicleId !== vehicleId || b.id === ignore) continue;
    if (b.status === "pending" || b.status === "approved") out.push([b.start - BUFFER, b.end + BUFFER]);
    if (b.status === "active") out.push([b.start - BUFFER, Math.max(b.end, now) + BUFFER]);
  }
  return out;
}

export function isAvailable(world: World, vehicleId: string, start: number, end: number, now: number, ignore?: string) {
  return !blocks(world, vehicleId, now, ignore).some(([a, b]) => start < b && end > a);
}

export function nextFree(world: World, vehicleId: string, start: number, end: number, now: number) {
  const dur = end - start;
  const bl = blocks(world, vehicleId, now).sort((a, b) => a[1] - b[1]);
  const candidates = [start, ...bl.map(([, b]) => b)].filter((t) => t >= start && Number.isFinite(t)).sort((a, b) => a - b);
  for (const c of candidates) {
    const s = Math.ceil(c / (30 * 60_000)) * 30 * 60_000;
    if (!bl.some(([a, b]) => s < b && s + dur > a)) return s;
  }
  return null;
}
