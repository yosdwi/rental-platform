"use client";
import { useMemo, useState } from "react";
import { LocateFixed, MapPin, Search, TrainFront, ShoppingBag, Landmark, CalendarClock } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/ui/bits";
import { useApp, type Prefs } from "@/lib/store/store";
import { PLACES } from "@/lib/domain/fixtures";
import { km, nearLabel } from "@/lib/domain/geo";
import type { Place } from "@/lib/domain/types";
import { useNow } from "@/lib/hooks";
import { hariRelatif, jam, tgl, H } from "@/lib/format";
import { hoursBetween } from "@/lib/domain/pricing";
import { cn } from "@/lib/cn";

export const DEFAULT_PLACE = PLACES.find((p) => p.id === "stasiun-bogor")!;

export function useSearch() {
  const prefs = useApp((s) => s.prefs);
  const setPrefs = useApp((s) => s.setPrefs);
  const now = useNow(30_000);
  const place: Prefs["place"] = prefs.place ?? DEFAULT_PLACE;
  const defStart = Math.ceil((now + H) / H) * H;
  const start = prefs.start && prefs.start > now ? prefs.start : defStart;
  const end = prefs.end && prefs.end > start ? prefs.end : start + 24 * H;
  return { place: place!, start, end, hours: hoursBetween(start, end), setPrefs, now };
}

const ICON: Record<string, React.ElementType> = { station: TrainFront, mall: ShoppingBag, landmark: Landmark, meeting: MapPin, area: MapPin };

export function PlaceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = useState("");
  const [locating, setLocating] = useState(false);
  const { place, setPrefs } = useSearch();
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PLACES.filter((p) => !t || `${p.name} ${p.area}`.toLowerCase().includes(t));
  }, [q]);
  const pick = (p: Place & { fromGps?: boolean }) => { setPrefs({ place: p }); onOpenChange(false); setQ(""); };
  const gps = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const near = [...PLACES].sort((a, b) => km(here, a) - km(here, b))[0];
        pick(km(here, near) < 1.2 ? { ...near, fromGps: true } : { id: "gps", name: "Lokasi kamu", area: nearLabel(here.lat, here.lng), ...here, fromGps: true });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Ambil atau diantar ke">
      <div className="relative mt-2">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari stasiun, hotel, tempat" className={cn(inputCls, "pl-10")} />
      </div>
      <button onClick={gps} className="press mt-3 flex w-full items-center gap-3 rounded-2xl bg-brand-soft px-4 py-3.5 text-left">
        <LocateFixed className={cn("size-5 text-brand", locating && "animate-pulse")} />
        <div className="flex-1">
          <div className="text-[14px] font-bold text-brand">{locating ? "Mencari lokasimu…" : "Pakai lokasi sekarang"}</div>
          {place.fromGps && <div className="text-[12px] text-brand/70">{place.name} · {place.area}</div>}
        </div>
      </button>
      <div className="mt-2 divide-y divide-line pb-4">
        {list.map((p) => {
          const Icon = ICON[p.kind ?? "area"] ?? MapPin;
          return (
            <button key={p.id} onClick={() => pick(p)} className="press flex w-full items-center gap-3 py-3 text-left">
              <div className="grid size-10 place-items-center rounded-2xl bg-canvas text-ink-2"><Icon className="size-[18px]" /></div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold">{p.name}</div>
                <div className="text-[12.5px] text-muted">{p.area}</div>
              </div>
              {place.id === p.id && <span className="size-2 rounded-full bg-brand" />}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

const DURATIONS = [12, 24, 36, 48, 72];

export function TimeSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { start, end, setPrefs, now } = useSearch();
  const [day, setDay] = useState(() => new Date(start).setHours(0, 0, 0, 0));
  const [hour, setHour] = useState(() => new Date(start).getHours());
  const [dur, setDur] = useState(() => Math.round((end - start) / H));
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() + i); return d.setHours(0, 0, 0, 0); });
  const hours = Array.from({ length: 16 }, (_, i) => i + 6);
  const s = day + hour * H;
  const valid = s > now;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Kapan sewanya?">
      <div className="pb-4">
        <div className="mt-2 text-[12.5px] font-semibold text-muted">Tanggal ambil</div>
        <div className="hide-scrollbar -mx-5 mt-2 flex gap-2 overflow-x-auto px-5">
          {days.map((d) => (
            <button key={d} onClick={() => setDay(d)} className={cn("press flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border text-center", d === day ? "border-brand bg-brand text-white" : "border-line bg-surface")}>
              <span className={cn("text-[11px] font-semibold", d === day ? "text-white/75" : "text-muted")}>{hariRelatif(d, now) === "Hari ini" ? "Hari ini" : hariRelatif(d, now) === "Besok" ? "Besok" : tgl(d).split(",")[0]}</span>
              <span className="num text-[18px] font-bold">{new Date(d).getDate()}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 text-[12.5px] font-semibold text-muted">Jam ambil</div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {hours.map((h) => {
            const past = day + h * H <= now;
            return (
              <button key={h} disabled={past} onClick={() => setHour(h)} className={cn("press num h-11 rounded-xl border text-[14px] font-semibold disabled:opacity-30", h === hour ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface")}>
                {String(h).padStart(2, "0")}.00
              </button>
            );
          })}
        </div>
        <div className="mt-4 text-[12.5px] font-semibold text-muted">Lama sewa</div>
        <div className="mt-2 flex gap-2">
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => setDur(d)} className={cn("press h-11 flex-1 rounded-xl border text-[13px] font-semibold", d === dur ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface")}>
              {d < 48 ? `${d} jam` : `${d / 24} hari`}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3 text-[13px]">
          <span className="text-muted">Kembali</span>
          <span className="num font-bold">{tgl(s + dur * H)} · {jam(s + dur * H)}</span>
        </div>
        <Button size="lg" block className="mt-4" disabled={!valid} onClick={() => { setPrefs({ start: s, end: s + dur * H }); onOpenChange(false); }}>
          Simpan
        </Button>
      </div>
    </Sheet>
  );
}

export function SearchCard({ onSearch, className }: { onSearch?: () => void; className?: string }) {
  const { place, start, end, now, hours, setPrefs } = useSearch();
  const [ps, setPs] = useState(false);
  const [ts, setTs] = useState(false);
  const quick = useMemo(() => PLACES.filter((p) => ["stasiun-bogor", "surya-kencana", "sentul-aeon", "botani", "ipb"].includes(p.id) && p.id !== place.id).slice(0, 3), [place.id]);
  return (
    <div className={cn("rounded-[26px] bg-surface p-3.5 shadow-[0_10px_40px_rgba(20,23,43,0.10)]", className)}>
      <button onClick={() => setPs(true)} className="press flex w-full items-center gap-3 rounded-[18px] bg-canvas px-3.5 py-3 text-left">
        <MapPin className="size-5 text-brand" />
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] font-semibold text-muted">{place.fromGps ? "Lokasi kamu sekarang" : "Ambil atau diantar ke"}</div>
          <div className="truncate text-[15px] font-bold">{place.name}</div>
        </div>
        {place.fromGps && <LocateFixed className="size-4 text-faint" />}
      </button>
      <div className="hide-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
        {quick.map((p) => (
          <button key={p.id} onClick={() => setPrefs({ place: p })} className="press shrink-0 rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-2">{p.name}</button>
        ))}
      </div>
      <button onClick={() => setTs(true)} className="press mt-2.5 grid w-full grid-cols-2 gap-2 text-left">
        <div className="rounded-[18px] bg-canvas px-3.5 py-2.5">
          <div className="flex items-center gap-1 text-[11.5px] font-semibold text-muted"><CalendarClock className="size-3.5" />Ambil</div>
          <div className="num truncate text-[14px] font-bold">{hariRelatif(start, now)} · {jam(start)}</div>
        </div>
        <div className="rounded-[18px] bg-canvas px-3.5 py-2.5">
          <div className="text-[11.5px] font-semibold text-muted">Kembali · {hours < 48 ? `${hours} jam` : `${Math.round(hours / 24)} hari`}</div>
          <div className="num truncate text-[14px] font-bold">{hariRelatif(end, now)} · {jam(end)}</div>
        </div>
      </button>
      {onSearch && <Button size="lg" block className="mt-3" onClick={onSearch}>Cari motor</Button>}
      <PlaceSheet open={ps} onOpenChange={setPs} />
      <TimeSheet open={ts} onOpenChange={setTs} />
    </div>
  );
}
