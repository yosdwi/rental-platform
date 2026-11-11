"use client";
import { useRouter } from "next/navigation";
import { BadgeCheck, LogOut, Phone, ScanFace, Ticket, Store } from "lucide-react";
import { Avatar, ListRow } from "@/components/ui/bits";
import { useApp } from "@/lib/store/store";
import { useMe, useWorld } from "@/lib/hooks";
import { displayPhone } from "@/lib/wa";

export default function Akun() {
  const router = useRouter();
  const world = useWorld();
  const { customer } = useMe();
  const media = useApp((s) => s.media);
  const setSession = useApp((s) => s.setSession);
  if (!customer) return null;
  const count = world.bookings.filter((b) => b.customerId === customer.id && b.status === "completed").length;
  return (
    <div className="px-4 pt-[max(env(safe-area-inset-top),18px)]">
      <div className="flex flex-col items-center pt-6">
        <Avatar name={customer.name} src={customer.selfie ? media[customer.selfie] : undefined} size={84} />
        <div className="mt-3 text-[20px] font-extrabold tracking-tight">{customer.name}</div>
        <div className="num text-[13px] text-muted">{displayPhone(customer.phone)}</div>
      </div>
      <div className="card mt-6 divide-y divide-line overflow-hidden">
        <ListRow icon={customer.verified ? <BadgeCheck className="size-5 text-ok" /> : <ScanFace className="size-5" />} title={customer.verified ? "KTP & SIM C terverifikasi" : "Belum verifikasi"} sub={customer.verified ? `Wajah cocok ${customer.faceMatch ?? 97}%` : "Diminta saat pesan pertama"} />
        <ListRow icon={<Ticket className="size-5" />} title={`${count} sewa selesai`} onClick={() => router.push("/tiket")} />
        <ListRow icon={<Phone className="size-5" />} title="Nomor WhatsApp" sub={displayPhone(customer.phone)} />
      </div>
      <div className="card mt-3 divide-y divide-line overflow-hidden">
        <ListRow icon={<Store className="size-5" />} title="Punya rental?" sub="Masuk sebagai mitra" onClick={() => { setSession(null); router.replace("/masuk?mitra=1"); }} />
        <ListRow icon={<LogOut className="size-5 text-danger" />} title={<span className="text-danger">Keluar</span>} onClick={() => { setSession(null); router.replace("/masuk"); }} />
      </div>
    </div>
  );
}
