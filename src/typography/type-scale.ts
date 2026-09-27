import type { CSSProperties } from "react";
import { FONT_DISPLAY, FONT_SANS } from "./fonts";

/** Screen-pixel type scale at 1080p (§A Typography, §10.5). */
export const TYPE = {
  dateMinor: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 600,
    fontSize: 56,
    lineHeight: 1,
    letterSpacing: "0.02em",
  },
  dateLockup: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 600,
    fontSize: 88,
    lineHeight: 0.95,
    letterSpacing: "0.01em",
  },
  dateMajor: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 600,
    fontSize: 132,
    lineHeight: 0.9,
    letterSpacing: "0.01em",
  },
  dateSolemn: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 600,
    fontSize: 104,
    lineHeight: 0.92,
    letterSpacing: "0.01em",
  },
  event: {
    fontFamily: FONT_SANS,
    fontWeight: 500,
    fontSize: 28,
    lineHeight: 1.2,
    letterSpacing: "0.04em",
  },
  eventWide: {
    fontFamily: FONT_SANS,
    fontWeight: 500,
    fontSize: 30,
    lineHeight: 1.2,
    letterSpacing: "0.16em",
  },
  eventNote: {
    fontFamily: FONT_SANS,
    fontWeight: 500,
    fontSize: 17,
    lineHeight: 1.2,
    letterSpacing: "0.2em",
  },
  anthem: {
    fontFamily: FONT_DISPLAY,
    fontWeight: 600,
    fontSize: 44,
    lineHeight: 1.22,
    letterSpacing: "0.06em",
  },
  map: {
    fontFamily: FONT_SANS,
    fontWeight: 500,
    fontSize: 18,
    lineHeight: 1.1,
    letterSpacing: "0.28em",
  },
  coordinate: {
    fontFamily: FONT_SANS,
    fontWeight: 500,
    fontSize: 16,
    lineHeight: 1,
    letterSpacing: "0.08em",
  },
} as const satisfies Record<string, CSSProperties>;

export type TypeToken = keyof typeof TYPE;
