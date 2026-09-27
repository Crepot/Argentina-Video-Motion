import React from "react";
import { cameraTransform } from "../../camera/evaluate-camera";
import type { CameraState } from "../../types/camera";
import { localCamera, type Placement } from "../space";

/**
 * Ground drawing of a sheet, seen through the sheet's local camera so that
 * tilt foreshortening always runs along the sheet's own north axis (the
 * same frame its standing items use). Strokes are screen px (.v2-nss).
 */
export const SheetGround: React.FC<{ camera: CameraState; pl: Placement; children: React.ReactNode; opacity?: number; id?: string }> = ({
  camera,
  pl,
  children,
  opacity,
  id,
}) => (
  <g data-sheet={id} className="v2-nss" transform={cameraTransform(localCamera(camera, pl))} opacity={opacity}>
    {children}
  </g>
);
