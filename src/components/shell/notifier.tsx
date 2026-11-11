"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useApp, nowOf } from "@/lib/store/store";
import { computeAlerts, ALERT_TEXT } from "@/lib/live";
import type { Booking, World } from "@/lib/domain/types";
import { firstName, hariRelatif, jam } from "@/lib/format";
import { haptic } from "@/lib/hooks";

type Snap = Record<string, { status: string; arrival?: number; ext?: string; proof?: boolean }>;
const snap = (w: World): Snap =>
  Object.fromEntries(w.bookings.map((b) => [b.id, { status: b.status, arrival: b.arrival?.at, ext: b.extension?.status, proof: !!b.payment.proof }]));

export function Notifier() {
  const router = useRouter();
  const prev = useRef<{ world: string; s: Snap; alerts: Set<string> } | null>(null);

  useEffect(() => {
    const tick = () => {
      const { world, session } = useApp.getState();
      if (!session) { prev.current = null; return; }
      const now = nowOf(world);
      const opts = session.role === "owner" ? { storeId: session.storeId } : { customerId: session.customerId };
      const alerts = computeAlerts(world, now, opts);
      const ids = new Set(alerts.map((a) => a.id));
      const cur = snap(world);
      const p = prev.current;
      prev.current = { world: world.id, s: cur, alerts: ids };
      if (!p || p.world !== world.id) return;

      const nameOf = (b: Booking) => firstName(world.customers.find((c) => c.id === b.customerId)?.name ?? "Penyewa");
      const unitOf = (b: Booking) => world.vehicles.find((v) => v.id === b.vehicleId)?.shortModel ?? "Motor";

      for (const a of alerts) {
        if (p.alerts.has(a.id)) continue;
        haptic([60, 40, 60]);
        if (session.role === "owner") {
          toast.error(ALERT_TEXT[a.type].title(a), {
            description: `${a.vehicle?.shortModel} ${a.vehicle?.plate} · ${a.customer?.name}`,
            action: { label: "Lihat", onClick: () => router.push(`/mitra/peta?b=${a.bookingId}`) },
            duration: 8000,
          });
        } else if (a.type === "exit_area" || a.type === "enter_zone") {
          toast.warning("Kamu di luar area sewa", { description: "Rental sudah diberi tahu. Hubungi mereka kalau perlu izin.", duration: 7000 });
        }
      }

      for (const b of world.bookings) {
        const before = p.s[b.id];
        const after = cur[b.id];
        const mine = session.role === "owner" ? b.storeId === session.storeId : b.customerId === session.customerId;
        if (!mine) continue;
        if (session.role === "owner") {
          if (!before && b.status === "pending") {
            haptic(30);
            toast("Permintaan sewa baru", { description: `${nameOf(b)} · ${unitOf(b)} · ${hariRelatif(b.start, now)} ${jam(b.start)}`, action: { label: "Lihat", onClick: () => router.push(`/mitra/sewa/${b.id}`) }, duration: 8000 });
          }
          if (before && !before.arrival && after.arrival && b.arrival) {
            haptic(30);
            toast(`${nameOf(b)} sudah di titik temu`, { description: b.arrival.note || b.pickup.place.name, action: { label: "Pindai", onClick: () => router.push(`/mitra/pindai`) }, duration: 8000 });
          }
          if (before && before.ext !== "pending" && after.ext === "pending") {
            toast(`${nameOf(b)} minta perpanjang`, { description: `${b.extension?.hours} jam · ${unitOf(b)}`, action: { label: "Lihat", onClick: () => router.push(`/mitra/sewa/${b.id}`) } });
          }
          if (before && !before.proof && after.proof) {
            toast("Bukti bayar masuk", { description: `${nameOf(b)} · ${b.payment.mode === "dp" ? "DP" : "Lunas"}` });
          }
        } else if (before && before.status !== after.status) {
          if (b.status === "approved") { haptic(30); toast.success("Sewa disetujui", { description: `Ambil ${hariRelatif(b.start, now).toLowerCase()} ${jam(b.start)} di ${b.pickup.place.name}`, action: { label: "Tiket", onClick: () => router.push(`/tiket/${b.id}`) } }); }
          if (b.status === "rejected") toast.error("Sewa ditolak", { description: b.rejectReason });
          if (b.status === "active") toast.success("Sewa dimulai", { description: "Hati-hati di jalan." });
          if (b.status === "completed") toast.success("Sewa selesai", { description: "Terima kasih sudah menyewa." });
        } else if (before && before.ext === "pending" && after.ext && after.ext !== "pending") {
          toast(after.ext === "approved" ? "Perpanjangan disetujui" : "Perpanjangan ditolak");
        }
      }
    };
    tick();
    const unsub = useApp.subscribe((s, ps) => { if (s.world !== ps.world || s.session !== ps.session) tick(); });
    const i = setInterval(tick, 2000);
    return () => { unsub(); clearInterval(i); };
  }, [router]);

  return null;
}
