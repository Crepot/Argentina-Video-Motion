import React from "react";
import { usePx } from "../camera/CameraPath";
import {
  pointAndAngleAt,
  polylineToPath,
  sampleRange,
} from "../paths/interpolate-path";
import { PATH_REGISTRY } from "../paths/path-registry";
import { DASH_PX, LINE_PX } from "../theme/line-styles";
import { PALETTE } from "../theme/palette";

/**
 * Secondary routes (§9.8): the 1978 ball trajectory and the 1982 dotted
 * naval/air guide. Never a substitute for memoryLine.main.
 */
export interface RouteLineProps {
  geometryId: "ballTrajectory1978" | "navalGuide1982";
  progress: number;
  opacity: number;
  style: "solid" | "dotted" | "interrupted" | "directional";
  colorToken: "skyBlue" | "deepBlue" | "grayBlue" | "gold";
  strokeWidthPx: number;
  marker?: "none" | "ball" | "routeHead";
  /** Draw the part ahead of `progress` as a faint dotted guide. */
  guideOpacity?: number;
}

const COLOR = {
  skyBlue: PALETTE.skyBlue,
  deepBlue: PALETTE.deepBlueSoft,
  grayBlue: PALETTE.grayBlue,
  gold: PALETTE.goldMuted,
} as const;

export const RouteLine: React.FC<RouteLineProps> = ({
  geometryId,
  progress,
  opacity,
  style,
  colorToken,
  strokeWidthPx,
  marker = "none",
  guideOpacity = 0,
}) => {
  const px = usePx();
  const pts = PATH_REGISTRY[geometryId].points;
  const dash =
    style === "solid"
      ? undefined
      : DASH_PX[style === "directional" ? "directional" : style];
  const head = pointAndAngleAt(pts, progress);
  return (
    <g data-id={geometryId}>
      {guideOpacity > 0.002 ? (
        <path
          d={polylineToPath(sampleRange(pts, 0, 1))}
          fill="none"
          stroke={COLOR[colorToken]}
          strokeWidth={px(LINE_PX.hairline * 1.4)}
          strokeLinecap="round"
          strokeDasharray={`${px(DASH_PX.dotted[0])} ${px(DASH_PX.dotted[1])}`}
          opacity={guideOpacity}
        />
      ) : null}
      {progress > 0.001 && opacity > 0.002 ? (
        <path
          d={polylineToPath(sampleRange(pts, 0, progress))}
          fill="none"
          stroke={COLOR[colorToken]}
          strokeWidth={px(strokeWidthPx)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dash ? `${px(dash[0])} ${px(dash[1])}` : undefined}
          opacity={opacity}
        />
      ) : null}
      {marker === "ball" && progress > 0 && progress < 1 && opacity > 0.002 ? (
        <circle
          cx={head.p[0]}
          cy={head.p[1]}
          r={px(5.5)}
          fill={PALETTE.paperCool}
          stroke={PALETTE.deepBlue}
          strokeWidth={px(2)}
        />
      ) : null}
    </g>
  );
};
