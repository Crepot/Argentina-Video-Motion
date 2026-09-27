/**
 * Declares the AAC encoder delay in the rendered MP4's audio edit list.
 *
 * The render muxes AAC with `elst.media_time = 0`, so players present the
 * encoder's priming samples (≈ silence) before the master audio, i.e. the
 * master is heard late. This rewrites, in place and with identical sizes,
 * only the audio track's edit-list entry: media_time = <priming samples>
 * (in the track's own timescale) and segment_duration = the video duration.
 * No sample is re-encoded; the master WAV is never touched.
 *
 * Usage: ./node_modules/.bin/jiti scripts/fix-aac-priming.ts <file.mp4> <primingSamples>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [file, primingArg] = process.argv.slice(2);
const priming = Number(primingArg);
if (!file || !Number.isInteger(priming) || priming <= 0) {
  throw new Error("usage: fix-aac-priming.ts <file.mp4> <primingSamples>");
}
const buf = readFileSync(file);

type Box = { type: string; start: number; size: number; body: number };
const children = (start: number, end: number): Box[] => {
  const out: Box[] = [];
  for (let p = start; p + 8 <= end; ) {
    const size = buf.readUInt32BE(p);
    const type = buf.toString("latin1", p + 4, p + 8);
    if (size < 8) break;
    out.push({ type, start: p, size, body: p + 8 });
    p += size;
  }
  return out;
};
const find = (parent: Box, type: string) => children(parent.body, parent.start + parent.size).find((b) => b.type === type);

const moov = children(0, buf.length).find((b) => b.type === "moov");
if (!moov) throw new Error("no moov box");
const mvhd = find(moov, "mvhd")!;
const movieTimescale = buf.readUInt32BE(mvhd.body + 12);

let videoDuration = 0;
let audioElst: Box | undefined;
let audioTimescale = 0;
for (const trak of children(moov.body, moov.start + moov.size).filter((b) => b.type === "trak")) {
  const mdia = find(trak, "mdia")!;
  const hdlr = find(mdia, "hdlr")!;
  const handler = buf.toString("latin1", hdlr.body + 8, hdlr.body + 12);
  const tkhd = find(trak, "tkhd")!;
  if (buf.readUInt8(tkhd.body) !== 0) throw new Error("tkhd v1 not handled");
  if (handler === "vide") videoDuration = buf.readUInt32BE(tkhd.body + 20);
  if (handler === "soun") {
    const mdhd = find(mdia, "mdhd")!;
    audioTimescale = buf.readUInt32BE(mdhd.body + 12);
    audioElst = find(find(trak, "edts")!, "elst");
  }
}
if (!audioElst || !videoDuration) throw new Error("audio edit list or video track not found");
if (buf.readUInt8(audioElst.body) !== 0 || buf.readUInt32BE(audioElst.body + 4) !== 1) {
  throw new Error("expected a version-0 elst with a single entry");
}
const entry = audioElst.body + 8;
const before = { segment: buf.readUInt32BE(entry), mediaTime: buf.readInt32BE(entry + 4) };
if (before.mediaTime !== 0) throw new Error(`audio media_time already ${before.mediaTime}; refusing to patch twice`);
buf.writeUInt32BE(videoDuration, entry);
buf.writeInt32BE(priming, entry + 4);
writeFileSync(file, buf);
console.log(
  `audio elst: segment ${before.segment} → ${videoDuration} (movie ts ${movieTimescale}), media_time 0 → ${priming} (audio ts ${audioTimescale}, ${((priming / audioTimescale) * 1000).toFixed(2)} ms)`,
);
