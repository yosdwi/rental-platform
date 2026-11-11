"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Copy, LogOut, QrCode, Share2, Shapes, Upload, Users, X } from "lucide-react";
import { Avatar, Field, Section, Toggle, inputCls } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { BrandButton } from "@/components/brand/logo";
import { useApp } from "@/lib/store/store";
import { useMe, useWorld, compressImage } from "@/lib/hooks";
import type { Store } from "@/lib/domain/types";
import { displayPhone, openWa } from "@/lib/wa";
import { rb } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function Pengaturan() {
  const router = useRouter();
  const world = useWorld();
  const { store } = useMe();
  const dispatch = useApp((s) => s.dispatch);
  const media = useApp((s) => s.media);
  const putMedia = useApp((s) => s.putMedia);
  const setSession = useApp((s) => s.setSession);
  const file = useRef<HTMLInputElement>(null);
  const [crew, setCrew] = useState("");
  if (!store) return null;
  const patch = (p: Partial<Store>) => dispatch({ type: "store.update", storeId: store.id, patch: p });
  const rules = (p: Partial<Store["rules"]>) => patch({ rules: { ...store.rules, ...p } });
  const link = typeof window !== "undefined" ? `${window.location.origin}/r/${store.slug}` : `/r/${store.slug}`;
  const zones = world.zones.filter((z) => z.scope === "platform" || z.storeId === store.id);
  const models = Array.from(new Map(world.vehicles.filter((v) => v.storeId === store.id).map((v) => [v.shortModel, v])).values());

  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),18px)] pb-10 lg:pt-8">
      <div className="flex items-center justify-between px-1 lg:hidden"><BrandButton size={28} /></div>
      <div className="mt-5 flex items-center gap-3 px-1">
        <Avatar name={store.ownerName} size={52} />
        <div>
          <div className="text-[20px] font-extrabold tracking-tight">{store.name}</div>
          <div className="num text-[13px] text-muted">{store.ownerName} · {displayPhone(store.ownerPhone)}</div>
        </div>
      </div>

      <Section title="Tautan toko">
        <div className="card p-4">
          <div className="num truncate rounded-xl bg-canvas px-3.5 py-3 text-[13.5px] font-semibold">{link.replace(/^https?:\/\//, "")}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => { navigator.clipboard?.writeText(link); toast("Tautan disalin"); }}><Copy className="size-4" />Salin</Button>
            <Button variant="wa" onClick={() => openWa("", `Sewa motor ${store.shortName} sekarang bisa langsung dari HP: ${link}`)}><Share2 className="size-4" />Bagikan</Button>
          </div>
          <p className="mt-2 text-[12px] text-muted">Pasang di bio Instagram dan status WhatsApp.</p>
        </div>
      </Section>

      <Section title="Aturan sewa">
        <div className="card divide-y divide-line">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1"><div className="text-[14px] font-semibold">Jumat–Minggu & tanggal merah</div><div className="text-[12.5px] text-muted">Hanya ambil & kembali di titik temu</div></div>
            <Toggle checked={store.rules.weekendMeetingPointOnly} onChange={(x) => rules({ weekendMeetingPointOnly: x })} label="Aturan akhir pekan" />
          </div>
          <NumRow label="DP per motor" value={store.rules.dpPerUnit} onCommit={(n) => rules({ dpPerUnit: n })} prefix="Rp" />
          <NumRow label="Denda telat per jam" value={store.rules.lateFeePerHour} onCommit={(n) => rules({ lateFeePerHour: n })} prefix="Rp" />
          <NumRow label="Toleransi telat" value={store.rules.graceMinutes} onCommit={(n) => rules({ graceMinutes: n })} suffix="mnt" />
          <NumRow label="Antar gratis sampai" value={store.rules.freeDeliveryKm} onCommit={(n) => rules({ freeDeliveryKm: n })} suffix="km" />
          <NumRow label="Jangkauan antar" value={store.rules.maxDeliveryKm} onCommit={(n) => rules({ maxDeliveryKm: n })} suffix="km" />
        </div>
      </Section>

      <Section title="Harga paket">
        <div className="card divide-y divide-line">
          {models.map((m) => (
            <div key={m.shortModel} className="px-4 py-3">
              <div className="mb-2 text-[14px] font-bold">{m.shortModel}</div>
              <div className="grid grid-cols-4 gap-2">
                {m.tiers.map((t, i) => (
                  <label key={t.hours} className="rounded-xl bg-canvas px-2.5 py-2">
                    <span className="block text-[11px] font-semibold text-muted">{t.hours} jam</span>
                    <input defaultValue={rb(t.price)} inputMode="numeric" className="num w-full bg-transparent text-[14px] font-bold outline-none"
                      onBlur={(e) => {
                        const n = Number(e.target.value.replace(/\D/g, "")) * (/(rb|k)$/i.test(e.target.value) || Number(e.target.value.replace(/\D/g, "")) < 1000 ? 1000 : 1);
                        if (!n) return;
                        world.vehicles.filter((v) => v.storeId === store.id && v.shortModel === m.shortModel).forEach((v) => {
                          const tiers = v.tiers.map((x, j) => (j === i ? { ...x, price: n } : x));
                          dispatch({ type: "vehicle.upsert", vehicle: { ...v, tiers } });
                        });
                        e.target.value = rb(n);
                      }} />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Titik temu & area">
        <div className="card divide-y divide-line overflow-hidden">
          <div className="px-4 py-3.5">
            <Field label={store.meetingPoint.name}>
              <textarea defaultValue={store.meetingPoint.directions} rows={2} className={cn(inputCls, "h-auto py-2.5 text-[14px]")}
                onBlur={(e) => patch({ meetingPoint: { ...store.meetingPoint, directions: e.target.value } })} />
            </Field>
          </div>
          <Link href="/mitra/zona" className="press flex items-center gap-3 px-4 py-3.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-canvas"><Shapes className="size-5 text-ink-2" /></div>
            <div className="flex-1"><div className="text-[14px] font-semibold">Area & zona</div><div className="text-[12.5px] text-muted">{zones.filter((z) => z.active).length} aktif · area layanan, larangan, pelabuhan</div></div>
            <ChevronRight className="size-4 text-faint" />
          </Link>
        </div>
      </Section>

      <Section title="Pembayaran">
        <div className="card flex items-center gap-3 p-4">
          <div className="grid size-16 place-items-center overflow-hidden rounded-2xl bg-canvas">
            {store.qrisImage && media[store.qrisImage] ? <img src={media[store.qrisImage]} alt="QRIS" className="size-full object-cover" /> : <QrCode className="size-6 text-faint" />}
          </div>
          <div className="flex-1"><div className="text-[14px] font-semibold">QRIS toko</div><div className="text-[12.5px] text-muted">{store.qrisImage ? "Tampil saat penyewa bayar DP" : "Unggah QRIS yang biasa kamu kirim"}</div></div>
          <input ref={file} type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const key = `qris:${store.id}`;
            putMedia(key, await compressImage(f, 520, 0.8));
            patch({ qrisImage: key });
            toast("QRIS tersimpan");
          }} />
          <Button size="sm" variant="secondary" onClick={() => file.current?.click()}><Upload className="size-4" />Unggah</Button>
        </div>
      </Section>

      <Section title="Crew">
        <div className="card p-4">
          <div className="flex flex-wrap gap-2">
            {store.crew.map((n) => (
              <span key={n} className="flex items-center gap-1.5 rounded-full bg-canvas py-1.5 pl-3 pr-1.5 text-[13px] font-semibold">
                {n}<button aria-label={`Hapus ${n}`} onClick={() => patch({ crew: store.crew.filter((x) => x !== n) })} className="grid size-5 place-items-center rounded-full hover:bg-line"><X className="size-3" /></button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={crew} onChange={(e) => setCrew(e.target.value)} placeholder="Nama crew" className={cn(inputCls, "h-11")} />
            <Button variant="soft" disabled={!crew.trim()} onClick={() => { patch({ crew: [...store.crew, crew.trim()] }); setCrew(""); }}><Users className="size-4" />Tambah</Button>
          </div>
        </div>
      </Section>

      <Button variant="ghost" block className="mt-6 text-danger" onClick={() => { setSession(null); router.replace("/masuk?mitra=1"); }}><LogOut className="size-4" />Keluar</Button>
    </div>
  );
}

function NumRow({ label, value, onCommit, prefix, suffix }: { label: string; value: number; onCommit: (n: number) => void; prefix?: string; suffix?: string }) {
  return (
    <label className="flex items-center gap-3 px-4 py-3">
      <span className="flex-1 text-[14px] font-semibold">{label}</span>
      <span className="flex items-center gap-1 rounded-xl bg-canvas px-3 py-2">
        {prefix && <span className="text-[13px] text-muted">{prefix}</span>}
        <input defaultValue={value.toLocaleString("id-ID")} inputMode="numeric" className="num w-20 bg-transparent text-right text-[14px] font-bold outline-none"
          onBlur={(e) => { const n = Number(e.target.value.replace(/\D/g, "")); if (!Number.isNaN(n)) { onCommit(n); e.target.value = n.toLocaleString("id-ID"); } }} />
        {suffix && <span className="text-[13px] text-muted">{suffix}</span>}
      </span>
    </label>
  );
}
