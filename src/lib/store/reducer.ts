import { produce } from "immer";
import type { Booking, World, Zone } from "../domain/types";
import { createWorld } from "../domain/fixtures";
import { inZone } from "../domain/geo";
import type { Envelope } from "./events";

const H = 3_600_000;

export function isNewer(a: Pick<World, "epoch" | "rev" | "id">, b: Pick<World, "epoch" | "rev" | "id">) {
  if (a.epoch !== b.epoch) return a.epoch > b.epoch;
  if (a.rev !== b.rev) return a.rev > b.rev;
  return a.id < b.id && a.id !== b.id;
}

function zonesFor(world: World, b: Booking): Zone[] {
  return world.zones.filter((z) => z.active && (z.scope === "platform" || z.storeId === b.storeId));
}

function evalZones(world: World, b: Booking, lng: number, lat: number, t: number, acc: number) {
  for (const z of zonesFor(world, b)) {
    const inside = inZone(lng, lat, z);
    const prev = b.zoneState[z.id] ?? (z.kind === "service");
    if (inside === prev) continue;
    b.zoneState[z.id] = inside;
    const permitted = b.permits.includes(z.id);
    const violation = (z.kind === "service" && !inside) || (z.kind === "restricted" && inside);
    if (z.kind === "service") {
      b.timeline.push({ t, text: inside ? `Kembali ke ${z.name}` : `Keluar ${z.name}${permitted ? " · sesuai izin" : ""}`, tone: inside ? "ok" : permitted ? "info" : "warn" });
    } else {
      b.timeline.push({ t, text: `${inside ? "Masuk" : "Keluar dari"} ${z.name}${inside && permitted ? " · sesuai izin" : ""}`, tone: inside ? (permitted ? "info" : "danger") : "ok" });
    }
    if (violation && !permitted && z.kind !== "monitor") {
      const n = world.alerts.filter((a) => a.bookingId === b.id && a.zoneId === z.id).length;
      world.alerts.push({
        id: `${b.id}:${z.id}:${n}`, bookingId: b.id, type: z.kind === "service" ? "exit_area" : "enter_zone",
        zoneId: z.id, at: t, lat, lng, acc,
      });
    }
  }
}

export function preserveOnReset(old: World, fresh: World): World {
  const users = old.customers.filter((c) => c.id.startsWith("u-"));
  const ownerOf = new Map(old.stores.map((s) => [s.id, s] as const));
  return {
    ...fresh,
    customers: [...fresh.customers, ...users.map((u) => ({ ...u, rentals: 0, verified: u.verified }))],
    stores: fresh.stores.map((s) => {
      const o = ownerOf.get(s.id);
      return o ? { ...s, ownerName: o.ownerName, ownerPhone: o.ownerPhone, qrisImage: o.qrisImage } : s;
    }),
  };
}

export function applyEnvelope(world: World, env: Envelope): World {
  const ev = env.ev;
  if (ev.type === "world.reset") {
    if (ev.newEpoch <= world.epoch) return world;
    const fresh = preserveOnReset(world, createWorld(ev.t0, ev.newEpoch, ev.worldId));
    return { ...fresh, rev: 1, seen: [env.id] };
  }
  if (env.epoch !== world.epoch || world.seen.includes(env.id)) return world;

  return produce(world, (w) => {
    w.rev += 1;
    w.seen.push(env.id);
    if (w.seen.length > 300) w.seen.splice(0, w.seen.length - 300);
    const bk = (id: string) => w.bookings.find((b) => b.id === id);
    const veh = (id: string) => w.vehicles.find((v) => v.id === id);

    switch (ev.type) {
      case "customer.upsert": {
        const i = w.customers.findIndex((c) => c.id === ev.customer.id);
        if (i >= 0) w.customers[i] = { ...w.customers[i], ...ev.customer };
        else w.customers.push(ev.customer);
        break;
      }
      case "store.update": {
        const s = w.stores.find((x) => x.id === ev.storeId);
        if (s) Object.assign(s, ev.patch);
        break;
      }
      case "booking.create": {
        if (!bk(ev.booking.id)) w.bookings.push(ev.booking);
        break;
      }
      case "booking.pay": {
        const b = bk(ev.id); if (!b) break;
        b.payment = { ...b.payment, mode: ev.mode, amount: ev.amount, proof: ev.proof ?? b.payment.proof, paidAt: ev.at };
        b.timeline.push({ t: ev.at, text: ev.mode === "dp" ? "DP dibayar via QRIS" : "Dibayar lunas via QRIS", tone: "ok" });
        break;
      }
      case "booking.confirmPayment": {
        const b = bk(ev.id); if (b) b.payment.confirmed = true;
        break;
      }
      case "booking.approve": {
        const b = bk(ev.id); if (!b || b.status !== "pending") break;
        b.status = "approved"; b.approvedAt = ev.at; b.permits = ev.permits; b.payment.confirmed = true;
        if (ev.crew) b.crew = ev.crew;
        b.timeline.push({ t: ev.at, text: ev.permits.length ? `Disetujui · izin ke ${b.destination.label}` : "Disetujui", tone: "ok" });
        break;
      }
      case "booking.reject": {
        const b = bk(ev.id); if (!b) break;
        b.status = "rejected"; b.rejectReason = ev.reason;
        b.timeline.push({ t: ev.at, text: `Ditolak: ${ev.reason}`, tone: "danger" });
        break;
      }
      case "booking.cancel": {
        const b = bk(ev.id); if (!b) break;
        b.status = "cancelled"; b.timeline.push({ t: ev.at, text: "Dibatalkan penyewa", tone: "warn" });
        break;
      }
      case "booking.crew": {
        const b = bk(ev.id); if (!b) break;
        b.crew = ev.crew; b.timeline.push({ t: ev.at, text: `Crew ${ev.crew} ditugaskan` });
        break;
      }
      case "booking.arrive": {
        const b = bk(ev.id); if (!b) break;
        b.arrival = { at: ev.at, note: ev.note, lat: ev.lat, lng: ev.lng };
        b.timeline.push({ t: ev.at, text: `Penyewa sudah di titik temu${ev.note ? ` · ${ev.note}` : ""}`, tone: "info" });
        break;
      }
      case "booking.start": {
        const b = bk(ev.id); if (!b) break;
        b.status = "active"; b.handover = ev.handover; b.arrival = undefined; b.zoneState = {};
        const v = veh(b.vehicleId); if (v) { v.inspection = false; v.fuel = ev.handover.fuel; v.odometer = ev.handover.km; }
        const c = w.customers.find((x) => x.id === b.customerId); if (c) c.rentals += 1;
        b.timeline.push({ t: ev.handover.at, text: `Motor diserahkan${ev.handover.by ? ` oleh ${ev.handover.by}` : ""}`, tone: "ok" });
        break;
      }
      case "booking.extendRequest": {
        const b = bk(ev.id); if (!b) break;
        b.extension = { hours: ev.hours, price: ev.price, status: "pending", at: ev.at };
        b.timeline.push({ t: ev.at, text: `Minta perpanjang ${ev.hours} jam`, tone: "info" });
        break;
      }
      case "booking.extendDecide": {
        const b = bk(ev.id); if (!b || !b.extension) break;
        b.extension.status = ev.approve ? "approved" : "rejected";
        if (ev.approve) { b.end += b.extension.hours * H; b.price.total += b.extension.price; }
        b.timeline.push({ t: ev.at, text: ev.approve ? `Perpanjang ${b.extension.hours} jam disetujui` : "Perpanjangan ditolak", tone: ev.approve ? "ok" : "warn" });
        break;
      }
      case "booking.complete": {
        const b = bk(ev.id); if (!b) break;
        b.status = "completed"; b.returned = ev.ret;
        const v = veh(b.vehicleId);
        if (v) {
          v.odometer = ev.ret.km; v.fuel = ev.ret.fuel; v.inspection = false;
          if (ev.serviceReason) v.maintenance = { since: ev.ret.at, reason: ev.serviceReason };
        }
        b.timeline.push({ t: ev.ret.at, text: "Motor dikembalikan", tone: "ok" });
        for (const a of w.alerts.filter((a) => a.bookingId === b.id)) {
          w.alertState[a.id] = { status: "resolved", at: ev.ret.at };
        }
        w.alertState[`${b.id}:signal`] = { status: "resolved", at: ev.ret.at };
        w.alertState[`${b.id}:overdue`] = { status: "resolved", at: ev.ret.at };
        if (w.sim.bookingId === b.id) w.sim.running = false;
        break;
      }
      case "booking.permit": {
        const b = bk(ev.id); if (!b) break;
        b.permits = Array.from(new Set([...b.permits, ...ev.zoneIds]));
        b.timeline.push({ t: ev.at, text: "Owner memberi izin wilayah", tone: "info" });
        break;
      }
      case "loc": {
        const b = bk(ev.bookingId); if (!b || b.status !== "active") break;
        b.positions.push(ev.pos);
        if (b.positions.length > 300) b.positions.splice(0, b.positions.length - 300);
        evalZones(w as World, b, ev.pos.lng, ev.pos.lat, ev.pos.t, ev.pos.acc);
        break;
      }
      case "alert.state": {
        w.alertState[ev.alertId] = ev.state;
        break;
      }
      case "zone.upsert": {
        const i = w.zones.findIndex((z) => z.id === ev.zone.id);
        if (i >= 0) w.zones[i] = ev.zone; else w.zones.push(ev.zone);
        break;
      }
      case "zone.remove": {
        w.zones = w.zones.filter((z) => z.id !== ev.id);
        break;
      }
      case "vehicle.upsert": {
        const i = w.vehicles.findIndex((v) => v.id === ev.vehicle.id);
        if (i >= 0) w.vehicles[i] = ev.vehicle; else w.vehicles.push(ev.vehicle);
        break;
      }
      case "vehicle.inspected": {
        const v = veh(ev.id); if (v) v.inspection = false;
        break;
      }
      case "vehicle.maintenance": {
        const v = veh(ev.id); if (v) v.maintenance = ev.maintenance;
        break;
      }
      case "vehicle.serviceDone": {
        const v = veh(ev.id); if (!v) break;
        v.serviceLog.unshift(ev.record);
        for (const s of v.service) if (ev.keys.includes(s.key)) s.lastKm = v.odometer;
        v.maintenance = null; v.inspection = false;
        break;
      }
      case "sim": {
        Object.assign(w.sim, ev.patch);
        if (ev.patch.signalOff) w.sim.signalOff = { ...ev.patch.signalOff };
        break;
      }
      case "clock": {
        w.clockOffset = ev.offset;
        break;
      }
    }
  });
}
