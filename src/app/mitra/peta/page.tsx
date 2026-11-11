"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { ArrowLeft, Layers, MessageCircle, Navigation, Undo2, ChevronRight, Shapes } from "lucide-react";
import { LiveMap, type MapMarker } from "@/components/map/live-map";
import { Avatar, Chip } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { AlertCard } from "@/components/owner/parts";
import { BrandButton } from "@/components/brand/logo";
import { useApp } from "@/lib/store/store";
import { useMe, useNow, useWorld } from "@/lib/hooks";
import { computeAlerts, livePosition } from "@/lib/live";
import { nearLabel } from "@/lib/domain/geo";
import { countdown, firstName, jam, lalu } from "@/lib/format";
import { openWa } from "@/lib/wa";
import type { LngLat } from "@/lib/domain/types";
import { cn } from "@/lib/cn";

function PetaInner() {
  const router = useRouter();
  const params = useSearchParams();
  const world = useWorld();
  const now = useNow();
  const { store } = useMe();
  const media = useApp((s) => s.media);
  const [sel, setSel] = useState<string | null>(params.get("b"));
  const [showZones, setShowZones] = useState(true);
  const [expanded, setExpanded] = useState(!!params.get("b"));

  const active = useMemo(() => (store ? world.bookings.filter((b) => b.storeId === store.id && b.status === "active") : []), [world.bookings, store]);
  if (!store) return null;
  const alerts = computeAlerts(world, now, { storeId: store.id });
  const alertBy = new Map<string, typeof alerts>();
  alerts.forEach((a) => alertBy.set(a.bookingId, [...(alertBy.get(a.bookingId) ?? []), a]));
  const zones = world.zones.filter((z) => z.active && (z.storeId === store.id || z.scope === "platform"));
  const rows = active.map((b) => ({ b, pos: livePosition(b, now), c: world.customers.find((x) => x.id === b.customerId)!, v: world.vehicles.find((x) => x.id === b.vehicleId)! }))
    .sort((a, b) => (alertBy.get(b.b.id)?.length ?? 0) - (alertBy.get(a.b.id)?.length ?? 0) || a.b.end - b.b.end);
  const selected = rows.find((r) => r.b.id === sel);

  const markers: MapMarker[] = [
    { id: "store", kind: "store", lat: store.meetingPoint.lat, lng: store.meetingPoint.lng, label: store.shortName },
    ...rows.filter((r) => r.pos).map((r) => {
      const al = alertBy.get(r.b.id);
      const stale = !!r.pos && now - r.pos.t > 120_000;
      return {
        id: r.b.id, kind: "rental" as const, lat: r.pos!.lat, lng: r.pos!.lng, label: firstName(r.c.name),
        tone: al?.some((a) => a.type !== "overdue") ? "danger" as const : now > r.b.end || r.b.end - now < 3_600_000 ? "warn" as const : "brand" as const,
        pulse: !!al?.length, selected: r.b.id === sel, stale,
      };
    }),
  ];
  const fitPoints: LngLat[] = selected?.pos ? [[selected.pos.lng, selected.pos.lat]] : [[store.meetingPoint.lng, store.meetingPoint.lat], ...rows.filter((r) => r.pos).map((r) => [r.pos!.lng, r.pos!.lat] as LngLat)];
  const fitKey = selected ? `sel-${selected.b.id}` : `all-${rows.length}`;
  const trail = selected ? selected.b.positions.map((p) => [p.lng, p.lat] as LngLat) : [];

  const onPan = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -30 || info.velocity.y < -300) setExpanded(true);
    if (info.offset.y > 30 || info.velocity.y > 300) setExpanded(false);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <LiveMap center={[store.meetingPoint.lng, store.meetingPoint.lat]} zoom={12} zones={showZones ? zones : []} markers={markers}
        trails={trail.length ? [{ id: "t", coords: trail, tone: alertBy.get(sel ?? "")?.length ? "danger" : "brand" }] : []}
        onMarkerClick={(id) => { if (id !== "store") { setSel(id); setExpanded(true); } }}
        fit={{ key: fitKey, points: fitPoints, maxZoom: selected ? 14 : 13 }}
        padding={{ top: 120, bottom: expanded ? 460 : 330, left: 50, right: 50 }} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="rounded-full bg-white/95 px-3.5 py-2 shadow-[0_4px_16px_rgba(20,23,43,0.12)] lg:hidden"><BrandButton size={24} /></div>
          <div className="hide-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
            <span className="shrink-0 rounded-full bg-white/95 px-3 py-2 text-[12.5px] font-bold shadow-[0_4px_16px_rgba(20,23,43,0.12)]"><span className="num">{rows.length}</span> disewa</span>
            {alerts.length > 0 && <span className="shrink-0 rounded-full bg-danger px-3 py-2 text-[12.5px] font-bold text-white shadow-[0_4px_16px_rgba(192,54,44,0.3)]"><span className="num">{alerts.length}</span> perhatian</span>}
          </div>
          <button onClick={() => setShowZones(!showZones)} aria-label="Lapisan zona" className={cn("press grid size-10 shrink-0 place-items-center rounded-full shadow-[0_4px_16px_rgba(20,23,43,0.12)]", showZones ? "bg-brand text-white" : "bg-white text-ink")}>
            <Layers className="size-[18px]" />
          </button>
          <Link href="/mitra/zona" aria-label="Kelola zona" className="press grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_4px_16px_rgba(20,23,43,0.12)]"><Shapes className="size-[18px]" /></Link>
        </div>
      </div>

      <motion.div
        className="absolute inset-x-0 z-20 mx-auto flex max-w-[560px] flex-col rounded-t-[28px] bg-surface shadow-[0_-10px_40px_rgba(20,23,43,0.14)] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:top-20 lg:w-[400px] lg:rounded-[28px]"
        style={{ bottom: 0 }}
        initial={false}
        animate={{ height: expanded ? "62dvh" : "clamp(210px, 32dvh, 260px)" }}
        transition={{ type: "spring", duration: 0.45, bounce: 0.12 }}
      >
        <motion.div onPan={onPan} onTap={() => setExpanded(!expanded)} className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-2 lg:hidden">
          <div className="h-1.5 w-10 rounded-full bg-line-strong" />
        </motion.div>
        <div className="hide-scrollbar flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+100px)] lg:pb-4 lg:pt-4">
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.div key="detail" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSel(null)} aria-label="Kembali" className="press grid size-9 place-items-center rounded-full hover:bg-canvas"><ArrowLeft className="size-5" /></button>
                  <Avatar name={selected.c.name} src={selected.c.selfie ? media[selected.c.selfie] : undefined} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold">{selected.c.name}</div>
                    <div className="num truncate text-[12.5px] text-muted">{selected.v.shortModel} {selected.v.plate}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("num text-[17px] font-extrabold", now > selected.b.end && "text-danger")}>{countdown(Math.abs(selected.b.end - now))}</div>
                    <div className="text-[11px] font-semibold text-muted">{now > selected.b.end ? "terlambat" : `kembali ${jam(selected.b.end)}`}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-3 text-[12.5px]">
                  <div><div className="font-semibold text-muted">Terakhir terlihat</div><div className="font-bold">{selected.pos ? lalu(selected.pos.t, now) : "—"}</div></div>
                  <div><div className="font-semibold text-muted">Akurasi</div><div className="num font-bold">{selected.pos ? `±${selected.pos.acc} m` : "—"}</div></div>
                  <div className="col-span-2"><div className="font-semibold text-muted">Posisi</div><div className="font-bold">{selected.pos ? nearLabel(selected.pos.lat, selected.pos.lng) : "Menunggu HP penyewa"}</div></div>
                  <div className="col-span-2 flex items-center gap-1.5 text-muted"><Navigation className="size-3.5" />Sumber lokasi: HP penyewa · tujuan {selected.b.destination.label.toLowerCase()}{selected.b.permits.length ? " (diizinkan)" : ""}</div>
                </div>
                <div className="mt-3 space-y-2">
                  {(alertBy.get(selected.b.id) ?? []).map((a) => <AlertCard key={a.id} a={a} world={world} now={now} store={store} compact />)}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button variant="wa" size="sm" onClick={() => openWa(selected.c.phone, `Halo ${firstName(selected.c.name)}, ini ${store.shortName}.`)}><MessageCircle className="size-4" />Chat</Button>
                  <Button variant="secondary" size="sm" onClick={() => router.push(`/mitra/sewa/${selected.b.id}`)}>Detail</Button>
                  <Button size="sm" onClick={() => router.push(`/mitra/pengembalian/${selected.b.id}`)}><Undo2 className="size-4" />Kembali</Button>
                </div>
                {selected.b.timeline.length > 0 && (
                  <div className="mt-3 rounded-2xl border border-line px-3.5 py-2">
                    {[...selected.b.timeline].reverse().slice(0, 5).map((t, i) => (
                      <div key={i} className="flex gap-2.5 py-1 text-[12.5px]">
                        <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", t.tone === "danger" ? "bg-danger" : t.tone === "warn" ? "bg-warn" : t.tone === "ok" ? "bg-ok" : "bg-brand-300")} />
                        <span className="flex-1">{t.text}</span><span className="num text-muted">{jam(t.t)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }}>
                <div className="mb-1 flex items-baseline justify-between px-1">
                  <div className="text-[16px] font-bold">Sedang disewa</div>
                  <div className="text-[12px] text-muted">{showZones ? `${zones.length} zona aktif` : "Zona disembunyikan"}</div>
                </div>
                <div className="divide-y divide-line">
                  {rows.map((r) => {
                    const al = alertBy.get(r.b.id);
                    return (
                      <button key={r.b.id} onClick={() => { setSel(r.b.id); setExpanded(true); }} className="press flex w-full items-center gap-3 py-3 text-left">
                        <Avatar name={r.c.name} src={r.c.selfie ? media[r.c.selfie] : undefined} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold">{r.c.name}</div>
                          <div className="num truncate text-[12px] text-muted">{r.v.shortModel} {r.v.plate} · {r.pos ? nearLabel(r.pos.lat, r.pos.lng) : "menunggu lokasi"}</div>
                        </div>
                        {al?.length ? <Chip tone="danger">{al.length > 1 ? `${al.length} peringatan` : "Perhatian"}</Chip>
                          : <span className={cn("num text-[13px] font-bold", now > r.b.end ? "text-danger" : r.b.end - now < 3_600_000 ? "text-warn" : "text-ink")}>{countdown(Math.abs(r.b.end - now))}</span>}
                        <ChevronRight className="size-4 text-faint" />
                      </button>
                    );
                  })}
                  {rows.length === 0 && <div className="py-8 text-center text-[13.5px] text-muted">Belum ada motor yang disewa.</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function Peta() {
  return <Suspense><PetaInner /></Suspense>;
}
