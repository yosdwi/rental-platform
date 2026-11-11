import { MotorArt } from "@/components/moto/motor-art";

export function HeroScene() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e8ebf8]">
      <svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden>
        <circle cx="300" cy="92" r="34" fill="#fff4d8" />
        <path d="M0 210 C 70 150, 130 160, 190 190 S 320 150, 400 175 L400 320 L0 320 Z" fill="#cfd4ef" />
        <path d="M0 240 C 90 200, 160 215, 240 230 S 360 205, 400 220 L400 320 L0 320 Z" fill="#b5bce6" />
        <path d="M-10 320 C 80 270, 170 262, 250 258 C 320 255, 360 250, 410 236 L410 320 Z" fill="#9aa2da" />
        <path d="M60 320 C 140 280, 230 268, 410 262" stroke="#fff" strokeWidth="2.5" strokeDasharray="10 12" fill="none" opacity="0.65" />
        <g opacity="0.9">
          <path d="M70 182 l6 -22 l6 22 Z M120 176 l7 -26 l7 26 Z M330 196 l6 -20 l6 20 Z" fill="#8d95cf" />
        </g>
        <path d="M262 132 c0 -16 26 -16 26 0 c0 12 -13 24 -13 24 s-13 -12 -13 -24z" fill="#1e2a78" />
        <circle cx="275" cy="132" r="5" fill="#fff" />
        <path d="M150 238 C 190 190, 230 170, 270 160" stroke="#1e2a78" strokeWidth="2.5" strokeDasharray="1 8" strokeLinecap="round" fill="none" opacity="0.55" />
      </svg>
      <div className="absolute bottom-[10%] left-[14%] w-[44%] max-w-[210px] drop-shadow-[0_8px_10px_rgba(20,23,43,0.12)]">
        <MotorArt color="#1e2a78" kind="matic" />
      </div>
    </div>
  );
}
