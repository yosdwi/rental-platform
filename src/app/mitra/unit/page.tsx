"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Segmented, Field, inputCls } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { VehicleRow } from "@/components/owner/parts";
import { MotorArt } from "@/components/moto/motor-art";
import { useApp, uid } from "@/lib/store/store";
import { useMe, useNow, useWorld, haptic } from "@/lib/hooks";
import { vehicleStatus } from "@/lib/domain/status";
import { MODEL_OPTIONS } from "@/lib/domain/fixtures";
import { nextService } from "@/lib/domain/service";
import { cn } from "@/lib/cn";

type F = "all" | "ready" | "active" | "maintenance";

function UnitInner() {
  const params = useSearchParams();
  const world = useWorld();
  const now = useNow(5000);
  const { store } = useMe();
  const s0 = params.get("s");
  const [f, setF] = useState<F>(s0 === "ready" ? "ready" : s0 === "active" || s0 === "reserved" ? "active" : s0 === "maintenance" ? "maintenance" : "all");
  const [add, setAdd] = useState(false);
  if (!store) return null;
  const vs = world.vehicles.filter((v) => v.storeId === store.id).map((v) => ({ v, st: vehicleStatus(world, v, now) }));
  const match = (st: string) => f === "all" || (f === "ready" && st === "ready") || (f === "active" && ["active", "due", "overdue", "reserved"].includes(st)) || (f === "maintenance" && ["maintenance", "inspection"].includes(st));
  const list = vs.filter((x) => match(x.st)).sort((a, b) => nextService(a.v).remaining - nextService(b.v).remaining);
  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),18px)] lg:pt-8">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-[26px] font-extrabold tracking-[-0.03em]">Unit <span className="num text-faint">{vs.length}</span></h1>
        <Button size="sm" variant="soft" onClick={() => setAdd(true)}><Plus className="size-4" />Tambah</Button>
      </div>
      <Segmented id="unit-f" className="mt-4" value={f} onChange={setF} options={[
        { value: "all", label: "Semua" },
        { value: "ready", label: "Siap" },
        { value: "active", label: "Dipakai" },
        { value: "maintenance", label: "Servis", badge: vs.filter((x) => ["maintenance", "inspection"].includes(x.st)).length },
      ]} />
      <div className="card mt-4 divide-y divide-line overflow-hidden">
        {list.map(({ v }) => <VehicleRow key={v.id} v={v} world={world} now={now} />)}
      </div>
      <AddUnit open={add} onOpenChange={setAdd} storeId={store.id} />
    </div>
  );
}

const COLORS = [
  { name: "Hitam", hex: "#1d1f27" }, { name: "Putih", hex: "#eceef3" }, { name: "Merah", hex: "#b8322a" },
  { name: "Biru", hex: "#2e4fa8" }, { name: "Abu", hex: "#6f7380" }, { name: "Krem", hex: "#e7d8bd" }, { name: "Mint", hex: "#a9dcc8" },
];

function AddUnit({ open, onOpenChange, storeId }: { open: boolean; onOpenChange: (o: boolean) => void; storeId: string }) {
  const dispatch = useApp((s) => s.dispatch);
  const [model, setModel] = useState(MODEL_OPTIONS[0].key);
  const [plate, setPlate] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [km, setKm] = useState("");
  const m = MODEL_OPTIONS.find((x) => x.key === model)!;
  const save = () => {
    const odo = Number(km.replace(/\D/g, "")) || 0;
    dispatch({
      type: "vehicle.upsert",
      vehicle: {
        id: uid("v-"), storeId, model: m.model, shortModel: m.short, kind: m.kind, cc: m.cc, year: new Date().getFullYear(), color: color.hex, colorName: color.name,
        plate: plate.toUpperCase().replace(/\s+/g, " ").trim(), odometer: odo, fuel: 5, tiers: m.t.map((t) => ({ ...t })), avgKmPerDay: 35, maintenance: null, serviceLog: [],
        service: [{ key: "oil", label: "Oli mesin", intervalKm: 2000, lastKm: odo }, { key: "gear", label: "Oli gardan", intervalKm: 8000, lastKm: odo }, { key: "cvt", label: "Servis CVT", intervalKm: 8000, lastKm: odo }],
      },
    });
    haptic(15);
    onOpenChange(false); setPlate(""); setKm("");
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Tambah unit">
      <div className="pb-4">
        <div className="mx-auto w-44"><MotorArt color={color.hex} kind={m.kind} /></div>
        <div className="hide-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5">
          {MODEL_OPTIONS.map((o) => (
            <button key={o.key} onClick={() => setModel(o.key)} className={cn("press shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold", model === o.key ? "border-brand bg-brand text-white" : "border-line")}>{o.short}</button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {COLORS.map((c) => (
            <button key={c.name} aria-label={c.name} onClick={() => setColor(c)} className={cn("press size-9 rounded-full border-2", color.name === c.name ? "border-brand" : "border-line")} style={{ background: c.hex }} />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Plat nomor"><input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="F 1234 AB" className={cn(inputCls, "uppercase")} /></Field>
          <Field label="Kilometer"><input value={km} onChange={(e) => setKm(e.target.value)} inputMode="numeric" placeholder="12000" className={inputCls} /></Field>
        </div>
        <p className="mt-2 text-[12px] text-muted">Harga paket mengikuti standar {m.short}. Bisa diubah di Pengaturan.</p>
        <Button size="lg" block className="mt-4" disabled={plate.trim().length < 4} onClick={save}>Simpan unit</Button>
      </div>
    </Sheet>
  );
}

export default function Unit() {
  return <Suspense><UnitInner /></Suspense>;
}
