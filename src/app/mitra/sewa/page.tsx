"use client";
import { useMemo, useState } from "react";
import { ClipboardPaste, Check, Inbox, MessageSquareText } from "lucide-react";
import { motion } from "motion/react";
import { Segmented, Empty, Chip, inputCls } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { BookingRow, approveWaText } from "@/components/owner/parts";
import { useMe, useNow, useWorld, haptic } from "@/lib/hooks";
import { useApp, uid } from "@/lib/store/store";
import { parseWhatsApp, matchPlace, matchDestination } from "@/lib/domain/ai";
import { isAvailable } from "@/lib/domain/availability";
import { hoursBetween, priceFor } from "@/lib/domain/pricing";
import { openWa } from "@/lib/wa";
import { tglJam, rupiah } from "@/lib/format";
import { cn } from "@/lib/cn";

type Tab = "masuk" | "aktif" | "datang" | "selesai";

export default function OwnerSewa() {
  const world = useWorld();
  const now = useNow();
  const { store } = useMe();
  const [tab, setTab] = useState<Tab>("masuk");
  const [paste, setPaste] = useState(false);
  if (!store) return null;
  const mine = world.bookings.filter((b) => b.storeId === store.id);
  const groups: Record<Tab, typeof mine> = {
    masuk: mine.filter((b) => b.status === "pending" || b.extension?.status === "pending").sort((a, b) => b.createdAt - a.createdAt),
    aktif: mine.filter((b) => b.status === "active").sort((a, b) => a.end - b.end),
    datang: mine.filter((b) => b.status === "approved").sort((a, b) => a.start - b.start),
    selesai: mine.filter((b) => ["completed", "rejected", "cancelled"].includes(b.status)).sort((a, b) => b.start - a.start),
  };
  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),18px)] lg:pt-8">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-[26px] font-extrabold tracking-[-0.03em]">Sewa</h1>
        <Button size="sm" variant="soft" onClick={() => setPaste(true)}><MessageSquareText className="size-4" />Dari chat WA</Button>
      </div>
      <Segmented id="owner-sewa" className="mt-4" value={tab} onChange={setTab} options={[
        { value: "masuk", label: "Masuk", badge: groups.masuk.length },
        { value: "aktif", label: "Aktif" },
        { value: "datang", label: "Akan datang" },
        { value: "selesai", label: "Selesai" },
      ]} />
      <div className="card mt-4 divide-y divide-line overflow-hidden">
        {groups[tab].length === 0 && <Empty icon={<Inbox className="size-6" />} title="Kosong" sub={tab === "masuk" ? "Permintaan baru muncul di sini." : undefined} />}
        {groups[tab].map((b) => <BookingRow key={b.id} b={b} world={world} now={now} />)}
      </div>
      <PasteSheet open={paste} onOpenChange={setPaste} />
    </div>
  );
}

function PasteSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const world = useWorld();
  const now = useNow(10_000);
  const { store } = useMe();
  const dispatch = useApp((s) => s.dispatch);
  const [text, setText] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const parsed = useMemo(() => (text.trim().length > 20 ? parseWhatsApp(text, now) : null), [text, now]);
  if (!store) return null;
  const vehicles = world.vehicles.filter((v) => v.storeId === store.id);
  const okStart = parsed?.start && parsed.end && parsed.end > parsed.start;
  const candidates = okStart
    ? vehicles.filter((v) => isAvailable(world, v.id, parsed!.start!, parsed!.end!, now))
        .sort((a, b) => Number(new RegExp(parsed?.model?.split(" ")[0] ?? "^$", "i").test(b.model)) - Number(new RegExp(parsed?.model?.split(" ")[0] ?? "^$", "i").test(a.model)))
    : [];
  const vehicle = candidates.find((v) => v.id === pick) ?? candidates[0];
  const fromClipboard = async () => { try { setText(await navigator.clipboard.readText()); } catch { /* izin ditolak */ } };

  const create = () => {
    if (!parsed || !vehicle || !okStart) return;
    const hours = hoursBetween(parsed.start!, parsed.end!);
    const pr = priceFor(vehicle.tiers, hours);
    const phone = (parsed.phone ?? "").replace(/^\+?62/, "0");
    const cid = "w-" + (phone || uid());
    dispatch({ type: "customer.upsert", customer: { id: cid, name: (parsed.name ?? "Pelanggan WA").replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\B\w+/g, (m) => m.toLowerCase()), phone, nik: parsed.nik, address: parsed.address, instagram: parsed.instagram, verified: !!parsed.nik, rentals: 0, since: now } });
    const pickup = matchPlace(parsed.pickupText ?? "") ?? store.meetingPoint;
    const drop = matchPlace(parsed.dropoffText ?? "") ?? pickup;
    const dest = matchDestination(parsed.destinationText ?? "");
    const id = uid("bk-");
    const booking = {
      id, code: `GSM-${Math.floor(1000 + Math.random() * 9000)}`, storeId: store.id, vehicleId: vehicle.id, customerId: cid,
      start: parsed.start!, end: parsed.end!, pickup: { mode: pickup.id === store.meetingPoint.id ? "meet" as const : "deliver" as const, place: pickup },
      dropoff: { mode: drop.id === store.meetingPoint.id ? "meet" as const : "deliver" as const, place: drop }, destination: dest,
      price: { base: pr.price, delivery: 0, total: pr.price, tierLabel: pr.label }, payment: { mode: "dp" as const, amount: store.rules.dpPerUnit },
      status: "approved" as const, createdAt: now, approvedAt: now, permits: dest.outside ? dest.permits : [], positions: [], zoneState: {},
      timeline: [{ t: now, text: "Dibuat dari chat WhatsApp" }], source: "whatsapp" as const, crew: store.crew[0],
    };
    dispatch({ type: "booking.create", booking });
    haptic(20);
    onOpenChange(false);
    setText("");
    openWa(phone, approveWaText(booking, { id: cid, name: parsed.name ?? "", phone, verified: true, rentals: 0, since: now }, vehicle, store));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Buat sewa dari chat">
      <div className="pb-4">
        <p className="text-[13px] text-muted">Tempel formulir yang diisi pelanggan di WhatsApp. Data langsung terbaca.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="Nama Lengkap Sesuai KTP: …"
          className={cn(inputCls, "mt-3 h-auto py-3 text-[14px] leading-relaxed")} />
        {!text && <Button variant="secondary" block className="mt-2" onClick={fromClipboard}><ClipboardPaste className="size-4" />Tempel dari clipboard</Button>}
        {parsed && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl bg-canvas p-4">
            <div className="flex flex-wrap gap-1.5">
              {parsed.found.map((f) => <Chip key={f} tone="ok" dot={false}><Check className="size-3" />{f}</Chip>)}
            </div>
            <div className="mt-3 space-y-1 text-[13.5px]">
              {parsed.name && <div><span className="text-muted">Nama </span><b>{parsed.name}</b></div>}
              {okStart && <div className="num"><span className="text-muted">Waktu </span><b>{tglJam(parsed.start!)} → {tglJam(parsed.end!)}</b></div>}
              {parsed.pickupText && <div><span className="text-muted">Antar </span><b>{parsed.pickupText}</b></div>}
              {parsed.destinationText && <div><span className="text-muted">Tujuan </span><b>{parsed.destinationText}</b></div>}
            </div>
            {okStart && (
              <div className="mt-3">
                <div className="mb-1.5 text-[12px] font-semibold text-muted">Unit kosong {parsed.model ? `· cocok "${parsed.model}"` : ""}</div>
                <div className="hide-scrollbar flex gap-1.5 overflow-x-auto">
                  {candidates.map((v) => (
                    <button key={v.id} onClick={() => setPick(v.id)} className={cn("press shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold", vehicle?.id === v.id ? "border-brand bg-brand text-white" : "border-line bg-surface")}>
                      {v.shortModel} {v.plate.split(" ")[1]}
                    </button>
                  ))}
                  {candidates.length === 0 && <span className="text-[13px] text-danger">Tidak ada unit kosong</span>}
                </div>
                {vehicle && <div className="num mt-2 text-[13px]"><span className="text-muted">Harga </span><b>{rupiah(priceFor(vehicle.tiers, hoursBetween(parsed.start!, parsed.end!)).price)}</b></div>}
              </div>
            )}
          </motion.div>
        )}
        <Button size="lg" block className="mt-4" disabled={!parsed || !vehicle || !okStart} onClick={create}>Buat & kirim konfirmasi</Button>
      </div>
    </Sheet>
  );
}
