"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "./store/store";

export function useNow(step = 1000) {
  const offset = useApp((s) => s.world.clockOffset);
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setT(Date.now()), step);
    return () => clearInterval(i);
  }, [step]);
  return t + offset;
}

export const useWorld = () => useApp((s) => s.world);

export function useMe() {
  const session = useApp((s) => s.session);
  const world = useApp((s) => s.world);
  const customer = session?.role === "renter" ? world.customers.find((c) => c.id === session.customerId) : undefined;
  const store = session?.role === "owner" ? world.stores.find((s) => s.id === session.storeId) : undefined;
  return { session, customer, store };
}

export function useLongPress(cb: () => void, ms = 650) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  return {
    onPointerDown: () => { clear(); timer.current = setTimeout(() => { cb(); navigator.vibrate?.(20); }, ms); },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

export const openScenario = () => window.dispatchEvent(new Event("lajur:scenario"));

export function compressImage(file: File, max = 360, quality = 0.62): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function haptic(pattern: number | number[] = 12) {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
}
