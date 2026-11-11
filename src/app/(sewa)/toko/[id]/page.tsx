"use client";
import { useParams } from "next/navigation";
import { Clock, MapPin, MessageCircle, ShieldCheck, Wallet, CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { SearchCard, useSearch } from "@/components/renter/search";
import { storeOffer, deliveryLabel, MotorTile } from "@/components/renter/rental-card";
import { LiveMap } from "@/components/map/live-map";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/bits";
import { useWorld } from "@/lib/hooks";
import { nextFree } from "@/lib/domain/availability";
import { rb } from "@/lib/format";
import { openWa } from "@/lib/wa";

export default function Toko() {
  const { id } = useParams<{ id: string }>();
  const world = useWorld();
  const { place, start, end, hours, now } = useSearch();
  const store = world.stores.find((s) => s.id === id || s.slug === id);
  if (!store) return null;
  const o = storeOffer(world, store, place, start, end, hours, now);
  const dl = deliveryLabel(o);
  const r = store.rules;
  return (
    <div className="pb-12">
      <div className="dots bg-brand pb-20 text-white">
        <PageHeader tone="brand" className="bg-transparent" />
        <div className="px-5">
          <div className="text-[13px] text-white/70">{store.address}</div>
          <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.03em]">{store.name}</h1>
          <div className="num mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/85">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" />{o.dist.toFixed(1)} km</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" />{store.openHours}</span>
            <span>{dl.text}</span>
          </div>
        </div>
      </div>
      <div className="-mt-14 px-4">
        <SearchCard />
        <Section title={`${o.available} motor tersedia`}>
          <div className="grid grid-cols-3 gap-2">
            {o.units.map(({ v, ok, price }) => (
              <MotorTile key={v.id} v={v} ok={ok} price={price.price} nextAt={!ok ? nextFree(world, v.id, start, end, now) : null} now={now} />
            ))}
          </div>
        </Section>
        <Section title="Aturan sewa">
          <div className="card divide-y divide-line">
            <Rule icon={<ShieldCheck className="size-[18px]" />} title="Jaminan" sub={r.deposit.join(" + ")} />
            <Rule icon={<Wallet className="size-[18px]" />} title={`DP mulai ${rb(r.dpPerUnit)} per motor`} sub="Bayar via QRIS, sisanya saat ambil" />
            {r.weekendMeetingPointOnly && <Rule icon={<CalendarRange className="size-[18px]" />} title="Jumat–Minggu & tanggal merah" sub={`Ambil dan kembali di ${store.meetingPoint.name}`} />}
            <Rule icon={<Clock className="size-[18px]" />} title={`Telat kembali ${rb(r.lateFeePerHour)}/jam`} sub={`Toleransi ${r.graceMinutes} menit`} />
          </div>
        </Section>
        <Section title="Titik temu">
          <div className="card overflow-hidden">
            <div className="h-40">
              <LiveMap interactive={false} center={[store.meetingPoint.lng, store.meetingPoint.lat]} zoom={15.5}
                markers={[{ id: "mp", kind: "meet", lat: store.meetingPoint.lat, lng: store.meetingPoint.lng, label: store.meetingPoint.name }]} />
            </div>
            <div className="p-4">
              <div className="text-[14px] font-bold">{store.meetingPoint.name}</div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{store.meetingPoint.directions}</p>
            </div>
          </div>
        </Section>
        <Button variant="secondary" size="lg" block className="mt-5" onClick={() => openWa(store.ownerPhone, `Halo ${store.shortName}, saya mau tanya soal sewa motor.`)}>
          <MessageCircle className="size-5 text-wa" />Chat WhatsApp
        </Button>
      </div>
    </div>
  );
}

function Rule({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">{icon}</div>
      <div><div className="text-[14px] font-semibold">{title}</div><div className="text-[12.5px] text-muted">{sub}</div></div>
    </div>
  );
}
