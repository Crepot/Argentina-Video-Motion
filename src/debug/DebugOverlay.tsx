import React, { useLayoutEffect, useRef } from "react";
import { ANCHORS } from "../atlas/atlas-anchors";
import { SAFE_AREA } from "../atlas/atlas-constants";
import { projectWorldPoint } from "../camera/evaluate-camera";
import type { CameraState } from "../types/camera";

/** Development-only HTML overlay. Mounted only when debug is on. */
export const DebugOverlay: React.FC<{
  globalFrame: number;
  localFrame: number;
  camera: CameraState;
  blockId: string;
  sceneId: string;
}> = ({ globalFrame, localFrame, camera, blockId, sceneId }) => {
  const budgetRef = useRef<HTMLDivElement>(null);
  // DOM/SVG budget (§11.1), written before paint so stills capture it.
  useLayoutEffect(() => {
    if (budgetRef.current) {
      budgetRef.current.textContent = `svg nodes ${document.querySelectorAll("svg *").length}`;
    }
  }, [globalFrame]);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "monospace",
        color: "#C4453A",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: SAFE_AREA.left,
          top: SAFE_AREA.top,
          width: SAFE_AREA.right - SAFE_AREA.left,
          height: SAFE_AREA.bottom - SAFE_AREA.top,
          outline: "1px dashed rgba(196,69,58,0.6)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 10,
          fontSize: 18,
          lineHeight: 1.35,
        }}
      >
        <div>
          global {globalFrame} · local {localFrame}
        </div>
        <div>
          block {blockId} · {sceneId}
        </div>
        <div>
          cam x {camera.x.toFixed(1)} y {camera.y.toFixed(1)} z{" "}
          {camera.zoom.toFixed(3)} r {camera.rotation.toFixed(2)}°
        </div>
        <div ref={budgetRef} />
      </div>
      {Object.entries(ANCHORS).map(([id, p]) => {
        const [x, y] = projectWorldPoint(p, camera);
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: x - 6,
              top: y - 6,
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                border: "1px solid #C4453A",
                borderRadius: 6,
              }}
            />
            <div
              style={{ marginLeft: 14, marginTop: -12, whiteSpace: "nowrap" }}
            >
              {id}
            </div>
          </div>
        );
      })}
    </div>
  );
};
