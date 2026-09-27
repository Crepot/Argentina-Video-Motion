export type EaseId =
  | "linearTravel"
  | "atlasDrift"
  | "institutionalLock"
  | "ceremonial"
  | "restrainedImpact";

export interface CameraKeyframe {
  /** Global frame, integer. */
  frame: number;
  /** World units. */
  x: number;
  y: number;
  zoom: number;
  /** Degrees. Positive = clockwise turn of the point of view (§3.2). */
  rotation: number;
  easeToNext: EaseId;
}

export interface CameraPathSpec {
  id: string;
  keyframes: readonly CameraKeyframe[];
  extrapolate: "clamp";
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  /**
   * Degrees between the view axis and the vertical (V2). 0 = overhead
   * cartographic view (the V1 default); ~60 = oblique scene view in which the
   * ground plane is foreshortened by cos(tilt) and upright objects rise.
   */
  tilt?: number;
}
