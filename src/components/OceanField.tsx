import React from "react";
import { progress } from "../animation/interpolate-clamped";
import { strokeDrawProps } from "../animation/stroke-draw";
import {
  COORDINATE_LABELS,
  OCEAN_ISOBARS,
  OCEAN_WIND,
} from "../atlas/south-atlantic-geometry";
import { TYPE } from "../typography/type-scale";
import { LINE_PX } from "../theme/line-styles";
import { PALETTE } from "../theme/palette";

/**
 * South Atlantic as paper carrying information (§A Oceans, §9.13): widely
 * spaced isobars, sparse directional hatching and two coordinate ticks. The
 * isobars nearest the stadium are not drawn here: they are the stadium rings
 * themselves (FootballPitch), which keeps their genealogy.
 */
export interface OceanFieldProps {
  globalFrame: number;
  isobarProgress: number;
  windProgress: number;
  coordinateOpacity: number;
  isobarColor: string;
  px: (n: number) => number;
}

export const OceanField: React.FC<OceanFieldProps> = ({
  globalFrame: f,
  isobarProgress,
  windProgress,
  coordinateOpacity,
  isobarColor,
  px,
}) => {
  const wind = OCEAN_WIND.map(({ p, angle, length }) => {
    const dx = (Math.cos(angle) * length) / 2;
    const dy = (Math.sin(angle) * length) / 2;
    return `M ${(p[0] - dx).toFixed(1)} ${(p[1] - dy).toFixed(1)} L ${(p[0] + dx).toFixed(1)} ${(p[1] + dy).toFixed(1)}`;
  }).join(" ");
  return (
    <g data-id="oceanField">
      {isobarProgress > 0
        ? OCEAN_ISOBARS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={isobarColor}
              strokeWidth={px(LINE_PX.cartographySecondary)}
              opacity={0.34}
              {...strokeDrawProps(isobarProgress)}
            />
          ))
        : null}
      {windProgress > 0.002 ? (
        <path
          d={wind}
          fill="none"
          stroke={PALETTE.skyBlue}
          strokeWidth={px(1.1)}
          strokeLinecap="round"
          opacity={windProgress}
        />
      ) : null}
      {COORDINATE_LABELS.map((c) => {
        const o = progress(f, c.frame, c.frame + 10) * coordinateOpacity;
        if (o <= 0.002) {
          return null;
        }
        const tick = px(9);
        return (
          <g key={c.id} data-id={c.id} opacity={o}>
            <path
              d={`M ${c.anchor[0] - tick} ${c.anchor[1] + px(10)} h ${tick * 2}`}
              stroke={PALETTE.deepBlueSoft}
              strokeWidth={px(1.2)}
            />
            <text
              x={c.anchor[0]}
              y={c.anchor[1]}
              fill={PALETTE.deepBlueSoft}
              fontFamily={TYPE.coordinate.fontFamily}
              fontWeight={TYPE.coordinate.fontWeight}
              fontSize={px(TYPE.coordinate.fontSize)}
              letterSpacing={px(1.2)}
              textAnchor="middle"
            >
              {c.text}
            </text>
          </g>
        );
      })}
    </g>
  );
};
