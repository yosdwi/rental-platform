"use client";
import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store/store";
import { ROUTES } from "@/lib/domain/fixtures";
import { pointAlong } from "@/lib/domain/geo";

/** Menggerakkan posisi sepanjang rute, hanya di perangkat yang memulai simulasi. */
export function SimRunner() {
  const progress = useRef(0);
  const sim = useApp((s) => s.world.sim);
  const deviceId = useApp((s) => s.deviceId);
  const mine = sim.running && sim.runner === deviceId && !!sim.bookingId && !!sim.routeId;

  useEffect(() => { progress.current = sim.progress; }, [sim.progress, sim.routeId, sim.bookingId]);

  useEffect(() => {
    if (!mine) return;
    const route = ROUTES[sim.routeId!];
    const i = setInterval(() => {
      const { world, dispatch } = useApp.getState();
      progress.current = Math.min(1, progress.current + world.sim.speed / 60);
      const [lng, lat] = pointAlong(route.path, progress.current);
      const t = Date.now() + world.clockOffset;
      if (!world.sim.signalOff[sim.bookingId!]) {
        dispatch({ type: "loc", bookingId: sim.bookingId!, pos: { lat, lng, acc: 6 + Math.round(Math.random() * 6), t, src: "sim" } });
      }
      if (progress.current >= 1) dispatch({ type: "sim", patch: { running: false, progress: 1 } });
    }, 1000);
    return () => clearInterval(i);
  }, [mine, sim.routeId, sim.bookingId]);

  return null;
}

/** GPS asli dari HP penyewa selama sewa aktif. */
export function GpsTracker() {
  const session = useApp((s) => s.session);
  const booking = useApp((s) =>
    s.session?.role === "renter"
      ? s.world.bookings.find((b) => b.customerId === (s.session as { customerId: string }).customerId && b.status === "active")
      : undefined,
  );
  const id = booking?.id;
  const last = useRef<{ t: number; lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!id || session?.role !== "renter" || !("geolocation" in navigator)) return;
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        const { world, dispatch } = useApp.getState();
        if ((world.sim.running && world.sim.bookingId === id) || world.sim.signalOff[id]) return;
        const t = Date.now() + world.clockOffset;
        const l = last.current;
        const moved = l ? Math.hypot(l.lat - p.coords.latitude, l.lng - p.coords.longitude) * 111_000 : Infinity;
        if (l && t - l.t < 5000 && moved < 15) return;
        if (l && moved < 15 && t - l.t < 12_000) return;
        last.current = { t, lat: p.coords.latitude, lng: p.coords.longitude };
        dispatch({ type: "loc", bookingId: id, pos: { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy), t, src: "phone" } });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 20_000 },
    );
    // Detak: kirim ulang posisi terakhir supaya rental tahu HP masih aktif walau diam.
    const beat = setInterval(() => {
      const { world, dispatch } = useApp.getState();
      const l = last.current;
      if (!l || (world.sim.running && world.sim.bookingId === id) || world.sim.signalOff[id]) return;
      const t = Date.now() + world.clockOffset;
      if (t - l.t < 15_000) return;
      last.current = { ...l, t };
      dispatch({ type: "loc", bookingId: id, pos: { lat: l.lat, lng: l.lng, acc: 12, t, src: "phone" } });
    }, 5000);
    // Layar tetap menyala selama sewa aktif (bila didukung).
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const acquire = () => { if (document.visibilityState === "visible") nav.wakeLock?.request("screen").then((l) => { lock = l; }).catch(() => {}); };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      navigator.geolocation.clearWatch(watch);
      clearInterval(beat);
      document.removeEventListener("visibilitychange", acquire);
      lock?.release().catch(() => {});
    };
  }, [id, session?.role]);

  return null;
}
