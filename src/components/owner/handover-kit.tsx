"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, Check, Gauge, Loader2 } from "lucide-react";
import { compressImage, haptic } from "@/lib/hooks";
import { cn } from "@/lib/cn";

export function Step({ n, title, done, active, children, onToggle }: { n: number; title: string; done: boolean; active: boolean; children: React.ReactNode; onToggle?: () => void }) {
  return (
    <div className={cn("card overflow-hidden transition-shadow", active && "shadow-[0_8px_30px_rgba(20,23,43,0.08)]")}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <motion.span animate={{ scale: done ? [1, 1.2, 1] : 1 }} className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold", done ? "bg-ok text-white" : active ? "bg-brand text-white" : "bg-canvas text-muted")}>
          {done ? <Check className="size-4" strokeWidth={3} /> : n}
        </motion.span>
        <span className={cn("flex-1 text-[14.5px] font-bold", !active && !done && "text-muted")}>{title}</span>
      </button>
      <motion.div initial={false} animate={{ height: active ? "auto" : 0, opacity: active ? 1 : 0 }} transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden">
        <div className="px-4 pb-4">{children}</div>
      </motion.div>
    </div>
  );
}

export function PhotoGrid({ photos, setPhotos, labels = ["Depan", "Kanan", "Belakang", "Kiri"] }: { photos: (string | null)[]; setPhotos: (p: (string | null)[]) => void; labels?: string[] }) {
  const latest = useRef(photos);
  latest.current = photos;
  return (
    <div className="grid grid-cols-4 gap-2">
      {labels.map((l, i) => (
        <label key={l} className="press flex cursor-pointer flex-col items-center gap-1">
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f) return;
            const img = await compressImage(f, 320, 0.6);
            const next = [...latest.current]; next[i] = img; setPhotos(next); haptic(8);
          }} />
          <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-line-strong bg-canvas">
            {photos[i] ? <img src={photos[i]!} alt={l} className="size-full object-cover" /> : <Camera className="size-5 text-faint" />}
          </div>
          <span className="text-[11.5px] font-semibold text-muted">{l}</span>
        </label>
      ))}
    </div>
  );
}

export function OdoReader({ onRead, km, fuel, setKm, setFuel }: { onRead: () => { km: number; fuel: number }; km: number | null; fuel: number; setKm: (n: number) => void; setFuel: (n: number) => void }) {
  const [img, setImg] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3">
        <label className="press relative grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-line-strong bg-canvas">
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f) return;
            setImg(await compressImage(f, 320));
            setReading(true);
            setTimeout(() => { const r = onRead(); setKm(r.km); setFuel(r.fuel); setReading(false); haptic(10); }, 1200);
          }} />
          {img ? <img src={img} alt="" className="size-full object-cover" /> : <Gauge className="size-6 text-faint" />}
          {reading && <div className="absolute inset-0 grid place-items-center bg-black/40"><Loader2 className="size-5 animate-spin text-white" /></div>}
        </label>
        <div className="flex-1">
          {km === null ? (
            <>
              <div className="text-[14px] font-semibold">{reading ? "Membaca speedometer…" : "Foto speedometer"}</div>
              <div className="text-[12.5px] text-muted">KM & bensin terisi otomatis</div>
              {!reading && <button onClick={() => { const r = onRead(); setKm(r.km); setFuel(r.fuel); }} className="mt-1 text-[12.5px] font-bold text-brand">Isi manual</button>}
            </>
          ) : (
            <div>
              <label className="text-[12px] font-semibold text-muted">Kilometer</label>
              <input inputMode="numeric" value={km.toLocaleString("id-ID")} onChange={(e) => setKm(Number(e.target.value.replace(/\D/g, "")) || 0)}
                className="num block w-full bg-transparent text-[22px] font-extrabold tracking-tight outline-none" />
            </div>
          )}
        </div>
      </div>
      {km !== null && (
        <div className="mt-3">
          <div className="mb-1.5 text-[12px] font-semibold text-muted">Bensin</div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setFuel(n)} aria-label={`${n} bar`} className={cn("press h-8 flex-1 rounded-lg", n <= fuel ? "bg-brand" : "bg-line")} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SignaturePad({ onChange }: { onChange: (signed: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [has, setHas] = useState(false);
  useEffect(() => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr; c.height = r.height * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr); ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#14172b";
  }, []);
  const pt = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] as const; };
  return (
    <div>
      <canvas ref={ref} className="h-36 w-full touch-none rounded-2xl border border-dashed border-line-strong bg-canvas"
        onPointerDown={(e) => { drawing.current = true; const ctx = ref.current!.getContext("2d")!; const [x, y] = pt(e); ctx.beginPath(); ctx.moveTo(x, y); (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; const [x, y] = pt(e); ctx.lineTo(x, y); ctx.stroke(); if (!has) { setHas(true); onChange(true); } }}
        onPointerUp={() => { drawing.current = false; }} />
      <div className="mt-1.5 flex justify-between text-[12px]">
        <span className="text-muted">{has ? "Tanda tangan tersimpan" : "Penyewa tanda tangan di sini"}</span>
        {has && <button className="font-bold text-brand" onClick={() => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setHas(false); onChange(false); }}>Ulangi</button>}
      </div>
    </div>
  );
}

export function ChipSelect({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn("press flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold", on ? "border-brand bg-brand-soft text-brand" : "border-line")}>
            {on && <Check className="size-3.5" strokeWidth={3} />}{o}
          </button>
        );
      })}
    </div>
  );
}
