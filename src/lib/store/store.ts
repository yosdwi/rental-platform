"use client";
import { create } from "zustand";
import type { Place, World } from "../domain/types";
import { createWorld } from "../domain/fixtures";
import type { Envelope, SyncMessage, WorldEvent } from "./events";
import { applyEnvelope, isNewer, preserveOnReset } from "./reducer";

export type Session =
  | { role: "renter"; customerId: string }
  | { role: "owner"; storeId: string };

export interface Prefs {
  place?: Place & { fromGps?: boolean };
  start?: number;
  end?: number;
  gps?: "granted" | "denied" | "unknown";
}

interface AppState {
  hydrated: boolean;
  world: World;
  deviceId: string;
  session: Session | null;
  prefs: Prefs;
  media: Record<string, string>;
  sync: "connecting" | "online" | "local";
  send: (msg: SyncMessage) => void;
  hydrate: () => void;
  dispatch: (ev: WorldEvent) => void;
  receive: (env: Envelope) => void;
  adopt: (w: World) => boolean;
  setSession: (s: Session | null) => void;
  setPrefs: (p: Partial<Prefs>) => void;
  putMedia: (key: string, data: string, broadcast?: boolean) => void;
}

export const uid = (p = "") => {
  const r = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return p + r.replace(/-/g, "").slice(0, 12);
};

const K = { world: "lajur.world.v1", session: "lajur.session", device: "lajur.device", prefs: "lajur.prefs", media: "lajur.media" };

function read<T>(k: string): T | null {
  try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : null; } catch { return null; }
}
function write(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ }
}

export const useApp = create<AppState>((set, get) => ({
  hydrated: false,
  world: createWorld(0, 0, "ssr"),
  deviceId: "ssr",
  session: null,
  prefs: {},
  media: {},
  sync: "connecting",
  send: () => {},

  hydrate: () => {
    if (get().hydrated) return;
    let deviceId = read<string>(K.device);
    if (!deviceId) { deviceId = uid("d"); write(K.device, deviceId); }
    const stored = read<World>(K.world);
    let world = stored && stored.config ? stored : createWorld(Date.now(), 0, uid("w"));
    // Data contoh yang sudah basi (>18 jam) disegarkan, selama tidak ada sewa pengguna yang masih berjalan.
    const busy = world.bookings.some((b) => b.customerId.startsWith("u-") && ["pending", "approved", "active"].includes(b.status));
    if (stored && Date.now() - stored.t0 > 18 * 3_600_000 && !busy) {
      world = { ...preserveOnReset(stored, createWorld(Date.now(), stored.epoch + 1, uid("w"))), rev: 1 };
    }
    set({
      hydrated: true, deviceId, world,
      session: read<Session>(K.session),
      prefs: read<Prefs>(K.prefs) ?? {},
      media: read<Record<string, string>>(K.media) ?? {},
    });
  },

  dispatch: (ev) => {
    const { world, deviceId, send } = get();
    const env: Envelope = {
      id: uid("e"), epoch: ev.type === "world.reset" ? ev.newEpoch : world.epoch,
      t: Date.now() + world.clockOffset, origin: deviceId, ev,
    };
    set({ world: applyEnvelope(world, env) });
    send({ kind: "ev", env });
  },

  receive: (env) => set({ world: applyEnvelope(get().world, env) }),

  adopt: (w) => {
    if (!isNewer(w, get().world)) return false;
    set({ world: w });
    return true;
  },

  setSession: (s) => { set({ session: s }); write(K.session, s); },
  setPrefs: (p) => { const prefs = { ...get().prefs, ...p }; set({ prefs }); write(K.prefs, prefs); },
  putMedia: (key, data, broadcast = true) => {
    const media = { ...get().media, [key]: data };
    set({ media });
    write(K.media, media);
    if (broadcast) get().send({ kind: "media", key, data });
  },
}));

// Simpan world ke localStorage (throttle)
if (typeof window !== "undefined") {
  let timer: ReturnType<typeof setTimeout> | null = null;
  useApp.subscribe((s, prev) => {
    if (!s.hydrated || s.world === prev.world) return;
    if (timer) return;
    timer = setTimeout(() => { timer = null; write(K.world, useApp.getState().world); }, 400);
  });
}

export const nowOf = (w: World) => Date.now() + w.clockOffset;
