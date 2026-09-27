/**
 * Apparent stroke widths at 1080p (§10.9). Components convert them to world
 * units with the current camera zoom so zoom never fattens a line.
 */
export const LINE_PX = {
  cartographySecondary: 1.1,
  gridPrimary: 1.35,
  institutionalControl: 1.75,
  pitch: 2.0,
  memoryLine: 3.0,
  routeHead: 3.25,
  trophy: 2.5,
  hairline: 1.0,
} as const;

/** Route taxonomy (§A): dotted = planned, solid = active, interrupted = lost. */
export const DASH_PX = {
  dotted: [1.2, 7] as const,
  interrupted: [14, 9] as const,
  directional: [12, 9] as const,
  censorTick: [3, 5] as const,
};
