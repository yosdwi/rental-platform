import type { Vehicle, World } from "./types";

export function serviceItems(v: Vehicle) {
  return v.service.map((s) => {
    const used = v.odometer - s.lastKm;
    const remaining = s.intervalKm - used;
    return {
      ...s,
      used,
      remaining,
      ratio: Math.min(1.2, used / s.intervalKm),
      daysLeft: Math.max(0, Math.floor(remaining / Math.max(1, v.avgKmPerDay))),
    };
  });
}

export function nextService(v: Vehicle) {
  return serviceItems(v).sort((a, b) => a.remaining - b.remaining)[0];
}

export function dueItems(v: Vehicle, threshold = 1) {
  return serviceItems(v).filter((s) => s.ratio >= threshold);
}

export function suggestServiceDay(world: World, v: Vehicle, now: number) {
  for (let i = 1; i <= 10; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(8, 0, 0, 0);
    const a = d.getTime();
    const b = a + 9 * 3_600_000;
    const busy = world.bookings.some(
      (x) => x.vehicleId === v.id && ["pending", "approved", "active"].includes(x.status) && x.start < b && x.end > a,
    );
    if (!busy) return a;
  }
  return null;
}
