import { EASES } from "../animation/easing";
import { lerp, progress } from "../animation/interpolate-clamped";
import { VIEWPORT_CENTER } from "../atlas/atlas-constants";
import type { CameraPathSpec, CameraState } from "../types/camera";
import type { Point } from "../types/paths";

export const validateCameraPath = (spec: CameraPathSpec) => {
  const { keyframes } = spec;
  if (keyframes.length < 2) {
    throw new Error(`Camera path ${spec.id} needs at least two keyframes`);
  }
  for (let i = 0; i < keyframes.length; i++) {
    const k = keyframes[i];
    if (!Number.isInteger(k.frame) || k.zoom <= 0) {
      throw new Error(`Camera path ${spec.id}: invalid keyframe at ${k.frame}`);
    }
    if (i > 0 && k.frame <= keyframes[i - 1].frame) {
      throw new Error(
        `Camera path ${spec.id}: keyframes must be strictly increasing`,
      );
    }
  }
};

/**
 * Pure function of the global frame (§4.1): picks the segment, applies that
 * segment's locked ease and interpolates x/y/zoom/rotation. Clamped outside.
 */
export const evaluateCameraPath = (
  spec: CameraPathSpec,
  globalFrame: number,
): CameraState => {
  const k = spec.keyframes;
  if (globalFrame <= k[0].frame) {
    return { x: k[0].x, y: k[0].y, zoom: k[0].zoom, rotation: k[0].rotation };
  }
  const last = k[k.length - 1];
  if (globalFrame >= last.frame) {
    return { x: last.x, y: last.y, zoom: last.zoom, rotation: last.rotation };
  }
  let i = 0;
  while (globalFrame >= k[i + 1].frame) {
    i++;
  }
  const a = k[i];
  const b = k[i + 1];
  const t = EASES[a.easeToNext](progress(globalFrame, a.frame, b.frame));
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    // Zoom interpolates geometrically so apparent scale changes evenly.
    zoom: a.zoom * Math.pow(b.zoom / a.zoom, t),
    rotation: lerp(a.rotation, b.rotation, t),
  };
};

/**
 * Binomial weights for the junction-smoothing kernel. The locked per-segment
 * eases (§4.3) stop the camera dead at most keyframes and restart ceremonial /
 * restrainedImpact segments at full speed, which breaks the §4.5 limits
 * (zoom > 1.5 %/frame, > 28 px/frame) and reads as a jolt. Averaging the same
 * eased path over ±RADIUS frames keeps its shape and keyframe values (within
 * a few world units) while making velocity continuous. Still a pure function
 * of the frame: no state, no accumulation.
 */
const SMOOTHING_RADIUS = 8;
// Zoom gets a wider window: the 2047→2084 atlasDrift pullback alone peaks at
// ~1.9 %/frame; r = 32 brings it under the 1.5 % limit.
const ZOOM_SMOOTHING_RADIUS = 32;

const binomialWeights = (radius: number): readonly number[] => {
  const n = radius * 2;
  const w: number[] = [];
  let c = 1;
  for (let k = 0; k <= n; k++) {
    w.push(c);
    c = (c * (n - k)) / (k + 1);
  }
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((v) => v / sum);
};

const SMOOTHING_WEIGHTS = binomialWeights(SMOOTHING_RADIUS);
const ZOOM_SMOOTHING_WEIGHTS = binomialWeights(ZOOM_SMOOTHING_RADIUS);

export const evaluateSmoothedCameraPath = (
  spec: CameraPathSpec,
  globalFrame: number,
): CameraState => {
  let x = 0;
  let y = 0;
  let logZoom = 0;
  let rotation = 0;
  for (let k = -ZOOM_SMOOTHING_RADIUS; k <= ZOOM_SMOOTHING_RADIUS; k++) {
    const c = evaluateCameraPath(spec, globalFrame + k);
    logZoom +=
      Math.log(c.zoom) * ZOOM_SMOOTHING_WEIGHTS[k + ZOOM_SMOOTHING_RADIUS];
    if (Math.abs(k) <= SMOOTHING_RADIUS) {
      const w = SMOOTHING_WEIGHTS[k + SMOOTHING_RADIUS];
      x += c.x * w;
      y += c.y * w;
      rotation += c.rotation * w;
    }
  }
  return { x, y, zoom: Math.exp(logZoom), rotation };
};

/** Camera seen by a parallax layer: translation scaled around a reference. */
export const cameraForLayer = (
  camera: CameraState,
  reference: CameraState,
  factor: number,
): CameraState =>
  factor === 1
    ? camera
    : {
        ...camera,
        x: reference.x + (camera.x - reference.x) * factor,
        y: reference.y + (camera.y - reference.y) * factor,
      };

/** Ground foreshortening of a tilted camera (1 when overhead). */
export const groundSquash = (c: CameraState) =>
  Math.cos(((c.tilt ?? 0) * Math.PI) / 180);

/** SVG transform for the world group (§3.4), with the V2 ground tilt. */
export const cameraTransform = (c: CameraState) => {
  const k = groundSquash(c);
  const scale = k === 1 ? `scale(${c.zoom})` : `scale(${c.zoom} ${c.zoom * k})`;
  return `translate(${VIEWPORT_CENTER[0]} ${VIEWPORT_CENTER[1]}) rotate(${-c.rotation}) ${scale} translate(${-c.x} ${-c.y})`;
};

/** World (ground) → viewport pixels, identical math to cameraTransform. */
export const projectWorldPoint = (p: Point, c: CameraState): Point => {
  const dx = (p[0] - c.x) * c.zoom;
  const dy = (p[1] - c.y) * c.zoom * groundSquash(c);
  const a = (-c.rotation * Math.PI) / 180;
  return [
    VIEWPORT_CENTER[0] + dx * Math.cos(a) - dy * Math.sin(a),
    VIEWPORT_CENTER[1] + dx * Math.sin(a) + dy * Math.cos(a),
  ];
};
