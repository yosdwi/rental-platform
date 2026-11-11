"use client";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/domain/status";
import { inisial } from "@/lib/format";

export const TONE: Record<Tone, { bg: string; fg: string; dot: string }> = {
  ok: { bg: "bg-ok-soft", fg: "text-ok", dot: "bg-ok" },
  info: { bg: "bg-info-soft", fg: "text-info", dot: "bg-info" },
  brand: { bg: "bg-brand-soft", fg: "text-brand", dot: "bg-brand" },
  warn: { bg: "bg-warn-soft", fg: "text-warn", dot: "bg-warn" },
  danger: { bg: "bg-danger-soft", fg: "text-danger", dot: "bg-danger" },
  check: { bg: "bg-check-soft", fg: "text-check", dot: "bg-check" },
  maint: { bg: "bg-maint-soft", fg: "text-maint", dot: "bg-maint" },
  muted: { bg: "bg-black/[0.05]", fg: "text-muted", dot: "bg-faint" },
};

export function Chip({ tone = "muted", children, className, dot = true }: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  const t = TONE[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none whitespace-nowrap", t.bg, t.fg, className)}>
      {dot && <span className={cn("size-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}

export function Avatar({ name, src, size = 40, className, tone = "brand" }: { name: string; src?: string; size?: number; className?: string; tone?: "brand" | "light" }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full font-bold",
        tone === "brand" ? "bg-brand-soft text-brand" : "bg-white/15 text-white", className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : inisial(name)}
    </div>
  );
}

export function Section({ title, action, onAction, children, className }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("mt-6", className)}>
      <div className="mb-2.5 flex items-baseline justify-between px-1">
        <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>
        {action && <button onClick={onAction} className="press text-[13px] font-semibold text-brand">{action}</button>}
      </div>
      {children}
    </section>
  );
}

export function Row({ label, value, strong, className }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-1.5 text-[14px]", className)}>
      <span className="text-muted">{label}</span>
      <span className={cn("num text-right", strong ? "font-bold text-ink" : "font-medium text-ink-2")}>{value}</span>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, id, className, size = "md" }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode; badge?: number }[]; id: string; className?: string; size?: "md" | "sm";
}) {
  return (
    <div className={cn("flex rounded-2xl bg-black/[0.045] p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn("relative flex-1 rounded-xl font-semibold transition-colors", size === "md" ? "h-10 text-[13px]" : "h-8 text-[12px]", value === o.value ? "text-ink" : "text-muted")}
        >
          {value === o.value && (
            <motion.span layoutId={`seg-${id}`} transition={{ type: "spring", duration: 0.35, bounce: 0.15 }} className="absolute inset-0 rounded-xl bg-surface shadow-[0_1px_3px_rgba(20,23,43,0.12)]" />
          )}
          <span className="relative inline-flex items-center gap-1.5">
            {o.label}
            {!!o.badge && <span className="num grid min-w-4.5 place-items-center rounded-full bg-danger px-1 text-[10px] leading-4.5 text-white">{o.badge}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200", checked ? "bg-brand" : "bg-line-strong")}>
      <motion.span layout transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
        className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow-sm", checked ? "right-0.5" : "left-0.5")} />
    </button>
  );
}

export function ListRow({ icon, title, sub, right, onClick, className }: { icon?: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; onClick?: () => void; className?: string }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left", onClick && "press active:bg-black/[0.02]", className)}>
      {icon && <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-canvas text-ink-2">{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold">{title}</div>
        {sub && <div className="truncate text-[12.5px] text-muted">{sub}</div>}
      </div>
      {right ?? (onClick && <ChevronRight className="size-4 text-faint" />)}
    </Comp>
  );
}

export function Field({ label, children, hint, className }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[12.5px] font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-faint">{hint}</span>}
    </label>
  );
}

export const inputCls = "h-12 w-full rounded-[var(--radius-field)] border border-line bg-surface px-3.5 text-[15px] font-medium outline-none transition-colors placeholder:text-faint focus:border-brand/50 focus:ring-4 focus:ring-brand/10";

export function Empty({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</div>
      <div className="text-[15px] font-bold">{title}</div>
      {sub && <div className="mt-1 text-[13px] text-muted">{sub}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, tone, onClick }: { label: string; value: React.ReactNode; tone?: Tone; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="press flex min-w-0 flex-1 flex-col items-start rounded-2xl bg-surface px-3.5 py-3 text-left border border-line">
      <span className="num text-[22px] font-bold leading-none tracking-tight">{value}</span>
      <span className={cn("mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold", tone ? TONE[tone].fg : "text-muted")}>
        {tone && <span className={cn("size-1.5 rounded-full", TONE[tone].dot)} />}
        {label}
      </span>
    </button>
  );
}
