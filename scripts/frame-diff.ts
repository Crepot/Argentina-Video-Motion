/**
 * Consecutive-frame difference for rendered PNGs (hard-cut detector).
 * A cut shows as a spike in MAD / drop in PSNR relative to its neighbours.
 * PNG → BMP via macOS `sips` (no extra dependency), then compared in Node.
 * Usage: ./node_modules/.bin/jiti scripts/frame-diff.ts <dir> <globalFrame...>
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [dir, ...frames] = process.argv.slice(2);
const files = readdirSync(dir);
const work = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), "framediff-"));
const load = (g: string) => {
  const f = files.find((n) => n.startsWith(`global-${g}_`));
  if (!f) throw new Error(`missing frame ${g}`);
  const out = join(work, `${g}.bmp`);
  execFileSync("sips", ["-s", "format", "bmp", join(dir, f), "--out", out], { stdio: "ignore" });
  const b = readFileSync(out);
  const offset = b.readUInt32LE(10);
  const bpp = b.readUInt16LE(28);
  return { px: b.subarray(offset), step: bpp / 8 };
};
let prev = load(frames[0]);
for (let i = 1; i < frames.length; i++) {
  const cur = load(frames[i]);
  let sad = 0, sse = 0, n = 0, changed = 0;
  for (let k = 0; k < cur.px.length; k += cur.step) {
    for (let c = 0; c < 3; c++) {
      const d = Math.abs(cur.px[k + c] - prev.px[k + c]);
      sad += d; sse += d * d; n++;
      if (c === 0 && d > 24) changed++;
    }
  }
  const mse = sse / n;
  const psnr = mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
  console.log(`${frames[i - 1]}→${frames[i]}  MAD ${(sad / n).toFixed(3)}  PSNR ${psnr.toFixed(2)} dB  px changed>24: ${((changed / (n / 3)) * 100).toFixed(3)}%`);
  prev = cur;
}
