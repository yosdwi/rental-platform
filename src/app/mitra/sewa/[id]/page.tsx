"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, AtSign, MapPin, MessageCircle, Navigation, Phone, ScanLine, Timer, Undo2, Map as MapIcon, Check, X } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Avatar, Chip, Row, Section } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { MotorArt } from "@/components/moto/motor-art";
import { LiveMap } from "@/components/map/live-map";
import { AlertCard, ApproveSheet } from "@/components/owner/parts";
import { useApp } from "@/lib/store/store";
import { useNow, useWorld } from "@/lib/hooks";
import { BOOKING_STATUS } from "@/lib/domain/status";
import { computeAlerts, livePosition } from "@/lib/live";
import { nearLabel } from "@/lib/domain/geo";
import { countdown, durasi, jam, lalu, rupiah, tglJam } from "@/lib/format";
import { displayPhone, openWa } from "@/lib/wa";
import { cn } from "@/lib/cn";

export default function OwnerBooking() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const world = useWorld();
  const now = useNow();
  const media = useApp((s) => s.media);
  const dispatch = useApp((s) => s.dispatch);
  const [approve, setApprove] = useState(false);
  const b = world.bookings.find((x) => x.id === id);
  if (!b) return null;
  const c = world.customers.find((x) => x.id === b.customerId)!;
  const v = world.vehicles.find((x) => x.id === b.vehicleId)!;
  const s = world.stores.find((x) => x.id === b.storeId)!;
  const st = BOOKING_STATUS[b.status];
  const pos = livePosition(b, now);
  const alerts = computeAlerts(world, now, { storeId: s.id }).filter((a) => a.bookingId === b.id);
  const zones = world.zones.filter((z) => z.active && (z.storeId === s.id || z.scope === "platform"));
  const trail = b.positions.map((p) => [p.lng, p.lat] as [number, number]);

  return (
    <div className="pb-16">
      <PageHeader title={c.name} sub={b.code} back="/mitra/sewa" right={<Chip tone={st.tone}>{b.status === "active" && now > b.end ? "Terlambat" : st.label}</Chip>} />
      <div className="space-y-3 px-4">
        {alerts.map((a) => <AlertCard key={a.id} a={a} world={world} now={now} store={s} />)}

        {b.status === "active" && (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
              <div className="p-4">
                <div className="text-[12px] font-semibold text-muted">{now > b.end ? "Terlambat" : "Sisa waktu"}</div>
                <div className={cn("num text-[24px] font-extrabold tracking-tight", now > b.end && "text-danger")}>{countdown(Math.abs(b.end - now))}</div>
              </div>
              <div className="p-4">
                <div className="text-[12px] font-semibold text-muted">Terakhir terlihat</div>
                <div className="text-[15px] font-bold">{pos ? lalu(pos.t, now) : "Belum ada"}</div>
                <div className="truncate text-[12px] text-muted">{pos ? `${nearLabel(pos.lat, pos.lng)} · ±${pos.acc} m` : "Menunggu HP penyewa"}</div>
              </div>
            </div>
            <div className="h-48">
              <LiveMap center={pos ? [pos.lng, pos.lat] : [s.meetingPoint.lng, s.meetingPoint.lat]} zoom={12.5} zones={zones}
                trails={[{ id: b.id, coords: trail }]}
                markers={pos ? [{ id: b.id, kind: "rental", lat: pos.lat, lng: pos.lng, tone: alerts.length ? "danger" : "brand", pulse: alerts.length > 0 }] : []}
                fit={pos ? { key: `${b.id}-${Math.round(pos.lat * 200)}-${Math.round(pos.lng * 200)}`, points: [[pos.lng, pos.lat]], maxZoom: 13 } : null} />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 text-[12px] text-muted">
              <Navigation className="size-3.5" />Sumber lokasi: HP penyewa
            </div>
          </div>
        )}

        {b.extension?.status === "pending" && (
          <div className="card flex items-center gap-3 p-4">
            <Timer className="size-5 text-info" />
            <div className="flex-1">
              <div className="text-[14px] font-bold">Minta perpanjang {b.extension.hours} jam</div>
              <div className="num text-[12.5px] text-muted">+{rupiah(b.extension.price)} · kembali {tglJam(b.end + b.extension.hours * 3_600_000)}</div>
            </div>
            <Button size="icon" variant="secondary" aria-label="Tolak" onClick={() => dispatch({ type: "booking.extendDecide", id: b.id, approve: false, at: now })}><X className="size-4" /></Button>
            <Button size="icon" aria-label="Setujui" onClick={() => dispatch({ type: "booking.extendDecide", id: b.id, approve: true, at: now })}><Check className="size-4" /></Button>
          </div>
        )}

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Avatar name={c.name} src={c.selfie ? media[c.selfie] : undefined} size={48} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{c.name}</div>
              <div className="num text-[12.5px] text-muted">{displayPhone(c.phone)} · {c.rentals > 0 ? `${c.rentals}x sewa` : "Penyewa baru"}</div>
            </div>
            <Button size="icon" variant="secondary" aria-label="Telepon" onClick={() => window.open(`tel:${c.phone}`)}><Phone className="size-4" /></Button>
            <Button size="icon" variant="wa" aria-label="WhatsApp" onClick={() => openWa(c.phone, `Halo ${c.name.split(" ")[0]}, ini ${s.shortName} soal sewa ${b.code}.`)}><MessageCircle className="size-4" /></Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.verified ? <Chip tone="ok" dot={false}><BadgeCheck className="size-3" />KTP & SIM cocok</Chip> : <Chip tone="warn">Belum verifikasi</Chip>}
            {c.faceMatch && <Chip tone="muted" dot={false}>Wajah {c.faceMatch}%</Chip>}
            {c.instagram && <Chip tone="muted" dot={false}><AtSign className="size-3" />{c.instagram}</Chip>}
            {b.source === "whatsapp" && <Chip tone="muted" dot={false}>Dari chat WA</Chip>}
          </div>
        </div>

        <div className="card flex items-center gap-3 p-3">
          <div className="grid h-14 w-20 place-items-center rounded-xl bg-canvas"><MotorArt color={v.color} kind={v.kind} className="h-12 w-auto" /></div>
          <div className="flex-1">
            <div className="text-[15px] font-bold">{v.model}</div>
            <div className="num text-[12.5px] text-muted">{v.plate} · {v.odometer.toLocaleString("id-ID")} km</div>
          </div>
        </div>

        <div className="card px-4 py-2.5">
          <Row label="Ambil" value={tglJam(b.start)} />
          <Row label="Kembali" value={tglJam(b.end)} />
          <Row label="Paket" value={b.price.tierLabel} />
          <Row label={b.pickup.mode === "deliver" ? "Diantar ke" : "Titik temu"} value={b.pickup.place.name} />
          <Row label="Tujuan" value={<span className={cn(b.destination.outside && "text-warn")}>{b.destination.label}{b.destination.outside ? (b.permits.length ? " · diizinkan" : " · di luar area") : ""}</span>} />
          {b.crew && <Row label="Crew" value={b.crew} />}
          <div className="my-1 border-t border-dashed border-line" />
          <Row label="Total" value={rupiah(b.price.total)} strong />
          <Row label={b.payment.mode === "dp" ? "DP" : "Dibayar"} value={`${rupiah(b.payment.amount)}${b.payment.paidAt ? "" : " · belum"}`} />
          {b.returned && <Row label="Denda & biaya" value={rupiah(b.returned.lateFee + b.returned.damageFee + b.returned.fuelFee)} />}
        </div>
        {b.payment.proof && media[b.payment.proof] && <img src={media[b.payment.proof]} alt="Bukti bayar" className="max-h-56 w-full rounded-[22px] border border-line object-cover object-top" />}

        {b.timeline.length > 0 && (
          <Section title="Riwayat" className="mt-4">
            <div className="card px-4 py-3">
              {[...b.timeline].reverse().map((t, i) => (
                <div key={i} className="flex gap-3 py-1.5">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", t.tone === "danger" ? "bg-danger" : t.tone === "warn" ? "bg-warn" : t.tone === "ok" ? "bg-ok" : "bg-brand-300")} />
                  <div className="flex-1 text-[13px]">{t.text}</div>
                  <span className="num text-[12px] text-muted">{jam(t.t)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <div className="pt-2">
          {b.status === "pending" && <Button size="lg" block onClick={() => setApprove(true)}>Tinjau & setujui</Button>}
          {b.status === "approved" && (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Button size="lg" onClick={() => router.push(`/mitra/serah-terima/${b.id}`)}><ScanLine className="size-5" />Serah terima</Button>
              <Button size="lg" variant="secondary" aria-label="Arah" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.pickup.place.lat},${b.pickup.place.lng}`)}><MapPin className="size-5" /></Button>
            </div>
          )}
          {b.status === "active" && (
            <div className="grid grid-cols-2 gap-2">
              <Button size="lg" variant="secondary" onClick={() => router.push(`/mitra/peta?b=${b.id}`)}><MapIcon className="size-5" />Peta</Button>
              <Button size="lg" onClick={() => router.push(`/mitra/pengembalian/${b.id}`)}><Undo2 className="size-5" />Pengembalian</Button>
            </div>
          )}
          {b.status === "completed" && b.returned && (
            <div className="text-center text-[12.5px] text-muted">Selesai {tglJam(b.returned.at)} · {durasi(b.returned.at - (b.handover?.at ?? b.start))}</div>
          )}
        </div>
      </div>
      <ApproveSheet b={b} open={approve} onOpenChange={setApprove} />
    </div>
  );
}
