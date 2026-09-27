import React from "react";
import { stabilizeLabel } from "../camera/label-stabilization";
import type { CameraState } from "../types/camera";
import type { LabelAlign, LabelMode } from "../types/labels";
import type { Point } from "../types/paths";

/**
 * Screen-space placement shared by HistoricalDate, EventLabel and
 * AnthemPhrase. The anchor is the top edge of the block at its alignment.
 * No backgrounds, borders or shadows: text belongs to the map.
 */
export const AnchoredLabel: React.FC<{
  id: string;
  anchor: Point;
  camera: CameraState;
  mode: LabelMode;
  align: LabelAlign;
  maxWidthPx: number;
  children: React.ReactNode;
}> = ({ id, anchor, camera, mode, align, maxWidthPx, children }) => {
  const { x, y, scale } = stabilizeLabel(anchor, camera, mode);
  const shift = align === "left" ? "0%" : align === "center" ? "-50%" : "-100%";
  return (
    <div
      data-id={id}
      style={{
        position: "absolute",
        left: x,
        top: y,
        maxWidth: maxWidthPx,
        transform: `translateX(${shift}) scale(${scale})`,
        transformOrigin: `${align === "left" ? "left" : align === "center" ? "center" : "right"} top`,
        textAlign: align,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
};
