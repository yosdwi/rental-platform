"use client";
import { motion } from "motion/react";
import { Mark, BRAND } from "./logo";

export function Splash({ label }: { label?: string }) {
  return (
    <div className="dots fixed inset-0 z-[60] grid place-items-center bg-brand">
      <div className="flex flex-col items-center">
        <motion.div initial={{ scale: 0.82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.7, bounce: 0.25 }}>
          <Mark size={84} animate light />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="mt-5 text-[34px] font-extrabold tracking-[-0.04em] text-white">
          {BRAND.name}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.85, duration: 0.4 }} className="mt-1 text-[13px] text-white">
          {label ?? BRAND.tagline}
        </motion.div>
      </div>
    </div>
  );
}

export function RideLoader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-white/85 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <svg width="132" height="70" viewBox="0 0 132 70" aria-hidden>
          <path id="arc" d="M10 60 Q 66 -6 122 60" fill="none" stroke="#d3d6e3" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round" />
          <motion.g initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "100%" }} transition={{ duration: 1.6, ease: [0.77, 0, 0.175, 1], repeat: Infinity }}
            style={{ offsetPath: "path('M10 60 Q 66 -6 122 60')", offsetRotate: "auto" }}>
            <circle r="7" fill="#1e2a78" />
            <circle r="2.5" fill="#fff" />
          </motion.g>
        </svg>
        <div className="mt-2 text-[16px] font-bold">{title}</div>
        {sub && <div className="mt-0.5 text-[13px] text-muted">{sub}</div>}
      </div>
    </div>
  );
}
