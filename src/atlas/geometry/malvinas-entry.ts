import type { Point } from "../../types/paths";
import { polylineToPath, sampleRange } from "../../paths/interpolate-path";
import { geo } from "../south-atlantic-geometry";

/**
 * Simplified Islas Malvinas outlines (lonW, latS), hand-authored at editorial
 * resolution from approximate coordinates. Pending cartographic verification
 * (storyboard §F) before the full film; inside the benchmark they only reach
 * 0.28 opacity and carry no sovereignty label yet (§8.17).
 */
// Gran Malvina: north coast, Falkland Sound shore (east), Cape Meredith (south), west coast.
const GRAN_MALVINA: readonly (readonly [number, number])[] = [
  [60.55, 51.31],
  [60.22, 51.3],
  [59.98, 51.36],
  [59.78, 51.44],
  [59.63, 51.55],
  [59.72, 51.63],
  [59.67, 51.73],
  [59.8, 51.8],
  [59.74, 51.9],
  [59.88, 52.0],
  [59.98, 52.12],
  [60.16, 52.21],
  [60.44, 52.28],
  [60.64, 52.24],
  [60.76, 52.12],
  [61.0, 52.03],
  [61.16, 51.91],
  [61.32, 51.8],
  [61.2, 51.7],
  [61.36, 51.6],
  [61.26, 51.51],
  [61.05, 51.46],
  [60.94, 51.38],
  [60.74, 51.35],
];

// Isla Soledad: north coast, Berkeley Sound, Cape Pembroke, Choiseul Sound
// (the deep inlet that leaves Lafonia joined by a narrow isthmus), Lafonia.
const SOLEDAD: readonly (readonly [number, number])[] = [
  [59.36, 51.42],
  [59.14, 51.34],
  [58.8, 51.32],
  [58.45, 51.35],
  [58.2, 51.42],
  [58.02, 51.5],
  [58.22, 51.56],
  [58.02, 51.61],
  [57.76, 51.64],
  [57.72, 51.7],
  [57.92, 51.75],
  [58.26, 51.8],
  [58.6, 51.84],
  [58.88, 51.84],
  [58.62, 51.9],
  [58.3, 51.93],
  [58.1, 51.99],
  [58.36, 52.1],
  [58.64, 52.2],
  [58.94, 52.3],
  [59.2, 52.35],
  [59.42, 52.26],
  [59.32, 52.12],
  [59.2, 51.99],
  [59.08, 51.88],
  [59.24, 51.78],
  [59.42, 51.68],
  [59.3, 51.58],
  [59.45, 51.5],
];

/** Island polygons in atlas world units (for masks and point tests). */
export const MALVINAS_POLYGONS: readonly (readonly Point[])[] = [GRAN_MALVINA, SOLEDAD].map((poly) =>
  poly.map(([lon, lat]) => geo(lon, lat)),
);

/** Even-odd point-in-polygon against both islands. */
export const insideMalvinas = (p: Point) =>
  MALVINAS_POLYGONS.some((poly) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  });

/** Closed outline smoothed with the shared Catmull-Rom sampler. */
const toPath = (pts: readonly (readonly [number, number])[]) => {
  const p: Point[] = pts.map(([lon, lat]) => geo(lon, lat));
  const ring: Point[] = [p[p.length - 1], ...p, p[0], p[1]];
  const smooth = sampleRange(
    ring,
    1 / (ring.length - 1),
    (ring.length - 2) / (ring.length - 1),
    5,
  );
  return `${polylineToPath(smooth)} Z`;
};

export const MALVINAS_PATHS: readonly { id: string; d: string }[] = [
  { id: "malvinas.granMalvina", d: toPath(GRAN_MALVINA) },
  { id: "malvinas.soledad", d: toPath(SOLEDAD) },
];

/** Hatch bounds covering both islands (world units). */
export const MALVINAS_BOUNDS = (() => {
  const all: Point[] = [...GRAN_MALVINA, ...SOLEDAD].map(([lon, lat]) =>
    geo(lon, lat),
  );
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
})();
