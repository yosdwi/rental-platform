"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Fuel, Gauge, Calendar, Palette, ShieldCheck, Sparkles, ChevronRight } from "lucide-react";
import { PageHeader, BottomBar } from "@/components/shell/page-header";
import { MotorArt } from "@/components/moto/motor-art";
import { TimeSheet, useSearch } from "@/components/renter/search";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/bits";
import { useWorld } from "@/lib/hooks";
import { isAvailable, nextFree } from "@/lib/domain/availability";
import { packageHint, priceFor } from "@/lib/domain/pricing";
import { hariRelatif, jam, rb, rupiah, tgl } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function MotorDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const world = useWorld();
  const { start, end, hours, now, setPrefs } = useSearch();
  const [ts, setTs] = useState(false);
  const v = world.vehicles.find((x) => x.id === id);
  if (!v) return null;
  const store = world.stores.find((s) => s.id === v.storeId)!;
  const ok = isAvailable(world, v.id, start, end, now);
  const nf = ok ? null : nextFree(world, v.id, start, end, now);
  const p = priceFor(v.tiers, hours);
  const hint = packageHint(v.tiers, start, end);
  return (
    <div className="pb-36">
      <div className="relative bg-gradient-to-b from-brand-soft to-canvas">
        <PageHeader tone="clear" className="bg-transparent" right={<Link href={`/toko/${store.id}`} className="press rounded-full bg-white/90 px-3 py-2 text-[12.5px] font-bold shadow-sm">{store.shortName}</Link>} />
        <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", duration: 0.7, bounce: 0.15 }} className="mx-auto -mt-2 w-[78%] max-w-[360px] pb-4">
          <MotorArt color={v.color} kind={v.kind} className="w-full" />
        </motion.div>
      </div>
      <div className="px-5">
        <div className="text-[13px] font-semibold text-muted">{store.name}</div>
        <h1 className="text-[26px] font-extrabold tracking-[-0.03em]">{v.model}</h1>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <Spec icon={<Gauge className="size-4" />} v={`${v.cc} cc`} />
          <Spec icon={<Calendar className="size-4" />} v={String(v.year)} />
          <Spec icon={<Palette className="size-4" />} v={v.colorName} />
          <Spec icon={<Fuel className="size-4" />} v={v.kind === "maxi" || v.kind === "sport" ? "Besar" : "Matic"} />
        </div>

        <Section title="Paket harga">
          <div className="grid grid-cols-4 gap-2">
            {v.tiers.map((t) => {
              const on = p.label === `${t.hours} jam`;
              return (
                <button key={t.hours} onClick={() => setPrefs({ start, end: start + t.hours * 3_600_000 })}
                  className={cn("press rounded-2xl border px-2 py-3 text-center", on ? "border-brand bg-brand text-white" : "border-line bg-surface")}>
                  <div className={cn("text-[11.5px] font-semibold", on ? "text-white/75" : "text-muted")}>{t.hours} jam</div>
                  <div className="num text-[15px] font-extrabold">{rb(t.price)}</div>
                </button>
              );
            })}
          </div>
          <button onClick={() => setTs(true)} className="press mt-3 flex w-full items-center justify-between rounded-2xl bg-surface px-4 py-3 text-left border border-line">
            <div>
              <div className="text-[12px] font-semibold text-muted">Jadwal</div>
              <div className="num text-[14px] font-bold">{tgl(start)} {jam(start)} → {hariRelatif(end, now) === "Besok" ? "besok" : tgl(end)} {jam(end)}</div>
            </div>
            <ChevronRight className="size-4 text-faint" />
          </button>
          {hint && (
            <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} onClick={() => setPrefs({ end: hint.end })}
              className="press mt-2 flex w-full items-center gap-2.5 rounded-2xl bg-ok-soft px-4 py-3 text-left">
              <Sparkles className="size-4 shrink-0 text-ok" />
              <span className="text-[13px] font-semibold text-ok">Kembali {hint.hours} jam lebih awal ({jam(hint.end)}) jadi paket {hint.label}, hemat {rupiah(hint.save)}</span>
            </motion.button>
          )}
        </Section>

        <Section title="Syarat">
          <div className="card flex items-center gap-3 p-4">
            <ShieldCheck className="size-5 text-brand" />
            <div className="text-[13.5px]"><span className="font-semibold">Jaminan {store.rules.deposit.join(" + ")}</span><div className="text-muted">KTP & SIM C diverifikasi sekali di aplikasi</div></div>
          </div>
        </Section>
      </div>

      <BottomBar>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-[12px] font-semibold text-muted">{p.label}</div>
            <div className="num text-[22px] font-extrabold tracking-tight">{rupiah(p.price)}</div>
          </div>
          {ok ? (
            <Button size="lg" className="flex-[1.3]" onClick={() => router.push(`/pesan/${v.id}`)}>Sewa motor ini</Button>
          ) : (
            <Button size="lg" variant="soft" className="flex-[1.3]" disabled={!nf} onClick={() => nf && setPrefs({ start: nf, end: nf + (end - start) })}>
              {nf ? `Pakai jam ${jam(nf)}` : "Penuh"}
            </Button>
          )}
        </div>
      </BottomBar>
      <TimeSheet open={ts} onOpenChange={setTs} />
    </div>
  );
}

function Spec({ icon, v }: { icon: React.ReactNode; v: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-surface py-2.5 text-ink-2">
      {icon}<span className="text-[12px] font-bold text-ink">{v}</span>
    </div>
  );
}
