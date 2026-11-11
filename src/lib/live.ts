import type { Alert, AlertState, Booking, Customer, Store, Vehicle, World } from "./domain/types";
import { pointAlong } from "./domain/geo";

export interface LivePos { lat: number; lng: number; acc: number; t: number; src: "phone" | "sim" }

export function livePosition(b: Booking, now: number): LivePos | null {
  if (b.ambient && b.status === "active") {
    const frac = (((now / 60_000) / b.ambient.periodMin + b.ambient.offset) % 1 + 1) % 1;
    const [lng, lat] = pointAlong(b.ambient.path, frac);
    return { lat, lng, acc: 7, t: now - 6_000, src: "phone" };
  }
  const p = b.positions[b.positions.length - 1];
  return p ? { ...p } : null;
}

export interface AlertView extends Alert {
  state: AlertState;
  booking: Booking;
  vehicle?: Vehicle;
  customer?: Customer;
  zoneName?: string;
}

export function computeAlerts(world: World, now: number, opts: { storeId?: string; customerId?: string; includeResolved?: boolean } = {}) {
  const out: AlertView[] = [];
  const grace = (s?: Store) => (s?.rules.graceMinutes ?? 15) * 60_000;
  const all: Alert[] = [...world.alerts];
  for (const b of world.bookings) {
    if (b.status !== "active" || b.ambient) continue;
    const last = b.positions[b.positions.length - 1];
    const limit = world.sim.signalOff[b.id] ? world.config.signalLostAfterSec : 180;
    if (last && now - last.t > limit * 1000) {
      all.push({ id: `${b.id}:signal`, bookingId: b.id, type: "signal_lost", at: last.t, lat: last.lat, lng: last.lng, acc: last.acc, derived: true });
    }
  }
  for (const b of world.bookings) {
    if (b.status !== "active") continue;
    const s = world.stores.find((x) => x.id === b.storeId);
    if (now > b.end + grace(s)) all.push({ id: `${b.id}:overdue`, bookingId: b.id, type: "overdue", at: b.end, derived: true });
  }
  for (const a of all) {
    const booking = world.bookings.find((b) => b.id === a.bookingId);
    if (!booking) continue;
    if (opts.storeId && booking.storeId !== opts.storeId) continue;
    if (opts.customerId && booking.customerId !== opts.customerId) continue;
    const state = world.alertState[a.id] ?? { status: "new", at: a.at };
    if (!opts.includeResolved && (state.status === "resolved" || booking.status !== "active")) continue;
    out.push({
      ...a, state, booking,
      vehicle: world.vehicles.find((v) => v.id === booking.vehicleId),
      customer: world.customers.find((c) => c.id === booking.customerId),
      zoneName: world.zones.find((z) => z.id === a.zoneId)?.name,
    });
  }
  const weight = { enter_zone: 4, signal_lost: 3, exit_area: 2, overdue: 1 } as const;
  return out.sort((a, b) => weight[b.type] - weight[a.type] || b.at - a.at);
}

export const ALERT_TEXT: Record<Alert["type"], { title: (a: AlertView) => string; tone: "danger" | "warn" }> = {
  enter_zone: { title: (a) => `Masuk ${a.zoneName ?? "zona larangan"}`, tone: "danger" },
  exit_area: { title: () => "Keluar area layanan", tone: "warn" },
  signal_lost: { title: () => "Sinyal hilang", tone: "danger" },
  overdue: { title: () => "Terlambat kembali", tone: "warn" },
};
