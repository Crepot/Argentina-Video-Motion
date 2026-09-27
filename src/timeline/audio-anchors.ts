import { asGlobalFrame } from "../types/branded-frames";
import type { AudioAnchor } from "../types/scene";

/** Mandatory musical anchors of the benchmark (§7.4 plus the 2016 / 2171 editorial locks). */
export const BENCHMARK_AUDIO_ANCHORS: readonly AudioAnchor[] = [
  {
    id: "anchor.1976",
    frame: asGlobalFrame(1722),
    role: "scene-entry",
    mandatory: true,
  },
  {
    id: "anchor.repression",
    frame: asGlobalFrame(1812),
    role: "internal-transform",
    mandatory: true,
  },
  {
    id: "anchor.pitch",
    frame: asGlobalFrame(1908),
    role: "geometry-transform",
    mandatory: true,
  },
  {
    id: "anchor.goal",
    frame: asGlobalFrame(2016),
    role: "internal-transform",
    mandatory: true,
  },
  {
    id: "anchor.southAtlantic",
    frame: asGlobalFrame(2085),
    role: "geometry-transform",
    mandatory: true,
  },
  {
    id: "anchor.malvinas",
    frame: asGlobalFrame(2171),
    role: "internal-transform",
    mandatory: true,
  },
  {
    id: "anchor.1983",
    frame: asGlobalFrame(2172),
    role: "next-scene",
    mandatory: false,
  },
];

/** Secondary accents observed in the master (§8.3); they never replace anchors. */
export const SECONDARY_ACCENTS = [
  1791, 1896, 1905, 2016, 2043, 2106, 2127,
] as const;

/** Suggested SFX stay muted data until a later phase (§2.5). */
export const SFX_CUES = [
  { id: "sfx.relay", frame: 1791, enabled: false },
  { id: "sfx.roomTone", frame: 1812, enabled: false },
  { id: "sfx.ballImpact", frame: 2016, enabled: false },
  { id: "sfx.wind", frame: 2085, enabled: false },
] as const;
