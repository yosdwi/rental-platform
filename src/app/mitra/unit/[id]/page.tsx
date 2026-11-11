"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CalendarCheck, ClipboardCheck, Sparkles, Wrench, Check } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { Chip, Section, inputCls } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { MotorArt } from "@/components/moto/motor-art";
import { BookingRow } from "@/components/owner/parts";
import { useApp, uid } from "@/lib/store/store";
import { useNow, useWorld, haptic } from "@/lib/hooks";
import { VEHICLE_STATUS, vehicleStatus } from "@/lib/domain/status";
import { serviceItems, nextService, suggestServiceDay } from "@/lib/domain/service";
import { parseServiceNote } from "@/lib/domain/ai";
import { rupiah, tgl, tglPanjang, hariRelatif } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function UnitDetail() {
  const { id } = useParams<{ id: string }>();
  const world = useWorld();
  const now = useNow(5000);
  const dispatch = useApp((s) => s.dispatch);
  const [done, setDone] = useState(false);
  const v = world.vehicles.find((x) => x.id === id);
  if (!v) return null;
  const st = VEHICLE_STATUS[vehicleStatus(world, v, now)];
  const items = serviceItems(v);
  const next = nextService(v);
  const day = suggestServiceDay(world, v, now);
  const upcoming = world.bookings.filter((b) => b.vehicleId === v.id && ["pending", "approved", "active"].includes(b.status)).sort((a, b) => a.start - b.start);
  const history = world.bookings.filter((b) => b.vehicleId === v.id && b.status === "completed").sort((a, b) => b.start - a.start).slice(0, 4);
  const m = v.maintenance;
  const inService = !!m && m.since <= now;

  const schedule = () => {
    if (!day) return;
    dispatch({ type: "vehicle.maintenance", id: v.id, maintenance: { since: day, until: day + 9 * 3_600_000, reason: next.label === "Oli mesin" ? "Ganti oli mesin" : next.label, scheduled: true } });
    haptic(15);
    toast.success("Servis dijadwalkan", { description: `${tglPanjang(day)} · unit ditutup dari pemesanan hari itu` });
  };

  return (
    <div className="pb-16">
      <div className="bg-gradient-to-b from-brand-soft to-canvas">
        <PageHeader tone="clear" className="bg-transparent" back="/mitra/unit" right={<Chip tone={st.tone}>{st.label}</Chip>} />
        <div className="mx-auto w-[64%] max-w-[300px] pb-2"><MotorArt color={v.color} kind={v.kind} className="w-full" /></div>
      </div>
      <div className="px-4">
        <h1 className="px-1 text-[24px] font-extrabold tracking-[-0.03em]">{v.model}</h1>
        <div className="num px-1 text-[13px] text-muted">{v.plate} · {v.colorName} · {v.year}</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric k="Kilometer" v={v.odometer.toLocaleString("id-ID")} />
          <Metric k="Rata-rata" v={`${v.avgKmPerDay} km/hr`} />
          <Metric k="Bensin" v={<span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <span key={n} className={cn("h-3 w-2.5 rounded-sm", n <= v.fuel ? "bg-brand" : "bg-line")} />)}</span>} />
        </div>

        {inService && m && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-[22px] border border-warn/30 bg-warn-soft p-4">
            <div className="flex items-center gap-2 text-[14px] font-bold text-warn"><Wrench className="size-4" />Sedang servis: {m.reason}</div>
            <div className="mt-0.5 text-[12.5px] text-warn/80">Tidak bisa dipesan sampai servis selesai.</div>
            <Button block className="mt-3" onClick={() => setDone(true)}><Check className="size-4" />Catat & selesai servis</Button>
          </motion.div>
        )}
        {!inService && m && (
          <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-line bg-surface p-4">
            <CalendarCheck className="size-5 text-info" />
            <div className="flex-1 text-[13.5px]"><b>Servis terjadwal</b><div className="text-muted">{hariRelatif(m.since, now)} · {m.reason}</div></div>
            <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "vehicle.maintenance", id: v.id, maintenance: null })}>Batal</Button>
          </div>
        )}
        {v.inspection && (
          <div className="mt-4 flex items-center gap-3 rounded-[22px] border border-check/25 bg-check-soft p-4">
            <ClipboardCheck className="size-5 text-check" />
            <div className="flex-1 text-[13.5px] font-semibold text-check">Baru kembali, perlu cek kondisi</div>
            <Button size="sm" onClick={() => { dispatch({ type: "vehicle.inspected", id: v.id }); haptic(10); }}>Beres</Button>
          </div>
        )}

        <Section title="Servis berkala">
          <div className="card p-4">
            <div className="space-y-3.5">
              {items.map((s) => (
                <div key={s.key}>
                  <div className="flex items-baseline justify-between text-[13.5px]">
                    <span className="font-semibold">{s.label}</span>
                    <span className={cn("num text-[12.5px] font-semibold", s.remaining <= 0 ? "text-danger" : s.ratio > 0.9 ? "text-warn" : "text-muted")}>
                      {s.remaining <= 0 ? `lewat ${Math.abs(s.remaining)} km` : `${s.remaining.toLocaleString("id-ID")} km lagi`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, s.ratio * 100)}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                      className={cn("h-full rounded-full", s.ratio >= 1 ? "bg-danger" : s.ratio > 0.9 ? "bg-warn" : "bg-brand")} />
                  </div>
                </div>
              ))}
            </div>
            {!m && (
              <div className="mt-4 rounded-2xl bg-brand-soft p-3.5">
                <div className="flex items-start gap-2 text-[13px] text-brand">
                  <Sparkles className="mt-0.5 size-4 shrink-0" />
                  <span><b>{next.label}</b> {next.remaining <= 0 ? "sudah lewat jadwal" : next.daysLeft === 0 ? `tinggal ${next.remaining} km` : `±${next.daysLeft} hari lagi`} dengan pemakaian {v.avgKmPerDay} km/hari.{day ? ` Unit kosong ${hariRelatif(day, now).toLowerCase() === "besok" ? "besok" : tgl(day)}.` : ""}</span>
                </div>
                {day && <Button size="sm" className="mt-2.5" onClick={schedule}><CalendarCheck className="size-4" />Jadwalkan {hariRelatif(day, now) === "Besok" ? "besok" : tgl(day)}</Button>}
              </div>
            )}
          </div>
        </Section>

        {upcoming.length > 0 && (
          <Section title="Jadwal sewa">
            <div className="card divide-y divide-line overflow-hidden">{upcoming.map((b) => <BookingRow key={b.id} b={b} world={world} now={now} />)}</div>
          </Section>
        )}

        <Section title="Riwayat">
          <div className="card divide-y divide-line overflow-hidden">
            {v.serviceLog.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-canvas"><Wrench className="size-4 text-ink-2" /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{r.items.map((i) => i.name).join(", ")}</div>
                  <div className="num text-[12.5px] text-muted">{tgl(r.at)} · {r.km.toLocaleString("id-ID")} km</div>
                </div>
                <span className="num text-[13px] font-bold">{rupiah(r.items.reduce((s, i) => s + i.cost, 0))}</span>
              </div>
            ))}
            {history.map((b) => <BookingRow key={b.id} b={b} world={world} now={now} />)}
            {v.serviceLog.length === 0 && history.length === 0 && <div className="px-4 py-6 text-center text-[13px] text-muted">Belum ada riwayat.</div>}
          </div>
        </Section>
      </div>
      {m && <ServiceDone open={done} onOpenChange={setDone} vehicleId={v.id} reason={m.reason} />}
    </div>
  );
}

function Metric({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-2.5">
      <div className="text-[11.5px] font-semibold text-muted">{k}</div>
      <div className="num mt-0.5 text-[15px] font-bold">{v}</div>
    </div>
  );
}

function ServiceDone({ open, onOpenChange, vehicleId, reason }: { open: boolean; onOpenChange: (o: boolean) => void; vehicleId: string; reason: string }) {
  const world = useWorld();
  const dispatch = useApp((s) => s.dispatch);
  const [note, setNote] = useState(reason.toLowerCase().includes("oli mesin") ? "ganti oli mesin 55rb" : `${reason.toLowerCase()} `);
  const items = useMemo(() => parseServiceNote(note), [note]);
  const v = world.vehicles.find((x) => x.id === vehicleId)!;
  const keys = useMemo(() => {
    const t = note.toLowerCase();
    const k: string[] = [];
    if (/oli mesin/.test(t) || /\boli\b(?!\s*gardan)/.test(t)) k.push("oil");
    if (/gardan|transmisi/.test(t)) k.push("gear");
    if (/cvt|roller|v-?belt|kampas ganda/.test(t)) k.push("cvt");
    return k;
  }, [note]);
  const total = items.reduce((s, i) => s + i.cost, 0);
  const save = () => {
    const now = Date.now() + world.clockOffset;
    dispatch({ type: "vehicle.serviceDone", id: v.id, keys, record: { id: uid("sl-"), at: now, km: v.odometer, items: items.length ? items : [{ name: reason, cost: 0 }] } });
    haptic([20, 30, 20]);
    toast.success(`${v.shortModel} ${v.plate} siap disewa`, { description: "Muncul lagi di toko." });
    onOpenChange(false);
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Catat servis">
      <div className="pb-4">
        <p className="text-[13px] text-muted">Tulis seperti di nota. Biaya dan item terbaca otomatis.</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={cn(inputCls, "mt-3 h-auto py-3")} placeholder="ganti oli 55rb, kampas rem depan 85rb" />
        <div className="mt-3 space-y-1.5">
          {items.map((i, n) => (
            <motion.div key={n + i.name} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between rounded-xl bg-canvas px-3.5 py-2.5 text-[13.5px]">
              <span className="font-semibold">{i.name}</span><span className="num font-bold">{rupiah(i.cost)}</span>
            </motion.div>
          ))}
        </div>
        {keys.length > 0 && <div className="mt-2 text-[12.5px] text-muted">Pengingat direset: {keys.map((k) => (k === "oil" ? "oli mesin" : k === "gear" ? "oli gardan" : "CVT")).join(", ")}</div>}
        <Button size="lg" block className="mt-4" onClick={save}>Selesai · {rupiah(total)}</Button>
      </div>
    </Sheet>
  );
}
