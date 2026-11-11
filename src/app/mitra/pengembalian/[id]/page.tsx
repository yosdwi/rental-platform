"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Check, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { PageHeader, BottomBar } from "@/components/shell/page-header";
import { Row, Toggle } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { Step, PhotoGrid, OdoReader } from "@/components/owner/handover-kit";
import { useApp } from "@/lib/store/store";
import { useNow, useWorld, haptic } from "@/lib/hooks";
import { compareDamage, readOdometer } from "@/lib/domain/ai";
import { lateFee } from "@/lib/domain/pricing";
import { pathKm } from "@/lib/domain/geo";
import { dueItems } from "@/lib/domain/service";
import { durasi, rupiah } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function Pengembalian() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const world = useWorld();
  const now = useNow(5000);
  const dispatch = useApp((s) => s.dispatch);
  const [step, setStep] = useState(0);
  const [km, setKm] = useState<number | null>(null);
  const [fuel, setFuel] = useState(3);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [comparing, setComparing] = useState(false);
  const [compared, setCompared] = useState(false);
  const [chargeDamage, setChargeDamage] = useState(true);
  const [waiveLate, setWaiveLate] = useState(false);
  const [chargeFuel, setChargeFuel] = useState(false);
  const [returned, setReturned] = useState<string[]>([]);
  const b = world.bookings.find((x) => x.id === id);
  const photosDone = photos.filter(Boolean).length;

  useEffect(() => {
    if (photosDone === 0 || compared || comparing) return;
    setComparing(true);
    const t = setTimeout(() => { setComparing(false); setCompared(true); haptic(10); }, 1500);
    return () => clearTimeout(t);
  }, [photosDone, compared, comparing]);

  const tripKm = useMemo(() => {
    if (!b) return 0;
    if (b.positions.length > 1) return Math.max(3, pathKm(b.positions.map((p) => [p.lng, p.lat])) * 1.25);
    const v = world.vehicles.find((x) => x.id === b.vehicleId);
    return Math.max(8, ((now - (b.handover?.at ?? b.start)) / 86_400_000) * (v?.avgKmPerDay ?? 40));
  }, [b, world.vehicles, now]);

  if (!b) return null;
  const s = world.stores.find((x) => x.id === b.storeId)!;
  const c = world.customers.find((x) => x.id === b.customerId)!;
  const v = world.vehicles.find((x) => x.id === b.vehicleId)!;
  if (b.status !== "active") {
    return <div><PageHeader title="Pengembalian" back={`/mitra/sewa/${b.id}`} /><div className="px-6 py-16 text-center text-[14px] text-muted">Sewa ini tidak sedang berjalan.</div></div>;
  }
  const damage = compareDamage(b);
  const lateMin = Math.max(0, Math.round((now - b.end) / 60_000));
  const late = waiveLate ? 0 : lateFee(s, lateMin);
  const fuelGap = Math.max(0, (b.handover?.fuel ?? 4) - fuel);
  const fuelFee = chargeFuel ? fuelGap * 10_000 : 0;
  const damageFee = compared && damage.found && chargeDamage ? damage.estimate : 0;
  const deposits = b.handover?.deposits ?? s.rules.deposit;
  const allReturned = deposits.every((d) => returned.includes(d));
  const extra = late + damageFee + fuelFee;
  const ready = km !== null && allReturned;

  const finish = () => {
    const after = { ...v, odometer: km! };
    const due = dueItems(after, 0.99);
    const reason = due.length ? due.map((d) => (d.key === "oil" ? "Ganti oli mesin" : d.key === "gear" ? "Ganti oli gardan" : "Servis CVT")).join(", ") : undefined;
    dispatch({
      type: "booking.complete", id: b.id, serviceReason: reason,
      ret: { at: now, km: km!, fuel, lateMinutes: lateMin, lateFee: late, damageFee, damageNote: damageFee ? damage.note : undefined, fuelFee },
    });
    haptic([30, 40, 30]);
    if (reason) {
      toast(`${v.shortModel} ${v.plate} masuk servis`, { description: `${reason}. Tidak bisa dipesan sampai servis selesai.`, icon: <Wrench className="size-4 text-warn" />, duration: 7000 });
      router.replace(`/mitra/unit/${v.id}`);
    } else {
      toast.success("Motor kembali", { description: `${v.shortModel} ${v.plate} siap disewa lagi.` });
      router.replace(`/mitra/sewa/${b.id}`);
    }
  };

  return (
    <div className="pb-40">
      <PageHeader title="Pengembalian" sub={`${v.shortModel} ${v.plate} · ${c.name}`} back={`/mitra/sewa/${b.id}`} />
      <div className="space-y-2.5 px-4">
        <Step n={1} title="Kilometer & bensin" done={km !== null} active={step === 0} onToggle={() => setStep(0)}>
          <OdoReader km={km} fuel={fuel} setKm={setKm} setFuel={setFuel} onRead={() => readOdometer(v, tripKm)} />
          {km !== null && (
            <div className="num mt-2 text-[12.5px] text-muted">Jarak tempuh {(km - (b.handover?.km ?? v.odometer)).toLocaleString("id-ID")} km sejak diambil</div>
          )}
          {km !== null && <Button block className="mt-3" onClick={() => setStep(1)}>Lanjut</Button>}
        </Step>

        <Step n={2} title="Cek kondisi" done={compared} active={step === 1} onToggle={() => setStep(1)}>
          <PhotoGrid photos={photos} setPhotos={setPhotos} />
          {comparing && <div className="mt-3 flex items-center gap-2 rounded-2xl bg-canvas px-3.5 py-3 text-[12.5px] font-semibold text-muted"><Sparkles className="size-4 animate-pulse text-brand" />Membandingkan dengan foto saat ambil…</div>}
          {compared && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-3 rounded-2xl px-3.5 py-3", damage.found ? "bg-warn-soft" : "bg-ok-soft")}>
              <div className={cn("flex items-center gap-2 text-[13px] font-bold", damage.found ? "text-warn" : "text-ok")}>
                {damage.found ? <Sparkles className="size-4" /> : <Check className="size-4" />}{damage.note}
              </div>
              {damage.found && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="num text-[12.5px] text-warn">Estimasi {rupiah(damage.estimate)}</span>
                  <Toggle checked={chargeDamage} onChange={setChargeDamage} label="Tagih kerusakan" />
                </div>
              )}
            </motion.div>
          )}
          <Button block variant={compared ? "primary" : "secondary"} className="mt-3" onClick={() => { setCompared(true); setStep(2); }}>Lanjut</Button>
        </Step>

        <Step n={3} title="Biaya tambahan" done={step > 2} active={step === 2} onToggle={() => setStep(2)}>
          <div className="rounded-2xl bg-canvas px-4 py-2">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-[13.5px] font-semibold">{lateMin > 0 ? `Telat ${durasi(lateMin * 60_000)}` : "Tepat waktu"}</div>
                {lateMin > 0 && <div className="text-[12px] text-muted">{rupiah(s.rules.lateFeePerHour)}/jam · toleransi {s.rules.graceMinutes} mnt</div>}
              </div>
              {lateMin > s.rules.graceMinutes ? (
                <div className="flex items-center gap-2"><span className={cn("num text-[13.5px] font-bold", waiveLate && "text-faint line-through")}>{rupiah(lateFee(s, lateMin))}</span><Toggle checked={!waiveLate} onChange={(x) => setWaiveLate(!x)} label="Tagih telat" /></div>
              ) : <Check className="size-4 text-ok" />}
            </div>
            <div className="flex items-center justify-between border-t border-line py-2">
              <div>
                <div className="text-[13.5px] font-semibold">{fuelGap > 0 ? `Bensin kurang ${fuelGap} bar` : "Bensin sesuai"}</div>
                {fuelGap > 0 && <div className="text-[12px] text-muted">Rp10.000/bar</div>}
              </div>
              {fuelGap > 0 ? <Toggle checked={chargeFuel} onChange={setChargeFuel} label="Tagih bensin" /> : <Check className="size-4 text-ok" />}
            </div>
          </div>
          <Button block className="mt-3" onClick={() => setStep(3)}>Lanjut</Button>
        </Step>

        <Step n={4} title="Kembalikan jaminan" done={allReturned} active={step === 3} onToggle={() => setStep(3)}>
          <div className="space-y-2">
            {deposits.map((d) => {
              const on = returned.includes(d);
              return (
                <button key={d} onClick={() => setReturned(on ? returned.filter((x) => x !== d) : [...returned, d])} className="press flex w-full items-center gap-3 rounded-2xl border border-line px-4 py-3 text-left">
                  <span className={cn("grid size-6 place-items-center rounded-lg border-2", on ? "border-ok bg-ok text-white" : "border-line-strong")}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                  <span className="flex-1 text-[14px] font-semibold">{d}</span>
                  <ShieldCheck className="size-4 text-faint" />
                </button>
              );
            })}
          </div>
        </Step>

        <div className="card px-4 py-2.5">
          <Row label={`Sewa ${b.price.tierLabel}`} value={rupiah(b.price.total)} />
          {late > 0 && <Row label="Keterlambatan" value={rupiah(late)} />}
          {damageFee > 0 && <Row label="Kerusakan" value={rupiah(damageFee)} />}
          {fuelFee > 0 && <Row label="Bensin" value={rupiah(fuelFee)} />}
          <div className="my-1 border-t border-dashed border-line" />
          <Row label="Tagihan tambahan" value={rupiah(extra)} strong />
        </div>
      </div>
      <BottomBar>
        <Button size="lg" block disabled={!ready} onClick={finish}>{ready ? (extra ? `Selesai · tagih ${rupiah(extra)}` : "Selesai") : km === null ? "Isi kilometer dulu" : "Kembalikan semua jaminan"}</Button>
      </BottomBar>
    </div>
  );
}
