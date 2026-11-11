"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export function PageHeader({ title, sub, right, back, tone = "light", className }: {
  title?: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; back?: string | (() => void); tone?: "light" | "clear" | "brand"; className?: string;
}) {
  const router = useRouter();
  const goBack = () => (typeof back === "function" ? back() : back ? router.push(back) : router.back());
  return (
    <header className={cn(
      "sticky top-0 z-30 flex items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),10px)] pb-2.5",
      tone === "light" && "bg-canvas/85 backdrop-blur-xl",
      tone === "brand" && "bg-brand text-white",
      className,
    )}>
      <button onClick={goBack} aria-label="Kembali" className={cn("press grid size-10 shrink-0 place-items-center rounded-full", tone === "brand" ? "hover:bg-white/10" : tone === "clear" ? "bg-white/90 shadow-sm" : "hover:bg-black/[0.04]")}>
        <ArrowLeft className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        {title && <div className="truncate text-[16px] font-bold tracking-tight">{title}</div>}
        {sub && <div className={cn("truncate text-[12px]", tone === "brand" ? "text-white/70" : "text-muted")}>{sub}</div>}
      </div>
      {right}
    </header>
  );
}

export function BottomBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[520px] border-t border-line bg-surface/92 px-4 pt-3 pb-safe backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}
