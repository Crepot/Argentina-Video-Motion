import React from "react";
import { createPrng } from "../../animation/stroke-draw";
import { PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";

/**
 * Paper fibres fixed in world space for the whole film (spec §9.11/§10.11):
 * deterministic tiles (seed 1810 + tile index) drawn only around the camera,
 * at an octave that keeps fibres at a constant apparent size. Opacity ≤ 0.035.
 * Nothing changes with time except which tiles are in view.
 */
const FIBRES_PER_TILE = 34;

const tileD = (ix: number, iy: number, size: number) => {
  const rand = createPrng(1810 + ((ix * 73856093) ^ (iy * 19349663) ^ (size * 83492791)));
  let d = "";
  for (let i = 0; i < FIBRES_PER_TILE; i++) {
    const x = ix * size + rand() * size;
    const y = iy * size + rand() * size;
    const len = (0.012 + rand() * 0.028) * size;
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

const cache = new Map<string, string>();
const cachedTile = (ix: number, iy: number, size: number) => {
  const key = `${ix}:${iy}:${size}`;
  let d = cache.get(key);
  if (d === undefined) {
    d = tileD(ix, iy, size);
    cache.set(key, d);
  }
  return d;
};

export const FilmPaperFibres: React.FC<{ camera: CameraState; opacity?: number }> = ({ camera, opacity = 0.03 }) => {
  // Tile ≈ 900 screen px at the current zoom, snapped to powers of two.
  const size = Math.pow(2, Math.round(Math.log2(900 / camera.zoom)));
  const squash = Math.max(0.25, Math.cos(((camera.tilt ?? 0) * Math.PI) / 180));
  const halfW = 1300 / camera.zoom;
  const halfH = 900 / (camera.zoom * squash);
  const x0 = Math.floor((camera.x - halfW) / size);
  const x1 = Math.floor((camera.x + halfW) / size);
  const y0 = Math.floor((camera.y - halfH) / size);
  const y1 = Math.floor((camera.y + halfH) / size);
  let d = "";
  for (let ix = x0; ix <= x1; ix++) {
    for (let iy = y0; iy <= y1; iy++) {
      d += cachedTile(ix, iy, size);
    }
  }
  return (
    <path
      d={d}
      fill="none"
      stroke={PALETTE.deepBlue}
      strokeWidth={0.7}
      vectorEffect="non-scaling-stroke"
      strokeLinecap="round"
      opacity={Math.min(0.035, opacity)}
    />
  );
};
