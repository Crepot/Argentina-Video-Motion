import type { Point } from "../types/paths";

/**
 * Locked editorial anchors (§3.3). Page positions inside the atlas, not GIS
 * coordinates. Geometry must reference these names, never loose numbers.
 */
export const ANCHORS = {
  institutionalEntry: [3340, 2110],
  controlledCenter: [3550, 2180],
  woundedVoid: [3720, 2190],
  stadiumWest: [3820, 2180],
  stadiumCenter: [4090, 2170],
  stadiumOverhead: [4300, 2250],
  southAtlanticThreshold: [4700, 2350],
  oceanTravel: [5140, 2530],
  malvinasApproach: [5480, 2690],
} as const satisfies Record<string, Point>;

export type AnchorId = keyof typeof ANCHORS;
