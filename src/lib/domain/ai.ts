// "Asisten" deterministik: hasilnya dihitung dari data & aturan, tanpa model AI sungguhan.
import type { Booking, Customer, Vehicle, World } from "./types";
import { DESTINATIONS, PLACES } from "./fixtures";
import { activeBookingOf, vehicleStatus } from "./status";
import { dueItems, nextService } from "./service";
import { jam, rupiah } from "../format";

const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return Math.abs(h);
};

export function readKtp(name: string, phone: string) {
  const h = String(hash(name + phone)).padStart(10, "0");
  return {
    nik: `3271${h.slice(0, 2)}${h.slice(2, 8)}${h.slice(8, 10)}01`.slice(0, 16),
    address: "Kota Bogor, Jawa Barat",
    name: name.toUpperCase(),
  };
}

export function readSim(name: string) {
  const h = String(hash("sim" + name)).padStart(12, "0");
  const y = new Date().getFullYear() + 3;
  return { simNumber: `${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}`, validUntil: `Berlaku s.d. ${y}`, kind: "SIM C" };
}

export const faceMatch = (name: string) => 95 + (hash(name) % 4);

export function readOdometer(v: Vehicle, extraKm = 0) {
  return { km: v.odometer + Math.round(extraKm), fuel: Math.max(1, Math.min(5, v.fuel - (extraKm > 50 ? 2 : extraKm > 10 ? 1 : 0))) };
}

export function compareDamage(b: Booking) {
  const wentFar = Object.entries(b.zoneState).some(([id, inside]) => id === "z-puncak" && inside) ||
    b.timeline.some((t) => /Puncak/.test(t.text));
  if (wentFar) return { found: true, note: "Goresan baru di spakbor kiri belakang", estimate: 75_000 };
  return { found: false, note: "Tidak ada kerusakan baru", estimate: 0 };
}

// --- Tempel chat WhatsApp → draf booking -------------------------------------------------
const MONTHS: Record<string, number> = {
  jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2, apr: 3, april: 3, mei: 4, jun: 5, juni: 5,
  jul: 6, juli: 6, agu: 7, agt: 7, ags: 7, agustus: 7, sep: 8, sept: 8, september: 8, okt: 9, oktober: 9,
  nov: 10, november: 10, des: 11, desember: 11,
};

function after(text: string, label: RegExp): string {
  const m = text.match(label);
  if (!m || m.index === undefined) return "";
  const rest = text.slice(m.index + m[0].length);
  const lines = rest.split("\n");
  const first = lines[0].replace(/^\s*:?\s*/, "").trim();
  if (first) return first;
  const next = (lines[1] ?? "").trim();
  return next.includes(":") ? "" : next;
}

function parseDate(s: string, now: number): Date | null {
  const m = s.toLowerCase().match(/(\d{1,2})\s+([a-z]+)\.?\s*(\d{4})?/);
  if (!m) return null;
  const month = MONTHS[m[2]] ?? MONTHS[m[2].slice(0, 3)];
  if (month === undefined) return null;
  const year = m[3] ? Number(m[3]) : new Date(now).getFullYear();
  return new Date(year, month, Number(m[1]));
}

function withTime(d: Date | null, s: string) {
  if (!d) return null;
  const m = s.match(/(\d{1,2})[.:](\d{2})/) ?? s.match(/(\d{1,2})/);
  if (!m) return null;
  const x = new Date(d);
  x.setHours(Number(m[1]), m[2] ? Number(m[2]) : 0, 0, 0);
  return x.getTime();
}

export function matchPlace(text: string) {
  const t = text.toLowerCase();
  const map: [RegExp, string][] = [
    [/taman topi|kfc/, "taman-topi"], [/stasiun bogor|st\.? bogor/, "stasiun-bogor"], [/surya ?kencana|suryakencana/, "surya-kencana"],
    [/kebun raya/, "kebun-raya"], [/botani/, "botani"], [/baranangsiang/, "baranangsiang"], [/tajur/, "tajur"],
    [/ipb|dramaga/, "ipb"], [/aeon/, "sentul-aeon"], [/taman budaya/, "taman-budaya"], [/ciawi/, "ciawi"], [/puncak/, "puncak"],
  ];
  const hit = map.find(([re]) => re.test(t));
  return hit ? PLACES.find((p) => p.id === hit[1]) ?? null : null;
}

export function matchDestination(text: string) {
  const t = text.toLowerCase();
  if (/puncak|cisarua|megamendung/.test(t)) return DESTINATIONS.find((d) => d.key === "puncak")!;
  if (/jakarta|bandung|sukabumi|depok|bekasi|tangerang|luar kota/.test(t)) return DESTINATIONS.find((d) => d.key === "luar")!;
  if (/sentul/.test(t)) return DESTINATIONS.find((d) => d.key === "sentul")!;
  return DESTINATIONS[0];
}

export interface ParsedChat {
  name?: string; phone?: string; nik?: string; address?: string; instagram?: string;
  start?: number; end?: number; model?: string; destinationText?: string; pickupText?: string; dropoffText?: string;
  found: string[];
}

export function parseWhatsApp(text: string, now: number): ParsedChat {
  const found: string[] = [];
  const out: ParsedChat = { found };
  const set = <K extends keyof ParsedChat>(k: K, v: ParsedChat[K], label: string) => {
    if (v) { out[k] = v; found.push(label); }
  };
  set("name", after(text, /Nama Lengkap[^:\n]*:?/i), "Nama");
  set("phone", after(text, /No\.? ?Hp\.? ?1\s*:?/i).replace(/[^\d+]/g, "") || undefined, "No. HP");
  set("nik", after(text, /NIk\.? ?KTP\s*:?/i).replace(/\D/g, "") || undefined, "NIK");
  set("address", after(text, /Alamat[^:\n]*:?/i), "Alamat");
  set("instagram", after(text, /Nama IG[^:\n]*:?/i), "Instagram");
  set("model", after(text, /Jenis Motor\s*:?/i), "Jenis motor");
  set("destinationText", after(text, /Tujuan Pemakaian\s*:?/i), "Tujuan");
  set("pickupText", after(text, /Titik Pengantaran\s*:?/i), "Titik antar");
  set("dropoffText", after(text, /Titik Pengembalian\s*:?/i), "Titik kembali");

  const startIdx = text.toLowerCase().lastIndexOf("mulai sewa");
  if (startIdx >= 0) {
    const block = text.slice(startIdx);
    const [a, b = ""] = block.split(/Selesai Sewa/i);
    const sDate = parseDate(after(a, /Tanggal[^:\n]*:?/i), now);
    const sTime = withTime(sDate, after(a, /Jam\s*:?/i));
    const eDate = parseDate(after(b, /Tanggal[^:\n]*:?/i), now);
    let eTime = withTime(eDate, after(b, /Jam\s*:?/i));
    const lama = text.match(/Lama Sewa\s*:?\s*(\d+)\s*jam/i);
    if (sTime && !eTime && lama) eTime = sTime + Number(lama[1]) * 3_600_000;
    if (sTime) set("start", sTime, "Mulai sewa");
    if (eTime) set("end", eTime, "Selesai sewa");
  }
  return out;
}

export const SAMPLE_CHAT = `Silahkan Isi Form di Bawah ini Dengan Lengkap

Nama Lengkap Sesuai KTP:
NADIA PUTRI

Alamat Sesuai KTP :
Cibinong, Kab. Bogor

No Hp 1 : 081310008821

KTP : Ada
NIk. KTP :
3201xxxxxxxx0004

SIM C : Ada

Mulai Sewa
Hari, Tanggal Sewa : Sabtu, 14 November 2026
Jam : 09.00

Selesai Sewa
Hari, Tanggal Kembali : Minggu, 15 November 2026
Jam : 09.00

Lama Sewa : 24 Jam
Jenis Motor : Scoopy

Tujuan Pemakaian :
Kebun Raya, Surya Kencana

Titik Pengantaran :
Stasiun Bogor

Titik Pengembalian :
Stasiun Bogor

Nama IG Ke -1: @nadiapt`;

// --- Catatan servis bebas → item & biaya --------------------------------------------------
export function parseServiceNote(text: string) {
  return text
    .split(/[,+\n;]| dan /i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)?\b/i);
      let cost = 0;
      if (m) {
        const n = Number(m[1].replace(",", "."));
        const unit = (m[2] ?? "").toLowerCase();
        cost = unit === "jt" || unit === "juta" ? n * 1_000_000 : unit ? n * 1000 : n < 1000 ? n * 1000 : n;
      }
      const name = s.replace(m?.[0] ?? "", "").replace(/\s+/g, " ").trim();
      return { name: name.charAt(0).toUpperCase() + name.slice(1), cost: Math.round(cost) };
    })
    .filter((x) => x.name);
}

// --- Ringkasan pagi untuk owner ------------------------------------------------------------
export function dailyBrief(world: World, storeId: string, now: number, alerts: number) {
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = startOfDay.getTime() + 86_400_000;
  const mine = world.bookings.filter((b) => b.storeId === storeId);
  const pickups = mine.filter((b) => b.status === "approved" && b.start < endOfDay);
  const returns = mine.filter((b) => b.status === "active" && b.end < endOfDay);
  const pending = mine.filter((b) => b.status === "pending");
  const vehicles = world.vehicles.filter((v) => v.storeId === storeId);
  const svc = vehicles.filter((v) => dueItems(v, 0.95).length > 0 && !v.maintenance);
  const idle = vehicles.filter((v) => vehicleStatus(world, v, now) === "ready").length;
  const lines: string[] = [];
  if (alerts) lines.push(`${alerts} sewa perlu perhatian sekarang`);
  if (pending.length) lines.push(`${pending.length} permintaan menunggu persetujuanmu`);
  if (pickups.length) lines.push(`${pickups.length} motor diambil hari ini, pertama jam ${jam(Math.min(...pickups.map((b) => b.start)))}`);
  if (returns.length) lines.push(`${returns.length} motor kembali hari ini`);
  for (const v of svc.slice(0, 2)) {
    const n = nextService(v);
    lines.push(`${v.shortModel} ${v.plate}: ${n.label.toLowerCase()} ${n.remaining <= 0 ? "sudah lewat" : n.daysLeft === 0 ? `sisa ${n.remaining} km` : `±${n.daysLeft} hari lagi`}`);
  }
  if (!lines.length) lines.push(`Semua aman. ${idle} unit siap disewa.`);
  return lines;
}

export function alertPriority(world: World, b: Booking, c: Customer | undefined, type: string) {
  let score = type === "signal_lost" ? 70 : type === "enter_zone" ? 80 : type === "exit_area" ? 60 : 50;
  const reasons: string[] = [];
  if (c && c.rentals <= 1) { score += 10; reasons.push("penyewa baru"); }
  const zone = world.zones.find((z) => b.zoneState[z.id] && z.kind === "restricted");
  if (zone) { score += 10; reasons.push(`di ${zone.name}`); }
  return { score, reasons };
}

export function revenueThisMonth(world: World, storeId: string, now: number) {
  const d = new Date(now); d.setDate(1); d.setHours(0, 0, 0, 0);
  return world.bookings
    .filter((b) => b.storeId === storeId && ["active", "completed"].includes(b.status) && b.start >= d.getTime() - 40 * 86_400_000)
    .reduce((s, b) => s + b.price.total + (b.returned?.lateFee ?? 0) + (b.returned?.damageFee ?? 0), 0);
}

export function lateSummary(b: Booking, now: number) {
  return Math.max(0, Math.round((now - b.end) / 60_000));
}

export { activeBookingOf, rupiah };
