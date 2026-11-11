"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Bike, ClipboardList, Home, Map, ScanLine, Settings } from "lucide-react";
import { useApp, nowOf } from "@/lib/store/store";
import { computeAlerts } from "@/lib/live";
import { useNow } from "@/lib/hooks";
import { BrandButton } from "@/components/brand/logo";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/mitra", label: "Beranda", icon: Home },
  { href: "/mitra/sewa", label: "Sewa", icon: ClipboardList },
  { href: "/mitra/peta", label: "Peta", icon: Map },
  { href: "/mitra/unit", label: "Unit", icon: Bike },
];

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useApp((s) => s.session);
  useEffect(() => {
    if (!session) router.replace("/masuk?mitra=1");
    else if (session.role !== "owner") router.replace("/beranda");
  }, [session, router]);
  if (!session || session.role !== "owner") return null;
  const isTab = TABS.some((t) => t.href === pathname) || pathname === "/mitra/pengaturan";
  const fullBleed = pathname === "/mitra/peta" || pathname === "/mitra/pindai";
  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <Sidebar pathname={pathname} storeId={session.storeId} />
      <main className={cn("relative mx-auto w-full lg:max-w-none", fullBleed ? "" : "max-w-[560px] lg:max-w-[880px] lg:px-6")}>
        {children}
        {isTab && !fullBleed && <div className="h-28 lg:hidden" />}
      </main>
      {isTab && <BottomNav pathname={pathname} storeId={session.storeId} />}
    </div>
  );
}

function useBadges(storeId: string) {
  const world = useApp((s) => s.world);
  const now = useNow(3000);
  const pending = world.bookings.filter((b) => b.storeId === storeId && (b.status === "pending" || b.extension?.status === "pending")).length;
  const alerts = computeAlerts(world, now, { storeId }).length;
  return { "/mitra/sewa": pending, "/mitra/peta": alerts } as Record<string, number>;
}

function BottomNav({ pathname, storeId }: { pathname: string; storeId: string }) {
  const badges = useBadges(storeId);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[560px] items-center gap-2.5 px-4 pb-[max(env(safe-area-inset-bottom),14px)] lg:hidden">
      <div className="flex flex-1 items-center justify-around rounded-full border border-line bg-surface/92 p-1.5 shadow-[0_8px_30px_rgba(20,23,43,0.12)] backdrop-blur-xl">
        {TABS.map((t) => {
          const active = pathname === t.href;
          const n = badges[t.href] ?? 0;
          return (
            <Link key={t.href} href={t.href} className="press relative flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-semibold">
              {active && <motion.span layoutId="owner-tab" transition={{ type: "spring", duration: 0.4, bounce: 0.18 }} className="absolute inset-0 rounded-full bg-brand" />}
              <t.icon className={cn("relative size-[18px]", active ? "text-white" : "text-muted")} strokeWidth={2.2} />
              {active && <span className="relative text-white">{t.label}</span>}
              {n > 0 && !active && <span className="num absolute right-[18%] top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white">{n}</span>}
            </Link>
          );
        })}
      </div>
      <Link href="/mitra/pindai" aria-label="Pindai tiket" className="press grid size-14 shrink-0 place-items-center rounded-full bg-brand text-white shadow-[0_8px_24px_rgba(30,42,120,0.35)]">
        <ScanLine className="size-6" />
      </Link>
    </nav>
  );
}

function Sidebar({ pathname, storeId }: { pathname: string; storeId: string }) {
  const badges = useBadges(storeId);
  const store = useApp((s) => s.world.stores.find((x) => x.id === storeId));
  const items = [...TABS, { href: "/mitra/pindai", label: "Pindai tiket", icon: ScanLine }, { href: "/mitra/pengaturan", label: "Pengaturan", icon: Settings }];
  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
      <BrandButton size={32} />
      <div className="mt-6 rounded-2xl bg-canvas px-3.5 py-3">
        <div className="text-[11.5px] font-semibold text-muted">Toko</div>
        <div className="truncate text-[14px] font-bold">{store?.name}</div>
      </div>
      <div className="mt-4 space-y-1">
        {items.map((t) => {
          const active = pathname === t.href;
          const n = badges[t.href] ?? 0;
          return (
            <Link key={t.href} href={t.href} className={cn("press flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold", active ? "bg-brand text-white" : "text-ink-2 hover:bg-canvas")}>
              <t.icon className="size-[18px]" />
              <span className="flex-1">{t.label}</span>
              {n > 0 && <span className="num rounded-full bg-danger px-1.5 text-[11px] leading-5 text-white">{n}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

export { nowOf };
