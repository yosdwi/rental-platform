"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Bike } from "lucide-react";
import type { Booking } from "@/lib/domain/types";
import { useApp } from "@/lib/store/store";
import { Chip } from "@/components/ui/bits";
import { BOOKING_STATUS } from "@/lib/domain/status";
import { jam, rb, tgl } from "@/lib/format";
import { cn } from "@/lib/cn";

export function useQr(text: string, size = 240) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 0, width: size, errorCorrectionLevel: "M", color: { dark: "#14172b", light: "#ffffff" } }).then(setSrc).catch(() => setSrc(null));
  }, [text, size]);
  return src;
}

export const qrPayload = (b: Booking) => `lajur:bk:${b.id}`;

export function TicketCard({ booking: b, compact }: { booking: Booking; compact?: boolean }) {
  const world = useApp((s) => s.world);
  const store = world.stores.find((s) => s.id === b.storeId)!;
  const v = world.vehicles.find((x) => x.id === b.vehicleId)!;
  const qr = useQr(qrPayload(b));
  const showQr = b.status === "approved" || b.status === "active";
  const st = BOOKING_STATUS[b.status];
  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-surface shadow-[0_2px_10px_rgba(20,23,43,0.05)]">
      <div className="flex items-center justify-between bg-brand px-4 py-2.5 text-[12.5px] font-semibold text-white">
        <span>{store.shortName}</span>
        <span className="num opacity-85">{b.code}</span>
      </div>
      <div className="px-4 pt-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-muted">{tgl(b.start)}</span>
          <Chip tone={st.tone}>{st.label}</Chip>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11.5px] font-semibold text-muted">Ambil</div>
            <div className="num text-[28px] font-extrabold leading-tight tracking-tight">{jam(b.start)}</div>
            <div className="max-w-[120px] truncate text-[12px] text-muted">{b.pickup.place.name}</div>
          </div>
          <div className="relative mx-3 flex-1 border-t-2 border-dotted border-line-strong">
            <span className="absolute left-1/2 top-0 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-soft text-brand">
              <Bike className="size-4" />
            </span>
          </div>
          <div className="text-right">
            <div className="text-[11.5px] font-semibold text-muted">Kembali</div>
            <div className="num text-[28px] font-extrabold leading-tight tracking-tight">{jam(b.end)}</div>
            <div className="text-[12px] text-muted">{tgl(b.end)}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-[1.4fr_1fr_1fr] gap-2 rounded-2xl bg-canvas px-3 py-2.5">
          <Info k="Motor" v={v.shortModel} />
          <Info k="Total" v={rb(b.price.total)} />
          <Info k={b.payment.mode === "dp" ? "DP" : "Bayar"} v={b.payment.paidAt ? (b.payment.mode === "dp" ? rb(b.payment.amount) : "Lunas") : "Belum"} />
        </div>
      </div>
      {showQr && (
        <>
          <div className="relative mx-4 border-t-2 border-dashed border-line">
            <span className="absolute -left-7 -top-2.5 size-5 rounded-full bg-canvas" />
            <span className="absolute -right-7 -top-2.5 size-5 rounded-full bg-canvas" />
          </div>
          <div className={cn("flex flex-col items-center px-4", compact ? "py-5" : "py-6")}>
            <div className="grid size-[176px] place-items-center rounded-2xl bg-white">
              {qr ? <img src={qr} alt="QR tiket" className="size-[164px]" /> : <div className="shimmer size-[164px] rounded-xl" />}
            </div>
            <div className="mt-3 text-[12.5px] font-medium text-muted">
              {b.status === "active" ? "Tunjukkan saat mengembalikan motor" : "Tunjukkan saat ambil motor"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10.5px] font-semibold text-muted">{k}</div>
      <div className="num truncate text-[13px] font-bold">{v}</div>
    </div>
  );
}
