import type { VehicleKind } from "@/lib/domain/types";

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt)));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const BODY: Record<VehicleKind, string> = {
  // Skuter matic standar (BeAT/Vario)
  matic: "M12 58 C12 49 19 44 30 43 L74 41 C81 41 85 45 87 51 L90 61 L103 61 C105 49 108 37 112 30 C114 26 118 24 122 26 L125 29 C122 39 119 51 117 63 L110 70 L92 70 L84 68 C70 70 50 70 40 67 C30 64 16 64 12 58 Z",
  // Skuter besar (NMAX/PCX)
  maxi: "M8 56 C8 45 17 39 30 38 L76 37 C84 37 88 42 90 49 L93 61 L104 61 C106 47 110 34 115 27 C117 23 122 21 126 24 L129 28 C125 39 121 52 118 64 L111 71 L93 71 L85 69 C70 71 48 71 36 67 C24 64 10 64 8 56 Z",
  // Skuter klasik (Scoopy/Fazzio)
  retro: "M14 58 C12 47 22 42 34 42 L72 41 C81 41 86 46 87 53 L89 61 L101 61 C100 47 104 33 113 27 C118 24 124 26 124 32 C121 44 119 54 117 64 L110 70 L92 70 L84 68 C70 70 50 70 40 67 C28 65 16 66 14 58 Z",
  // Sport matic (Aerox)
  sport: "M8 54 L22 42 L78 38 C85 38 89 43 90 49 L93 61 L104 61 C107 48 110 36 115 28 L126 23 L129 28 C125 39 121 52 118 64 L111 71 L93 71 L85 69 C70 71 48 71 36 67 C24 64 10 62 8 54 Z",
};

/** Ilustrasi skuter tampak samping (menghadap kanan), warna mengikuti unit. */
export function MotorArt({ color, kind = "matic", className }: { color: string; kind?: VehicleKind; className?: string }) {
  const dark = shade(color, -40);
  const light = shade(color, 46);
  const big = kind === "maxi" || kind === "sport";
  const retro = kind === "retro";
  const seatY = big ? 37 : 41;
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden>
      <ellipse cx="84" cy="96" rx="66" ry="3.5" fill="#14172b" opacity="0.08" />
      {/* roda belakang */}
      <circle cx="36" cy="80" r="15.5" fill="#1b1d24" />
      <circle cx="36" cy="80" r="9" fill="#454956" />
      <circle cx="36" cy="80" r="3" fill="#cfd2db" />
      {/* roda depan */}
      <circle cx="132" cy="80" r="15.5" fill="#1b1d24" />
      <circle cx="132" cy="80" r="9" fill="#454956" />
      <circle cx="132" cy="80" r="3" fill="#cfd2db" />
      {/* garpu depan */}
      <path d="M121 38 L132 80" stroke="#8a8e9b" strokeWidth="4" strokeLinecap="round" />
      {/* knalpot & blok mesin */}
      <rect x="14" y="71" width="26" height="6" rx="3" fill="#b3b7c2" />
      <path d="M38 66 L84 67 L79 77 C66 80 52 80 42 78 Z" fill="#2c2f39" />
      {/* bodi utama */}
      <path d={BODY[kind]} fill={color} />
      {/* lantai/dek */}
      <path d={big ? "M93 61 L104 61 L103 66 L92 66 Z" : "M90 61 L103 61 L102 66 L89 66 Z"} fill={dark} opacity="0.55" />
      {/* garis kilau */}
      <path d={big ? "M16 50 C30 42 58 41 80 42" : retro ? "M20 52 C32 46 56 45 76 46" : "M18 52 C32 46 56 45 78 46"} stroke={light} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.75" />
      <path d={retro ? "M106 58 C106 47 109 37 116 31" : "M107 58 C109 47 111 38 115 32"} stroke={dark} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35" />
      {/* jok */}
      <path d={`M28 ${seatY + 1} C33 ${seatY - 7} 66 ${seatY - 9} 80 ${seatY - 4} C83 ${seatY - 3} 83 ${seatY + 1} 79 ${seatY + 1} Z`} fill="#1d1f27" />
      {/* lampu belakang */}
      <path d={big ? "M8 54 L13 50 L14 54 Z" : "M12 56 L17 52 L18 56 Z"} fill="#e0533f" />
      {/* spakbor depan */}
      <path d="M119 67 C123 59 141 57 149 66 L143 67 C138 62 127 62 123 68 Z" fill={dark} />
      {/* setang & spion */}
      <path d={big ? "M122 24 L124 13" : "M119 27 L121 16"} stroke="#2c2f39" strokeWidth="3.4" strokeLinecap="round" />
      <path d={big ? "M114 14 L134 11" : "M111 17 L131 14"} stroke="#2c2f39" strokeWidth="3.6" strokeLinecap="round" />
      <path d={big ? "M127 12 L129 4" : "M124 15 L126 7"} stroke="#2c2f39" strokeWidth="1.6" />
      <ellipse cx={big ? 130 : 127} cy={big ? 4 : 7} rx="3.6" ry="2.1" fill="#2c2f39" />
      {big && <path d="M118 25 C120 17 124 12 128 10" stroke="#c9d6ea" strokeWidth="3" strokeLinecap="round" opacity="0.8" />}
      {/* lampu depan */}
      {retro ? <circle cx="121" cy="30" r="4.6" fill="#fff6d6" stroke={dark} strokeWidth="1.6" /> : <path d={big ? "M124 30 L131 26 L130 33 Z" : "M121 32 L128 28 L127 35 Z"} fill="#fff6d6" />}
    </svg>
  );
}
