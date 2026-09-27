import React, { createContext, useContext } from "react";
import { AbsoluteFill } from "remotion";
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "../atlas/atlas-constants";
import { LAYERS, type LayerId } from "../atlas/layers";
import { cameraForLayer, cameraTransform } from "../camera/evaluate-camera";
import type { CameraState } from "../types/camera";

interface AtlasContextValue {
  camera: CameraState;
  layerReferences: Record<LayerId, CameraState>;
}

const AtlasContext = createContext<AtlasContextValue | null>(null);

export interface AtlasCanvasProps {
  worldWidth: 7680;
  worldHeight: 4320;
  viewportWidth: 1920;
  viewportHeight: 1080;
  camera: CameraState;
  /** Camera at each layer's registration frame, precomputed once. */
  layerReferences: Record<LayerId, CameraState>;
  paperColor: string;
  children: React.ReactNode;
  /** Screen-space HTML (stabilized typography, debug). Never rotated. */
  overlay?: React.ReactNode;
}

/**
 * Viewport, outer clip and the single <svg> every world layer lives in
 * (§9.1). It does not evaluate the timeline, mount audio or know scenes.
 */
export const AtlasCanvas: React.FC<AtlasCanvasProps> = ({
  camera,
  layerReferences,
  paperColor,
  children,
  overlay,
}) => (
  <AtlasContext.Provider value={{ camera, layerReferences }}>
    <AbsoluteFill style={{ backgroundColor: paperColor, overflow: "hidden" }}>
      <svg
        width={VIEWPORT_WIDTH}
        height={VIEWPORT_HEIGHT}
        viewBox={`0 0 ${VIEWPORT_WIDTH} ${VIEWPORT_HEIGHT}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <rect
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          fill={paperColor}
        />
        {children}
      </svg>
      {overlay}
    </AbsoluteFill>
  </AtlasContext.Provider>
);

/** A world-space group transformed by the (parallax-adjusted) camera. */
export const WorldLayer: React.FC<{
  layer: LayerId;
  mask?: string;
  children: React.ReactNode;
}> = ({ layer, mask, children }) => {
  const ctx = useContext(AtlasContext);
  if (!ctx) {
    throw new Error("<WorldLayer> must be inside <AtlasCanvas>");
  }
  const spec = LAYERS[layer];
  const cam = cameraForLayer(
    ctx.camera,
    ctx.layerReferences[layer],
    spec.factor,
  );
  return (
    <g
      data-layer={layer}
      data-order={spec.order}
      transform={cameraTransform(cam)}
      mask={mask}
    >
      {children}
    </g>
  );
};
