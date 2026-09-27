import React from "react";
import { PALETTE } from "../theme/palette";
import { TYPE } from "../typography/type-scale";

/**
 * Editorial date (§9.4). Entry is opacity + ≤ 8 px vertical travel + ≤ 4 px
 * tracking (§10.5). Benchmark rule: never gold; 1976 stays minor.
 */
export interface HistoricalDateProps {
  year: string;
  opacity: number;
  emphasis: "minor" | "lockup" | "major" | "solemn";
  colorToken: "deepBlue" | "deepBlueSoft" | "skyBlue";
  /** 0..1 entry progress (drives the small vertical travel). */
  enter?: number;
  trackingPx?: number;
}

const SIZE = {
  minor: TYPE.dateMinor,
  lockup: TYPE.dateLockup,
  major: TYPE.dateMajor,
  solemn: TYPE.dateSolemn,
} as const;

export const HistoricalDate: React.FC<HistoricalDateProps> = ({
  year,
  opacity,
  emphasis,
  colorToken,
  enter = 1,
  trackingPx = 0,
}) => {
  const t = SIZE[emphasis];
  return (
    <div
      style={{
        ...t,
        letterSpacing: `calc(${t.letterSpacing} + ${trackingPx}px)`,
        color: PALETTE[colorToken],
        opacity,
        transform: `translateY(${(1 - enter) * 8}px)`,
        fontVariantNumeric: "lining-nums",
      }}
    >
      {year}
    </div>
  );
};
