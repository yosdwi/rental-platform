"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, MapPinOff, MessageCircle, ShieldAlert, SignalZero, ShieldCheck, Map as MapIcon, BadgeCheck, X } from "lucide-react";
import type { Booking, Customer, Store, Vehicle, World } from "@/lib/domain/types";
import { type AlertView, ALERT_TEXT, livePosition } from "@/lib/live";
import { alertPriority } from "@/lib/domain/ai";
import { nearLabel } from "@/lib/domain/geo";
import { BOOKING_STATUS, VEHICLE_STATUS, vehicleStatus } from "@/lib/domain/status";
import { useApp } from "@/lib/store/store";
import { haptic } from "@/lib/hooks";
import { Avatar, Chip, Toggle } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { MotorArt } from "@/components/moto/motor-art";
import { countdown, firstName, hariRelatif, jam, lalu, rupiah, tglJam, durasi } from "@/lib/format";
import { openWa } from "@/lib/wa";
import { cn } from "@/lib/cn";

const ALERT_ICON = { enter_zone: ShieldAlert, exit_area: MapPinOff, signal_lost: SignalZero, overdue: Clock };

export function alertWaText(a: AlertView, store: Store, now: number) {
  const n = firstName(a.customer?.name ?? "");
  const loc = a.lat ? nearLabel(a.lat, a.lng!) : "";
  switch (a.type) {
    case "exit_area": return `Halo ${n}, motor ${a.vehicle?.shortModel} terdeteksi keluar area sewa ${store.shortName} (${loc}). Boleh dikabari mau ke mana? Terima kasih.`;
    case "enter_zone": return `Halo ${n}, motor terdeteksi masuk ${a.zoneName}. Area ini di luar izin sewa ${store.shortName}. Mohon kabari kami secepatnya ya.`;
    case "signal_lost": return `Halo ${n}, lokasi motor tidak terkirim sejak ${jam(a.at)}. Mohon pastikan aplikasi lajur tetap terbuka ya.`;
    default: return `Halo ${n}, jam kembali ${a.vehicle?.shortModel} sudah lewat ${durasi(now - a.booking.end)}. Mau perpanjang atau sedang menuju titik kembali?`;
  }
}

export function AlertCard({ a, world, now, store, compact }: { a: AlertView; world: World; now: number; store: Store; compact?: boolean }) {
  const router = useRouter();
  const dispatch = useApp((s) => s.dispatch);
  const Icon = ALERT_ICON[a.type];
  const meta = ALERT_TEXT[a.type];
  const pr = alertPriority(world, a.booking, a.customer, a.type);
  const pos = a.lat ? a : livePosition(a.booking, now);
  const handled = a.state.status === "acknowledged";
  const resolve = (note: string) => { dispatch({ type: "alert.state", alertId: a.id, state: { status: "resolved", at: now, note } }); haptic(12); };
  return (
    <div className={cn("rounded-[22px] border bg-surface p-4", meta.tone === "danger" ? "border-danger/25" : "border-warn/30")}>
      <div className="flex items-start gap-3">
        <div className={cn("relative grid size-10 shrink-0 place-items-center rounded-2xl", meta.tone === "danger" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn")}>
          {!handled && <span className={cn("absolute inset-0 animate-ping rounded-2xl opacity-30", meta.tone === "danger" ? "bg-danger" : "bg-warn")} />}
          <Icon className="relative size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className={cn("text-[15px] font-bold", meta.tone === "danger" ? "text-danger" : "text-warn")}>{meta.title(a)}</div>
            <span className="num shrink-0 text-[12px] text-muted">{lalu(a.at, now)}</span>
          </div>
          <div className="mt-0.5 truncate text-[13.5px] font-semibold">{a.vehicle?.shortModel} <span className="num">{a.vehicle?.plate}</span> · {a.customer?.name}</div>
          {!compact && (
            <div className="num mt-1 text-[12.5px] leading-relaxed text-muted">
              {a.type === "overdue"
                ? `Seharusnya kembali ${jam(a.booking.end)} · telat ${durasi(now - a.booking.end)}`
                : pos ? `${a.type === "signal_lost" ? "Terakhir" : "Posisi"} ${nearLabel(pos.lat!, pos.lng!)} · ±${pos.acc ?? 10} m · HP penyewa` : ""}
            </div>
          )}
          {(pr.reasons.length > 0 || handled) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {handled && <Chip tone="info">Sedang ditangani</Chip>}
              {pr.reasons.map((r) => <Chip key={r} tone="muted" dot={false}>{r}</Chip>)}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="wa" className="flex-1" onClick={() => {
          openWa(a.customer?.phone ?? "", alertWaText(a, store, now));
          dispatch({ type: "alert.state", alertId: a.id, state: { status: "acknowledged", at: now, note: "Dihubungi" } });
        }}><MessageCircle className="size-4" />Hubungi</Button>
        {(a.type === "exit_area" || a.type === "enter_zone") ? (
          <Button size="sm" variant="secondary" className="flex-1" onClick={() => {
            dispatch({ type: "booking.permit", id: a.bookingId, zoneIds: [a.zoneId!, ...world.zones.filter((z) => z.kind === "service" && z.storeId === store.id).map((z) => z.id)], at: now });
            resolve("Diizinkan");
          }}><ShieldCheck className="size-4" />Izinkan</Button>
        ) : (
          <Button size="sm" variant="secondary" className="flex-1" onClick={() => resolve("Ditangani")}><Check className="size-4" />Beres</Button>
        )}
        <Button size="sm" variant="secondary" aria-label="Lihat di peta" onClick={() => router.push(`/mitra/peta?b=${a.bookingId}`)}><MapIcon className="size-4" /></Button>
      </div>
    </div>
  );
}

export function BookingRow({ b, world, now, right, onClick }: { b: Booking; world: World; now: number; right?: React.ReactNode; onClick?: () => void }) {
  const c = world.customers.find((x) => x.id === b.customerId);
  const v = world.vehicles.find((x) => x.id === b.vehicleId);
  const media = useApp((s) => s.media);
  const inner = (
    <>
      <Avatar name={c?.name ?? "?"} src={c?.selfie ? media[c.selfie] : undefined} size={42} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold">{c?.name}</div>
        <div className="num truncate text-[12.5px] text-muted">{v?.shortModel} {v?.plate} · {hariRelatif(b.start, now)} {jam(b.start)}</div>
      </div>
      {right ?? <Chip tone={BOOKING_STATUS[b.status].tone}>{b.status === "active" ? (now > b.end ? "Terlambat" : countdown(b.end - now)) : BOOKING_STATUS[b.status].label}</Chip>}
    </>
  );
  return onClick
    ? <button onClick={onClick} className="press flex w-full items-center gap-3 px-4 py-3 text-left">{inner}</button>
    : <Link href={`/mitra/sewa/${b.id}`} className="press flex items-center gap-3 px-4 py-3">{inner}</Link>;
}

export function VehicleRow({ v, world, now, right }: { v: Vehicle; world: World; now: number; right?: React.ReactNode }) {
  const st = VEHICLE_STATUS[vehicleStatus(world, v, now)];
  return (
    <Link href={`/mitra/unit/${v.id}`} className="press flex items-center gap-3 px-4 py-3">
      <div className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-canvas"><MotorArt color={v.color} kind={v.kind} className="h-10 w-auto" /></div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold">{v.shortModel} <span className="num font-semibold text-muted">{v.plate}</span></div>
        <div className="num text-[12.5px] text-muted">{v.odometer.toLocaleString("id-ID")} km · {v.colorName}</div>
      </div>
      {right ?? <Chip tone={st.tone}>{st.label}</Chip>}
    </Link>
  );
}

export function approveWaText(b: Booking, c: Customer, v: Vehicle, s: Store) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `Halo ${firstName(c.name)}, sewa ${v.model} (${b.code}) sudah kami setujui.\n\nAmbil: ${tglJam(b.start)}\nLokasi: ${b.pickup.place.name}${b.pickup.mode === "meet" ? `\n${s.meetingPoint.directions}` : ""}\nBawa: ${s.rules.deposit.join(" + ")}\n\nTiket & QR: ${origin}/tiket/${b.id}`;
}

export function ApproveSheet({ b, open, onOpenChange }: { b: Booking; open: boolean; onOpenChange: (o: boolean) => void }) {
  const world = useApp((s) => s.world);
  const media = useApp((s) => s.media);
  const dispatch = useApp((s) => s.dispatch);
  const c = world.customers.find((x) => x.id === b.customerId)!;
  const v = world.vehicles.find((x) => x.id === b.vehicleId)!;
  const s = world.stores.find((x) => x.id === b.storeId)!;
  const [permit, setPermit] = useState(true);
  const [crew, setCrew] = useState<string | undefined>(s.crew[0]);
  const [rejecting, setRejecting] = useState(false);
  const now = Date.now() + world.clockOffset;
  const approve = () => {
    dispatch({ type: "booking.approve", id: b.id, at: now, permits: b.destination.outside && permit ? b.destination.permits : [], crew });
    haptic(20);
    onOpenChange(false);
    openWa(c.phone, approveWaText(b, c, v, s));
  };
  const reject = (reason: string) => {
    dispatch({ type: "booking.reject", id: b.id, reason, at: now });
    onOpenChange(false);
    openWa(c.phone, `Halo ${firstName(c.name)}, mohon maaf sewa ${v.model} (${b.code}) belum bisa kami terima: ${reason.toLowerCase()}.`);
  };
  return (
    <Sheet open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setRejecting(false); }} title={rejecting ? "Alasan menolak" : "Setujui sewa"}>
      {rejecting ? (
        <div className="space-y-2 pb-4">
          {["Unit tidak tersedia", "Dokumen belum lengkap", "Tujuan di luar area layanan", "DP belum masuk"].map((r) => (
            <button key={r} onClick={() => reject(r)} className="press flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3.5 text-left text-[14px] font-semibold">{r}<X className="size-4 text-faint" /></button>
          ))}
        </div>
      ) : (
        <div className="pb-4">
          <div className="flex items-center gap-3 rounded-2xl bg-canvas p-3">
            <Avatar name={c.name} src={c.selfie ? media[c.selfie] : undefined} size={46} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{c.name}</div>
              <div className="flex items-center gap-1 text-[12.5px] font-semibold text-ok"><BadgeCheck className="size-3.5" />KTP & SIM cocok · wajah {c.faceMatch ?? 97}%</div>
              <div className="text-[12px] text-muted">{c.rentals > 0 ? `${c.rentals}x sewa sebelumnya` : "Penyewa baru"}</div>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-line px-4 py-2 text-[13.5px]">
            <div className="flex justify-between py-1.5"><span className="text-muted">Unit</span><span className="font-semibold">{v.shortModel} <span className="num">{v.plate}</span></span></div>
            <div className="flex justify-between py-1.5"><span className="text-muted">Waktu</span><span className="num font-semibold">{tglJam(b.start)} · {b.price.tierLabel}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-muted">Ambil</span><span className="font-semibold">{b.pickup.mode === "deliver" ? `Antar ke ${b.pickup.place.name}` : b.pickup.place.name}</span></div>
            <div className="flex justify-between py-1.5"><span className="text-muted">{b.payment.mode === "dp" ? "DP" : "Lunas"}</span><span className="num font-semibold">{rupiah(b.payment.amount)} {b.payment.paidAt ? "· dibayar" : "· belum"}</span></div>
          </div>
          {b.payment.proof && media[b.payment.proof] && (
            <img src={media[b.payment.proof]} alt="Bukti bayar" className="mt-3 max-h-40 w-full rounded-2xl border border-line object-cover object-top" />
          )}
          {b.destination.outside && (
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-warn-soft px-4 py-3">
              <div className="flex-1">
                <div className="text-[13.5px] font-bold text-warn">Tujuan: {b.destination.label}</div>
                <div className="text-[12px] text-warn/80">Di luar area. Izinkan supaya tidak muncul peringatan.</div>
              </div>
              <Toggle checked={permit} onChange={setPermit} label="Izinkan tujuan" />
            </div>
          )}
          {s.crew.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-[12.5px] font-semibold text-muted">Crew serah terima</div>
              <div className="flex gap-2">
                {[...s.crew, "Saya sendiri"].map((n) => {
                  const val = n === "Saya sendiri" ? undefined : n;
                  return <button key={n} onClick={() => setCrew(val)} className={cn("press rounded-full border px-3.5 py-2 text-[13px] font-semibold", crew === val ? "border-brand bg-brand-soft text-brand" : "border-line")}>{n}</button>;
                })}
              </div>
            </div>
          )}
          <Button size="lg" block className="mt-4" onClick={approve}><Check className="size-5" />Setujui & kabari</Button>
          <Button variant="ghost" block className="mt-1 text-danger" onClick={() => setRejecting(true)}>Tolak</Button>
        </div>
      )}
    </Sheet>
  );
}
