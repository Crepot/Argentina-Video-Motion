/**
 * Verifies that the benchmark's audio track is the master WAV at 57.4–72.4 s.
 * Cross-correlates the decoded MP4 audio against the untouched master and
 * reports the best-matching source time. Read-only on the master file.
 * Usage: ./node_modules/.bin/jiti scripts/audio-offset.ts <decoded-benchmark.wav>
 */
import { readFileSync } from "node:fs";

const readWav = (path: string) => {
  const b = readFileSync(path);
  let p = 12, fmt = { ch: 2, rate: 48000, bits: 16 }, data = Buffer.alloc(0);
  while (p < b.length - 8) {
    const id = b.toString("ascii", p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === "fmt ") fmt = { ch: b.readUInt16LE(p + 10), rate: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (id === "data") { data = b.subarray(p + 8, p + 8 + size); break; }
    p += 8 + size + (size % 2);
  }
  const frames = data.length / (fmt.ch * 2);
  const mono = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0; for (let c = 0; c < fmt.ch; c++) s += data.readInt16LE((i * fmt.ch + c) * 2);
    mono[i] = s / fmt.ch / 32768;
  }
  return { rate: fmt.rate, mono, seconds: frames / fmt.rate };
};

const master = readWav("assets/Lealtad_y_Destino_2026-09-26T210416.wav");
const bench = readWav(process.argv[2]);
console.log(`master ${master.seconds.toFixed(3)} s @ ${master.rate} Hz · benchmark track ${bench.seconds.toFixed(3)} s`);

// Envelope-free direct correlation on a 4 s window taken 1 s into the benchmark.
const rate = master.rate;
const win = 4 * rate, start = 1 * rate;
const corrAt = (sourceSample: number) => {
  let num = 0, ea = 0, eb = 0;
  for (let i = 0; i < win; i += 2) {
    const a = bench.mono[start + i], b = master.mono[sourceSample + start + i];
    num += a * b; ea += a * a; eb += b * b;
  }
  return num / Math.sqrt(ea * eb || 1);
};
const expected = Math.round(57.4 * rate);
let best = { lag: 0, c: -Infinity };
for (let lag = -rate / 2; lag <= rate / 2; lag += 1) {
  const c = corrAt(expected + lag);
  if (c > best.c) best = { lag, c };
}
const t = (expected + best.lag) / rate;
console.log(`best match: source t = ${t.toFixed(4)} s (lag ${best.lag} samples = ${(best.lag / rate * 1000).toFixed(2)} ms vs 57.4000 s), correlation ${best.c.toFixed(4)}`);
// Tail check: 13 s into the benchmark must still match the master at 70.4 s.
const tail = (() => { let num = 0, ea = 0, eb = 0; const s0 = 13 * rate; for (let i = 0; i < rate; i += 2) { const a = bench.mono[s0 + i], b = master.mono[expected + best.lag + s0 + i]; num += a * b; ea += a * a; eb += b * b; } return num / Math.sqrt(ea * eb || 1); })();
console.log(`tail correlation at +13 s (master ${(t + 13).toFixed(3)} s): ${tail.toFixed(4)}`);
