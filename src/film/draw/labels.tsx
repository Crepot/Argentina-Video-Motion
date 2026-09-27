import React from "react";
import { clamp01 } from "../../animation/interpolate-clamped";
import { projectWorldPoint } from "../../camera/evaluate-camera";
import { PALETTE } from "../../theme/palette";
import type { CameraState } from "../../types/camera";
import type { Point } from "../../types/paths";
import { FONT_DISPLAY, FONT_SANS } from "../../typography/fonts";

/**
 * Film typography (§A Typography, §10.5): Cormorant Garamond 600 for dates,
 * anthem and title; Source Sans 3 500 for events, notes and map labels.
 * Entry = opacity + ≤ 8 px travel; no scale pops, glows or cards.
 */
export type Tone = "deep" | "soft" | "sky" | "gold" | "gray";
const COLOR: Record<Tone, string> = {
  deep: PALETTE.deepBlue,
  soft: PALETTE.deepBlueSoft,
  sky: PALETTE.skyBlue,
  gold: PALETTE.goldMuted,
  gray: PALETTE.grayBlue,
};

export const At: React.FC<{
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
  id?: string;
}> = ({ x, y, align = "left", children, id }) => (
  <div
    data-id={id}
    style={{
      position: "absolute",
      left: align === "right" ? undefined : x,
      right: align === "right" ? 1920 - x : undefined,
      top: y,
      transform: align === "center" ? "translateX(-50%)" : undefined,
      textAlign: align,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

export const DateText: React.FC<{ text: string; size: number; o: number; tone?: Tone; enter?: number; tracking?: number }> = ({
  text,
  size,
  o,
  tone = "deep",
  enter = 1,
  tracking = 0.01,
}) =>
  o > 0.002 ? (
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 0.95,
        letterSpacing: `${tracking}em`,
        color: COLOR[tone],
        opacity: o,
        transform: `translateY(${(1 - clamp01(enter)) * 8}px)`,
        fontVariantNumeric: "lining-nums",
      }}
    >
      {text}
    </div>
  ) : null;

export const EventText: React.FC<{
  lines: readonly string[];
  size?: number;
  o: number;
  tone?: Tone;
  enter?: number;
  tracking?: number;
  mt?: number;
}> = ({ lines, size = 28, o, tone = "deep", enter = 1, tracking = 0.12, mt = 10 }) =>
  o > 0.002 ? (
    <div
      style={{
        fontFamily: FONT_SANS,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1.25,
        letterSpacing: `${tracking}em`,
        color: COLOR[tone],
        opacity: o,
        marginTop: mt,
        transform: `translateY(${(1 - clamp01(enter)) * 8}px)`,
      }}
    >
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  ) : null;

export const AnthemText: React.FC<{
  lines: readonly string[];
  o: number;
  reveal: number;
  size?: number;
  tone?: Tone;
  align?: "left" | "center" | "right";
  center?: boolean;
}> = ({ lines, o, reveal, size = 46, tone = "deep", align = "left", center = false }) =>
  o > 0.002 ? (
    <div
      style={{
        fontFamily: FONT_DISPLAY,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.2,
        letterSpacing: "0.06em",
        color: COLOR[tone],
        opacity: o,
        textAlign: align,
      }}
    >
      {lines.map((line, i) => {
        const r = clamp01(reveal * lines.length - i);
        const inset = center ? `inset(-12% ${(1 - r) * 50}% -12% ${(1 - r) * 50}%)` : `inset(-12% ${(1 - r) * 100}% -12% 0)`;
        return (
          <div key={line} style={{ clipPath: inset }}>
            {line}
          </div>
        );
      })}
    </div>
  ) : null;

/** Map label anchored to a world point (hybrid: follows the atlas, not its zoom). */
export const MapLabel: React.FC<{
  camera: CameraState;
  anchor: Point;
  lines: readonly string[];
  o: number;
  size?: number;
  tone?: Tone;
  align?: "left" | "center" | "right";
  tracking?: number;
  dy?: number;
  id?: string;
}> = ({ camera, anchor, lines, o, size = 18, tone = "soft", align = "center", tracking = 0.26, dy = 0, id }) => {
  if (o <= 0.002) {
    return null;
  }
  const [x, y] = projectWorldPoint(anchor, camera);
  if (x < -600 || x > 2520 || y < -300 || y > 1380) {
    return null;
  }
  return (
    <At x={x} y={y + dy} align={align} id={id}>
      <EventText lines={lines} size={size} o={o} tone={tone} tracking={tracking} mt={0} />
    </At>
  );
};
