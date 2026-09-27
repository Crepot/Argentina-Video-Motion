import React from "react";
import { EASES } from "../animation/easing";
import { progress } from "../animation/interpolate-clamped";
import { CENSOR_SHUTTERS } from "../atlas/geometry/institutions";
import { PALETTE } from "../theme/palette";

/**
 * Pale shutters that erase press rules, radio waves and a façade register
 * (§9, storyboard Scene 10). Deterministic left→right wipes with crisp
 * edges; never black bars, never diagonals.
 */
export const CensorshipMask: React.FC<{
  globalFrame: number;
  opacity: number;
  px: (n: number) => number;
}> = ({ globalFrame: f, opacity, px }) => (
  <g data-id="censorship" opacity={opacity}>
    {CENSOR_SHUTTERS.map((s) => {
      const t = EASES.institutionalLock(progress(f, s.start - 1, s.end));
      if (t <= 0) {
        return null;
      }
      const w = s.w * t;
      // Tall shutters are slatted (venetian), so they erase without becoming a block.
      const slats = s.h > 40 ? Math.round(s.h / 16) : 1;
      const pitch = s.h / slats;
      const slatH = slats > 1 ? pitch * 0.62 : s.h;
      return (
        <g key={s.id} data-id={s.id}>
          {Array.from({ length: slats }, (_, i) => (
            <rect
              key={i}
              x={s.x}
              y={s.y + i * pitch}
              width={w}
              height={slatH}
              fill={PALETTE.grayBluePale}
            />
          ))}
          <path
            d={`M ${s.x + w} ${s.y} V ${s.y + s.h}`}
            stroke={PALETTE.grayBlue}
            strokeWidth={px(1.2)}
          />
        </g>
      );
    })}
  </g>
);
