export const WORLD_WIDTH = 7680;
export const WORLD_HEIGHT = 4320;
export const VIEWPORT_WIDTH = 1920;
export const VIEWPORT_HEIGHT = 1080;
export const VIEWPORT_CENTER = [960, 540] as const;
export const FPS = 30;

/** Safe zones for primary text (§A: 8% horizontal, 7% vertical). */
export const SAFE_AREA = {
  left: Math.round(VIEWPORT_WIDTH * 0.08),
  right: VIEWPORT_WIDTH - Math.round(VIEWPORT_WIDTH * 0.08),
  top: Math.round(VIEWPORT_HEIGHT * 0.07),
  bottom: VIEWPORT_HEIGHT - Math.round(VIEWPORT_HEIGHT * 0.07),
} as const;
