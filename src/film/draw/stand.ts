import { planeMatrix, type Projector } from "../../stage/projection";

/**
 * A drawing standing on the ground at (x, y) of a sheet, local +x = east
 * (× facing), local −y = up. `fold` lays it flat toward north (0 upright … 1
 * flat): the same mechanism V2 uses to turn scenery back into cartography.
 */
export const standMatrix = (p: Projector, x: number, y: number, s: number, facing: 1 | -1 = 1, fold = 0, lift = 0) => {
  const th = (Math.min(1, Math.max(0, fold)) * Math.PI) / 2;
  return planeMatrix(p, [x, y, lift], [s * facing, 0, 0], [0, s * Math.sin(th), -s * Math.cos(th)]);
};

/** Upright height factor of a folded drawing as seen by the camera (for culling/fades). */
export const foldVisibility = (p: Projector, fold: number) => {
  const th = (Math.min(1, Math.max(0, fold)) * Math.PI) / 2;
  return Math.hypot(Math.sin(th) * p.squash, Math.cos(th) * p.rise);
};
