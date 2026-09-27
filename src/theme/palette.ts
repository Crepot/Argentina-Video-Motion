/** Benchmark palette tokens (§8.2). No partisan red, no black, no alternate gold. */
export const PALETTE = {
  paperIvory: "#F5F0E6",
  paperWarm: "#F7F3EA",
  paperCool: "#F2EFE7",
  skyBlue: "#75B6D9",
  skyBlueMid: "#8BC4E0",
  skyBluePale: "#A5D3E8",
  deepBlue: "#174A73",
  deepBlueSoft: "#245B82",
  goldMuted: "#C49A45",
  goldLight: "#D2AE61",
  grayBlue: "#A9B8BE",
  grayBluePale: "#CCD3D1",
} as const;

export type PaletteToken = keyof typeof PALETTE;

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (v: number) =>
  Math.round(Math.min(255, Math.max(0, v)))
    .toString(16)
    .padStart(2, "0");

/**
 * Token mix in sRGB. Used for "saturation" states: the spec applies
 * saturation to tokens, never as a CSS filter on the page (§6).
 */
export const mixColor = (a: string, b: string, t: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const k = Math.min(1, Math.max(0, t));
  return `#${toHex(ca[0] + (cb[0] - ca[0]) * k)}${toHex(ca[1] + (cb[1] - ca[1]) * k)}${toHex(
    ca[2] + (cb[2] - ca[2]) * k,
  )}`;
};

/** Sky-blue that loses saturation toward the controlled gray-blue. */
export const desaturatedSky = (saturation: number) =>
  mixColor(PALETTE.grayBlue, PALETTE.skyBlue, saturation);
