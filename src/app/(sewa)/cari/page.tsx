"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { SearchCard, useSearch } from "@/components/renter/search";
import { storeOffer, deliveryLabel } from "@/components/renter/rental-card";
import { MotorArt } from "@/components/moto/motor-art";
import { Segmented, Empty } from "@/components/ui/bits";
import { useWorld } from "@/lib/hooks";
import { nextFree } from "@/lib/domain/availability";
import { hariRelatif, jam, rb } from "@/lib/format";
import { Bike } from "lucide-react";
import { cn } from "@/lib/cn";

type Kind = "all" | "matic" | "maxi" | "retro";

export default function Cari() {
  const world = useWorld();
  const { place, start, end, hours, now } = useSearch();
  const [kind, setKind] = useState<Kind>("all");
  const rows = world.stores
    .map((s) => ({ s, o: storeOffer(world, s, place, start, end, hours, now) }))
    .flatMap(({ s, o }) => o.units.map((u) => ({ ...u, s, o })))
    .filter((r) => kind === "all" || r.v.kind === kind || (kind === "maxi" && r.v.kind === "sport"))
    .sort((a, b) => Number(b.ok) - Number(a.ok) || a.o.dist - b.o.dist || a.price.price - b.price.price);

  return (
    <div className="pb-10">
      <PageHeader title="Cari motor" sub={`${rows.filter((r) => r.ok).length} unit tersedia`} back="/beranda" />
      <div className="px-4">
        <SearchCard />
        <Segmented id="kind" className="mt-4" value={kind} onChange={setKind}
          options={[{ value: "all", label: "Semua" }, { value: "matic", label: "Matic" }, { value: "maxi", label: "Besar" }, { value: "retro", label: "Klasik" }]} />
        <div className="mt-4 space-y-2.5">
          {rows.length === 0 && <Empty icon={<Bike className="size-6" />} title="Belum ada motor" sub="Coba ubah jam atau lokasi." />}
          {rows.map(({ v, ok, price, s, o }) => {
            const dl = deliveryLabel(o);
            const nf = ok ? null : nextFree(world, v.id, start, end, now);
            return (
              <Link key={v.id} href={`/motor/${v.id}`} className={cn("press card flex items-center gap-3 p-3", !ok && "opacity-60")}>
                <div className="grid h-[70px] w-[96px] shrink-0 place-items-center rounded-2xl bg-canvas">
                  <MotorArt color={v.color} kind={v.kind} className="h-[58px] w-auto" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold">{v.model}</div>
                  <div className="truncate text-[12.5px] text-muted">{s.shortName} · {o.dist.toFixed(1)} km</div>
                  <div className={cn("mt-0.5 text-[12px] font-semibold", dl.tone)}>{dl.text}</div>
                </div>
                <div className="text-right">
                  {ok ? (
                    <>
                      <div className="num text-[16px] font-extrabold">{rb(price.price)}</div>
                      <div className="text-[11px] text-muted">{price.label}</div>
                    </>
                  ) : (
                    <div className="num text-[12px] font-semibold text-warn">{nf ? `Mulai\n${hariRelatif(nf, now)} ${jam(nf)}` : "Penuh"}</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
