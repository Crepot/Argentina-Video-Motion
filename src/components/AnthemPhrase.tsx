import React from "react";
import { clamp01 } from "../animation/interpolate-clamped";
import { PALETTE } from "../theme/palette";
import { TYPE } from "../typography/type-scale";

/**
 * Anthem phrase (§9.6): refined, revealed line by line with a crisp mask,
 * never a typewriter. In the benchmark it is always deep blue, never gold.
 */
export interface AnthemPhraseProps {
  lines: readonly string[];
  state: "entering" | "held" | "exiting" | "suspended" | "resolved";
  opacity: number;
  /** 0..1 over all lines; each line gets an equal share. */
  revealProgress: number;
  align: "left" | "center" | "right";
}

export const AnthemPhrase: React.FC<AnthemPhraseProps> = ({
  lines,
  state,
  opacity,
  revealProgress,
  align,
}) => (
  <div
    data-state={state}
    style={{
      ...TYPE.anthem,
      color: PALETTE.deepBlue,
      opacity,
      textAlign: align,
    }}
  >
    {lines.map((line, i) => {
      const r = clamp01(revealProgress * lines.length - i);
      return (
        <div
          key={line}
          style={{ clipPath: `inset(-10% ${(1 - r) * 100}% -10% 0)` }}
        >
          {line}
        </div>
      );
    })}
  </div>
);
