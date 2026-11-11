"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { Map as MLMap, Marker, LngLatBounds, setWorkerUrl, type GeoJSONSource, type StyleSpecification } from "maplibre-gl";
import type { LngLat, Zone } from "@/lib/domain/types";
import { cn } from "@/lib/cn";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  kind: "rental" | "me" | "meet" | "store" | "pin";
  label?: string;
  tone?: "brand" | "danger" | "warn" | "muted" | "ok";
  pulse?: boolean;
  selected?: boolean;
  stale?: boolean;
}

if (typeof window !== "undefined") setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const FALLBACK: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "bg", type: "background", paint: { "background-color": "#eef0f6" } }],
};

const TONE_HEX = { brand: "#1e2a78", danger: "#c0362c", warn: "#b4610e", muted: "#8a8ea3", ok: "#1f7a4d" } as const;

function markerHtml(m: MapMarker) {
  const c = TONE_HEX[m.tone ?? "brand"];
  if (m.kind === "me") {
    return `<div style="position:relative;width:22px;height:22px">
      <span style="position:absolute;inset:0;border-radius:999px;background:${c};opacity:.25;animation:pulse-ring 1.8s cubic-bezier(.23,1,.32,1) infinite"></span>
      <span style="position:absolute;inset:3px;border-radius:999px;background:${c};border:3px solid #fff;box-shadow:0 2px 6px rgba(20,23,43,.3)"></span></div>`;
  }
  if (m.kind === "meet" || m.kind === "store" || m.kind === "pin") {
    const icon = m.kind === "store"
      ? `<path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM3 6l2-3h14l2 3v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" fill="#fff"/>`
      : `<circle cx="12" cy="10" r="3.2" fill="${c}"/>`;
    return `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-14px)">
      <div style="display:grid;place-items:center;width:30px;height:30px;border-radius:12px;background:${m.kind === "store" ? c : "#fff"};border:${m.kind === "store" ? "0" : `3px solid ${c}`};box-shadow:0 4px 10px rgba(20,23,43,.2)">
        <svg width="16" height="16" viewBox="0 0 24 24">${icon}</svg></div>
      ${m.label ? `<div style="margin-top:4px;padding:2px 8px;border-radius:999px;background:#fff;font:700 11px/1.4 'Plus Jakarta Sans Variable',sans-serif;color:#14172b;box-shadow:0 1px 4px rgba(20,23,43,.15);white-space:nowrap">${m.label}</div>` : ""}
    </div>`;
  }
  const ring = m.selected ? `0 0 0 4px rgba(30,42,120,.18),` : "";
  return `<div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;opacity:${m.stale ? 0.55 : 1}">
    ${m.pulse ? `<span style="position:absolute;top:0;left:50%;margin-left:-19px;width:38px;height:38px;border-radius:999px;background:${c};animation:pulse-ring 1.6s cubic-bezier(.23,1,.32,1) infinite"></span>` : ""}
    <div style="position:relative;display:grid;place-items:center;width:38px;height:38px;border-radius:999px;background:${c};border:3px solid #fff;box-shadow:${ring}0 4px 12px rgba(20,23,43,.28);color:#fff;font:800 12px 'Plus Jakarta Sans Variable',sans-serif">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17" r="2.5"/><circle cx="18.5" cy="17" r="2.5"/><path d="M8 17h7l3-6h-4l-2-4H9"/><path d="M5.5 17 8 11h4"/></svg>
    </div>
    ${m.label ? `<div style="margin-top:3px;padding:2px 7px;border-radius:999px;background:#fff;font:700 11px/1.4 'Plus Jakarta Sans Variable',sans-serif;color:${m.tone === "danger" ? c : "#14172b"};box-shadow:0 1px 4px rgba(20,23,43,.15);white-space:nowrap">${m.label}</div>` : ""}
  </div>`;
}

export function LiveMap({
  center, zoom = 12.5, zones = [], markers = [], trails = [], onMarkerClick, fit, className, interactive = true, padding,
}: {
  center: LngLat;
  zoom?: number;
  zones?: Zone[];
  markers?: MapMarker[];
  trails?: { id: string; coords: LngLat[]; tone?: "brand" | "danger" }[];
  onMarkerClick?: (id: string) => void;
  fit?: { key: string; points: LngLat[]; maxZoom?: number } | null;
  className?: string;
  interactive?: boolean;
  padding?: { top: number; bottom: number; left: number; right: number };
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const mk = useRef(new Map<string, { m: Marker; el: HTMLDivElement; html: string; anim?: number; at: LngLat }>());
  const [styleV, setStyleV] = useState(0);
  const ready = styleV > 0;
  const clickRef = useRef(onMarkerClick);
  clickRef.current = onMarkerClick;

  useEffect(() => {
    if (!el.current) return;
    const m = new MLMap({
      container: el.current, style: STYLE_URL, center, zoom, attributionControl: { compact: true },
      interactive, dragRotate: false, pitchWithRotate: false, fadeDuration: 0,
    });
    m.touchZoomRotate.disableRotation();
    let fellBack = false;
    const fallback = setTimeout(() => { if (!m.isStyleLoaded()) { fellBack = true; m.setStyle(FALLBACK); } }, 5000);
    m.on("error", () => { if (!fellBack && !m.isStyleLoaded()) { fellBack = true; clearTimeout(fallback); m.setStyle(FALLBACK); } });
    const onLoad = () => {
      clearTimeout(fallback);
      if (!m.getSource("zones")) {
        m.addSource("zones", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addSource("trails", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        m.addLayer({ id: "zone-fill", type: "fill", source: "zones", paint: { "fill-color": ["get", "color"], "fill-opacity": ["get", "opacity"] } });
        m.addLayer({ id: "zone-line", type: "line", source: "zones", paint: { "line-color": ["get", "color"], "line-width": 2, "line-opacity": 0.75, "line-dasharray": [2, 1.5] } });
        m.addLayer({ id: "trail", type: "line", source: "trails", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ["get", "color"], "line-width": 4, "line-opacity": 0.85 } });
      }
      setStyleV((v) => v + 1);
    };
    m.on("style.load", onLoad);
    map.current = m;
    return () => { clearTimeout(fallback); mk.current.forEach((x) => x.m.remove()); mk.current.clear(); m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const src = m.getSource("zones") as GeoJSONSource | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: zones.filter((z) => z.active).map((z) => ({
        type: "Feature",
        properties: {
          color: z.kind === "service" ? "#1e2a78" : z.kind === "monitor" ? "#b4610e" : "#c0362c",
          opacity: z.kind === "service" ? 0.035 : 0.13,
        },
        geometry: { type: "Polygon", coordinates: [z.polygon] },
      })),
    });
  }, [zones, styleV]);

  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    (m.getSource("trails") as GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: trails.filter((t) => t.coords.length > 1).map((t) => ({
        type: "Feature", properties: { color: t.tone === "danger" ? "#c0362c" : "#1e2a78" },
        geometry: { type: "LineString", coordinates: t.coords },
      })),
    });
  }, [trails, styleV]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const seen = new Set<string>();
    for (const x of markers) {
      seen.add(x.id);
      const html = markerHtml(x);
      const to: LngLat = [x.lng, x.lat];
      const cur = mk.current.get(x.id);
      if (!cur) {
        const div = document.createElement("div");
        div.innerHTML = html;
        div.addEventListener("click", (e) => { e.stopPropagation(); clickRef.current?.(x.id); });
        const marker = new Marker({ element: div, anchor: x.kind === "rental" ? "top" : "center", offset: x.kind === "rental" ? [0, -19] : [0, 0] }).setLngLat(to).addTo(m);
        mk.current.set(x.id, { m: marker, el: div, html, at: to });
        continue;
      }
      if (cur.html !== html) { cur.el.innerHTML = html; cur.html = html; }
      if (cur.at[0] !== to[0] || cur.at[1] !== to[1]) {
        const from = cur.m.getLngLat();
        const t0 = performance.now();
        if (cur.anim) cancelAnimationFrame(cur.anim);
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / 900);
          const e = 1 - Math.pow(1 - k, 3);
          cur.m.setLngLat([from.lng + (to[0] - from.lng) * e, from.lat + (to[1] - from.lat) * e]);
          if (k < 1) cur.anim = requestAnimationFrame(step);
        };
        cur.anim = requestAnimationFrame(step);
        cur.at = to;
      }
    }
    for (const [id, x] of mk.current) if (!seen.has(id)) { x.m.remove(); mk.current.delete(id); }
  }, [markers]);

  const fitKey = fit?.key;
  useEffect(() => {
    const m = map.current;
    if (!m || !fit || !fit.points.length) return;
    if (fit.points.length === 1) {
      m.easeTo({ center: fit.points[0], zoom: Math.max(m.getZoom(), fit.maxZoom ?? 14), duration: 700, padding });
      return;
    }
    const b = new LngLatBounds(fit.points[0], fit.points[0]);
    fit.points.forEach((p) => b.extend(p));
    m.fitBounds(b, { padding: padding ?? 60, maxZoom: fit.maxZoom ?? 14.5, duration: 700 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, styleV]);

  return <div ref={el} className={cn("relative h-full w-full overflow-hidden bg-[#eef0f6]", className)} />;
}
