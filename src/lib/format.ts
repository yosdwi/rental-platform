import { format, formatDistanceStrict } from "date-fns";
import { id } from "date-fns/locale";

export const H = 3_600_000;
export const M = 60_000;

export function rupiah(n: number) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

export function rb(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "jt";
  return Math.round(n / 1000) + "rb";
}

export const jam = (t: number) => format(t, "HH.mm");
export const tgl = (t: number) => format(t, "EEE, d MMM", { locale: id });
export const tglPanjang = (t: number) => format(t, "EEEE, d MMMM", { locale: id });
export const tglJam = (t: number) => `${tgl(t)} · ${jam(t)}`;

export function hariRelatif(t: number, now: number) {
  const a = new Date(t); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  const d = Math.round((a.getTime() - b.getTime()) / 86_400_000);
  if (d === 0) return "Hari ini";
  if (d === 1) return "Besok";
  if (d === -1) return "Kemarin";
  return tgl(t);
}

export function lalu(t: number, now: number) {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "baru saja";
  if (s < 3600) return `${Math.round(s / 60)} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return formatDistanceStrict(t, now, { locale: id }) + " lalu";
}

export function durasi(ms: number) {
  const neg = ms < 0;
  const m = Math.floor(Math.abs(ms) / M);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  const s = d > 0 ? `${d} hr ${h} j` : h > 0 ? `${h} j ${mm} m` : `${mm} mnt`;
  return neg ? "-" + s : s;
}

export function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((x) => String(x).padStart(2, "0")).join(":");
}

export function sapaan(t: number) {
  const h = new Date(t).getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export const inisial = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

export const firstName = (name: string) => name.split(/\s+/)[0] ?? name;
