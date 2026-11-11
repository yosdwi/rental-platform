"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowUpRight, PersonStanding, Sparkles, Timer, Wrench } from "lucide-react";
import { BrandButton } from "@/components/brand/logo";
import { Avatar, Chip, Section, Stat } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { AlertCard, ApproveSheet, BookingRow, VehicleRow } from "@/components/owner/parts";
import { useMe, useNow, useWorld } from "@/lib/hooks";
import { computeAlerts } from "@/lib/live";
import { vehicleStatus } from "@/lib/domain/status";
import { dailyBrief, revenueThisMonth } from "@/lib/domain/ai";
import { dueItems, nextService } from "@/lib/domain/service";
import { countdown, firstName, jam, rupiah, sapaan, tglPanjang } from "@/lib/format";
import type { Booking } from "@/lib/domain/types";

export default function OwnerHome() {
  const router = useRouter();
  const world = useWorld();
  const now = useNow();
  const { store } = useMe();
  const [approve, setApprove] = useState<Booking | null>(null);
  if (!store) return null;
  const vehicles = world.vehicles.filter((v) => v.storeId === store.id);
  const st = vehicles.map((v) => vehicleStatus(world, v, now));
  const count = (...k: string[]) => st.filter((s) => k.includes(s)).length;
  const alerts = computeAlerts(world, now, { storeId: store.id });
  const mine = world.bookings.filter((b) => b.storeId === store.id);
  const endOfDay = new Date(now).setHours(23, 59, 59, 999);
  const pending = mine.filter((b) => b.status === "pending").sort((a, b) => a.createdAt - b.createdAt);
  const arrived = mine.filter((b) => b.arrival && (b.status === "approved" || b.status === "active"));
  const ext = mine.filter((b) => b.extension?.status === "pending");
  const pickups = mine.filter((b) => b.status === "approved" && b.start <= endOfDay && !b.arrival).sort((a, b) => a.start - b.start);
  const returns = mine.filter((b) => b.status === "active" && b.end <= endOfDay && !b.arrival).sort((a, b) => a.end - b.end);
  const service = vehicles.filter((v) => !v.maintenance && dueItems(v, 0.95).length > 0);
  const inspection = vehicles.filter((v) => v.inspection);
  const brief = dailyBrief(world, store.id, now, alerts.length);
  const revenue = revenueThisMonth(world, store.id, now);
  const queueEmpty = !pending.length && !arrived.length && !ext.length && !pickups.length && !returns.length && !service.length && !inspection.length;

  return (
    <div>
      <div className="dots bg-brand px-5 pt-[max(env(safe-area-inset-top),16px)] pb-20 text-white lg:mt-4 lg:rounded-[28px]">
        <div className="flex items-center justify-between lg:hidden">
          <BrandButton light size={30} />
          <Link href="/mitra/pengaturan"><Avatar name={store.ownerName} size={36} tone="light" /></Link>
        </div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 lg:mt-2">
          <div className="text-[13px] text-white/70">{store.shortName} · {tglPanjang(now)}</div>
          <h1 className="mt-0.5 text-[26px] font-extrabold tracking-[-0.03em]">{sapaan(now)}, {firstName(store.ownerName)}</h1>
        </motion.div>
      </div>

      <div className="-mt-14 px-4">
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Disewa" value={count("active", "due", "overdue")} tone="brand" onClick={() => router.push("/mitra/unit?s=active")} />
          <Stat label="Siap" value={count("ready")} tone="ok" onClick={() => router.push("/mitra/unit?s=ready")} />
          <Stat label="Dipesan" value={count("reserved")} tone="info" onClick={() => router.push("/mitra/unit?s=reserved")} />
          <Stat label="Servis" value={count("maintenance", "inspection")} tone="maint" onClick={() => router.push("/mitra/unit?s=maintenance")} />
        </div>

        <div className="lg:grid lg:grid-cols-[1.25fr_1fr] lg:gap-5">
          <div>
            {alerts.length > 0 && (
              <Section title="Perlu perhatian">
                <div className="space-y-2.5">
                  {alerts.map((a) => (
                    <motion.div key={a.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                      <AlertCard a={a} world={world} now={now} store={store} />
                    </motion.div>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Perlu tindakan">
              {queueEmpty ? (
                <div className="card px-4 py-6 text-center text-[13.5px] text-muted">Tidak ada yang menunggu. Santai dulu.</div>
              ) : (
                <div className="card divide-y divide-line overflow-hidden">
                  {arrived.map((b) => (
                    <BookingRow key={b.id} b={b} world={world} now={now}
                      right={<Button size="sm" onClick={(e) => { e.preventDefault(); router.push("/mitra/pindai"); }}><PersonStanding className="size-4" />Sudah tiba</Button>} />
                  ))}
                  {pending.map((b) => (
                    <BookingRow key={b.id} b={b} world={world} now={now}
                      right={<Button size="sm" onClick={(e) => { e.preventDefault(); setApprove(b); }}>Tinjau</Button>} />
                  ))}
                  {ext.map((b) => (
                    <BookingRow key={b.id + "x"} b={b} world={world} now={now} right={<Chip tone="info" dot={false}><Timer className="size-3" />+{b.extension!.hours} jam</Chip>} />
                  ))}
                  {pickups.map((b) => (
                    <BookingRow key={b.id} b={b} world={world} now={now} right={<Chip tone="info">Ambil {jam(b.start)}</Chip>} />
                  ))}
                  {returns.map((b) => (
                    <BookingRow key={b.id} b={b} world={world} now={now}
                      right={<Chip tone={now > b.end ? "danger" : b.end - now < 3_600_000 ? "warn" : "brand"}>{now > b.end ? "Terlambat" : `Kembali ${jam(b.end)}`}</Chip>} />
                  ))}
                  {inspection.map((v) => <VehicleRow key={v.id} v={v} world={world} now={now} right={<Chip tone="check">Cek kondisi</Chip>} />)}
                  {service.map((v) => {
                    const n = nextService(v);
                    return <VehicleRow key={v.id} v={v} world={world} now={now} right={<Chip tone="warn" dot={false}><Wrench className="size-3" />{n.remaining <= 0 ? "Lewat" : `${n.remaining} km`}</Chip>} />;
                  })}
                </div>
              )}
            </Section>
          </div>

          <div>
            <Section title="Ringkasan hari ini">
              <div className="card p-4">
                <div className="mb-2 flex items-center gap-2 text-[12.5px] font-bold text-brand"><Sparkles className="size-4" />Asisten lajur</div>
                <ul className="space-y-1.5">
                  {brief.map((l, i) => (
                    <motion.li key={l} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 * i }} className="flex gap-2 text-[13.5px] leading-snug">
                      <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand-300" />{l}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Section>
            <Section title="Bulan ini">
              <div className="grid grid-cols-2 gap-2">
                <div className="card p-4">
                  <div className="text-[12px] font-semibold text-muted">Pendapatan</div>
                  <div className="num mt-1 text-[20px] font-extrabold tracking-tight">{rupiah(revenue)}</div>
                </div>
                <Link href="/mitra/sewa" className="press card p-4">
                  <div className="flex items-center justify-between text-[12px] font-semibold text-muted">Unit terpakai<ArrowUpRight className="size-3.5" /></div>
                  <div className="num mt-1 text-[20px] font-extrabold tracking-tight">{Math.round((count("active", "due", "overdue", "reserved") / Math.max(1, vehicles.length)) * 100)}%</div>
                </Link>
              </div>
            </Section>
            {mine.some((b) => b.status === "active") && (
              <Section title="Sedang disewa" action="Peta" onAction={() => router.push("/mitra/peta")}>
                <div className="card divide-y divide-line overflow-hidden">
                  {mine.filter((b) => b.status === "active").sort((a, b) => a.end - b.end).map((b) => (
                    <BookingRow key={b.id} b={b} world={world} now={now} right={<span className="num text-[13px] font-bold">{now > b.end ? <span className="text-danger">Telat</span> : countdown(b.end - now)}</span>} />
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
      {approve && <ApproveSheet b={approve} open={!!approve} onOpenChange={(o) => !o && setApprove(null)} />}
    </div>
  );
}
