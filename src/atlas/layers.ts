/**
 * Layer order and parallax (§3.5, §10.8). Parallax is a pure translation of
 * the camera position around a reference frame so that geometry which must
 * register across a transform is exactly aligned at that frame.
 */
export interface LayerSpec {
  order: number;
  factor: number;
  /** Global frame at which the layer is perfectly registered with world 1.0. */
  referenceFrame: number;
}

export const LAYERS = {
  paperBase: { order: 0, factor: 0, referenceFrame: 1722 },
  paperFiber: { order: 5, factor: 0.92, referenceFrame: 1722 },
  gridFar: { order: 10, factor: 0.95, referenceFrame: 1722 },
  cartography: { order: 20, factor: 1, referenceFrame: 1722 },
  historical: { order: 30, factor: 1, referenceFrame: 1722 },
  memoryLine: { order: 40, factor: 1, referenceFrame: 1722 },
  // Crowd/trophy sit 2% "above" the map, registered at the 2016 impact.
  figures: { order: 50, factor: 1.02, referenceFrame: 2016 },
  worldLabels: { order: 60, factor: 1, referenceFrame: 1722 },
} as const satisfies Record<string, LayerSpec>;

export type LayerId = keyof typeof LAYERS;
