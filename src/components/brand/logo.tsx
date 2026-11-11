"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { openScenario, useLongPress } from "@/lib/hooks";

export const BRAND = { name: "lajur", tagline: "Sewa motor, tanpa ribet" };

export function Mark({ size = 36, animate = false, light = false, className }: { size?: number; animate?: boolean; light?: boolean; className?: string }) {
  const stroke = light ? "#1e2a78" : "#ffffff";
  const bg = light ? "#ffffff" : "#1e2a78";
  const draw = animate
    ? { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.9, ease: [0.23, 1, 0.32, 1] as const } }
    : {};
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      <rect width="48" height="48" rx="14" fill={bg} />
      <motion.path d="M13 36 C 13 24, 22 20, 30 17" stroke={stroke} strokeWidth="5" strokeLinecap="round" fill="none" {...draw} />
      <motion.path d="M21 37 C 22 30, 27 27, 33 25" stroke={stroke} strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.1 5" fill="none"
        {...(animate ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5, duration: 0.4 } } : {})} />
      <motion.circle cx="35" cy="15" r="4.2" fill={stroke}
        {...(animate ? { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.75, type: "spring", bounce: 0.5, duration: 0.5 } } : {})} />
    </svg>
  );
}

export function Wordmark({ light = false, className }: { light?: boolean; className?: string }) {
  return <span className={cn("text-[22px] font-extrabold tracking-[-0.04em]", light ? "text-white" : "text-brand", className)}>{BRAND.name}</span>;
}

/** Logo yang bisa ditekan lama untuk membuka panel skenario. */
export function BrandButton({ light = false, size = 32, withWord = true }: { light?: boolean; size?: number; withWord?: boolean }) {
  const lp = useLongPress(openScenario, 900);
  return (
    <div {...lp} className="flex select-none items-center gap-2" style={{ WebkitTouchCallout: "none" }}>
      <Mark size={size} light={light} />
      {withWord && <Wordmark light={light} className="text-[19px]" />}
    </div>
  );
}
