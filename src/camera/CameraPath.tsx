import React, { createContext, useContext, useMemo } from "react";
import type { GlobalFrame } from "../types/branded-frames";
import type { CameraPathSpec, CameraState } from "../types/camera";
import {
  evaluateSmoothedCameraPath,
  validateCameraPath,
} from "./evaluate-camera";

const CameraContext = createContext<CameraState | null>(null);

/**
 * Single camera evaluation per frame (§4.2). Exposes the state to children
 * through a render prop and to any descendant through `useCamera()`.
 */
export const CameraPath: React.FC<{
  spec: CameraPathSpec;
  globalFrame: GlobalFrame;
  /** Optional alternative evaluator (V2 channel camera with tilt). */
  evaluate?: (globalFrame: number) => CameraState;
  children: (camera: CameraState) => React.ReactNode;
}> = ({ spec, globalFrame, evaluate, children }) => {
  useMemo(() => validateCameraPath(spec), [spec]);
  const camera = useMemo(
    () =>
      evaluate
        ? evaluate(globalFrame)
        : evaluateSmoothedCameraPath(spec, globalFrame),
    [spec, globalFrame, evaluate],
  );
  return (
    <CameraContext.Provider value={camera}>
      {children(camera)}
    </CameraContext.Provider>
  );
};

export const useCamera = () => {
  const ctx = useContext(CameraContext);
  if (!ctx) {
    throw new Error("useCamera() must be used inside <CameraPath>");
  }
  return ctx;
};

/** Converts apparent screen pixels to world units at the current zoom (§10.9). */
export const usePx = () => {
  const { zoom } = useCamera();
  return (px: number) => px / zoom;
};
