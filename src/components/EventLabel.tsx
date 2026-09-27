import React from "react";
import { PALETTE } from "../theme/palette";
import { TYPE } from "../typography/type-scale";

/** Short Spanish event copy (§9.5). No cards, backgrounds, borders or shadows. */
export interface EventLabelProps {
  lines: readonly string[];
  opacity: number;
  tone: "standard" | "subdued" | "solemn" | "note";
  enter?: number;
  trackingPx?: number;
  marginTop?: number;
}

const TONE = {
  standard: { type: TYPE.event, color: PALETTE.deepBlue },
  subdued: { type: TYPE.eventWide, color: PALETTE.deepBlueSoft },
  solemn: { type: TYPE.eventWide, color: PALETTE.deepBlue },
  note: { type: TYPE.eventNote, color: PALETTE.deepBlueSoft },
} as const;

export const EventLabel: React.FC<EventLabelProps> = ({
  lines,
  opacity,
  tone,
  enter = 1,
  trackingPx = 0,
  marginTop = 0,
}) => {
  const { type, color } = TONE[tone];
  return (
    <div
      style={{
        ...type,
        letterSpacing: `calc(${type.letterSpacing} + ${trackingPx}px)`,
        color,
        opacity,
        marginTop,
        transform: `translateY(${(1 - enter) * 8}px)`,
      }}
    >
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
};
