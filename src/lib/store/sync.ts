"use client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { SyncMessage } from "./events";
import { isNewer } from "./reducer";
import { useApp } from "./store";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kigmysgloiezucdimqui.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_YcG7pMnaCNJoNmwaZRpZQA_vyXPiaOb";
const ROOM = process.env.NEXT_PUBLIC_SYNC_ROOM || "gsm-bogor";

let started = false;

export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  const app = useApp;
  const me = app.getState().deviceId;
  let channel: RealtimeChannel | null = null;
  let online = false;
  const bc = "BroadcastChannel" in window ? new BroadcastChannel(`lajur:${ROOM}`) : null;

  const send = (msg: SyncMessage) => {
    bc?.postMessage(msg);
    if (channel && online) channel.send({ type: "broadcast", event: "m", payload: msg }).catch(() => {});
  };
  app.setState({ send });

  let lastHelloReply = 0;
  const hello = () => {
    const w = app.getState().world;
    send({ kind: "hello", from: me, worldId: w.id, epoch: w.epoch, rev: w.rev });
  };

  const handle = (msg: SyncMessage) => {
    const s = app.getState();
    switch (msg.kind) {
      case "ev": {
        if (msg.env.origin === me) return;
        const before = s.world;
        s.receive(msg.env);
        // Event dari epoch lain (atau terlewat) → minta snapshot
        if (app.getState().world === before && msg.env.epoch > before.epoch && msg.env.ev.type !== "world.reset") hello();
        break;
      }
      case "hello": {
        if (msg.from === me) return;
        const w = s.world;
        const peer = { id: msg.worldId, epoch: msg.epoch, rev: msg.rev };
        if (isNewer(w, peer)) send({ kind: "snap", from: me, world: w });
        else if (isNewer(peer, w) && Date.now() - lastHelloReply > 1500) { lastHelloReply = Date.now(); hello(); }
        // Kirim media yang kita punya (kecil, jarang)
        for (const [key, data] of Object.entries(s.media)) send({ kind: "media", key, data });
        break;
      }
      case "snap": {
        if (msg.from === me) return;
        s.adopt(msg.world);
        break;
      }
      case "media": {
        if (s.media[msg.key] !== msg.data) s.putMedia(msg.key, msg.data, false);
        break;
      }
    }
  };

  bc?.addEventListener("message", (e) => handle(e.data as SyncMessage));

  import("@supabase/supabase-js").then(({ createClient }) => {
    try {
      const sb = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 30 } } });
      channel = sb.channel(`lajur-${ROOM}`, { config: { broadcast: { self: false, ack: false } } });
      channel.on("broadcast", { event: "m" }, ({ payload }) => handle(payload as SyncMessage));
      channel.subscribe((status) => {
        online = status === "SUBSCRIBED";
        app.setState({ sync: online ? "online" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "local" : "connecting" });
        if (online) hello();
      });
    } catch {
      app.setState({ sync: "local" });
    }
  });

  hello();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") hello(); });
  window.addEventListener("online", hello);
  setInterval(hello, 15_000);
}
