import { VIEWPORT_CENTER } from "../atlas/atlas-constants";
import type { CameraState } from "../types/camera";
import type { Point } from "../types/paths";

/**
 * 2.5D stage projection (V2). The atlas stays one flat sheet of paper, but
 * the camera may tilt away from the overhead view: the ground plane is then
 * foreshortened by cos(tilt) and anything with height (people, façades,
 * stands, relief) rises from it. When the camera returns overhead, heights
 * fold back into the plane, so scenery physically becomes cartography.
 *
 * The map is affine in (x, y, h), which lets every vertical plane (a figure
 * billboard, a façade, a flag) be drawn in its own local units under a single
 * SVG matrix. Nothing here depends on time: it is a pure function of camera.
 */

/** Tilt at which heights are drawn at their nominal size (h world = h·zoom px). */
export const REFERENCE_TILT = 60;
const SIN_REF = Math.sin((REFERENCE_TILT * Math.PI) / 180);

export type Vec3 = readonly [number, number, number];

export interface Projector {
  camera: CameraState;
  /** Plane depth: 1 = ground plane; > 1 = a closer foreground plane (parallax). */
  depth: number;
  /** Screen px per world unit on this plane. */
  zoom: number;
  /** Ground foreshortening (1 overhead). */
  squash: number;
  /** Relative height factor (0 overhead, 1 at REFERENCE_TILT). */
  rise: number;
  /** Screen position of the 3D point (x, y, h). */
  point: (x: number, y: number, h?: number) => Point;
  /** Linear screen vectors of the three world axes. */
  ex: Point;
  ey: Point;
  eh: Point;
}

const rotateScreen = (v: Point, rad: number): Point => [
  v[0] * Math.cos(rad) - v[1] * Math.sin(rad),
  v[0] * Math.sin(rad) + v[1] * Math.cos(rad),
];

export const createProjector = (
  camera: CameraState,
  depth = 1,
): Projector => {
  const tilt = ((camera.tilt ?? 0) * Math.PI) / 180;
  const zoom = camera.zoom * depth;
  const squash = Math.cos(tilt);
  const rise = Math.min(1.12, Math.max(0, Math.sin(tilt) / SIN_REF));
  const a = (-camera.rotation * Math.PI) / 180;
  const ex = rotateScreen([zoom, 0], a);
  const ey = rotateScreen([0, zoom * squash], a);
  const eh = rotateScreen([0, -zoom * rise], a);
  const point = (x: number, y: number, h = 0): Point => {
    const dx = x - camera.x;
    const dy = y - camera.y;
    return [
      VIEWPORT_CENTER[0] + dx * ex[0] + dy * ey[0] + h * eh[0],
      VIEWPORT_CENTER[1] + dx * ex[1] + dy * ey[1] + h * eh[1],
    ];
  };
  return { camera, depth, zoom, squash, rise, point, ex, ey, eh };
};

const combine = (p: Projector, v: Vec3): Point => [
  v[0] * p.ex[0] + v[1] * p.ey[0] + v[2] * p.eh[0],
  v[0] * p.ex[1] + v[1] * p.ey[1] + v[2] * p.eh[1],
];

const fmt = (n: number) => (Math.abs(n) < 1e-9 ? "0" : n.toFixed(5));

/**
 * SVG matrix for a plane whose local unit vectors are `u` (local +x) and `v`
 * (local +y, SVG-down) in world 3D, anchored at `origin`.
 */
export const planeMatrix = (
  p: Projector,
  origin: Vec3,
  u: Vec3,
  v: Vec3,
): string => {
  const o = p.point(origin[0], origin[1], origin[2]);
  const U = combine(p, u);
  const V = combine(p, v);
  return `matrix(${fmt(U[0])} ${fmt(U[1])} ${fmt(V[0])} ${fmt(V[1])} ${o[0].toFixed(2)} ${o[1].toFixed(2)})`;
};

/**
 * A billboard standing on the ground at (x, y): local +x = world +x, local
 * +y = downwards in height. `scale` is world units per local unit. When the
 * camera is overhead its height folds to zero (the figure becomes a mark).
 */
export const billboardMatrix = (
  p: Projector,
  x: number,
  y: number,
  scale: number,
  facing: 1 | -1 = 1,
  lift = 0,
): string =>
  planeMatrix(p, [x, y, lift], [scale * facing, 0, 0], [0, 0, -scale]);

/**
 * A façade standing on a ground line, folded `fold` (0 upright … 1 flat)
 * toward −y (north). Flat, its elevation drawing lies on the block like a
 * plan: height v lands at y0 − v.
 */
export const facadeMatrix = (
  p: Projector,
  x0: number,
  y0: number,
  fold: number,
): string => {
  const th = (Math.min(1, Math.max(0, fold)) * Math.PI) / 2;
  return planeMatrix(
    p,
    [x0, y0, 0],
    [1, 0, 0],
    [0, Math.sin(th), -Math.cos(th)],
  );
};

/** Apparent screen scale of a billboard of `scale` world units per unit. */
export const billboardPx = (p: Projector, scale: number) => p.zoom * scale;
