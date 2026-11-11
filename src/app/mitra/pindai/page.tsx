"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, CameraOff, Flashlight } from "lucide-react";
import { BookingRow } from "@/components/owner/parts";
import { Chip } from "@/components/ui/bits";
import { useMe, useNow, useWorld, haptic } from "@/lib/hooks";
import { useApp } from "@/lib/store/store";
import { jam } from "@/lib/format";

export default function Pindai() {
  const router = useRouter();
  const world = useWorld();
  const now = useNow(5000);
  const { store } = useMe();
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"starting" | "on" | "off">("starting");
  const [hit, setHit] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stop = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const go = (id: string) => {
      const b = useApp.getState().world.bookings.find((x) => x.id === id);
      if (!b) { toast.error("Tiket tidak dikenal"); return false; }
      haptic([20, 30, 20]);
      setHit(true);
      setTimeout(() => router.push(b.status === "active" ? `/mitra/pengembalian/${b.id}` : `/mitra/serah-terima/${b.id}`), 380);
      return true;
    };
    let last = 0;
    const loop = (t: number) => {
      if (stop) return;
      raf = requestAnimationFrame(loop);
      const v = video.current;
      if (!v || v.readyState < 2 || t - last < 220 || !ctx) return;
      last = t;
      const w = 360; const h = Math.round((v.videoHeight / v.videoWidth) * w) || 360;
      canvas.width = w; canvas.height = h;
      ctx.drawImage(v, 0, 0, w, h);
      const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
      if (code?.data?.startsWith("lajur:bk:")) {
        if (go(code.data.slice(9))) stop = true;
      }
    };
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        stream = s;
        if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); }
        setState("on");
        raf = requestAnimationFrame(loop);
      })
      .catch(() => setState("off"));
    if (!navigator.mediaDevices) setState("off");
    return () => { stop = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((x) => x.stop()); };
  }, [router]);

  if (!store) return null;
  const endOfDay = new Date(now).setHours(23, 59, 59, 999);
  const queue = world.bookings
    .filter((b) => b.storeId === store.id && ((b.status === "approved" && b.start <= endOfDay + 86_400_000) || b.status === "active"))
    .sort((a, b) => Number(!!b.arrival) - Number(!!a.arrival) || (a.status === "approved" ? a.start : a.end) - (b.status === "approved" ? b.start : b.end));

  return (
    <div className="min-h-dvh bg-[#0c0e1a] text-white">
      <div className="relative mx-auto aspect-[3/4] max-h-[62dvh] w-full max-w-[560px] overflow-hidden">
        <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" />
        {state !== "on" && (
          <div className="absolute inset-0 grid place-items-center text-center">
            {state === "off" ? <div className="px-10"><CameraOff className="mx-auto size-8 opacity-70" /><div className="mt-2 text-[14px] font-semibold">Kamera tidak tersedia</div><div className="mt-1 text-[12.5px] text-white/60">Pilih sewa dari daftar di bawah.</div></div> : <div className="text-[13px] text-white/60">Membuka kamera…</div>}
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(12,14,26,0.65)_35%)]" />
        <motion.div animate={hit ? { scale: 0.92, borderColor: "#1f7a4d" } : { scale: 1 }} transition={{ type: "spring", bounce: 0.4, duration: 0.4 }}
          className="absolute left-1/2 top-1/2 size-[62%] max-h-[260px] max-w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-[30px] border-[3px] border-white/90">
          {!hit && state === "on" && (
            <motion.div className="absolute inset-x-4 h-0.5 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              animate={{ top: ["12%", "88%", "12%"] }} transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }} />
          )}
        </motion.div>
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),12px)]">
          <button onClick={() => router.back()} aria-label="Kembali" className="press grid size-10 place-items-center rounded-full bg-white/15 backdrop-blur"><ArrowLeft className="size-5" /></button>
          <div className="text-[15px] font-bold">Pindai tiket</div>
          <div className="grid size-10 place-items-center rounded-full bg-white/15 opacity-60"><Flashlight className="size-5" /></div>
        </div>
        <div className="absolute inset-x-0 bottom-5 text-center text-[13px] text-white/80">Arahkan ke QR di tiket penyewa</div>
      </div>
      <div className="mx-auto max-w-[560px] rounded-t-[28px] bg-canvas px-4 pt-5 pb-32 text-ink">
        <div className="mb-2 px-1 text-[15px] font-bold">Atau pilih manual</div>
        <div className="card divide-y divide-line overflow-hidden">
          {queue.map((b) => (
            <BookingRow key={b.id} b={b} world={world} now={now} onClick={() => router.push(b.status === "active" ? `/mitra/pengembalian/${b.id}` : `/mitra/serah-terima/${b.id}`)}
              right={b.arrival ? <Chip tone="info">Sudah tiba</Chip> : b.status === "active" ? <Chip tone="brand">Kembali {jam(b.end)}</Chip> : <Chip tone="muted">Ambil {jam(b.start)}</Chip>} />
          ))}
          {queue.length === 0 && <div className="py-8 text-center text-[13.5px] text-muted">Tidak ada serah terima hari ini.</div>}
        </div>
      </div>
    </div>
  );
}
