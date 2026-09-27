import React from "react";
import { PERSISTENT_OBJECT_IDS } from "../paths/path-registry";
import { type FrameRange, isInRange } from "../types/branded-frames";

/**
 * Layer overlap + geometry handoff across a scene boundary (§9.12). A bridge
 * never mounts a replacement for a preserved object: it wraps the shared
 * components that perform the handoff, records which layers leave/enter,
 * and refuses to preserve anything that is not a persistent object.
 */
export interface SceneBridgeProps {
  id: string;
  range: FrameRange;
  globalFrame: number;
  outgoingLayerIds: readonly string[];
  incomingLayerIds: readonly string[];
  preservedObjectIds: readonly string[];
  geometryProgress: number;
  children: React.ReactNode;
}

export const SceneBridge: React.FC<SceneBridgeProps> = ({
  id,
  range,
  globalFrame,
  outgoingLayerIds,
  incomingLayerIds,
  preservedObjectIds,
  geometryProgress,
  children,
}) => {
  for (const pid of preservedObjectIds) {
    if (!(PERSISTENT_OBJECT_IDS as readonly string[]).includes(pid)) {
      throw new Error(`SceneBridge ${id}: ${pid} is not a persistent object`);
    }
  }
  return (
    <g
      data-bridge={id}
      data-outgoing={outgoingLayerIds.join(" ")}
      data-incoming={incomingLayerIds.join(" ")}
      data-preserved={preservedObjectIds.join(" ")}
      data-progress={geometryProgress.toFixed(3)}
      data-active={isInRange(globalFrame, range) ? "true" : "false"}
    >
      {children}
    </g>
  );
};
