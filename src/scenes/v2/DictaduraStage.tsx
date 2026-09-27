import React from "react";
import { clamp01, progress } from "../../animation/interpolate-clamped";
import {
  CIVIC_NODES_V2,
  CROSS_STREETS,
  FACADE_Y,
  FACADES,
  LOOSE_PAPERS,
  MAST,
  MEDIAN_Y,
  NORTH_CURB,
  NORTH_STREET_Y,
  SOUTH_CURB,
  SOUTH_EDGE,
} from "../../atlas/geometry/city-v2";
import { PITCH } from "../../atlas/geometry/stadium";
import { positionAt } from "../../actors/action-track";
import { VEHICLES_1976, type VehicleTrack } from "../../choreography/benchmark-v2-choreography";
import { mixColor, PALETTE } from "../../theme/palette";
import { Facade } from "../../stage/Facade";
import { Barrier, Kiosk, Lamppost, Paper, Smoke, Vehicle } from "../../stage/Props";
import { billboardMatrix, facadeMatrix } from "../../stage/projection";
import { TRACKS_V2 } from "../../timeline/benchmark-v2-timeline";
import type { StageContext, StageItem } from "./stage-items";

/**
 * Scene 10 (1976–1983) in V2: an inhabited avenue. The civic timeline is the
 * avenue's median; the institutional grid is a real façade; control is bars,
 * barriers, shutters and scan light; absence is exact empty rings.
 */
const T = TRACKS_V2;
const X0 = 2500;
const X1 = 4900;

/* ------------------------------------------------------------------ ground */

/** City plan on the ground plane (world units; rendered inside a WorldLayer). */
export const DictaduraGround: React.FC<{ f: number; px: (n: number) => number }> = ({ f, px }) => {
  const street = T.city.street(f);
  if (street <= 0.002) {
    return null;
  }
  const line = mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.35);
  let kerbs = `M ${X0} ${FACADE_Y} H ${X1} M ${X0} ${NORTH_CURB} H ${X1} M ${X0} ${SOUTH_CURB} H ${X1} M ${X0} ${SOUTH_EDGE} H ${X1} `;
  let blocks = "";
  let zebra = "";
  for (const [a, b] of CROSS_STREETS) {
    kerbs += `M ${a} ${NORTH_STREET_Y} V ${NORTH_CURB} M ${b} ${NORTH_STREET_Y} V ${NORTH_CURB} M ${a} ${SOUTH_EDGE} V 2900 M ${b} ${SOUTH_EDGE} V 2900 `;
    for (let y = NORTH_CURB + 14; y < SOUTH_CURB - 10; y += 22) {
      zebra += `M ${a + 6} ${y} H ${b - 6} `;
    }
  }
  // Blocks north of the avenue: their outlines are what the folded façades lie on.
  const edges = [X0, ...CROSS_STREETS.flat(), X1];
  for (let i = 0; i < edges.length; i += 2) {
    blocks += `M ${edges[i]} ${NORTH_STREET_Y} H ${edges[i + 1]} V ${FACADE_Y} H ${edges[i]} Z `;
  }
  const lanes = `M ${X0} 2402 H ${X1} M ${X0} 2524 H ${X1}`;
  const control = T.city.control(f);
  return (
    <g data-id="city.plan" opacity={street}>
      <path d={blocks} fill={mixColor(PALETTE.paperCool, PALETTE.grayBlue, 0.12)} stroke={line} strokeWidth={px(1.1)} />
      <path d={kerbs} fill="none" stroke={line} strokeWidth={px(1.3)} />
      <path d={zebra} fill="none" stroke={line} strokeWidth={px(3.2)} opacity={0.35} />
      <path d={lanes} fill="none" stroke={line} strokeWidth={px(1.1)} strokeDasharray={`${px(18)} ${px(16)}`} opacity={0.5} />
      {/* Institutional control on the ground: rigid double lines lock the kerbs. */}
      {control > 0.001 ? (
        <path
          d={`M ${X0} ${NORTH_CURB + 8} H ${X0 + (X1 - X0) * control} M ${X0} ${SOUTH_CURB - 8} H ${X0 + (X1 - X0) * control} M 3642 ${NORTH_CURB} V ${NORTH_CURB + (SOUTH_CURB - NORTH_CURB) * control}`}
          stroke={mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.5)}
          strokeWidth={px(1.8)}
          fill="none"
          opacity={0.75}
        />
      ) : null}
    </g>
  );
};

/** Civic nodes and the empty rings left by authored removals (§8.7). */
export const CivicNodesV2: React.FC<{ f: number; px: (n: number) => number }> = ({ f, px }) => {
  const nodeO = T.nodes.opacity(f);
  const ringO = T.nodes.rings(f);
  return (
    <g data-id="civicNodes.v2">
      {CIVIC_NODES_V2.map((n) => {
        const erosion = n.removeAt ? progress(f, n.removeAt, n.removeAt + 10) : 0;
        const r = 10;
        return (
          <g key={n.id}>
            <circle cx={n.p[0]} cy={n.p[1]} r={r * (1 - erosion)} fill={PALETTE.skyBlue} opacity={nodeO * (1 - erosion)} />
            <circle
              cx={n.p[0]}
              cy={n.p[1]}
              r={r + 6}
              fill="none"
              stroke={n.removeAt ? PALETTE.deepBlueSoft : PALETTE.skyBlue}
              strokeWidth={px(1.3)}
              opacity={n.removeAt ? ringO * (0.4 + 0.6 * erosion) : nodeO * 0.6}
            />
            {n.removeAt && erosion > 0 ? (
              <path
                d={`M ${n.p[0] - r - 12} ${n.p[1]} h 8 M ${n.p[0] + r + 4} ${n.p[1]} h 8 M ${n.p[0]} ${n.p[1] - r - 12} v 8 M ${n.p[0]} ${n.p[1] + r + 4} v 8`}
                stroke={PALETTE.deepBlueSoft}
                strokeWidth={px(1.1)}
                opacity={ringO * erosion}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

/** Surveillance: a searchlight pool sweeping two zones of the avenue (ground). */
export const ScanPools: React.FC<{ f: number; px: (n: number) => number }> = ({ f, px }) => {
  const o = T.control.scan(f);
  if (o <= 0.002) {
    return null;
  }
  const sweep = (f - 1812) / 60;
  const zones = [
    { x: 3480 + Math.sin(sweep * Math.PI * 1.4) * 150, y: 2470 },
    { x: 3860 + Math.sin(sweep * Math.PI * 1.1 + 1.3) * 120, y: 2520 },
  ];
  return (
    <g data-id="surveillance.scan" opacity={o}>
      {zones.map((z, i) => (
        <g key={i}>
          <ellipse cx={z.x} cy={z.y} rx={92} ry={56} fill={PALETTE.grayBluePale} opacity={0.55} />
          <ellipse cx={z.x} cy={z.y} rx={92} ry={56} fill="none" stroke={PALETTE.deepBlueSoft} strokeWidth={px(1)} strokeDasharray={`${px(6)} ${px(5)}`} />
          <path d={`M ${z.x - 104} ${z.y} h 20 M ${z.x + 84} ${z.y} h 20`} stroke={PALETTE.deepBlueSoft} strokeWidth={px(1.2)} />
        </g>
      ))}
    </g>
  );
};

/* -------------------------------------------------------------- billboards */

const vehicleAt = (v: VehicleTrack, f: number) => {
  const keys = v.pos.map((k) => ({ f: k.f, x: k.x, y: k.y, ease: k.ease }));
  return positionAt(
    { id: v.id, wardrobe: "army1976", scale: 1, detail: "map", seed: 0, role: "context", pos: keys, actions: [], life: { from: 0, to: 0 } },
    f,
  );
};

export const dictaduraItems = (ctx: StageContext): StageItem[] => {
  const { f } = ctx;
  const items: StageItem[] = [];
  if (f > 2095) {
    return items;
  }
  const p = ctx.proj(1);
  const fold = T.city.fold(f);
  const detail = T.city.detail(f);
  const tone = T.city.tone(f);
  const massO = T.city.mass(f);

  /* façades */
  for (const s of FACADES) {
    const inst = s.kind === "institution";
    const fo = inst ? T.city.institutionFold(f) : fold;
    const mass = inst ? T.city.institutionMass(f) : massO;
    const lines = inst ? T.city.institutionLines(f) : 1;
    if (mass <= 0.002 && lines <= 0.002) {
      continue;
    }
    items.push({
      key: s.id,
      y: FACADE_Y,
      depth: 1,
      node: (
        <g opacity={inst ? Math.max(mass, lines) : Math.min(1, massO * 1.4)}>
          <Facade
            spec={s}
            projector={p}
            groundY={FACADE_Y}
            fold={fo}
            detail={inst ? Math.max(detail, 0) : detail}
            massOpacity={inst ? mass : massO}
            tone={inst ? tone * 0.5 : tone}
            control={inst ? T.city.control(f) : 0}
            moduleH={inst ? T.city.institutionModule(f) : undefined}
            brackets={inst ? T.control.brackets(f) : 0}
          />
        </g>
      ),
    });
  }

  /* radio waves from the mast, erased by censorship shutters */
  const waves = T.censor.waves(f);
  if (waves > 0.002 && fold < 0.6) {
    const base = p.point(MAST.x, FACADE_Y, MAST.top * (1 - fold));
    items.push({
      key: "mast.waves",
      y: FACADE_Y + 1,
      depth: 1,
      node: (
        <g opacity={waves * (1 - fold)}>
          {[40, 70, 100].map((r, i) => {
            const rr = r * p.zoom;
            const beat = ((f / 30 + i * 0.33) % 1) * 0.3;
            return (
              <path
                key={r}
                d={`M ${base[0] - rr * (1 + beat)} ${base[1] + rr * 0.15} A ${rr * (1 + beat)} ${rr * (1 + beat)} 0 0 1 ${base[0] + rr * (1 + beat)} ${base[1] + rr * 0.15}`}
                fill="none"
                stroke={PALETTE.skyBlue}
                strokeWidth={1.6}
                strokeDasharray={waves < 1 ? `${(rr * 3 * waves).toFixed(1)} ${(rr * 3 * (1 - waves) + 1).toFixed(1)}` : undefined}
              />
            );
          })}
        </g>
      ),
    });
  }

  /* control bars rising along the institution kerb */
  const bars = T.control.bars(f) * (1 - T.city.institutionFold(f));
  if (bars > 0.002) {
    const barsO = T.control.barsOpacity(f);
    let d = "";
    const n = 17;
    for (let i = 0; i < n; i++) {
      const x = PITCH.left + (PITCH.width * i) / (n - 1);
      const a = p.point(x, 2330, 0);
      const h = 170 * clamp01(bars * 1.2 - (i % 4) * 0.06);
      const b = p.point(x, 2330, h);
      d += `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} L ${b[0].toFixed(1)} ${b[1].toFixed(1)} `;
    }
    const r0 = p.point(PITCH.left, 2330, 170 * bars);
    const r1 = p.point(PITCH.right, 2330, 170 * bars);
    items.push({
      key: "control.bars",
      y: 2330,
      depth: 1,
      node: (
        <g opacity={barsO} stroke={mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.62)} fill="none">
          <path d={d} strokeWidth={3} strokeLinecap="butt" />
          <path d={`M ${r0[0]} ${r0[1]} L ${r1[0]} ${r1[1]}`} strokeWidth={3.2} />
        </g>
      ),
    });
  }

  /* barriers across the avenue (the riot line's checkpoint) */
  const barrier = T.control.barrier(f);
  [2388, 2436, 2484, 2532].forEach((y, i) => {
    items.push({
      key: `barrier.${i}`,
      y,
      depth: 1,
      node: <Barrier p={p} x={3612} y={y} scale={1} width={46} build={clamp01(barrier * 1.6 - i * 0.2) * (1 - fold)} tone={0.05} />,
    });
  });

  /* lampposts along both kerbs */
  [3060, 3420, 3840, 4200, 4560].forEach((x, i) => {
    if (!ctx.onScreen(x, SOUTH_CURB, 1, 400)) {
      return;
    }
    items.push({ key: `lamp.s.${i}`, y: SOUTH_CURB + 6, depth: 1, node: <g opacity={1 - fold}><Lamppost p={p} x={x} y={SOUTH_CURB + 6} scale={1.3} tone={0.05} /></g> });
    items.push({ key: `lamp.n.${i}`, y: NORTH_CURB - 6, depth: 1, node: <g opacity={1 - fold}><Lamppost p={p} x={x + 180} y={NORTH_CURB - 6} scale={1.25} tone={0.12} /></g> });
  });

  /* vehicles */
  for (const v of VEHICLES_1976) {
    if (f < v.life.from || f > v.life.to) {
      continue;
    }
    const at = vehicleAt(v, f);
    if (!ctx.onScreen(at.x, at.y, 1, 300)) {
      continue;
    }
    const facing: 1 | -1 = v.pos[v.pos.length - 1].x >= v.pos[0].x ? 1 : -1;
    const vis = v.id === "sedan.1" ? clamp01(progress(f, v.life.from, v.life.from + 8)) * clamp01(progress(f, v.life.to, v.life.to - 10)) : 1;
    items.push({
      key: v.id,
      y: at.y,
      depth: v.depth ?? 1,
      node: (
        <g opacity={vis * (1 - fold)}>
          <Vehicle kind={v.kind} p={ctx.proj(v.depth ?? 1)} x={at.x} y={at.y} scale={v.scale} facing={facing} dist={at.dist} tone={v.tone} rise={1 - fold} />
        </g>
      ),
    });
  }

  /* kiosk on the south pavement (near plane): newspapers shuttered by censorship */
  const kp = ctx.proj(1.2);
  items.push({
    key: "kiosk",
    y: 2680,
    depth: 1.2,
    node: (
      <g opacity={1 - fold}>
        <Kiosk p={kp} x={4075} y={2680} scale={0.95} censor={T.censor.kiosk(f)} tone={0} />
      </g>
    ),
  });

  /* tear-gas smoke at the checkpoint, thinning into hatching */
  const smoke = T.smoke.strength(f);
  if (smoke > 0.002) {
    items.push({
      key: "smoke.1",
      y: 2470,
      depth: 1,
      node: <Smoke p={p} x={3600} y={2470} scale={1.6} age={(f - 1788) / 70} strength={smoke} seed={3} />,
    });
    items.push({
      key: "smoke.2",
      y: 2560,
      depth: 1,
      node: <Smoke p={p} x={3530} y={2560} scale={1.3} age={(f - 1796) / 64} strength={smoke * 0.8} seed={8} />,
    });
  }

  /* loose documents blown east along the avenue */
  const paperO = T.papers(f);
  if (paperO > 0.002) {
    LOOSE_PAPERS.forEach((q, i) => {
      const t = (f - 1722) / 30;
      const x = q.x + t * 38 * q.drift;
      const h = 6 + Math.abs(Math.sin((t + q.phase) * 2.2)) * 22;
      if (!ctx.onScreen(x, q.y, 1, 100)) {
        return;
      }
      items.push({
        key: `paper.${i}`,
        y: q.y,
        depth: 1,
        node: (
          <g opacity={paperO}>
            <Paper p={p} x={x} y={q.y} h={h} size={q.size} spin={t * 0.7 + q.phase} censored={i % 3 === 0} />
          </g>
        ),
      });
    });
  }

  /* foreground lamppost passing close to the camera */
  const fg = ctx.proj(2.3);
  items.push({
    key: "fg.lamp",
    y: 2700,
    depth: 2.3,
    node: <Lamppost p={fg} x={3470} y={2700} scale={2.2} tone={0} />,
  });
  return items;
};

export const MEDIAN = MEDIAN_Y;
export { billboardMatrix, facadeMatrix };
