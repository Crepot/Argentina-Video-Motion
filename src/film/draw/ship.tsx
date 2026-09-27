import React from "react";
import { mixColor, PALETTE } from "../../theme/palette";
import { type Projector } from "../../stage/projection";
import { standMatrix } from "./stand";

/**
 * Ships on routes (VehicleOnRoute, spec §9.14): original generic vessels
 * drawn as billboards standing on the water plane. Local units: bow toward
 * +x, waterline y = 0, hull ≈ 300 long. Sails answer an authored wind phase;
 * the hull rolls a few degrees. Nothing is copied from period plates.
 */
export type ShipKind = "caravel" | "frigate" | "steamer";

const f1 = (n: number) => n.toFixed(1);
const ns = { vectorEffect: "non-scaling-stroke" as const };

const squareSail = (x: number, top: number, bot: number, w: number, belly: number) =>
  `M ${f1(x - w / 2)} ${f1(top)} L ${f1(x + w / 2)} ${f1(top)} C ${f1(x + w / 2 + belly)} ${f1((top + bot) / 2)}, ${f1(x + w / 2 + belly * 0.6)} ${f1(bot)}, ${f1(x + w / 2 - 2)} ${f1(bot)} L ${f1(x - w / 2 + 2)} ${f1(bot)} C ${f1(x - w / 2 + belly * 0.6)} ${f1(bot)}, ${f1(x - w / 2 + belly)} ${f1((top + bot) / 2)}, ${f1(x - w / 2)} ${f1(top)} Z`;

const lateen = (x: number, top: number, bot: number, w: number, belly: number) =>
  `M ${f1(x - w * 0.55)} ${f1(bot)} L ${f1(x + w * 0.2)} ${f1(top)} C ${f1(x + w * 0.5 + belly)} ${f1(top + (bot - top) * 0.5)}, ${f1(x + w * 0.45 + belly)} ${f1(bot - 6)}, ${f1(x + w * 0.35)} ${f1(bot)} Z`;

export const ShipDrawing: React.FC<{
  kind: ShipKind;
  wind: number;
  tone?: number;
  furl?: number;
  smoke?: number;
  flag?: "argentina" | "abstract" | "none";
  passengers?: number;
}> = ({ kind, wind, tone = 0, furl = 0, smoke = 0, flag = "abstract", passengers = 0 }) => {
  const T = (c: string) => mixColor(c, PALETTE.paperCool, tone);
  const line = T(PALETTE.deepBlue);
  const hullC = T(mixColor(PALETTE.deepBlueSoft, PALETTE.deepBlue, 0.4));
  const sailC = T(PALETTE.paperWarm);
  const belly = (i: number) => (10 + 4 * Math.sin(wind * Math.PI * 2 + i)) * (1 - furl);
  const sails: string[] = [];
  let masts = "";
  let rig = "";
  let hull = "";
  let deck = "";
  if (kind === "steamer") {
    hull = "M -160 -40 L 150 -40 C 162 -34, 168 -20, 160 0 L -150 0 C -158 -8, -162 -24, -160 -40 Z";
    deck = "M -120 -40 L -120 -64 L 90 -64 L 90 -40 M -100 -64 L -100 -80 L 60 -80 L 60 -64";
    masts = "M -130 -40 V -170 M 120 -40 V -160";
    rig = "M -130 -168 L 120 -158 M -130 -168 L -158 -42 M 120 -158 L 150 -42";
  } else {
    hull =
      kind === "caravel"
        ? "M -140 -36 C -128 -52, -110 -58, -96 -54 L 96 -46 C 118 -52, 136 -62, 150 -70 C 146 -40, 128 -10, 96 0 L -104 0 C -126 -8, -140 -20, -140 -36 Z"
        : "M -150 -52 C -142 -70, -120 -74, -104 -66 L 110 -58 C 130 -62, 148 -70, 160 -78 C 156 -44, 136 -10, 104 0 L -112 0 C -136 -10, -150 -28, -150 -52 Z";
    deck = kind === "frigate" ? "M -120 -42 L 120 -36 M -110 -26 H 116" : "M -110 -40 L 100 -34";
    const mx = kind === "caravel" ? [-70, 10, 80] : [-80, 0, 84];
    const mh = kind === "caravel" ? [190, 240, 170] : [250, 290, 220];
    mx.forEach((x, i) => {
      masts += `M ${x} -46 V ${-mh[i]} `;
    });
    if (kind === "caravel") {
      sails.push(lateen(mx[0], -mh[0] + 10, -70, 120, belly(0)));
      sails.push(squareSail(mx[1], -mh[1] + 30, -80, 116, belly(1)));
      sails.push(lateen(mx[2], -mh[2] + 10, -66, 100, belly(2)));
      rig = `M ${mx[1]} ${-mh[1]} L 150 -70 M ${mx[1]} ${-mh[1]} L -140 -40`;
    } else {
      mx.forEach((x, i) => {
        const h = mh[i];
        sails.push(squareSail(x, -h + 26, -h + 100, 128 - i * 6, belly(i)));
        sails.push(squareSail(x, -h + 108, -86, 150 - i * 8, belly(i + 3)));
      });
      rig = `M ${mx[1]} ${-mh[1]} L 186 -84 M ${mx[1]} ${-mh[1]} L -150 -52 M 160 -78 L 206 -96`;
    }
  }
  const smokePuffs =
    kind === "steamer" && smoke > 0.01
      ? [0, 1, 2, 3].map((i) => {
          const t = (wind * 0.8 + i * 0.25) % 1;
          return (
            <ellipse
              key={i}
              cx={-30 - t * 120}
              cy={-120 - t * 60}
              rx={14 + t * 26}
              ry={10 + t * 16}
              fill={T(PALETTE.grayBluePale)}
              opacity={smoke * Math.sin(t * Math.PI) * 0.8}
            />
          );
        })
      : null;
  const wave = Math.sin(wind * Math.PI * 2) * 3;
  return (
    <g>
      <path d={`M -170 2 Q -120 ${6 + wave} -60 2 T 60 2 T 170 2`} fill="none" stroke={T(PALETTE.skyBlue)} strokeWidth={1.4} opacity={0.7} {...ns} />
      <path d={masts} stroke={line} strokeWidth={2.2} {...ns} />
      <path d={rig} stroke={line} strokeWidth={0.8} opacity={0.7} fill="none" {...ns} />
      {sails.map((d, i) => (
        <path key={i} d={d} fill={sailC} stroke={line} strokeWidth={1.1} opacity={1 - furl * 0.8} {...ns} />
      ))}
      {kind === "steamer" ? (
        <>
          {smokePuffs}
          <path d="M -40 -80 L -44 -134 H -18 L -20 -80 Z M 10 -80 L 6 -130 H 30 L 28 -80 Z" fill={T(mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.4))} stroke={line} strokeWidth={1} {...ns} />
          <path d="M -44 -120 H -18 M 6 -118 H 30" stroke={T(PALETTE.skyBlue)} strokeWidth={4} {...ns} />
        </>
      ) : null}
      <path d={hull} fill={hullC} stroke={line} strokeWidth={1.2} {...ns} />
      {kind === "steamer" ? (
        <>
          <path d="M -120 -64 H 90 V -40 H -120 Z M -100 -80 H 60 V -64 H -100 Z" fill={T(mixColor(PALETTE.paperWarm, PALETTE.grayBluePale, 0.4))} stroke={line} strokeWidth={0.9} {...ns} />
          <path d={Array.from({ length: 14 }, (_, i) => `M ${-140 + i * 20} -22 m -3 0 a 3 3 0 1 0 6 0 a 3 3 0 1 0 -6 0`).join(" ")} fill={T(PALETTE.paperWarm)} stroke="none" />
          {passengers > 0.01 ? (
            <path
              d={Array.from({ length: 16 }, (_, i) => {
                const x = -112 + i * 12.5;
                return `M ${x - 3} -64 v -7 a 3 3 0 0 1 6 0 v 7 Z M ${x} -74 m -2.6 0 a 2.6 2.6 0 1 0 5.2 0 a 2.6 2.6 0 1 0 -5.2 0`;
              }).join(" ")}
              fill={T(PALETTE.deepBlueSoft)}
              opacity={passengers}
            />
          ) : null}
        </>
      ) : (
        <path d={deck} fill="none" stroke={T(PALETTE.paperWarm)} strokeWidth={1.2} opacity={0.8} {...ns} />
      )}
      {kind === "frigate" ? (
        <path d={Array.from({ length: 9 }, (_, i) => `M ${-96 + i * 24} -30 h 10 v 7 h -10 Z`).join(" ")} fill={T(PALETTE.paperWarm)} opacity={0.75} />
      ) : null}
      {flag !== "none" ? (
        <path
          d={`M ${kind === "steamer" ? -130 : kind === "caravel" ? 10 : 0} ${kind === "steamer" ? -170 : kind === "caravel" ? -240 : -290} l 34 ${4 + wave} l -34 ${8 - wave * 0.5} Z`}
          fill={flag === "argentina" ? T(PALETTE.skyBlue) : T(PALETTE.grayBlue)}
          stroke={line}
          strokeWidth={0.7}
          {...ns}
        />
      ) : null}
    </g>
  );
};

/** A ship standing on the water plane at (x, y) of a sheet. */
export const Ship: React.FC<{
  p: Projector;
  x: number;
  y: number;
  scale: number;
  facing: 1 | -1;
  kind: ShipKind;
  wind: number;
  rise?: number;
  tone?: number;
  opacity?: number;
  furl?: number;
  smoke?: number;
  flag?: "argentina" | "abstract" | "none";
  passengers?: number;
  /** 0 standing on the water … 1 drawn flat on the chart (overhead views). */
  fold?: number;
}> = ({ p, x, y, scale, facing, kind, wind, rise = 1, tone, opacity = 1, furl, smoke, flag, passengers, fold = 0 }) => {
  if (opacity <= 0.002) {
    return null;
  }
  const roll = Math.sin(wind * Math.PI * 2 * 0.7) * 1.6;
  return (
    <g transform={standMatrix(p, x, y, scale, facing, fold)} opacity={opacity}>
      <g transform={`scale(1 ${Math.max(0.02, rise).toFixed(3)}) rotate(${roll.toFixed(2)})`}>
        <ShipDrawing kind={kind} wind={wind} tone={tone} furl={furl} smoke={smoke} flag={flag} passengers={passengers} />
      </g>
    </g>
  );
};
