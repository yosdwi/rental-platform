"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Store, Vehicle, World, Place } from "@/lib/domain/types";
import { MotorArt } from "@/components/moto/motor-art";
import { isAvailable, nextFree } from "@/lib/domain/availability";
import { deliveryQuote, isWeekendRule, priceFor } from "@/lib/domain/pricing";
import { km } from "@/lib/domain/geo";
import { hariRelatif, jam, rb } from "@/lib/format";
import { cn } from "@/lib/cn";

export function storeInitials(name: string) {
  const first = name.split(" ")[0];
  if (first.length <= 4 && first === first.toUpperCase()) return first;
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function storeOffer(world: World, store: Store, place: Place, start: number, end: number, hours: number, now: number) {
  const vehicles = world.vehicles.filter((v) => v.storeId === store.id);
  const units = vehicles.map((v) => ({
    v,
    ok: isAvailable(world, v.id, start, end, now),
    price: priceFor(v.tiers, hours),
  }));
  units.sort((a, b) => Number(b.ok) - Number(a.ok) || a.price.price - b.price.price);
  const dist = km(store.meetingPoint, place);
  const weekend = store.rules.weekendMeetingPointOnly && isWeekendRule(start);
  const delivery = weekend ? null : deliveryQuote(store, place);
  return { units, dist, delivery, weekend, available: units.filter((u) => u.ok).length };
}

export function deliveryLabel(o: ReturnType<typeof storeOffer>) {
  if (o.dist < 0.6) return { text: "Titik temu dekat", tone: "text-ok" };
  if (o.weekend) return { text: "Ambil di titik temu", tone: "text-muted" };
  if (!o.delivery) return { text: "Ambil di titik temu", tone: "text-muted" };
  return o.delivery.fee === 0 ? { text: "Antar gratis", tone: "text-ok" } : { text: `Antar ${rb(o.delivery.fee)}`, tone: "text-ink-2" };
}

export function RentalCard({ world, store, place, start, end, hours, now }: {
  world: World; store: Store; place: Place; start: number; end: number; hours: number; now: number;
}) {
  const o = storeOffer(world, store, place, start, end, hours, now);
  const dl = deliveryLabel(o);
  return (
    <div className="card overflow-hidden">
      <Link href={`/toko/${store.id}`} className="press flex items-start gap-3 px-4 pt-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-[13px] font-extrabold text-white">
          {storeInitials(store.shortName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate text-[15px] font-bold">{store.name}<ChevronRight className="size-4 shrink-0 text-faint" /></div>
          <div className="num mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
            <span>{o.dist < 1 ? `${Math.round(o.dist * 1000)} m` : `${o.dist.toFixed(1)} km`}</span>
            <span className="size-1 rounded-full bg-faint" />
            <span className={cn("font-semibold", dl.tone)}>{dl.text}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="num text-[15px] font-extrabold">{o.available}</div>
          <div className="text-[11px] font-semibold text-muted">tersedia</div>
        </div>
      </Link>
      <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 pb-4">
        {o.units.slice(0, 8).map(({ v, ok, price }) => (
          <MotorTile key={v.id} v={v} ok={ok} price={price.price} nextAt={!ok ? nextFree(world, v.id, start, end, now) : null} now={now} />
        ))}
      </div>
    </div>
  );
}

export function MotorTile({ v, ok, price, nextAt, now }: { v: Vehicle; ok: boolean; price: number; nextAt: number | null; now: number }) {
  return (
    <Link href={`/motor/${v.id}`} className={cn("press w-[118px] shrink-0 rounded-[18px] bg-canvas p-2.5", !ok && "opacity-55")}>
      <div className="flex h-[58px] items-center justify-center">
        <MotorArt color={v.color} kind={v.kind} className="h-[56px] w-auto" />
      </div>
      <div className="mt-1 truncate text-[13px] font-bold">{v.shortModel}</div>
      {ok ? (
        <div className="num text-[12px] font-semibold text-ink-2">{rb(price)}</div>
      ) : (
        <div className="num truncate text-[11.5px] font-semibold text-warn">{nextAt ? `Mulai ${hariRelatif(nextAt, now) === "Hari ini" ? "" : hariRelatif(nextAt, now) + " "}${jam(nextAt)}` : "Penuh"}</div>
      )}
    </Link>
  );
}
