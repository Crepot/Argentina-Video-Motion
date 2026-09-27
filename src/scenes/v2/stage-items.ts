import type React from "react";
import type { Projector } from "../../stage/projection";

/**
 * A drawable standing on the atlas (façade, figure, vehicle, prop). Items of
 * one plane are depth-sorted by their ground y (far first) so that people,
 * vehicles and architecture occlude each other correctly.
 */
export interface StageItem {
  key: string;
  /** Ground y used for sorting (world units). */
  y: number;
  /** Plane depth (1 = ground plane; > 1 foreground). */
  depth: number;
  node: React.ReactNode;
}

export interface StageContext {
  f: number;
  proj: (depth?: number) => Projector;
  /** Screen-space viewport culling margin test. */
  onScreen: (x: number, y: number, depth?: number, margin?: number) => boolean;
}

export const sortItems = (items: readonly StageItem[]) =>
  [...items].sort((a, b) => (a.depth === b.depth ? a.y - b.y : a.depth - b.depth));
