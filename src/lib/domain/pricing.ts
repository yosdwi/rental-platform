import type { PriceTier, Store, Place } from "./types";
import { km } from "./geo";
import { H } from "../format";

export function hoursBetween(start: number, end: number) {
  return Math.max(1, Math.ceil((end - start) / H - 1e-9));
}

function tierFor(tiers: PriceTier[], hours: number) {
  const sorted = [...tiers].sort((a, b) => a.hours - b.hours);
  return sorted.find((t) => t.hours >= hours) ?? sorted[sorted.length - 1];
}

export function priceFor(tiers: PriceTier[], hours: number): { price: number; label: string } {
  const sorted = [...tiers].sort((a, b) => a.hours - b.hours);
  const max = sorted[sorted.length - 1];
  if (hours <= max.hours) {
    const t = tierFor(sorted, hours);
    return { price: t.price, label: `${t.hours} jam` };
  }
  const p24 = sorted.find((t) => t.hours === 24)?.price ?? max.price / 2;
  const days = Math.floor(hours / 24);
  const rem = hours - days * 24;
  const extra = rem === 0 ? 0 : tierFor(sorted, rem).price;
  return { price: days * p24 + extra, label: rem === 0 ? `${days} hari` : `${days} hari ${rem} jam` };
}

export function packageHint(tiers: PriceTier[], start: number, end: number) {
  const hours = hoursBetween(start, end);
  const now = priceFor(tiers, hours);
  for (let cut = 1; cut <= 4; cut++) {
    const h = hours - cut;
    if (h < 1) break;
    const alt = priceFor(tiers, h);
    if (alt.price < now.price) {
      return { hours: cut, save: now.price - alt.price, end: start + h * H, label: alt.label };
    }
  }
  return null;
}

export function lateFee(store: Store, lateMinutes: number) {
  const over = Math.max(0, lateMinutes - store.rules.graceMinutes);
  return Math.ceil(over / 60) * store.rules.lateFeePerHour;
}

export function deliveryQuote(store: Store, place: Place): { fee: number; km: number } | null {
  const d = km(store.base, place);
  if (d > store.rules.maxDeliveryKm) return null;
  return { fee: d <= store.rules.freeDeliveryKm ? 0 : store.rules.deliveryFee, km: d };
}

export const fromPrice = (tiers: PriceTier[]) => Math.min(...tiers.map((t) => t.price));
export const dayPrice = (tiers: PriceTier[]) => tiers.find((t) => t.hours === 24)?.price ?? fromPrice(tiers);

// Akhir pekan & tanggal merah (Jumat–Minggu + daftar libur nasional sederhana)
const HOLIDAYS = ["2026-12-24", "2026-12-25", "2027-01-01"];
export function isWeekendRule(t: number) {
  const d = new Date(t);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return d.getDay() === 5 || d.getDay() === 6 || d.getDay() === 0 || HOLIDAYS.includes(key);
}
