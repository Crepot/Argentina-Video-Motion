import { Easing } from "remotion";
import type { EaseId } from "../types/camera";

/** The only easings allowed in the benchmark (§4.3). No springs, no overshoot. */
export const EASES: Record<EaseId, (t: number) => number> = {
  linearTravel: (t) => t,
  atlasDrift: Easing.bezier(0.33, 0, 0.2, 1),
  institutionalLock: Easing.bezier(0.65, 0, 0.35, 1),
  ceremonial: Easing.bezier(0.22, 0.61, 0.36, 1),
  restrainedImpact: Easing.bezier(0.18, 0.78, 0.3, 1),
};
