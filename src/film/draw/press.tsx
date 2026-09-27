import React from "react";
import { clamp01 } from "../../animation/interpolate-clamped";
import { createPrng } from "../../animation/stroke-draw";
import { mixColor, PALETTE } from "../../theme/palette";
import { FONT_DISPLAY, FONT_SANS } from "../../typography/fonts";

/**
 * Monte Chingolo beat (storyboard 09, spec §2.9): a deterministic,
 * non-graphic architectural blast — fractured windows and roof plates, one
 * flat smoke mass — whose smoke becomes the halftone of an authored,
 * clearly labelled newspaper reconstruction. No bodies, no fireball, no
 * particles, no real masthead.
 */
const SHARDS = (() => {
  const r = createPrng(1975);
  return Array.from({ length: 16 }, (_, i) => {
    const x = 120 + r() * 260;
    const y = -130 - r() * 30;
    const w = 14 + r() * 26;
    const h = 6 + r() * 12;
    const a = (i / 16) * Math.PI - Math.PI;
    return { x, y, w, h, vx: Math.cos(a) * (40 + r() * 60), vy: -40 - r() * 90, rot: (r() - 0.5) * 120 };
  });
})();

const CRACKS = "M 150 -120 L 170 -96 L 162 -70 M 170 -96 L 196 -88 M 240 -126 L 232 -100 L 248 -78 L 240 -50 M 232 -100 L 212 -92 M 300 -118 L 318 -90 L 306 -64 M 318 -90 L 344 -96 M 262 -40 L 280 -20 L 272 0";

/** Blast overlay drawn in the arsenal façade's local plane (0…W, up negative). */
export const ArsenalBlast: React.FC<{ t: number; smoke: number }> = ({ t, smoke }) => {
  if (t <= 0 && smoke <= 0.002) {
    return null;
  }
  const k = clamp01(t);
  return (
    <g>
      {k > 0 ? <path d={CRACKS} fill="none" stroke={PALETTE.deepBlue} strokeWidth={1.4} vectorEffect="non-scaling-stroke" opacity={Math.min(1, k * 4)} /> : null}
      {SHARDS.map((s, i) => {
        const e = Math.min(1, k * 1.4);
        const x = s.x + s.vx * e;
        const y = s.y + s.vy * e + 60 * e * e;
        return (
          <rect
            key={i}
            x={x - s.w / 2}
            y={y - s.h / 2}
            width={s.w}
            height={s.h}
            fill={mixColor(PALETTE.grayBlue, PALETTE.paperWarm, 0.3)}
            stroke={PALETTE.deepBlue}
            strokeWidth={0.8}
            vectorEffect="non-scaling-stroke"
            transform={`rotate(${(s.rot * e).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}
            opacity={1 - clamp01((k - 0.6) / 0.4)}
          />
        );
      })}
      {smoke > 0.002 ? (
        <g opacity={smoke}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const g = clamp01(k * 1.2);
            const cx = 250 + (i - 3) * 34 * (0.6 + g);
            const cy = -150 - 60 * g - (i % 3) * 22;
            const r = (30 + (i % 3) * 14) * (0.5 + g);
            return (
              <g key={i}>
                <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.72} fill={PALETTE.paperWarm} stroke={PALETTE.deepBlueSoft} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.72} fill="url(#film-halftone)" opacity={clamp01((smoke - 0.2) * 1.4) * 0.5} />
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
};

/** Authored front page (ground plane, local units ~760 × 560). */
export const FrontPage: React.FC<{ w: number; h: number; reveal: number; stamp: number }> = ({ w, h, reveal, stamp }) => {
  const ink = PALETTE.deepBlue;
  const gray = PALETTE.grayBlue;
  const cols = 5;
  const colW = (w - 60) / cols;
  let rules = "";
  for (let c = 0; c < cols; c++) {
    const x0 = 30 + c * colW + 8;
    const x1 = 30 + (c + 1) * colW - 8;
    const top = c < 3 ? 330 : 190;
    for (let y = top; y < h - 26; y += 11) {
      rules += `M ${x0.toFixed(1)} ${y} H ${(x1 - ((y * 7 + c * 13) % 40)).toFixed(1)} `;
    }
  }
  return (
    <g data-id="newspaper.reconstruction">
      <defs>
        <clipPath id="page-reveal">
          <circle cx={w * 0.4} cy={h * 0.45} r={Math.max(0, reveal) * w * 0.9} />
        </clipPath>
      </defs>
      <g clipPath="url(#page-reveal)">
        <rect x={0} y={0} width={w} height={h} fill={PALETTE.paperWarm} stroke={ink} strokeWidth={1.4} />
        {/* Generic top band: no masthead of any real newspaper. */}
        <path d={`M 30 34 H ${w - 30} M 30 40 H ${w - 30} M 30 78 H ${w - 30}`} stroke={ink} strokeWidth={1.1} />
        <text x={30} y={62} fontFamily={FONT_SANS} fontWeight={500} fontSize={15} letterSpacing={3} fill={PALETTE.deepBlueSoft}>
          BUENOS AIRES · MIÉRCOLES 24 DE DICIEMBRE DE 1975
        </text>
        <text x={30} y={134} fontFamily={FONT_DISPLAY} fontWeight={600} fontSize={52} fill={ink}>
          TERRORISMO: EL ERP ATACA
        </text>
        <text x={30} y={186} fontFamily={FONT_DISPLAY} fontWeight={600} fontSize={52} fill={ink}>
          UN ARSENAL MILITAR
        </text>
        <text x={30} y={216} fontFamily={FONT_SANS} fontWeight={500} fontSize={15} letterSpacing={1.2} fill={PALETTE.deepBlueSoft}>
          MONTE CHINGOLO · BATALLÓN DEPÓSITO DE ARSENALES 601 “DOMINGO VIEJOBUENO”
        </text>
        {/* Halftone plate born from the smoke. */}
        <rect x={30} y={234} width={colW * 3 - 16} height={86} fill="url(#film-halftone)" stroke={gray} strokeWidth={1} />
        <path d={rules} stroke={gray} strokeWidth={1.2} />
        <path d={Array.from({ length: cols - 1 }, (_, c) => `M ${30 + (c + 1) * colW} 234 V ${h - 24}`).join(" ")} stroke={gray} strokeWidth={0.8} opacity={0.6} />
      </g>
      {stamp > 0.002 ? (
        <g opacity={stamp} data-id="stamp.recreacion">
          <rect x={w - 292} y={h - 66} width={262} height={40} fill={PALETTE.paperWarm} stroke={ink} strokeWidth={2} />
          <text x={w - 161} y={h - 40} textAnchor="middle" fontFamily={FONT_SANS} fontWeight={500} fontSize={17} letterSpacing={3.4} fill={ink}>
            RECREACIÓN GRÁFICA
          </text>
        </g>
      ) : null}
    </g>
  );
};
