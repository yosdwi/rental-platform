"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ChevronRight, Radio } from "lucide-react";
import { BrandButton } from "@/components/brand/logo";
import { SearchCard, useSearch } from "@/components/renter/search";
import { RentalCard } from "@/components/renter/rental-card";
import { Avatar, Section } from "@/components/ui/bits";
import { useMe, useWorld } from "@/lib/hooks";
import { km } from "@/lib/domain/geo";
import { countdown, firstName, hariRelatif, jam, sapaan } from "@/lib/format";

export default function Beranda() {
  const router = useRouter();
  const world = useWorld();
  const { customer } = useMe();
  const { place, start, end, hours, now } = useSearch();
  const stores = [...world.stores].sort((a, b) => km(a.meetingPoint, place) - km(b.meetingPoint, place));
  const mine = world.bookings
    .filter((b) => b.customerId === customer?.id && ["pending", "approved", "active"].includes(b.status))
    .sort((a, b) => (a.status === "active" ? -1 : 0) - (b.status === "active" ? -1 : 0) || a.start - b.start)[0];
  const mv = mine && world.vehicles.find((v) => v.id === mine.vehicleId);

  return (
    <div>
      <div className="dots bg-brand px-5 pt-[max(env(safe-area-inset-top),16px)] pb-24 text-white">
        <div className="flex items-center justify-between">
          <BrandButton light size={30} />
          <Link href="/akun"><Avatar name={customer?.name ?? "?"} src={customer?.selfie} size={36} tone="light" /></Link>
        </div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-6">
          <div className="text-[13px] text-white/70">{sapaan(now)}, {firstName(customer?.name ?? "")}</div>
          <h1 className="mt-0.5 text-[26px] font-extrabold tracking-[-0.03em]">Mau sewa di mana?</h1>
        </motion.div>
      </div>

      <div className="-mt-[76px] px-4">
        <SearchCard onSearch={() => router.push("/cari")} />

        {mine && mv && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Link href={`/tiket/${mine.id}`} className="press mt-4 flex items-center gap-3 rounded-[22px] border border-line bg-surface p-3.5">
              <div className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                {mine.status === "active" ? <Radio className="size-5" /> : <span className="num text-[13px] font-extrabold">{jam(mine.start).slice(0, 2)}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-muted">
                  {mine.status === "active" ? "Sewa berjalan" : mine.status === "pending" ? "Menunggu persetujuan" : `Ambil ${hariRelatif(mine.start, now).toLowerCase()} ${jam(mine.start)}`}
                </div>
                <div className="truncate text-[15px] font-bold">{mv.shortModel} · {world.stores.find((s) => s.id === mine.storeId)?.shortName}</div>
              </div>
              {mine.status === "active" ? (
                <span className="num rounded-xl bg-brand px-2.5 py-1.5 text-[13px] font-bold text-white">{countdown(mine.end - now)}</span>
              ) : <ChevronRight className="size-5 text-faint" />}
            </Link>
          </motion.div>
        )}

        <Section title="Rental terdekat" action="Lihat semua" onAction={() => router.push("/cari")}>
          <div className="space-y-3">
            {stores.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}>
                <RentalCard world={world} store={s} place={place} start={start} end={end} hours={hours} now={now} />
              </motion.div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
