"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Plus, Search, ShieldAlert, Eye, Building2, MapPinned } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Chip, Segmented, Section, Toggle, inputCls } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { LiveMap } from "@/components/map/live-map";
import { useApp, uid } from "@/lib/store/store";
import { useMe, useWorld, haptic } from "@/lib/hooks";
import { PLACES, ZONE_PRESETS } from "@/lib/domain/fixtures";
import { circleRing, ringCenter } from "@/lib/domain/geo";
import type { LngLat, Zone, ZoneKind } from "@/lib/domain/types";
import { cn } from "@/lib/cn";

const KIND: Record<ZoneKind, { label: string; tone: "brand" | "danger" | "warn" }> = {
  service: { label: "Area layanan", tone: "brand" },
  restricted: { label: "Larang", tone: "danger" },
  monitor: { label: "Pantau", tone: "warn" },
};

export default function Zona() {
  const world = useWorld();
  const { store } = useMe();
  const dispatch = useApp((s) => s.dispatch);
  const [add, setAdd] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  if (!store) return null;
  const mine = world.zones.filter((z) => z.storeId === store.id);
  const platform = world.zones.filter((z) => z.scope === "platform");
  const shown = [...mine, ...platform];
  const fz = shown.find((z) => z.id === focus);
  const pts: LngLat[] = fz ? fz.polygon : mine.flatMap((z) => z.polygon);

  const Row = ({ z, readonly }: { z: Zone; readonly?: boolean }) => (
    <div className="flex items-center gap-3 px-4 py-3">
      <button onClick={() => setFocus(z.id)} className="press flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", z.kind === "service" ? "bg-brand-soft text-brand" : z.kind === "restricted" ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn")}>
          {z.kind === "service" ? <MapPinned className="size-5" /> : z.kind === "restricted" ? <ShieldAlert className="size-5" /> : <Eye className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold">{z.name}</div>
          <div className="truncate text-[12.5px] text-muted">{z.note}</div>
        </div>
      </button>
      {readonly ? <Chip tone="muted" dot={false}>lajur</Chip> : <Toggle checked={z.active} onChange={(a) => dispatch({ type: "zone.upsert", zone: { ...z, active: a } })} label={`Aktifkan ${z.name}`} />}
    </div>
  );

  return (
    <div className="pb-12">
      <PageHeader title="Area & zona" sub="Peringatan otomatis saat motor keluar atau masuk" back="/mitra/pengaturan"
        right={<Button size="sm" onClick={() => setAdd(true)}><Plus className="size-4" />Zona</Button>} />
      <div className="px-4">
        <div className="card h-64 overflow-hidden">
          <LiveMap center={[store.meetingPoint.lng, store.meetingPoint.lat]} zoom={10.5} zones={shown.filter((z) => z.active || z.id === focus)}
            markers={[{ id: "s", kind: "store", lat: store.meetingPoint.lat, lng: store.meetingPoint.lng }]}
            fit={{ key: focus ?? "mine", points: pts, maxZoom: 13 }} padding={{ top: 30, bottom: 30, left: 30, right: 30 }} />
        </div>
        <Section title="Zona toko">
          <div className="card divide-y divide-line overflow-hidden">{mine.map((z) => <Row key={z.id} z={z} />)}</div>
        </Section>
        <Section title="Dari lajur">
          <div className="card divide-y divide-line overflow-hidden">{platform.map((z) => <Row key={z.id} z={z} readonly />)}</div>
          <p className="mt-2 px-1 text-[12px] text-muted">Dikelola lajur untuk semua mitra, misalnya pelabuhan penyeberangan.</p>
        </Section>
      </div>
      <AddZone open={add} onOpenChange={setAdd} storeId={store.id} onSaved={(id) => setFocus(id)} />
    </div>
  );
}

function AddZone({ open, onOpenChange, storeId, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; storeId: string; onSaved: (id: string) => void }) {
  const dispatch = useApp((s) => s.dispatch);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<{ id: string; name: string; area: string; center: LngLat; polygon?: LngLat[] } | null>(null);
  const [shape, setShape] = useState<"batas" | "radius">("batas");
  const [radius, setRadius] = useState(3);
  const [kind, setKind] = useState<ZoneKind>("restricted");
  const options = useMemo(() => {
    const t = q.trim().toLowerCase();
    const presets = ZONE_PRESETS.map((p) => ({ id: p.id, name: p.name, area: p.area, center: p.center as LngLat, polygon: p.polygon }));
    const places = PLACES.map((p) => ({ id: p.id, name: p.name, area: p.area, center: [p.lng, p.lat] as LngLat, polygon: undefined }));
    return [...presets, ...places].filter((o) => !t || `${o.name} ${o.area}`.toLowerCase().includes(t)).slice(0, 8);
  }, [q]);
  const polygon: LngLat[] | null = pick ? (shape === "batas" && pick.polygon ? pick.polygon : circleRing(pick.center, radius)) : null;
  const save = () => {
    if (!pick || !polygon) return;
    const id = uid("z-");
    dispatch({ type: "zone.upsert", zone: { id, name: pick.name, kind, scope: "store", storeId, note: `${kind === "restricted" ? "Dilarang" : "Dipantau"} · ${shape === "radius" || !pick.polygon ? `radius ${radius} km` : "batas wilayah"}`, polygon, active: true, createdAt: Date.now() } });
    haptic(15);
    toast.success("Zona tersimpan", { description: `${pick.name} · ${KIND[kind].label}` });
    onSaved(id);
    onOpenChange(false); setPick(null); setQ("");
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Tambah zona">
      <div className="pb-4">
        {!pick ? (
          <>
            <div className="relative mt-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari daerah: Puncak, Sukabumi…" className={cn(inputCls, "pl-10")} />
            </div>
            <div className="mt-2 divide-y divide-line">
              {options.map((o) => (
                <button key={o.id} onClick={() => { setPick(o); setShape(o.polygon ? "batas" : "radius"); }} className="press flex w-full items-center gap-3 py-3 text-left">
                  <div className="grid size-10 place-items-center rounded-2xl bg-canvas">{o.polygon ? <Building2 className="size-[18px]" /> : <MapPinned className="size-[18px]" />}</div>
                  <div className="flex-1"><div className="text-[14px] font-semibold">{o.name}</div><div className="text-[12.5px] text-muted">{o.area}{o.polygon ? " · ada batas wilayah" : ""}</div></div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div><div className="text-[16px] font-bold">{pick.name}</div><div className="text-[12.5px] text-muted">{pick.area}</div></div>
              <button onClick={() => setPick(null)} className="text-[13px] font-bold text-brand">Ganti</button>
            </div>
            <div className="mt-3 h-44 overflow-hidden rounded-2xl border border-line">
              {polygon && (
                <LiveMap interactive={false} center={ringCenter(polygon)} zoom={10}
                  zones={[{ id: "preview", name: pick.name, kind, scope: "store", note: "", polygon, active: true, createdAt: 0 }]}
                  fit={{ key: `${pick.id}-${shape}-${radius}`, points: polygon, maxZoom: 13 }} padding={{ top: 20, bottom: 20, left: 20, right: 20 }} />
              )}
            </div>
            {pick.polygon && (
              <Segmented id="shape" className="mt-3" value={shape} onChange={setShape} options={[{ value: "batas", label: "Batas wilayah" }, { value: "radius", label: "Radius" }]} />
            )}
            {(shape === "radius" || !pick.polygon) && (
              <div className="mt-3 flex items-center gap-3">
                <input type="range" min={1} max={15} step={1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="flex-1 accent-[#1e2a78]" />
                <span className="num w-14 text-right text-[14px] font-bold">{radius} km</span>
              </div>
            )}
            <Segmented id="kind" className="mt-3" value={kind} onChange={(k) => setKind(k as ZoneKind)} options={[{ value: "restricted", label: "Larang masuk" }, { value: "monitor", label: "Pantau saja" }]} />
            <p className="mt-2 px-1 text-[12px] text-muted">{kind === "restricted" ? "Kamu dapat peringatan saat motor masuk area ini." : "Tercatat di riwayat tanpa peringatan."}</p>
            <Button size="lg" block className="mt-4" onClick={save}>Simpan zona</Button>
          </motion.div>
        )}
      </div>
    </Sheet>
  );
}
