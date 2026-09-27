import { clamp } from "../animation/interpolate-clamped";
import type { CameraState } from "../types/camera";
import type { LabelMode } from "../types/labels";
import type { Point } from "../types/paths";
import { projectWorldPoint } from "./evaluate-camera";

/**
 * Screen placement for labels rendered in the HTML overlay (§3.6, §10.10).
 * The overlay is never rotated, so hybrid/stabilized labels are counter-
 * rotated by construction; only their anchor follows the world.
 */
export const stabilizeLabel = (
  anchor: Point,
  camera: CameraState,
  mode: LabelMode,
) => {
  const [x, y] = projectWorldPoint(anchor, camera);
  const scale =
    mode === "stabilized"
      ? 1
      : mode === "hybrid"
        ? camera.zoom * clamp(1 / camera.zoom, 0.88, 1.08)
        : camera.zoom;
  return { x, y, scale };
};
