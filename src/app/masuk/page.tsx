"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, MapPin, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/ui/bits";
import { HeroScene } from "@/components/brand/hero-scene";
import { Mark } from "@/components/brand/logo";
import { RideLoader } from "@/components/brand/splash";
import { useApp } from "@/lib/store/store";
import { PLACES } from "@/lib/domain/fixtures";
import { km, nearLabel } from "@/lib/domain/geo";
import { displayPhone } from "@/lib/wa";
import { cn } from "@/lib/cn";
import { Suspense } from "react";

type Step = "phone" | "otp" | "name" | "location";
const ease = [0.23, 1, 0.32, 1] as const;

function MasukInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [owner, setOwner] = useState(params.get("mitra") === "1");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const world = useApp((s) => s.world);
  const dispatch = useApp((s) => s.dispatch);
  const setSession = useApp((s) => s.setSession);
  const setPrefs = useApp((s) => s.setPrefs);
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("62") ? "0" + digits.slice(2) : digits.startsWith("0") ? digits : "0" + digits;
  const cid = "u-" + local;
  const existing = world.customers.find((c) => c.id === cid);
  const store = world.stores.find((s) => s.primary)!;
  const next = useRef<string | null>(null);

  useEffect(() => {
    if (step !== "otp") return;
    const code = "284157";
    let i = 0;
    const t0 = setTimeout(function type() {
      i += 1;
      setOtp(code.slice(0, i));
      if (i < code.length) setTimeout(type, 110);
      else setTimeout(afterOtp, 380);
    }, 900);
    return () => clearTimeout(t0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function afterOtp() {
    if (owner) {
      if (store.ownerPhone && store.ownerName !== "Pemilik GSM") { finishOwner(store.ownerName); return; }
      setStep("name");
    } else if (existing) {
      setSession({ role: "renter", customerId: existing.id });
      setStep("location");
    } else setStep("name");
  }

  function finishOwner(n: string) {
    dispatch({ type: "store.update", storeId: store.id, patch: { ownerName: n, ownerPhone: local } });
    setSession({ role: "owner", storeId: store.id });
    setLoading(`Menyiapkan ${store.shortName}`);
    next.current = "/mitra";
    setTimeout(() => router.replace("/mitra"), 1300);
  }

  function submitName() {
    const n = name.trim().replace(/\s+/g, " ");
    if (n.length < 2) return;
    if (owner) { finishOwner(n); return; }
    dispatch({ type: "customer.upsert", customer: { id: cid, name: n, phone: local, verified: false, rentals: 0, since: Date.now() } });
    setSession({ role: "renter", customerId: cid });
    setStep("location");
  }

  function finishRenter() {
    setLoading("Mencari rental terdekat");
    setTimeout(() => router.replace("/beranda"), 1200);
  }

  function askLocation() {
    if (!("geolocation" in navigator)) { setPrefs({ gps: "denied" }); finishRenter(); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        const near = [...PLACES].sort((a, b) => km(here, a) - km(here, b))[0];
        const place = km(here, near) < 1.2
          ? { ...near, fromGps: true }
          : { id: "gps", name: "Lokasi kamu", area: nearLabel(here.lat, here.lng), ...here, fromGps: true };
        setPrefs({ gps: "granted", place });
        finishRenter();
      },
      () => { setPrefs({ gps: "denied" }); finishRenter(); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[520px] flex-col bg-surface">
      <div className="relative h-[42dvh] min-h-[260px]">
        <HeroScene />
        <div className="absolute left-5 top-[max(env(safe-area-inset-top),18px)] flex items-center gap-2">
          <Mark size={30} />
          <span className="text-[19px] font-extrabold tracking-[-0.04em] text-brand">lajur</span>
        </div>
      </div>
      <div className="relative -mt-7 flex flex-1 flex-col rounded-t-[30px] bg-surface px-6 pt-7 pb-safe">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step + owner} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28, ease }} className="flex flex-1 flex-col">
            {step === "phone" && (
              <>
                {owner && <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[12px] font-bold text-brand"><StoreIcon className="size-3.5" />Mitra rental</div>}
                <h1 className="text-[26px] font-extrabold tracking-[-0.03em]">{owner ? "Masuk ke tokomu" : "Selamat datang"}</h1>
                <p className="mt-1 text-[14px] text-muted">{owner ? "Kelola sewa, unit, dan lokasi motor." : "Masuk pakai nomor WhatsApp."}</p>
                <div className="mt-6 flex items-center gap-2">
                  <div className="flex h-12 items-center rounded-[var(--radius-field)] border border-line bg-canvas px-3.5 text-[15px] font-semibold text-ink-2">+62</div>
                  <input autoFocus inputMode="tel" placeholder="812-3456-7890" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d-\s]/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && digits.length >= 9 && setStep("otp")}
                    className={cn(inputCls, "num flex-1 tracking-wide")} />
                </div>
                <Button size="lg" block className="mt-4" disabled={digits.length < 9} onClick={() => setStep("otp")}>Lanjut</Button>
                <div className="mt-auto pt-8 text-center text-[13px] text-muted">
                  {owner ? "Mau sewa motor? " : "Punya rental? "}
                  <button className="font-bold text-brand" onClick={() => setOwner(!owner)}>{owner ? "Masuk sebagai penyewa" : "Masuk sebagai mitra"}</button>
                </div>
              </>
            )}
            {step === "otp" && (
              <>
                <button onClick={() => { setStep("phone"); setOtp(""); }} className="press -ml-1 mb-3 grid size-9 place-items-center rounded-full hover:bg-canvas"><ArrowLeft className="size-5" /></button>
                <h1 className="text-[24px] font-extrabold tracking-[-0.03em]">Masukkan kode</h1>
                <p className="mt-1 text-[14px] text-muted">Dikirim lewat WhatsApp ke <span className="num font-semibold text-ink">{displayPhone(local)}</span></p>
                <div className="mt-6 flex justify-between gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div key={i} animate={otp[i] ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 0.2 }}
                      className={cn("num grid h-14 flex-1 place-items-center rounded-2xl border text-[22px] font-bold", otp.length === i ? "border-brand ring-4 ring-brand/10" : otp[i] ? "border-line-strong" : "border-line")}>
                      {otp[i] ?? ""}
                    </motion.div>
                  ))}
                </div>
                <p className="mt-4 text-[13px] text-muted">Kode terisi otomatis dari WhatsApp</p>
              </>
            )}
            {step === "name" && (
              <>
                <h1 className="text-[24px] font-extrabold tracking-[-0.03em]">{owner ? "Nama pemilik" : "Siapa namamu?"}</h1>
                <p className="mt-1 text-[14px] text-muted">{owner ? `Untuk ${store.name}` : "Sesuai KTP, biar rental gampang verifikasi."}</p>
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitName()}
                  placeholder="Nama lengkap" className={cn(inputCls, "mt-6")} />
                <Button size="lg" block className="mt-4" disabled={name.trim().length < 2} onClick={submitName}>Lanjut</Button>
              </>
            )}
            {step === "location" && (
              <>
                <div className="mx-auto mt-2 grid size-20 place-items-center rounded-[28px] bg-brand-soft text-brand">
                  <MapPin className="size-9" strokeWidth={2.2} />
                </div>
                <h1 className="mt-5 text-center text-[24px] font-extrabold tracking-[-0.03em]">Rental terdekat, langsung</h1>
                <p className="mx-auto mt-1 max-w-[280px] text-center text-[14px] text-muted">Izinkan lokasi supaya rental di sekitarmu muncul duluan.</p>
                <Button size="lg" block className="mt-8" onClick={askLocation}>Izinkan lokasi</Button>
                <Button size="lg" variant="ghost" block className="mt-1" onClick={() => { setPrefs({ gps: "denied" }); finishRenter(); }}>Nanti saja</Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {loading && <RideLoader title={loading} sub="Sebentar ya" />}
    </div>
  );
}

export default function MasukPage() {
  return <Suspense><MasukInner /></Suspense>;
}
