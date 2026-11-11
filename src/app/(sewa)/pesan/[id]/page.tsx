"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Camera, Check, CreditCard, IdCard, MapPin, ScanFace, Sparkles, Timer, Upload, Navigation } from "lucide-react";
import { PageHeader, BottomBar } from "@/components/shell/page-header";
import { MotorArt } from "@/components/moto/motor-art";
import { TimeSheet, useSearch } from "@/components/renter/search";
import { Button } from "@/components/ui/button";
import { Avatar, Row, Section, Segmented } from "@/components/ui/bits";
import { Sheet } from "@/components/ui/sheet";
import { useQr } from "@/components/renter/ticket";
import { useApp, uid } from "@/lib/store/store";
import { useMe, useWorld, compressImage, haptic } from "@/lib/hooks";
import { DESTINATIONS } from "@/lib/domain/fixtures";
import { deliveryQuote, isWeekendRule, packageHint, priceFor } from "@/lib/domain/pricing";
import { isAvailable } from "@/lib/domain/availability";
import { readKtp, readSim, faceMatch } from "@/lib/domain/ai";
import { countdown, jam, rb, rupiah, tgl } from "@/lib/format";
import { cn } from "@/lib/cn";

type DocKey = "ktp" | "sim" | "selfie";

export default function Pesan() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const world = useWorld();
  const { customer } = useMe();
  const dispatch = useApp((s) => s.dispatch);
  const putMedia = useApp((s) => s.putMedia);
  const media = useApp((s) => s.media);
  const { place, start, end, hours, now, setPrefs } = useSearch();
  const [ts, setTs] = useState(false);
  const [holdUntil] = useState(() => Date.now() + 15 * 60_000);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(i); }, []);

  const v = world.vehicles.find((x) => x.id === id);
  const store = v && world.stores.find((s) => s.id === v.storeId);
  const weekend = !!store && store.rules.weekendMeetingPointOnly && isWeekendRule(start);
  const quote = store && !weekend ? deliveryQuote(store, place) : null;
  const canDeliver = !!quote && place.id !== store?.meetingPoint.id;
  const [mode, setMode] = useState<"meet" | "deliver">("meet");
  const [dest, setDest] = useState(DESTINATIONS[0].key);
  const [pay, setPay] = useState<"dp" | "full">("dp");
  const [docs, setDocs] = useState<Partial<Record<DocKey, { img: string; done: boolean }>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [paySheet, setPaySheet] = useState<string | null>(null);

  useEffect(() => { if (!canDeliver && mode === "deliver") setMode("meet"); }, [canDeliver, mode]);
  if (!v || !store || !customer) return null;

  const p = priceFor(v.tiers, hours);
  const hint = packageHint(v.tiers, start, end);
  const deliveryFee = mode === "deliver" && quote ? quote.fee : 0;
  const total = p.price + deliveryFee;
  const dp = Math.min(total, store.rules.dpPerUnit);
  const payNow = pay === "dp" ? dp : total;
  const destination = DESTINATIONS.find((d) => d.key === dest)!;
  const verified = customer.verified;
  const docsDone = verified || (["ktp", "sim", "selfie"] as DocKey[]).every((k) => docs[k]?.done);
  const ok = isAvailable(world, v.id, start, end, now);
  const holdLeft = holdUntil - tick;

  const submit = async () => {
    setSubmitting(true);
    haptic(15);
    if (!verified) {
      const ktp = readKtp(customer.name, customer.phone);
      const sim = readSim(customer.name);
      const selfieKey = docs.selfie ? `selfie:${customer.id}` : undefined;
      if (selfieKey && docs.selfie) putMedia(selfieKey, docs.selfie.img);
      dispatch({ type: "customer.upsert", customer: { ...customer, verified: true, nik: ktp.nik, address: ktp.address, simNumber: sim.simNumber, faceMatch: faceMatch(customer.name), selfie: selfieKey } });
    }
    const bid = uid("bk-");
    const pickupPlace = mode === "deliver" ? place : store.meetingPoint;
    dispatch({
      type: "booking.create",
      booking: {
        id: bid, code: `${store.shortName.split(" ")[0].toUpperCase()}-${String(Math.abs(bid.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7)) % 9000 + 1000)}`,
        storeId: store.id, vehicleId: v.id, customerId: customer.id, start, end,
        pickup: { mode, place: pickupPlace }, dropoff: { mode, place: pickupPlace }, destination,
        price: { base: p.price, delivery: deliveryFee, total, tierLabel: p.label },
        payment: { mode: pay, amount: payNow }, status: "pending", createdAt: Date.now() + world.clockOffset, permits: [],
        positions: [], zoneState: {}, source: "app",
        timeline: [{ t: Date.now() + world.clockOffset, text: "Diajukan dari aplikasi" }],
      },
    });
    await new Promise((r) => setTimeout(r, 450));
    setSubmitting(false);
    setPaySheet(bid);
  };

  return (
    <div className="pb-40">
      <PageHeader title="Pesan sewa" sub={store.name}
        right={<span className={cn("num flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-bold", holdLeft > 120_000 ? "bg-brand-soft text-brand" : "bg-warn-soft text-warn")}><Timer className="size-3.5" />{holdLeft > 0 ? countdown(holdLeft).slice(3) : "Habis"}</span>} />
      <div className="px-4">
        <div className="card flex items-center gap-3 p-3">
          <div className="grid h-16 w-24 place-items-center rounded-2xl bg-canvas"><MotorArt color={v.color} kind={v.kind} className="h-14 w-auto" /></div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold">{v.model}</div>
            <div className="text-[12.5px] text-muted">{v.colorName} · {v.year}</div>
          </div>
        </div>

        <Section title="Waktu">
          <button onClick={() => setTs(true)} className="press card flex w-full items-center justify-between p-4 text-left">
            <div>
              <div className="num text-[15px] font-bold">{tgl(start)} · {jam(start)}</div>
              <div className="num text-[13px] text-muted">sampai {tgl(end)} · {jam(end)}</div>
            </div>
            <span className="rounded-full bg-brand-soft px-3 py-1.5 text-[12.5px] font-bold text-brand">{p.label}</span>
          </button>
          {hint && (
            <button onClick={() => setPrefs({ end: hint.end })} className="press mt-2 flex w-full items-center gap-2.5 rounded-2xl bg-ok-soft px-4 py-3 text-left">
              <Sparkles className="size-4 shrink-0 text-ok" />
              <span className="text-[13px] font-semibold text-ok">Kembali jam {jam(hint.end)}, hemat {rupiah(hint.save)}</span>
            </button>
          )}
          {!ok && <div className="mt-2 rounded-2xl bg-danger-soft px-4 py-3 text-[13px] font-semibold text-danger">Unit tidak tersedia di jam ini. Ubah waktu dulu.</div>}
        </Section>

        <Section title="Ambil motor">
          <Segmented id="mode" value={mode} onChange={(m) => canDeliver && setMode(m)}
            options={[{ value: "meet", label: "Titik temu" }, { value: "deliver", label: canDeliver ? `Diantar${quote!.fee ? ` · ${rb(quote!.fee)}` : " · gratis"}` : "Diantar" }]} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="card mt-2.5 flex gap-3 p-4">
              {mode === "meet" ? <MapPin className="mt-0.5 size-5 shrink-0 text-brand" /> : <Navigation className="mt-0.5 size-5 shrink-0 text-brand" />}
              <div>
                <div className="text-[14px] font-bold">{mode === "meet" ? store.meetingPoint.name : place.name}</div>
                <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                  {mode === "meet" ? store.meetingPoint.directions : `Crew antar ke lokasimu · ${quote?.km.toFixed(1)} km dari garasi`}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          {weekend && <p className="mt-2 px-1 text-[12.5px] text-muted">Jumat–Minggu & tanggal merah: ambil dan kembali di titik temu.</p>}
          {!weekend && !quote && <p className="mt-2 px-1 text-[12.5px] text-muted">Lokasimu di luar jangkauan antar ({store.rules.maxDeliveryKm} km).</p>}
        </Section>

        <Section title="Mau ke mana?">
          <div className="flex flex-wrap gap-2">
            {DESTINATIONS.map((d) => (
              <button key={d.key} onClick={() => setDest(d.key)} className={cn("press rounded-full border px-4 py-2.5 text-[13px] font-semibold", dest === d.key ? "border-brand bg-brand text-white" : "border-line bg-surface")}>
                {d.label}
              </button>
            ))}
          </div>
          {destination.outside && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 rounded-2xl bg-warn-soft px-4 py-3 text-[12.5px] font-semibold text-warn">
              {destination.label} di luar area sewa {store.shortName}. Rental akan meninjau dulu sebelum menyetujui.
            </motion.p>
          )}
        </Section>

        <Section title="Verifikasi">
          {verified ? (
            <div className="card flex items-center gap-3 p-4">
              <Avatar name={customer.name} src={customer.selfie ? media[customer.selfie] : undefined} size={42} />
              <div className="flex-1">
                <div className="text-[14px] font-bold">{customer.name}</div>
                <div className="text-[12.5px] text-ok">KTP & SIM C terverifikasi</div>
              </div>
              <Check className="size-5 text-ok" />
            </div>
          ) : (
            <DocsCapture name={customer.name} phone={customer.phone} docs={docs} setDocs={setDocs} />
          )}
        </Section>

        <Section title="Pembayaran">
          <Segmented id="pay" value={pay} onChange={setPay} options={[{ value: "dp", label: `DP ${rb(dp)}` }, { value: "full", label: `Lunas ${rb(total)}` }]} />
          <div className="card mt-2.5 px-4 py-2.5">
            <Row label={`Sewa ${p.label}`} value={rupiah(p.price)} />
            <Row label="Antar" value={deliveryFee ? rupiah(deliveryFee) : "Gratis"} />
            <div className="my-1 border-t border-dashed border-line" />
            <Row label="Total" value={rupiah(total)} strong />
            {pay === "dp" && <Row label="Sisa dibayar saat ambil" value={rupiah(total - dp)} />}
          </div>
          <p className="mt-2 px-1 text-[12px] text-muted">Jaminan {store.rules.deposit.join(" + ")} diserahkan saat ambil motor.</p>
        </Section>
      </div>

      <BottomBar>
        <Button size="lg" block disabled={!docsDone || !ok || holdLeft <= 0} loading={submitting} onClick={submit}>
          {!docsDone ? "Lengkapi verifikasi" : `Ajukan sewa · ${rupiah(payNow)}`}
        </Button>
      </BottomBar>
      <TimeSheet open={ts} onOpenChange={setTs} />
      {paySheet && <PaySheet bookingId={paySheet} onDone={() => router.replace(`/tiket/${paySheet}?baru=1`)} />}
    </div>
  );
}

function DocsCapture({ name, phone, docs, setDocs }: {
  name: string; phone: string;
  docs: Partial<Record<DocKey, { img: string; done: boolean }>>;
  setDocs: React.Dispatch<React.SetStateAction<Partial<Record<DocKey, { img: string; done: boolean }>>>>;
}) {
  const ktp = useMemo(() => readKtp(name, phone), [name, phone]);
  const sim = useMemo(() => readSim(name), [name]);
  const items: { k: DocKey; label: string; icon: React.ElementType; result: string }[] = [
    { k: "ktp", label: "Foto KTP", icon: IdCard, result: `${ktp.name} · NIK ${ktp.nik.slice(0, 6)}••••${ktp.nik.slice(-2)}` },
    { k: "sim", label: "Foto SIM C", icon: CreditCard, result: `${sim.simNumber} · ${sim.validUntil}` },
    { k: "selfie", label: "Selfie", icon: ScanFace, result: `Wajah cocok dengan KTP · ${faceMatch(name)}%` },
  ];
  const onFile = async (k: DocKey, f: File | undefined) => {
    if (!f) return;
    const img = await compressImage(f, k === "selfie" ? 200 : 480);
    setDocs((d) => ({ ...d, [k]: { img, done: false } }));
    setTimeout(() => { setDocs((d) => ({ ...d, [k]: { img, done: true } })); haptic(10); }, 1300);
  };
  return (
    <div className="card divide-y divide-line">
      {items.map(({ k, label, icon: Icon, result }) => {
        const d = docs[k];
        return (
          <label key={k} className="press flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left">
            <input type="file" accept="image/*" capture={k === "selfie" ? "user" : "environment"} className="sr-only"
              onChange={(e) => { onFile(k, e.target.files?.[0]); e.target.value = ""; }} />
            <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-canvas text-ink-2">
              {d ? <img src={d.img} alt="" className="size-full object-cover" /> : <Icon className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold">{label}</div>
              {!d && <div className="text-[12.5px] text-muted">Ketuk untuk foto</div>}
              {d && !d.done && <div className="mt-1.5 h-3 w-40 rounded-full shimmer" />}
              {d?.done && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate text-[12.5px] font-semibold text-ok">{result}</motion.div>}
            </div>
            {d?.done ? <Check className="size-5 text-ok" /> : <Camera className="size-5 text-faint" />}
          </label>
        );
      })}
    </div>
  );
}

function PaySheet({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const world = useWorld();
  const dispatch = useApp((s) => s.dispatch);
  const putMedia = useApp((s) => s.putMedia);
  const media = useApp((s) => s.media);
  const b = world.bookings.find((x) => x.id === bookingId);
  const store = b && world.stores.find((s) => s.id === b.storeId);
  const qr = useQr(`lajur:pay:${bookingId}:${b?.payment.amount ?? 0}`, 260);
  const [proof, setProof] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  if (!b || !store) return null;
  const qris = store.qrisImage ? media[store.qrisImage] : undefined;
  const done = () => {
    const key = proof ? `proof:${b.id}` : undefined;
    if (key && proof) putMedia(key, proof);
    dispatch({ type: "booking.pay", id: b.id, mode: b.payment.mode, amount: b.payment.amount, proof: key, at: Date.now() + world.clockOffset });
    haptic(20);
    onDone();
  };
  return (
    <Sheet open onOpenChange={() => {}} dismissible={false} title="Bayar via QRIS">
      <div className="flex flex-col items-center pb-4">
        <div className="num mt-1 text-[30px] font-extrabold tracking-tight">{rupiah(b.payment.amount)}</div>
        <div className="text-[13px] text-muted">{b.payment.mode === "dp" ? "DP" : "Pelunasan"} · {store.name}</div>
        <div className="mt-4 grid size-[230px] place-items-center rounded-3xl border border-line bg-white p-4">
          {qris ? <img src={qris} alt="QRIS" className="size-full object-contain" /> : qr ? <img src={qr} alt="QRIS" className="size-full" /> : <div className="shimmer size-full rounded-xl" />}
        </div>
        <div className="mt-2 text-[12.5px] text-muted">Scan pakai m-banking atau e-wallet</div>
        <input ref={file} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setProof(await compressImage(f, 420)); }} />
        <button onClick={() => file.current?.click()} className="press mt-5 flex w-full items-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-3.5 text-left">
          {proof ? <img src={proof} alt="" className="size-10 rounded-lg object-cover" /> : <Upload className="size-5 text-muted" />}
          <span className="flex-1 text-[14px] font-semibold">{proof ? "Bukti bayar terlampir" : "Unggah bukti bayar"}</span>
          {proof && <Check className="size-5 text-ok" />}
        </button>
        <Button size="lg" block className="mt-3" onClick={done}>Saya sudah bayar</Button>
      </div>
    </Sheet>
  );
}
