"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Home, QrCode, Ticket, User } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/store/store";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/sheet";
import { TicketCard } from "@/components/renter/ticket";

const TABS = [
  { href: "/beranda", label: "Beranda", icon: Home },
  { href: "/tiket", label: "Sewa", icon: Ticket },
  { href: "/akun", label: "Akun", icon: User },
];

export function RenterShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useApp((s) => s.session);
  useEffect(() => {
    if (!session) router.replace("/masuk");
    else if (session.role === "owner") router.replace("/mitra");
  }, [session, router]);
  if (!session || session.role !== "renter") return null;
  const showNav = TABS.some((t) => t.href === pathname);
  return (
    <div className="relative mx-auto min-h-dvh max-w-[520px] bg-canvas">
      {children}
      {showNav && <RenterNav pathname={pathname} />}
    </div>
  );
}

function RenterNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const customerId = useApp((s) => (s.session?.role === "renter" ? s.session.customerId : ""));
  const ticket = useApp((s) =>
    s.world.bookings
      .filter((b) => b.customerId === customerId && (b.status === "active" || b.status === "approved"))
      .sort((a, b) => (a.status === "active" ? 0 : 1) - (b.status === "active" ? 0 : 1) || a.start - b.start)[0],
  );
  return (
    <>
      <div className="h-28" />
      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[520px] items-center gap-2.5 px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
        <div className="flex flex-1 items-center justify-around rounded-full border border-line bg-surface/90 p-1.5 shadow-[0_8px_30px_rgba(20,23,43,0.12)] backdrop-blur-xl">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link key={t.href} href={t.href} className="press relative flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold">
                {active && <motion.span layoutId="renter-tab" transition={{ type: "spring", duration: 0.4, bounce: 0.18 }} className="absolute inset-0 rounded-full bg-brand" />}
                <t.icon className={cn("relative size-[18px]", active ? "text-white" : "text-muted")} strokeWidth={2.2} />
                {active && <span className="relative text-white">{t.label}</span>}
              </Link>
            );
          })}
        </div>
        <button
          aria-label="Tiket"
          onClick={() => (ticket ? setOpen(true) : toast("Belum ada tiket", { description: "Tiket muncul setelah sewa disetujui." }))}
          className="press relative grid size-14 shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_8px_24px_rgba(30,42,120,0.35)]"
        >
          <QrCode className="size-6" />
          {ticket && <span className="absolute right-1 top-1 size-3 rounded-full border-2 border-white bg-ok" />}
        </button>
      </nav>
      {ticket && (
        <Sheet open={open} onOpenChange={setOpen} title="Tiket sewa" hideTitle>
          <div className="pt-2 pb-4"><TicketCard booking={ticket} compact /></div>
        </Sheet>
      )}
    </>
  );
}
