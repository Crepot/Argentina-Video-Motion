import type { Projector } from "../stage/projection";

/**
 * Pseudo-perspective for billboards: the affine stage has no diminution, so
 * figures lower in frame (closer) are drawn slightly larger. Scaled by the
 * camera rise, it vanishes overhead.
 */
export const PERSPECTIVE = 0.34;
export const perspectiveAt = (p: Projector, screenY: number) =>
  Math.max(0.6, 1 + PERSPECTIVE * p.rise * ((screenY - 540) / 540));
