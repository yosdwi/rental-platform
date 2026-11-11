"use client";
import { useState } from "react";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { Chip, Empty, Segmented } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { MotorArt } from "@/components/moto/motor-art";
import { useMe, useNow, useWorld } from "@/lib/hooks";
import { BOOKING_STATUS } from "@/lib/domain/status";
import { countdown, hariRelatif, jam, rb } from "@/lib/format";

export default function TiketList() {
  const world = useWorld();
  const now = useNow();
  const { customer } = useMe();
  const [tab, setTab] = useState<"aktif" | "riwayat">("aktif");
  const mine = world.bookings.filter((b) => b.customerId === customer?.id);
  const list = mine
    .filter((b) => (tab === "aktif" ? ["pending", "approved", "active"].includes(b.status) : !["pending", "approved", "active"].includes(b.status)))
    .sort((a, b) => (tab === "aktif" ? a.start - b.start : b.start - a.start));
  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),18px)]">
      <h1 className="px-1 text-[26px] font-extrabold tracking-[-0.03em]">Sewa saya</h1>
      <Segmented id="tiket" className="mt-4" value={tab} onChange={setTab} options={[{ value: "aktif", label: "Aktif" }, { value: "riwayat", label: "Riwayat" }]} />
      <div className="mt-4 space-y-2.5">
        {list.length === 0 && (
          <Empty icon={<Ticket className="size-6" />} title={tab === "aktif" ? "Belum ada sewa" : "Belum ada riwayat"} sub="Sewa motor pertamamu dari rental terdekat."
            action={<Link href="/beranda"><Button>Cari motor</Button></Link>} />
        )}
        {list.map((b) => {
          const v = world.vehicles.find((x) => x.id === b.vehicleId)!;
          const s = world.stores.find((x) => x.id === b.storeId)!;
          const st = BOOKING_STATUS[b.status];
          return (
            <Link key={b.id} href={`/tiket/${b.id}`} className="press card flex items-center gap-3 p-3">
              <div className="grid h-16 w-20 shrink-0 place-items-center rounded-2xl bg-canvas"><MotorArt color={v.color} kind={v.kind} className="h-12 w-auto" /></div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold">{v.shortModel} · {s.shortName}</div>
                <div className="num text-[12.5px] text-muted">{hariRelatif(b.start, now)} {jam(b.start)} · {b.price.tierLabel} · {rb(b.price.total)}</div>
                <div className="mt-1.5"><Chip tone={st.tone}>{b.status === "active" ? `Sisa ${countdown(b.end - now)}` : st.label}</Chip></div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
