import React from "react";
import { createPrng } from "../animation/stroke-draw";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../atlas/atlas-constants";
import { PALETTE } from "../theme/palette";

/**
 * Deterministic paper (§9.11, §10.11). Fibres are generated once with seed
 * 1810 and live in world space (layer 5, parallax 0.92); the print grain is
 * a fixed screen tile. No feTurbulence, nothing changes per frame.
 */
const FIBRE_COUNT = 520;

const fibres = (seed: number, count: number) => {
  const rand = createPrng(seed);
  let d = "";
  for (let i = 0; i < count; i++) {
    const x = 1900 + rand() * 5400;
    const y = 1250 + rand() * 2700;
    const len = 8 + rand() * 26;
    const a = rand() * Math.PI;
    const bend = (rand() - 0.5) * len * 0.5;
    const x1 = x + Math.cos(a) * len;
    const y1 = y + Math.sin(a) * len;
    const mx = (x + x1) / 2 - Math.sin(a) * bend;
    const my = (y + y1) / 2 + Math.cos(a) * bend;
    d += `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)} `;
  }
  return d;
};

const FIBRES_D = fibres(1810, FIBRE_COUNT);

const GRAIN_TILE = 192;
const GRAIN_D = (() => {
  const rand = createPrng(1810 * 7);
  let d = "";
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(rand() * GRAIN_TILE);
    const y = Math.floor(rand() * GRAIN_TILE);
    d += `M${x} ${y}h1v1h-1z`;
  }
  return d;
})();

export interface PaperTextureProps {
  seed: 1810;
  worldOpacity: number;
  screenGrainOpacity: number;
  fiberCount: number;
  /** World units per screen pixel at the current zoom. */
  pxToWorld: number;
}

/** World-space fibres. Render inside the paperFiber world layer. */
export const PaperFibres: React.FC<PaperTextureProps> = ({
  worldOpacity,
  pxToWorld,
}) => (
  <path
    d={FIBRES_D}
    fill="none"
    stroke={PALETTE.deepBlue}
    strokeWidth={0.7 * pxToWorld}
    strokeLinecap="round"
    opacity={Math.min(0.035, worldOpacity)}
  />
);

/** Screen-fixed print grain. Render at the top of the SVG, outside world layers. */
export const PaperGrain: React.FC<
  Pick<PaperTextureProps, "screenGrainOpacity">
> = ({ screenGrainOpacity }) => (
  <>
    <defs>
      <pattern
        id="paper-grain"
        width={GRAIN_TILE}
        height={GRAIN_TILE}
        patternUnits="userSpaceOnUse"
      >
        <path d={GRAIN_D} fill={PALETTE.deepBlue} />
      </pattern>
    </defs>
    <rect
      width={VIEWPORT_WIDTH}
      height={VIEWPORT_HEIGHT}
      fill="url(#paper-grain)"
      opacity={Math.min(0.018, screenGrainOpacity)}
    />
  </>
);

/** Very faint survey ruling on the far-grid layer (0.95 parallax): paper depth only. */
const SURVEY_D = (() => {
  let d = "";
  for (let x = 1950; x <= 7300; x += 52) {
    d += `M ${x} 1300 V 3900 `;
  }
  for (let y = 1300; y <= 3900; y += 45) {
    d += `M 1950 ${y} H 7300 `;
  }
  return d;
})();

export const SurveyRuling: React.FC<{ opacity: number; pxToWorld: number }> = ({
  opacity,
  pxToWorld,
}) => (
  <path
    d={SURVEY_D}
    fill="none"
    stroke={PALETTE.grayBlue}
    strokeWidth={0.6 * pxToWorld}
    opacity={opacity}
  />
);
