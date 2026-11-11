import type { Booking, BookingStatus, Vehicle, World } from "./types";

export type VehicleStatus = "ready" | "reserved" | "active" | "due" | "overdue" | "inspection" | "maintenance";
export type Tone = "ok" | "info" | "brand" | "warn" | "danger" | "check" | "maint" | "muted";

export const VEHICLE_STATUS: Record<VehicleStatus, { label: string; tone: Tone }> = {
  ready: { label: "Siap", tone: "ok" },
  reserved: { label: "Dipesan", tone: "info" },
  active: { label: "Disewa", tone: "brand" },
  due: { label: "Segera kembali", tone: "warn" },
  overdue: { label: "Terlambat", tone: "danger" },
  inspection: { label: "Cek kondisi", tone: "check" },
  maintenance: { label: "Servis", tone: "maint" },
};

export const BOOKING_STATUS: Record<BookingStatus, { label: string; tone: Tone }> = {
  pending: { label: "Menunggu persetujuan", tone: "warn" },
  approved: { label: "Disetujui", tone: "info" },
  active: { label: "Sedang disewa", tone: "brand" },
  completed: { label: "Selesai", tone: "ok" },
  rejected: { label: "Ditolak", tone: "danger" },
  cancelled: { label: "Dibatalkan", tone: "muted" },
};

export function inMaintenance(v: Vehicle, now: number) {
  const m = v.maintenance;
  if (!m) return false;
  return m.since <= now;
}

export function activeBookingOf(world: World, vehicleId: string) {
  return world.bookings.find((b) => b.vehicleId === vehicleId && b.status === "active");
}

export function vehicleStatus(world: World, v: Vehicle, now: number): VehicleStatus {
  const act = activeBookingOf(world, v.id);
  if (act) {
    if (now > act.end) return "overdue";
    if (act.end - now < 60 * 60_000) return "due";
    return "active";
  }
  if (inMaintenance(v, now)) return "maintenance";
  if (v.inspection) return "inspection";
  const soon = world.bookings.find(
    (b) => b.vehicleId === v.id && b.status === "approved" && b.start - now < 12 * 3_600_000 && b.end > now,
  );
  if (soon) return "reserved";
  return "ready";
}

export function bookingPhase(b: Booking, now: number): "upcoming" | "active" | "overdue" | "done" | "pending" | "closed" {
  if (b.status === "pending") return "pending";
  if (b.status === "approved") return "upcoming";
  if (b.status === "active") return now > b.end ? "overdue" : "active";
  if (b.status === "completed") return "done";
  return "closed";
}
