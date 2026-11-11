"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BadgeCheck, IdCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, BottomBar } from "@/components/shell/page-header";
import { Avatar, Row, Toggle } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { Step, PhotoGrid, OdoReader, SignaturePad, ChipSelect } from "@/components/owner/handover-kit";
import { useApp } from "@/lib/store/store";
import { useNow, useWorld, haptic } from "@/lib/hooks";
import { readOdometer } from "@/lib/domain/ai";
import { jam, rupiah, tglJam } from "@/lib/format";

export default function SerahTerima() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const world = useWorld();
  const now = useNow(5000);
  const media = useApp((s) => s.media);
  const dispatch = useApp((s) => s.dispatch);
  const [step, setStep] = useState(0);
  const [matched, setMatched] = useState(false);
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [km, setKm] = useState<number | null>(null);
  const [fuel, setFuel] = useState(4);
  const b = world.bookings.find((x) => x.id === id);
  const s = b && world.stores.find((x) => x.id === b.storeId);
  const [deposits, setDeposits] = useState<string[]>(() => [...(s?.rules.deposit ?? ["KTP asli"]), "Helm 2"]);
  const [paid, setPaid] = useState(b?.payment.mode === "full" && !!b.payment.paidAt);
  const [signed, setSigned] = useState(false);
  if (!b || !s) return null;
  const c = world.customers.find((x) => x.id === b.customerId)!;
  const v = world.vehicles.find((x) => x.id === b.vehicleId)!;
  const remaining = Math.max(0, b.price.total - (b.payment.paidAt ? b.payment.amount : 0));
  const photosDone = photos.filter(Boolean).length;
  const ready = matched && km !== null && signed;

  if (b.status !== "approved") {
    return (
      <div><PageHeader title="Serah terima" back={`/mitra/sewa/${b.id}`} />
        <div className="px-6 py-16 text-center text-[14px] text-muted">Sewa ini {b.status === "active" ? "sudah berjalan" : "tidak menunggu serah terima"}.</div></div>
    );
  }

  const start = () => {
    if (!paid && remaining > 0) { /* sisa dicatat belum lunas */ }
    if (paid && remaining > 0) dispatch({ type: "booking.pay", id: b.id, mode: "full", amount: b.price.total, at: now });
    dispatch({ type: "booking.start", id: b.id, handover: { at: now, km: km!, fuel, deposits, photos: photosDone, signed: true, by: b.crew ?? s.ownerName.split(" ")[0] } });
    haptic([30, 40, 30]);
    toast.success("Sewa dimulai", { description: `${v.shortModel} ${v.plate} · kembali ${tglJam(b.end)}` });
    router.replace(`/mitra/sewa/${b.id}`);
  };

  return (
    <div className="pb-36">
      <PageHeader title="Serah terima" sub={`${v.shortModel} ${v.plate} · ${c.name}`} back={`/mitra/sewa/${b.id}`} />
      <div className="space-y-2.5 px-4">
        <Step n={1} title="Cocokkan penyewa" done={matched} active={step === 0} onToggle={() => setStep(0)}>
          <div className="flex items-center gap-3">
            <Avatar name={c.name} src={c.selfie ? media[c.selfie] : undefined} size={64} />
            <div className="grid size-16 place-items-center rounded-2xl bg-canvas text-muted"><IdCard className="size-7" /></div>
            <div className="flex-1">
              <div className="text-[15px] font-bold">{c.name}</div>
              <div className="flex items-center gap-1 text-[12.5px] font-semibold text-ok"><BadgeCheck className="size-3.5" />Wajah cocok {c.faceMatch ?? 97}%</div>
              <div className="text-[12px] text-muted">Cek KTP asli sama dengan foto</div>
            </div>
          </div>
          <Button block className="mt-3" onClick={() => { setMatched(true); setStep(1); haptic(10); }}>Cocok</Button>
        </Step>

        <Step n={2} title="Foto kondisi motor" done={photosDone >= 4} active={step === 1} onToggle={() => setStep(1)}>
          <PhotoGrid photos={photos} setPhotos={setPhotos} />
          {photosDone > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-brand-soft px-3.5 py-3 text-[12.5px] font-semibold text-brand">
              <Sparkles className="mt-0.5 size-4 shrink-0" />Kondisi tercatat. {photosDone >= 2 ? "Goresan lama di bodi samping ditandai sebagai bawaan." : "Lengkapi 4 sisi untuk perbandingan saat kembali."}
            </div>
          )}
          <Button block variant={photosDone >= 4 ? "primary" : "secondary"} className="mt-3" onClick={() => setStep(2)}>{photosDone >= 4 ? "Lanjut" : "Lanjut tanpa lengkap"}</Button>
        </Step>

        <Step n={3} title="Kilometer & bensin" done={km !== null} active={step === 2} onToggle={() => setStep(2)}>
          <OdoReader km={km} fuel={fuel} setKm={setKm} setFuel={setFuel} onRead={() => readOdometer(v)} />
          {km !== null && <Button block className="mt-3" onClick={() => setStep(3)}>Lanjut</Button>}
        </Step>

        <Step n={4} title="Jaminan & perlengkapan" done={deposits.length > 0 && step > 3} active={step === 3} onToggle={() => setStep(3)}>
          <ChipSelect options={[...s.rules.deposit, "KTM", "NPWP", "SIM A", "Helm 1", "Helm 2", "Jas hujan"]} value={deposits} onChange={setDeposits} />
          <Button block className="mt-3" onClick={() => setStep(4)}>Lanjut</Button>
        </Step>

        <Step n={5} title="Pembayaran" done={step > 4} active={step === 4} onToggle={() => setStep(4)}>
          <Row label={b.payment.mode === "dp" ? "DP sudah masuk" : "Sudah dibayar"} value={b.payment.paidAt ? rupiah(b.payment.amount) : "Belum"} />
          <Row label="Sisa" value={rupiah(remaining)} strong />
          {remaining > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
              <span className="text-[13.5px] font-semibold">Sisa sudah diterima</span>
              <Toggle checked={paid} onChange={setPaid} label="Sisa diterima" />
            </div>
          )}
          <Button block className="mt-3" onClick={() => setStep(5)}>Lanjut</Button>
        </Step>

        <Step n={6} title="Tanda tangan penyewa" done={signed} active={step === 5} onToggle={() => setStep(5)}>
          <p className="mb-2 text-[12.5px] text-muted">Setuju kembali {tglJam(b.end)} di {b.dropoff.place.name}. Lokasi motor dibagikan selama sewa.</p>
          <SignaturePad onChange={setSigned} />
        </Step>
      </div>
      <BottomBar>
        <Button size="lg" block disabled={!ready} onClick={start}>
          {ready ? `Mulai sewa · kembali ${jam(b.end)}` : "Lengkapi langkah 1, 3, dan 6"}
        </Button>
      </BottomBar>
    </div>
  );
}
