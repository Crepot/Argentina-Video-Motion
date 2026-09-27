import React from "react";
import { PALETTE } from "../../theme/palette";

/** Shared patterns for the film (mounted once). User-space patterns scale with the atlas. */
export const FilmDefs: React.FC = () => (
  <defs>
    <pattern id="film-hatch-fine" patternUnits="userSpaceOnUse" width={4} height={4} patternTransform="rotate(40)">
      <path d="M 0 0 V 4" stroke={PALETTE.deepBlueSoft} strokeWidth={0.6} />
    </pattern>
    <pattern id="film-hatch-claim" patternUnits="userSpaceOnUse" width={7} height={7} patternTransform="rotate(-45)">
      <path d="M 0 0 V 7" stroke={PALETTE.deepBlue} strokeWidth={1.1} />
    </pattern>
    <pattern id="film-halftone" patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
      <circle cx={3} cy={3} r={1.35} fill={PALETTE.deepBlueSoft} />
    </pattern>
    <pattern id="film-rock-hatch" patternUnits="userSpaceOnUse" width={5} height={5} patternTransform="rotate(-30)">
      <path d="M 0 0 V 5" stroke={PALETTE.deepBlueSoft} strokeWidth={0.7} />
    </pattern>
  </defs>
);
