import { clamp01 } from "../../animation/interpolate-clamped";
import { createPrng } from "../../animation/stroke-draw";
import { mixColor, PALETTE } from "../../theme/palette";
import type { Projector } from "../../stage/projection";
import type { Point } from "../../types/paths";
import type { StageItem } from "../types";

/**
 * CrowdFlow (spec §9.14): many people as compact glyphs (body, head, arms,
 * optional umbrella/placard) merged into a few compound paths per depth
 * band — not hundreds of React components. Members arrive, gather, respond,
 * withdraw by pure functions of the frame; phases come from a seed.
 */
export interface CrowdMember {
  x: number;
  y: number;
  shirt: number;
  phase: number;
  lift: number;
  /** Arrival order 0..1 (who shows up first). */
  order: number;
  /** Arrival offset (local units) the member walks in from. */
  from: Point;
}

export const seedCrowd = (opts: {
  seed: number;
  count: number;
  /** Area test in local units. */
  area: (rnd: () => number) => Point;
  shirts: number;
  from?: (p: Point, rnd: () => number) => Point;
}): CrowdMember[] => {
  const r = createPrng(opts.seed);
  const out: CrowdMember[] = [];
  for (let i = 0; i < opts.count; i++) {
    const p = opts.area(r);
    out.push({
      x: p[0],
      y: p[1],
      shirt: Math.floor(r() * opts.shirts),
      phase: r(),
      lift: r(),
      order: r(),
      from: opts.from ? opts.from(p, r) : [0, 0],
    });
  }
  return out;
};

export interface CrowdLook {
  /** Glyph size (local units): body half-width. */
  u: number;
  shirts: readonly string[];
  head?: string;
  /** 0..1 umbrellas open over heads (1810). */
  umbrellas?: number;
  /** 0..1 placards on sticks. */
  placards?: number;
  /** 0..1 small flags. */
  flags?: number;
  tone?: number;
  /** Body height in units of `u` (5.2 standing, ~2 seated). */
  tall?: number;
}

export interface CrowdState {
  /** Fraction of the crowd present (arrival by order). */
  presence: number;
  /** 0 calm … 1 jumping, arms up. */
  excite: number;
  /** Travelling wave of raised arms (civic pulse): position 0..1 along x, or null. */
  pulse?: { x: number; width: number; strength: number } | null;
  /** 0..1 withdrawal: members walk back toward `from`. */
  withdraw?: number;
  /** Global opacity. */
  opacity?: number;
  /** Height factor (1 standing, 0 folded marks). */
  rise?: number;
}

const f1 = (n: number) => n.toFixed(1);

export const crowdItems = (opts: {
  key: string;
  p: Projector;
  members: readonly CrowdMember[];
  look: CrowdLook;
  state: CrowdState;
  f: number;
  bands?: number;
  sortOffset?: number;
}): StageItem[] => {
  const { p, members, look, state, f } = opts;
  const o = state.opacity ?? 1;
  if (o <= 0.002 || state.presence <= 0.001) {
    return [];
  }
  const nb = opts.bands ?? 6;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const m of members) {
    y0 = Math.min(y0, m.y);
    y1 = Math.max(y1, m.y);
  }
  const bandOf = (y: number) => Math.min(nb - 1, Math.floor(((y - y0) / Math.max(1, y1 - y0)) * nb));
  const shirtsD: string[][] = Array.from({ length: nb }, () => look.shirts.map(() => ""));
  const heads = Array.from({ length: nb }, () => "");
  const arms = Array.from({ length: nb }, () => "");
  const umbr = Array.from({ length: nb }, () => "");
  const plac = Array.from({ length: nb }, () => "");
  const flg = Array.from({ length: nb }, () => "");
  const legs = Array.from({ length: nb }, () => "");
  const eh = p.eh;
  const ex = p.ex;
  const z = p.zoom;
  const rise = state.rise ?? 1;
  const u = look.u;
  const sorted = [...members].sort((a, b) => a.y - b.y);
  for (const m of sorted) {
    const appear = clamp01((state.presence - m.order * 0.9) / 0.1);
    if (appear <= 0.02) {
      continue;
    }
    const wd = clamp01(((state.withdraw ?? 0) - m.order * 0.6) / 0.4);
    const walk = 1 - appear;
    const mx = m.x + m.from[0] * Math.max(walk, wd);
    const my = m.y + m.from[1] * Math.max(walk, wd);
    const base = p.point(mx, my, 0);
    if (base[0] < -80 || base[0] > 2000 || base[1] < -200 || base[1] > 1300) {
      continue;
    }
    const b = bandOf(m.y);
    const k = appear * (1 - wd * 0.3);
    let lift = 0;
    const exc = state.excite;
    if (exc > 0.05) {
      lift = exc * 2.4 * u * Math.max(0, Math.sin((f / 8 + m.phase) * Math.PI)) * (m.lift > 0.4 ? 1 : 0.4);
    }
    let pulseArms = 0;
    if (state.pulse) {
      const d = Math.abs((m.x - state.pulse.x) / state.pulse.width);
      pulseArms = clamp01(1 - d) * state.pulse.strength;
      lift += pulseArms * u * 1.2;
    }
    const hgt = rise;
    const bodyH = (look.tall ?? 5.2) * u * hgt;
    const lx = eh[0] * lift;
    const ly = eh[1] * lift;
    const bx = base[0] + lx + eh[0] * u * 3.2 * hgt;
    const by = base[1] + ly + eh[1] * u * 3.2 * hgt;
    if (hgt > 0.3) {
      const sw = Math.sin((f / 6 + m.phase * 7) * Math.PI) * u * 0.35 * walk * z;
      legs[b] += `M ${f1(base[0] + lx - ex[0] * u * 0.45 + sw)} ${f1(base[1] + ly)} L ${f1(bx - ex[0] * u * 0.3)} ${f1(by)} M ${f1(base[0] + lx + ex[0] * u * 0.45 - sw)} ${f1(base[1] + ly)} L ${f1(bx + ex[0] * u * 0.3)} ${f1(by)} `;
    }
    const cx = base[0] + lx + eh[0] * bodyH;
    const cy = base[1] + ly + eh[1] * bodyH;
    const si = m.shirt % look.shirts.length;
    shirtsD[b][si] += `M ${f1(bx)} ${f1(by)} L ${f1(bx + (cx - bx) * k)} ${f1(by + (cy - by) * k)} `;
    const hx = cx + eh[0] * u * 1.05 * hgt * k;
    const hy = cy + eh[1] * u * 1.05 * hgt * k;
    const hr = u * 0.62 * z * k;
    heads[b] += `M ${f1(hx - hr)} ${f1(hy)} a ${f1(hr)} ${f1(hr)} 0 1 0 ${f1(2 * hr)} 0 a ${f1(hr)} ${f1(hr)} 0 1 0 ${f1(-2 * hr)} 0 `;
    const armsUp = Math.max(clamp01((exc - 0.35) * 2.5) * (m.lift > 0.3 ? 1 : 0), pulseArms);
    if (armsUp > 0.05) {
      for (const side of [-1, 1]) {
        const sx = cx + ex[0] * side * u * 0.8 * k + eh[0] * u * 0.5;
        const sy = cy + ex[1] * side * u * 0.8 * k + eh[1] * u * 0.5;
        const tx = sx + ex[0] * side * u * 0.6 * armsUp + eh[0] * u * 2.4 * armsUp;
        const ty = sy + ex[1] * side * u * 0.6 * armsUp + eh[1] * u * 2.4 * armsUp;
        arms[b] += `M ${f1(sx)} ${f1(sy)} L ${f1(tx)} ${f1(ty)} `;
      }
    }
    if ((look.umbrellas ?? 0) > 0.02 && m.lift > 0.45) {
      const ua = look.umbrellas! * k;
      const ux = hx + eh[0] * u * 1.3;
      const uy = hy + eh[1] * u * 1.3;
      const w = u * 2.2 * z * ua;
      const hh = u * 1.1 * z * Math.max(0.3, p.rise) * ua;
      umbr[b] += `M ${f1(ux - w)} ${f1(uy)} Q ${f1(ux)} ${f1(uy - hh * 2)} ${f1(ux + w)} ${f1(uy)} Z `;
    }
    if ((look.placards ?? 0) > 0.02 && m.lift > 0.82) {
      const pa = look.placards! * k;
      const px0 = hx + eh[0] * u * 2.6 * pa;
      const py0 = hy + eh[1] * u * 2.6 * pa;
      const w = u * 1.7 * z;
      const hh = u * 1.1 * z * Math.max(0.3, p.rise);
      plac[b] += `M ${f1(px0 - w)} ${f1(py0 - hh)} h ${f1(2 * w)} v ${f1(2 * hh)} h ${f1(-2 * w)} Z `;
    }
    if ((look.flags ?? 0) > 0.02 && m.lift > 0.9) {
      const fa = look.flags! * k;
      const px0 = hx + eh[0] * u * 3.2 * fa;
      const py0 = hy + eh[1] * u * 3.2 * fa;
      const w = u * 2 * z * fa;
      const wave = Math.sin(f / 5 + m.phase * 6) * u * 0.3 * z;
      flg[b] += `M ${f1(px0)} ${f1(py0)} l ${f1(w)} ${f1(wave)} l 0 ${f1(u * 0.9 * z)} l ${f1(-w)} ${f1(-wave)} Z `;
    }
  }
  const out: StageItem[] = [];
  const line = PALETTE.deepBlue;
  const T = (c: string) => mixColor(c, PALETTE.paperCool, look.tone ?? 0);
  for (let b = 0; b < nb; b++) {
    if (!heads[b]) {
      continue;
    }
    out.push({
      key: `${opts.key}.b${b}`,
      y: y0 + ((b + 0.5) / nb) * (y1 - y0) + (opts.sortOffset ?? 0),
      depth: 1,
      node: (
        <g opacity={o}>
          {legs[b] ? <path d={legs[b]} stroke={T(PALETTE.deepBlue)} strokeWidth={Math.max(1, look.u * p.zoom * 0.55)} strokeLinecap="round" /> : null}
          {flg[b] ? <path d={flg[b]} fill={T(PALETTE.skyBlue)} stroke={T(line)} strokeWidth={0.5} /> : null}
          {plac[b] ? <path d={plac[b]} fill={T(PALETTE.paperWarm)} stroke={T(line)} strokeWidth={0.8} /> : null}
          {look.shirts.map((c, i) =>
            shirtsD[b][i] ? (
              <g key={i}>
                <path d={shirtsD[b][i]} stroke={T(line)} strokeWidth={look.u * p.zoom * 1.6 + 1.2} strokeLinecap="round" strokeOpacity={0.55} />
                <path d={shirtsD[b][i]} stroke={T(c)} strokeWidth={look.u * p.zoom * 1.6} strokeLinecap="round" />
              </g>
            ) : null,
          )}
          <path d={heads[b]} fill={T(look.head ?? PALETTE.deepBlue)} opacity={0.88} />
          {arms[b] ? <path d={arms[b]} stroke={T(PALETTE.deepBlueSoft)} strokeWidth={Math.max(0.8, look.u * p.zoom * 0.28)} strokeLinecap="round" /> : null}
          {umbr[b] ? <path d={umbr[b]} fill={T(mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3))} stroke={T(line)} strokeWidth={0.6} /> : null}
        </g>
      ),
    });
  }
  return out;
};
