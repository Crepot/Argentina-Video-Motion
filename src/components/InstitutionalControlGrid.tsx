import React from "react";
import { clamp01, progress } from "../animation/interpolate-clamped";
import { EASES } from "../animation/easing";
import { strokeDrawProps } from "../animation/stroke-draw";
import {
  CONTROL_LINES,
  ENCLOSURES,
  FINAL_RELAY_LOCK,
  LOCKS,
  REPRESSION_PATHS,
  SCAN_ZONES,
  SURVEILLANCE_BOXES,
} from "../atlas/geometry/institutions";
import { LINE_PX } from "../theme/line-styles";
import type { Point } from "../types/paths";

/**
 * State/security layer (§9.13, §A conflict grammar). It grows only from
 * institutional anchors, uses rigid parallel lines and square caps, closes
 * institutions, intercepts civic routes with locks, surveils with coordinate
 * boxes and scan arcs, and launches repression paths that leave the grid and
 * return to it. It is never visually equivalent to any other actor.
 */
export interface InstitutionalControlGridProps {
  globalFrame: number;
  opacity: number;
  scanOpacity: number;
  repressionResidual: number;
  color: string;
  lockColor: string;
  px: (n: number) => number;
}

const PARALLEL = 4.5;
const lockEase = EASES.institutionalLock;

/** Two rigid parallels along [a, b], drawn outward from `from`. */
const doubleLine = (
  from: Point,
  a: Point,
  b: Point,
  t: number,
  px: (n: number) => number,
) => {
  const horizontal = a[1] === b[1];
  const off = px(PARALLEL);
  const legs: string[] = [];
  for (const sign of [-1, 1]) {
    const o: Point = horizontal ? [0, sign * off] : [sign * off, 0];
    for (const end of [a, b]) {
      const x = from[0] + (end[0] - from[0]) * t;
      const y = from[1] + (end[1] - from[1]) * t;
      legs.push(
        `M ${from[0] + o[0]} ${from[1] + o[1]} L ${x + o[0]} ${y + o[1]}`,
      );
    }
  }
  return legs.join(" ");
};

const enclosurePath = (e: (typeof ENCLOSURES)[number]) => {
  // Starts at the institution's base axis and closes around it.
  const mx = (e.x0 + e.x1) / 2;
  return `M ${mx} ${e.y1} H ${e.x1} V ${e.y0} H ${e.x0} V ${e.y1} H ${mx}`;
};

const surveillanceBox = (c: Point, size: number) => {
  const h = size / 2;
  const t = size * 0.22;
  const [x, y] = c;
  return [
    `M ${x - h} ${y - h + t} V ${y - h} H ${x - h + t}`,
    `M ${x + h - t} ${y - h} H ${x + h} V ${y - h + t}`,
    `M ${x + h} ${y + h - t} V ${y + h} H ${x + h - t}`,
    `M ${x - h + t} ${y + h} H ${x - h} V ${y + h - t}`,
    `M ${x - 6} ${y} H ${x + 6} M ${x} ${y - 6} V ${y + 6}`,
  ].join(" ");
};

const scanSector = (pivot: Point, r: number, center: number, width: number) => {
  const a0 = ((center - width / 2) * Math.PI) / 180;
  const a1 = ((center + width / 2) * Math.PI) / 180;
  const p0 = [pivot[0] + r * Math.cos(a0), pivot[1] + r * Math.sin(a0)];
  const p1 = [pivot[0] + r * Math.cos(a1), pivot[1] + r * Math.sin(a1)];
  return `M ${pivot[0]} ${pivot[1]} L ${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A ${r} ${r} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Z`;
};

export const InstitutionalControlGrid: React.FC<
  InstitutionalControlGridProps
> = ({
  globalFrame: f,
  opacity,
  scanOpacity,
  repressionResidual,
  color,
  lockColor,
  px,
}) => {
  const w = px(LINE_PX.institutionalControl);
  return (
    <g
      data-id="control.militaryControl"
      opacity={opacity}
      fill="none"
      stroke={color}
      strokeLinecap="butt"
      strokeLinejoin="miter"
    >
      {ENCLOSURES.map((e) => {
        const t = lockEase(progress(f, e.start - 1, e.end));
        if (t <= 0) {
          return null;
        }
        const inset = px(PARALLEL * 2);
        return (
          <g key={e.id} data-id={e.id} strokeWidth={w}>
            <path d={enclosurePath(e)} {...strokeDrawProps(t)} />
            <path
              d={enclosurePath({
                ...e,
                x0: e.x0 + inset,
                y0: e.y0 + inset,
                x1: e.x1 - inset,
                y1: e.y1,
              })}
              {...strokeDrawProps(t)}
              opacity={0.7}
            />
          </g>
        );
      })}
      {CONTROL_LINES.map((l) => {
        const t = lockEase(progress(f, l.start - 1, l.end));
        return t > 0 ? (
          <path
            key={l.id}
            data-id={l.id}
            d={doubleLine(l.from, l.a, l.b, t, px)}
            strokeWidth={w * 0.85}
          />
        ) : null;
      })}
      <g data-id="control.locks" stroke={lockColor} strokeWidth={w}>
        {LOCKS.map((l, i) => {
          const o = progress(f, l.at - 1, l.at + 8);
          const s = px(6);
          return o > 0 ? (
            <path
              key={i}
              d={`M ${l.p[0] - s} ${l.p[1] - s} h ${2 * s} v ${2 * s} h ${-2 * s} Z`}
              opacity={o}
            />
          ) : null;
        })}
        {f >= 1791 ? (
          <path
            data-id="control.finalRelay"
            d={`M ${FINAL_RELAY_LOCK[0] - px(9)} ${FINAL_RELAY_LOCK[1] - px(9)} h ${px(18)} v ${px(18)} h ${-px(18)} Z M ${FINAL_RELAY_LOCK[0] - px(9)} ${FINAL_RELAY_LOCK[1] - px(9)} l ${px(18)} ${px(18)}`}
            opacity={progress(f, 1790, 1799)}
          />
        ) : null}
      </g>
      <g data-id="control.surveillance" strokeWidth={px(LINE_PX.hairline)}>
        {SURVEILLANCE_BOXES.map((b, i) => {
          const o = progress(f, b.at - 1, b.at + 10);
          return o > 0 ? (
            <g key={i} opacity={o}>
              <path d={surveillanceBox(b.c, b.size)} />
              <path
                d={surveillanceBox([b.c[0] + 7, b.c[1] + 7], b.size)}
                opacity={0.5}
              />
            </g>
          ) : null;
        })}
        {scanOpacity > 0.002
          ? SCAN_ZONES.map((z, i) => {
              // Slow deterministic sweep, back and forth over the zone.
              const phase =
                (Math.sin(((f - 1792) / 70) * Math.PI * 2 + i * 1.7) + 1) / 2;
              const center = z.sweep[0] + (z.sweep[1] - z.sweep[0]) * phase;
              return (
                <path
                  key={i}
                  d={scanSector(z.pivot, z.radius, center, z.width)}
                  opacity={scanOpacity}
                  strokeDasharray={`${px(3)} ${px(4)}`}
                />
              );
            })
          : null}
      </g>
      <g data-id="control.repression" strokeWidth={w}>
        {REPRESSION_PATHS.map((r) => {
          const t = progress(f, r.start - 1, r.end);
          if (t <= 0) {
            return null;
          }
          // A rigid pulse leaves the grid and returns to it; a faint trace stays.
          const windowLen = 0.34;
          const head = clamp01(t * (1 + windowLen));
          const tail = Math.max(0, head - windowLen);
          return (
            <g key={r.id} data-id={r.id}>
              <path
                d={r.d}
                pathLength={1}
                strokeDasharray={`0 ${tail} ${head - tail} 1`}
              />
              <path
                d={r.d}
                opacity={repressionResidual * t}
                strokeDasharray={`${px(2)} ${px(5)}`}
                strokeWidth={px(1)}
              />
            </g>
          );
        })}
      </g>
    </g>
  );
};
