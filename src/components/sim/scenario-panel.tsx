"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Mountain, Navigation, Pause, Play, RotateCcw, SignalZero, Signal, Inbox, FastForward } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Segmented, Toggle } from "@/components/ui/bits";
import { useApp, nowOf, uid } from "@/lib/store/store";
import { ROUTES, INCOMING_NAMES, placeById, DESTINATIONS } from "@/lib/domain/fixtures";
import { isAvailable } from "@/lib/domain/availability";
import { priceFor } from "@/lib/domain/pricing";
import { firstName } from "@/lib/format";
import { cn } from "@/lib/cn";

const H = 3_600_000;

export function ScenarioPanel() {
  const [open, setOpen] = useState(false);
  const world = useApp((s) => s.world);
  const deviceId = useApp((s) => s.deviceId);
  const sync = useApp((s) => s.sync);
  const dispatch = useApp((s) => s.dispatch);
  const [route, setRoute] = useState<keyof typeof ROUTES>("puncak");

  useEffect(() => {
    const on = () => setOpen(true);
    const key = (e: KeyboardEvent) => { if (e.key === "`" || (e.key.toLowerCase() === "k" && e.shiftKey && (e.metaKey || e.ctrlKey))) setOpen((o) => !o); };
    window.addEventListener("lajur:scenario", on);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("lajur:scenario", on); window.removeEventListener("keydown", key); };
  }, []);

  const tracked = useMemo(
    () => world.bookings.filter((b) => b.status === "active" && !b.ambient).sort((a, b) => (b.handover?.at ?? 0) - (a.handover?.at ?? 0)),
    [world.bookings],
  );
  const [pick, setPick] = useState<string | null>(null);
  const target = tracked.find((b) => b.id === pick) ?? tracked[0];
  const sim = world.sim;
  const now = nowOf(world);
  const running = sim.running && sim.bookingId === target?.id;
  const signalOff = target ? !!sim.signalOff[target.id] : false;
  const nameOf = (id: string) => firstName(world.customers.find((c) => c.id === id)?.name ?? "");

  const start = (progress = 0) => {
    if (!target) return;
    dispatch({ type: "sim", patch: { running: true, bookingId: target.id, routeId: route, progress, runner: deviceId } });
    toast("Perjalanan berjalan", { description: ROUTES[route].name });
  };

  const incoming = () => {
    const gsm = world.stores.find((s) => s.primary)!;
    const n = INCOMING_NAMES[world.bookings.length % INCOMING_NAMES.length];
    const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
    const s = d.getTime(); const e = s + 24 * H;
    const v = world.vehicles.find((x) => x.storeId === gsm.id && isAvailable(world, x.id, s, e, now));
    if (!v) { toast("Tidak ada unit kosong besok"); return; }
    const cid = "c-" + n.phone.slice(-6);
    if (!world.customers.find((c) => c.id === cid)) {
      dispatch({ type: "customer.upsert", customer: { id: cid, name: n.name, phone: n.phone, instagram: n.ig, verified: true, faceMatch: 97, rentals: 0, since: now } });
    }
    const p = priceFor(v.tiers, 24);
    const tp = placeById("stasiun-bogor");
    dispatch({
      type: "booking.create",
      booking: {
        id: uid("bk-"), code: "GSM-" + Math.floor(1000 + Math.random() * 9000), storeId: gsm.id, vehicleId: v.id, customerId: cid,
        start: s, end: e, pickup: { mode: "meet", place: gsm.meetingPoint }, dropoff: { mode: "meet", place: gsm.meetingPoint },
        destination: DESTINATIONS[0], price: { base: p.price, delivery: 0, total: p.price, tierLabel: p.label },
        payment: { mode: "dp", amount: gsm.rules.dpPerUnit, paidAt: now }, status: "pending", createdAt: now, permits: [],
        positions: [], zoneState: {}, timeline: [{ t: now, text: `Diajukan dari aplikasi · dekat ${tp.name}` }], source: "app",
      },
    });
    setOpen(false);
  };

  const shift = (ms: number) => dispatch({ type: "clock", offset: world.clockOffset + ms });
  const toEnd = (deltaMin: number) => {
    const b = target ?? world.bookings.find((x) => x.status === "active");
    if (!b) return;
    dispatch({ type: "clock", offset: world.clockOffset + (b.end + deltaMin * 60_000 - now) });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} title="Skenario">
      <div className="space-y-5 pb-4">
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span className={cn("size-2 rounded-full", sync === "online" ? "bg-ok" : sync === "local" ? "bg-warn" : "bg-faint")} />
          {sync === "online" ? "Tersinkron antar perangkat" : sync === "local" ? "Hanya perangkat ini" : "Menyambung…"}
          <span className="ml-auto num">rev {world.rev}</span>
        </div>

        <Block icon={<Navigation className="size-4" />} title="Perjalanan">
          {target ? (
            <>
              {tracked.length > 1 && (
                <div className="hide-scrollbar mb-3 flex gap-2 overflow-x-auto">
                  {tracked.map((b) => (
                    <button key={b.id} onClick={() => setPick(b.id)} className={cn("press shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold", b.id === target.id ? "border-brand bg-brand-soft text-brand" : "border-line")}>
                      {nameOf(b.customerId)}
                    </button>
                  ))}
                </div>
              )}
              <div className="mb-2 text-[13px] text-muted">Sewa {nameOf(target.customerId)} · {world.vehicles.find((v) => v.id === target.vehicleId)?.shortModel}</div>
              <Segmented id="route" value={route} onChange={(v) => setRoute(v)} options={[{ value: "puncak", label: "Ke Puncak" }, { value: "sentul", label: "Ke Sentul" }, { value: "kota", label: "Keliling kota" }]} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {running ? (
                  <Button variant="secondary" onClick={() => dispatch({ type: "sim", patch: { running: false } })}><Pause className="size-4" />Jeda</Button>
                ) : (
                  <Button onClick={() => start(sim.bookingId === target.id && sim.routeId === route && sim.progress < 1 ? sim.progress : 0)}><Play className="size-4" />{sim.bookingId === target.id && sim.progress > 0 && sim.progress < 1 ? "Lanjut" : "Mulai"}</Button>
                )}
                <Button variant="secondary" onClick={() => { setRoute("puncak"); dispatch({ type: "sim", patch: { running: true, bookingId: target.id, routeId: "puncak", progress: 0.52, runner: deviceId } }); }}>
                  <Mountain className="size-4" />Dekat Gadog
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold">Kecepatan</span>
                <Segmented id="speed" size="sm" className="w-48" value={String(sim.speed)} onChange={(v) => dispatch({ type: "sim", patch: { speed: Number(v) } })}
                  options={[{ value: "0.3", label: "Pelan" }, { value: "0.6", label: "Normal" }, { value: "1.2", label: "Cepat" }]} />
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-canvas px-3.5 py-3">
                <span className="flex items-center gap-2 text-[13px] font-semibold">{signalOff ? <SignalZero className="size-4 text-danger" /> : <Signal className="size-4 text-ok" />}Putuskan sinyal</span>
                <Toggle checked={signalOff} onChange={(v) => dispatch({ type: "sim", patch: { signalOff: { ...sim.signalOff, [target.id]: v } } })} />
              </div>
            </>
          ) : (
            <p className="text-[13px] text-muted">Belum ada sewa aktif dari HP penyewa.</p>
          )}
        </Block>

        <Block icon={<Clock className="size-4" />} title="Waktu">
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="secondary" onClick={() => shift(30 * 60_000)}>+30 mnt</Button>
            <Button size="sm" variant="secondary" onClick={() => shift(2 * H)}>+2 jam</Button>
            <Button size="sm" variant="secondary" onClick={() => shift(12 * H)}>+12 jam</Button>
            <Button size="sm" variant="secondary" onClick={() => toEnd(-20)}>Jelang kembali</Button>
            <Button size="sm" variant="secondary" onClick={() => toEnd(50)}>Lewat 50 mnt</Button>
            <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "clock", offset: 0 })}><FastForward className="size-3.5 rotate-180" />Normal</Button>
          </div>
        </Block>

        <Block icon={<Inbox className="size-4" />} title="Pesanan">
          <Button variant="secondary" block onClick={incoming}>Kirim permintaan sewa baru</Button>
        </Block>

        <Button variant="ghost" block className="text-danger" onClick={() => {
          if (!confirm("Mulai ulang semua data ke kondisi awal?")) return;
          dispatch({ type: "world.reset", t0: Date.now(), newEpoch: world.epoch + 1, worldId: uid("w") });
          setOpen(false);
        }}><RotateCcw className="size-4" />Mulai ulang dari awal</Button>
      </div>
    </Sheet>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2 text-[13px] font-bold text-ink-2">{icon}{title}</div>
      {children}
    </div>
  );
}
