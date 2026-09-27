import { createProjector, type Projector } from "../stage/projection";
import type { CameraState } from "../types/camera";
import type { Point } from "../types/paths";

/**
 * Film space. The camera lives in world units of the current camera segment
 * (see film-camera.ts). Scenes are authored on "sheets": local coordinate
 * systems placed in the world by a similarity (origin + uniform scale), so a
 * port, a plaza or a mountain pass can be drawn at human scale and nested at
 * its place on the continental map (storyboard: one atlas, many scales).
 */
export interface Placement {
  /** World position of local (0, 0). */
  ox: number;
  oy: number;
  /** World units per local unit. */
  k: number;
  /** Rotation of the sheet in the world, degrees (SVG sense: clockwise on screen). */
  rot?: number;
}

export const IDENTITY: Placement = { ox: 0, oy: 0, k: 1 };

export const place = (ox: number, oy: number, k: number, rot = 0): Placement => ({ ox, oy, k, rot });

const rotV = (p: Point, deg: number): Point => {
  if (!deg) {
    return p;
  }
  const a = (deg * Math.PI) / 180;
  return [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
};

/** Placement that puts local point `local` at world point `world`. */
export const anchorAt = (local: Point, world: Point, k: number, rot = 0): Placement => {
  const v = rotV([local[0] * k, local[1] * k], rot);
  return { ox: world[0] - v[0], oy: world[1] - v[1], k, rot };
};

export const toWorld = (pl: Placement, p: Point): Point => {
  const v = rotV([p[0] * pl.k, p[1] * pl.k], pl.rot ?? 0);
  return [pl.ox + v[0], pl.oy + v[1]];
};
export const toLocal = (pl: Placement, p: Point): Point => {
  const v = rotV([p[0] - pl.ox, p[1] - pl.oy], -(pl.rot ?? 0));
  return [v[0] / pl.k, v[1] / pl.k];
};

/** The camera as seen from inside a sheet. */
export const localCamera = (c: CameraState, pl: Placement): CameraState => {
  const [x, y] = toLocal(pl, [c.x, c.y]);
  return { ...c, x, y, zoom: c.zoom * pl.k, rotation: c.rotation - (pl.rot ?? 0) };
};

/** SVG transform of a sheet inside a world layer. */
export const placementTransform = (pl: Placement) =>
  pl.k === 1 && pl.ox === 0 && pl.oy === 0 && !pl.rot
    ? undefined
    : `translate(${pl.ox.toFixed(3)} ${pl.oy.toFixed(3)})${pl.rot ? ` rotate(${pl.rot})` : ""} scale(${pl.k})`;

/** A similarity applied at a camera re-origin: world' = s·world + d. */
export interface Similarity {
  s: number;
  dx: number;
  dy: number;
}

export const applySim = (t: Similarity, p: Point): Point => [p[0] * t.s + t.dx, p[1] * t.s + t.dy];
export const invertSim = (t: Similarity): Similarity => ({ s: 1 / t.s, dx: -t.dx / t.s, dy: -t.dy / t.s });
export const simPlacement = (t: Similarity, pl: Placement): Placement => ({
  ox: pl.ox * t.s + t.dx,
  oy: pl.oy * t.s + t.dy,
  k: pl.k * t.s,
  rot: pl.rot,
});

/** Projector cache for one frame. */
export const makeProjectorCache = (camera: CameraState) => {
  const cache = new Map<string, Projector>();
  return (pl: Placement, depth = 1): Projector => {
    const key = `${pl.ox}|${pl.oy}|${pl.k}|${pl.rot ?? 0}|${depth}`;
    let p = cache.get(key);
    if (!p) {
      p = createProjector(localCamera(camera, pl), depth);
      cache.set(key, p);
    }
    return p;
  };
};
