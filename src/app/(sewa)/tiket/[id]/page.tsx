"use client";
import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Check, MapPin, MessageCircle, PersonStanding, Radio, Timer, Clock, Bike } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/page-header";
import { TicketCard } from "@/components/renter/ticket";
import { LiveMap } from "@/components/map/live-map";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Section, inputCls, Row } from "@/components/ui/bits";
import { useApp } from "@/lib/store/store";
import { useNow, useWorld, haptic } from "@/lib/hooks";
import { priceFor } from "@/lib/domain/pricing";
import { lateFee } from "@/lib/domain/pricing";
import { computeAlerts } from "@/lib/live";
import { countdown, durasi, firstName, hariRelatif, jam, lalu, rb, rupiah, tglJam } from "@/lib/format";
import { openWa } from "@/lib/wa";
import { cn } from "@/lib/cn";

function TiketInner() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const world = useWorld();
  const now = useNow();
  const dispatch = useApp((s) => s.dispatch);
  const [arrive, setArrive] = useState(false);
  const [extend, setExtend] = useState(false);
  const [note, setNote] = useState("");
  const b = world.bookings.find((x) => x.id === id);
  if (!b) return null;
  const store = world.stores.find((s) => s.id === b.storeId)!;
  const v = world.vehicles.find((x) => x.id === b.vehicleId)!;
  const c = world.customers.find((x) => x.id === b.customerId)!;
  const fresh = params.get("baru") === "1" && b.status === "pending";
  const waText = `Halo ${store.shortName}, saya ${c.name} mengajukan sewa ${v.model} (${b.code}).\nAmbil: ${tglJam(b.start)} di ${b.pickup.place.name}\nKembali: ${tglJam(b.end)}\nTujuan: ${b.destination.label}\nBayar: ${b.payment.mode === "dp" ? "DP" : "Lunas"} ${rupiah(b.payment.amount)}\nCek & setujui: ${typeof window !== "undefined" ? window.location.origin : ""}/mitra/sewa/${b.id}`;
  const alerts = computeAlerts(world, now, { customerId: c.id }).filter((a) => a.bookingId === b.id && (a.type === "exit_area" || a.type === "enter_zone"));
  const last = b.positions[b.positions.length - 1];
  const svc = world.zones.filter((z) => z.storeId === store.id && z.active);
  const returning = b.status === "active" && b.end - now < 2 * 3_600_000;

  const doArrive = () => {
    const fallback = b.status === "active" ? b.dropoff.place : b.pickup.place;
    const send = (lat: number, lng: number) => {
      dispatch({ type: "booking.arrive", id: b.id, at: now, note: note.trim(), lat, lng });
      haptic(20);
      setArrive(false);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => send(p.coords.latitude, p.coords.longitude), () => send(fallback.lat, fallback.lng), { timeout: 4000, enableHighAccuracy: true });
    } else send(fallback.lat, fallback.lng);
  };

  return (
    <div className="pb-14">
      <PageHeader title={v.model} sub={b.code} back="/tiket" />
      <div className="px-4">
        {fresh && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="mb-4 flex flex-col items-center rounded-[24px] bg-surface px-5 py-6 text-center border border-line">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", bounce: 0.5 }} className="grid size-14 place-items-center rounded-full bg-ok text-white">
              <Check className="size-7" strokeWidth={3} />
            </motion.div>
            <div className="mt-3 text-[18px] font-extrabold tracking-tight">Permintaan terkirim</div>
            <div className="mt-1 text-[13px] text-muted">{store.shortName} biasanya membalas dalam beberapa menit.</div>
            <Button variant="wa" size="lg" block className="mt-4" onClick={() => openWa(store.ownerPhone, waText)}>
              <MessageCircle className="size-5" />Kirim ke WhatsApp rental
            </Button>
          </motion.div>
        )}

        {b.status === "active" && (
          <ActivePanel b={b} now={now} store={store} />
        )}

        {alerts.length > 0 && (
          <div className="mb-3 rounded-2xl bg-warn-soft px-4 py-3 text-[13px] font-semibold text-warn">
            Motor terdeteksi di luar area sewa. Hubungi {store.shortName} kalau butuh izin.
          </div>
        )}

        <TicketCard booking={b} />

        {b.status === "pending" && !fresh && (
          <div className="card mt-3 flex items-center gap-3 p-4">
            <span className="relative flex size-3"><span className="absolute inset-0 animate-ping rounded-full bg-warn opacity-60" /><span className="relative size-3 rounded-full bg-warn" /></span>
            <div className="flex-1 text-[13.5px] font-semibold">Menunggu {store.shortName} menyetujui</div>
            <button className="press text-[13px] font-bold text-wa" onClick={() => openWa(store.ownerPhone, waText)}>WhatsApp</button>
          </div>
        )}

        {(b.status === "approved" || returning) && (
          <Section title={b.status === "approved" ? `Ambil ${hariRelatif(b.start, now).toLowerCase()} ${jam(b.start)}` : `Kembalikan jam ${jam(b.end)}`}>
            <div className="card overflow-hidden">
              <div className="h-36">
                <LiveMap interactive={false} center={[(b.status === "approved" ? b.pickup : b.dropoff).place.lng, (b.status === "approved" ? b.pickup : b.dropoff).place.lat]} zoom={15.3}
                  markers={[{ id: "mp", kind: "meet", lat: (b.status === "approved" ? b.pickup : b.dropoff).place.lat, lng: (b.status === "approved" ? b.pickup : b.dropoff).place.lng, label: (b.status === "approved" ? b.pickup : b.dropoff).place.name }]} />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-[14px] font-bold"><MapPin className="size-4 text-brand" />{(b.status === "approved" ? b.pickup : b.dropoff).place.name}</div>
                {b.pickup.mode === "meet" && <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{store.meetingPoint.directions}</p>}
                {b.arrival ? (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-3 rounded-2xl bg-brand-soft px-3.5 py-3">
                    <span className="relative flex size-2.5"><span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-60" /><span className="relative size-2.5 rounded-full bg-brand" /></span>
                    <div className="flex-1 text-[13px]">
                      <div className="font-bold text-brand">{b.crew ? `Crew ${b.crew} menuju kamu` : `${store.shortName} sudah diberi tahu`}</div>
                      <div className="text-brand/70">Kamu tiba {lalu(b.arrival.at, now)}{b.arrival.note ? ` · ${b.arrival.note}` : ""}</div>
                    </div>
                  </motion.div>
                ) : (
                  <Button size="lg" block className="mt-3" onClick={() => setArrive(true)}><PersonStanding className="size-5" />Saya sudah sampai</Button>
                )}
              </div>
            </div>
          </Section>
        )}

        {b.status === "active" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" size="lg" onClick={() => setExtend(true)} disabled={b.extension?.status === "pending"}>
              <Timer className="size-5" />{b.extension?.status === "pending" ? "Menunggu" : "Perpanjang"}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => openWa(store.ownerPhone, `Halo ${store.shortName}, saya ${c.name} (${b.code}).`)}>
              <MessageCircle className="size-5 text-wa" />Chat rental
            </Button>
          </div>
        )}

        {b.status === "completed" && b.returned && (
          <Section title="Ringkasan">
            <div className="card px-4 py-2.5">
              <Row label="Durasi" value={durasi(b.returned.at - (b.handover?.at ?? b.start))} />
              <Row label="Jarak tempuh" value={`${(b.returned.km - (b.handover?.km ?? b.returned.km)).toLocaleString("id-ID")} km`} />
              <Row label={`Sewa ${b.price.tierLabel}`} value={rupiah(b.price.total)} />
              {b.returned.lateFee > 0 && <Row label={`Telat ${b.returned.lateMinutes} mnt`} value={rupiah(b.returned.lateFee)} />}
              {b.returned.damageFee > 0 && <Row label="Kerusakan" value={rupiah(b.returned.damageFee)} />}
              <div className="my-1 border-t border-dashed border-line" />
              <Row label="Total" value={rupiah(b.price.total + b.returned.lateFee + b.returned.damageFee + b.returned.fuelFee)} strong />
            </div>
            <Button size="lg" block className="mt-3" onClick={() => router.push(`/motor/${v.id}`)}><Bike className="size-5" />Sewa lagi</Button>
          </Section>
        )}

        {(b.status === "rejected" || b.status === "cancelled") && (
          <div className="card mt-3 p-4 text-[13.5px]">
            <div className="font-bold">{b.status === "rejected" ? "Sewa ditolak" : "Sewa dibatalkan"}</div>
            {b.rejectReason && <div className="mt-1 text-muted">{b.rejectReason}</div>}
            <Button variant="soft" block className="mt-3" onClick={() => router.push("/cari")}>Cari motor lain</Button>
          </div>
        )}

        {b.timeline.length > 0 && (
          <Section title="Riwayat">
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

        {b.status === "pending" && (
          <Button variant="ghost" block className="mt-4 text-danger" onClick={() => dispatch({ type: "booking.cancel", id: b.id, at: now })}>Batalkan permintaan</Button>
        )}
        {last && b.status === "active" && <div className="mt-4 text-center text-[11.5px] text-faint">Lokasi terakhir dikirim {lalu(last.t, now)}</div>}
        {svc.length === 0 && null}
      </div>

      <Sheet open={arrive} onOpenChange={setArrive} title="Kabari crew">
        <div className="pb-4">
          <p className="text-[13px] text-muted">Lokasimu dikirim ke {store.shortName}. Tambah ciri supaya mudah ditemukan.</p>
          <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="Baju merah, depan pintu KFC" className={cn(inputCls, "mt-3")} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Baju merah", "Depan pintu", "Bawa koper"].map((s) => (
              <button key={s} onClick={() => setNote((n) => (n ? `${n}, ${s.toLowerCase()}` : s))} className="press rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold">{s}</button>
            ))}
          </div>
          <Button size="lg" block className="mt-4" onClick={doArrive}>Kirim</Button>
        </div>
      </Sheet>

      <Sheet open={extend} onOpenChange={setExtend} title="Perpanjang sewa">
        <div className="space-y-2 pb-4">
          {[12, 24].map((h) => {
            const add = priceFor(v.tiers, h).price;
            return (
              <button key={h} onClick={() => { dispatch({ type: "booking.extendRequest", id: b.id, hours: h, price: add, at: now }); setExtend(false); haptic(15); }}
                className="press flex w-full items-center justify-between rounded-2xl border border-line px-4 py-4 text-left">
                <div>
                  <div className="text-[15px] font-bold">+{h} jam</div>
                  <div className="num text-[12.5px] text-muted">Kembali {tglJam(b.end + h * 3_600_000)}</div>
                </div>
                <div className="num text-[16px] font-extrabold">{rb(add)}</div>
              </button>
            );
          })}
          <p className="px-1 pt-1 text-[12px] text-muted">Telat tanpa perpanjang kena {rb(store.rules.lateFeePerHour)}/jam ({rb(lateFee(store, 60))} per jam pertama setelah toleransi).</p>
        </div>
      </Sheet>
    </div>
  );
}

function ActivePanel({ b, now, store }: { b: import("@/lib/domain/types").Booking; now: number; store: import("@/lib/domain/types").Store }) {
  const world = useWorld();
  const left = b.end - now;
  const last = b.positions[b.positions.length - 1];
  const zones = world.zones.filter((z) => z.active && (z.storeId === store.id || z.scope === "platform"));
  const over = left < 0;
  return (
    <div className="mb-3 overflow-hidden rounded-[24px] bg-brand text-white">
      <div className="dots px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-3 text-[12.5px] text-white/75">
          <span className="flex items-center gap-1.5"><Clock className="size-3.5" />{over ? "Lewat jam kembali" : "Sisa waktu"}</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 font-semibold text-white">
            <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-[#7ee2a8] opacity-70" /><span className="relative size-2 rounded-full bg-[#7ee2a8]" /></span>
            <Radio className="size-3.5" />Lokasi ke {store.shortName}
          </span>
        </div>
        <div className={cn("num mt-1 text-[44px] font-extrabold leading-none tracking-[-0.03em]", over && "text-[#ffb4a8]")}>{over ? "+" : ""}{countdown(Math.abs(left))}</div>
        <div className="mt-1 text-[12.5px] text-white/70">Kembali {tglJam(b.end)} · {b.dropoff.place.name}</div>
      </div>
      <div className="h-44 bg-[#eef0f6]">
        <LiveMap interactive center={last ? [last.lng, last.lat] : [b.pickup.place.lng, b.pickup.place.lat]} zoom={12.6} zones={zones}
          markers={last ? [{ id: "me", kind: "me", lat: last.lat, lng: last.lng }] : []}
          fit={last ? { key: `${Math.round(last.lat * 300)}:${Math.round(last.lng * 300)}`, points: [[last.lng, last.lat]], maxZoom: 13 } : null} />
      </div>
    </div>
  );
}

export default function Tiket() {
  return <Suspense><TiketInner /></Suspense>;
}
