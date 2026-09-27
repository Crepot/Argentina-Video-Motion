import React from "react";
import { progress } from "../animation/interpolate-clamped";
import {
  BROADCAST_ORIGIN,
  BROADCAST_RADII,
  BUILDINGS,
  CIVIC_CONNECTORS,
  CIVIC_TIMELINE_X,
  GROUND_Y,
  NEWSPAPER,
  PLAZA_FIGURES,
  PLAZA_OUTLINE,
  PREVIOUS_ROUTES,
  STREET_Y,
} from "../atlas/geometry/institutions";
import { DASH_PX, LINE_PX } from "../theme/line-styles";
import { PALETTE } from "../theme/palette";

/**
 * Architectural drawing of the city section inherited from Scene 09 (§8.4):
 * Congreso, broadcast, ministry, university, the press, the plaza, and the
 * civic network. Pure line drawing; opacities come from the timeline.
 */
export interface CityInstitutionsProps {
  globalFrame: number;
  opacity: number;
  previousRoutesOpacity: number;
  figuresOpacity: number;
  figuresWithdraw: number;
  structuralColor: string;
  px: (n: number) => number;
}

const arc = (
  c: readonly [number, number],
  r: number,
  a0: number,
  a1: number,
) => {
  const p0 = [
    c[0] + r * Math.cos((a0 * Math.PI) / 180),
    c[1] + r * Math.sin((a0 * Math.PI) / 180),
  ];
  const p1 = [
    c[0] + r * Math.cos((a1 * Math.PI) / 180),
    c[1] + r * Math.sin((a1 * Math.PI) / 180),
  ];
  return `M ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A ${r} ${r} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`;
};

const BROADCAST_D = BROADCAST_RADII.map(
  (r) =>
    `${arc(BROADCAST_ORIGIN, r, -55, 55)} ${arc(BROADCAST_ORIGIN, r, 125, 235)}`,
).join(" ");
const NEWSPAPER_D =
  `M ${NEWSPAPER.x} ${NEWSPAPER.y} h ${NEWSPAPER.w} v ${NEWSPAPER.h} h ${-NEWSPAPER.w} Z ` +
  NEWSPAPER.rules.map(([x0, y, x1]) => `M ${x0} ${y} H ${x1}`).join(" ");
const MASTHEAD_D = `M ${NEWSPAPER.x + 12} ${NEWSPAPER.y + 16} H ${NEWSPAPER.x + NEWSPAPER.w - 12}`;

export const CityInstitutions: React.FC<CityInstitutionsProps> = ({
  globalFrame,
  opacity,
  previousRoutesOpacity,
  figuresOpacity,
  figuresWithdraw,
  structuralColor,
  px,
}) => {
  const figures = PLAZA_FIGURES.map(({ x, h, side }) => {
    const dx = figuresWithdraw * (side < 0 ? -118 : 96);
    return `M ${(x + dx).toFixed(1)} ${GROUND_Y - 2} v ${-h} m -2.4 ${-3.2} a 2.4 2.4 0 1 0 4.8 0 a 2.4 2.4 0 1 0 -4.8 0`;
  }).join(" ");
  return (
    <g data-id="city.inherited">
      <g opacity={previousRoutesOpacity} fill="none">
        {PREVIOUS_ROUTES.map((r) => (
          <path
            key={r.id}
            d={r.d}
            stroke={
              r.style === "civic"
                ? PALETTE.skyBlue
                : r.style === "rigid"
                  ? PALETTE.grayBlue
                  : PALETTE.deepBlueSoft
            }
            strokeWidth={px(r.style === "civic" ? 2.2 : 1.4)}
            strokeLinecap={r.style === "civic" ? "round" : "butt"}
            strokeDasharray={
              r.style === "civic"
                ? `${px(DASH_PX.dotted[0])} ${px(DASH_PX.dotted[1])}`
                : r.style === "angular"
                  ? `${px(10)} ${px(6)} ${px(2)} ${px(6)}`
                  : undefined
            }
          />
        ))}
      </g>
      <g
        opacity={opacity}
        fill="none"
        stroke={structuralColor}
        strokeLinejoin="round"
      >
        <path
          d={`M ${CIVIC_TIMELINE_X[0] - 70} ${GROUND_Y} H 3800`}
          strokeWidth={px(LINE_PX.gridPrimary)}
        />
        <path
          d={`M ${CIVIC_TIMELINE_X[0] - 50} ${STREET_Y} H 3790`}
          strokeWidth={px(LINE_PX.hairline)}
          opacity={0.5}
          strokeDasharray={`${px(18)} ${px(8)}`}
        />
        {BUILDINGS.map((b) => (
          <g key={b.id} data-id={`building.${b.id}`}>
            {b.layers.map((d, i) => (
              <path
                key={i}
                d={d}
                strokeWidth={px(
                  i === 0 ? LINE_PX.gridPrimary : LINE_PX.cartographySecondary,
                )}
              />
            ))}
          </g>
        ))}
        <path
          d={BROADCAST_D}
          strokeWidth={px(LINE_PX.cartographySecondary)}
          opacity={0.8}
        />
        <g data-id="press">
          <path d={NEWSPAPER_D} strokeWidth={px(LINE_PX.hairline)} />
          <path d={MASTHEAD_D} strokeWidth={px(3.2)} />
        </g>
        <path
          d={PLAZA_OUTLINE}
          strokeWidth={px(LINE_PX.hairline)}
          strokeDasharray={`${px(2)} ${px(6)}`}
          opacity={0.7}
        />
        {CIVIC_CONNECTORS.map((c) => {
          const lost = c.stopsRespondingAt
            ? progress(
                globalFrame,
                c.stopsRespondingAt,
                c.stopsRespondingAt + 12,
              )
            : 0;
          return (
            <path
              key={c.id}
              d={`M ${c.from[0]} ${c.from[1]} V ${c.to[1]}`}
              stroke={PALETTE.skyBlue}
              strokeWidth={px(1.3)}
              strokeDasharray={`${px(4)} ${px(4)}`}
              opacity={
                0.75 *
                (1 - 0.8 * lost) *
                (1 - 0.6 * progress(globalFrame, 1760, 1811))
              }
            />
          );
        })}
      </g>
      <path
        d={figures}
        fill="none"
        stroke={PALETTE.deepBlueSoft}
        strokeWidth={px(1.1)}
        opacity={figuresOpacity}
      />
    </g>
  );
};
