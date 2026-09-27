import { createPrng } from "../../animation/stroke-draw";
import type { Point } from "../../types/paths";
import { ANCHORS } from "../atlas-anchors";
import { gridX, gridY } from "./stadium";

/**
 * City section inherited from Scene 09 at frame 1722: façades in elevation on
 * a common ground line, a civic timeline beneath (the memory line) and the
 * civic network that connects them. Every control line snaps to the atlas
 * grid, so the state/security layer visibly occupies the same geometry.
 */
export const GROUND_Y = 2290;
export const STREET_Y = 2380;
export const CIVIC_TIMELINE_Y = 2460;
export const CIVIC_TIMELINE_X = [2450, 3760] as const;

/* ------------------------------------------------------------- buildings */

const rect = (x0: number, y0: number, x1: number, y1: number) =>
  `M ${x0} ${y0} H ${x1} V ${y1} H ${x0} Z`;

const windows = (
  x0: number,
  y0: number,
  cols: number,
  rows: number,
  dx: number,
  dy: number,
  w: number,
  h: number,
) => {
  let d = "";
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      d +=
        rect(x0 + c * dx, y0 + r * dy, x0 + c * dx + w, y0 + r * dy + h) + " ";
    }
  }
  return d;
};

const UNI_CX = 2530;
const CONGRESO_CX = 2840;
const TOWER_X = 3102;
const MINISTRY_CX = 3365;

export interface Building {
  id: string;
  /** Civic anchor on the ground line: control lines grow from here. */
  anchor: Point;
  /** Drafting order: axis → mass → openings → detail. */
  layers: readonly string[];
}

export const BUILDINGS: readonly Building[] = [
  {
    id: "university",
    anchor: [UNI_CX, GROUND_Y],
    layers: [
      `M ${UNI_CX - 80} ${GROUND_Y} H ${UNI_CX + 80} M ${UNI_CX - 72} ${GROUND_Y - 8} H ${UNI_CX + 72}`,
      `M ${UNI_CX - 70} ${GROUND_Y - 8} V ${GROUND_Y - 96} H ${UNI_CX + 70} V ${GROUND_Y - 8} M ${UNI_CX - 78} ${GROUND_Y - 96} L ${UNI_CX} ${GROUND_Y - 138} L ${UNI_CX + 78} ${GROUND_Y - 96} Z`,
      `M ${UNI_CX - 48} ${GROUND_Y - 8} V ${GROUND_Y - 90} M ${UNI_CX - 16} ${GROUND_Y - 8} V ${GROUND_Y - 90} M ${UNI_CX + 16} ${GROUND_Y - 8} V ${GROUND_Y - 90} M ${UNI_CX + 48} ${GROUND_Y - 8} V ${GROUND_Y - 90}`,
    ],
  },
  {
    id: "congreso",
    anchor: [CONGRESO_CX, GROUND_Y],
    layers: [
      `M ${CONGRESO_CX} ${GROUND_Y} V ${GROUND_Y - 300} M ${CONGRESO_CX - 170} ${GROUND_Y} H ${CONGRESO_CX + 170}`,
      `${rect(CONGRESO_CX - 165, GROUND_Y - 92, CONGRESO_CX - 58, GROUND_Y)} ${rect(CONGRESO_CX + 58, GROUND_Y - 92, CONGRESO_CX + 165, GROUND_Y)} ${rect(CONGRESO_CX - 58, GROUND_Y - 132, CONGRESO_CX + 58, GROUND_Y)} M ${CONGRESO_CX - 66} ${GROUND_Y - 132} L ${CONGRESO_CX} ${GROUND_Y - 166} L ${CONGRESO_CX + 66} ${GROUND_Y - 132} Z`,
      `${rect(CONGRESO_CX - 44, GROUND_Y - 214, CONGRESO_CX + 44, GROUND_Y - 166)} M ${CONGRESO_CX - 50} ${GROUND_Y - 214} C ${CONGRESO_CX - 48} ${GROUND_Y - 262}, ${CONGRESO_CX - 18} ${GROUND_Y - 280}, ${CONGRESO_CX} ${GROUND_Y - 282} C ${CONGRESO_CX + 18} ${GROUND_Y - 280}, ${CONGRESO_CX + 48} ${GROUND_Y - 262}, ${CONGRESO_CX + 50} ${GROUND_Y - 214} M ${CONGRESO_CX - 6} ${GROUND_Y - 282} V ${GROUND_Y - 300} H ${CONGRESO_CX + 6} V ${GROUND_Y - 282}`,
      `M ${CONGRESO_CX - 40} ${GROUND_Y} V ${GROUND_Y - 126} M ${CONGRESO_CX - 14} ${GROUND_Y} V ${GROUND_Y - 126} M ${CONGRESO_CX + 14} ${GROUND_Y} V ${GROUND_Y - 126} M ${CONGRESO_CX + 40} ${GROUND_Y} V ${GROUND_Y - 126} ${windows(CONGRESO_CX - 150, GROUND_Y - 76, 4, 2, 22, 34, 10, 18)} ${windows(CONGRESO_CX + 76, GROUND_Y - 76, 4, 2, 22, 34, 10, 18)} M ${CONGRESO_CX - 30} ${GROUND_Y - 214} V ${GROUND_Y - 166} M ${CONGRESO_CX} ${GROUND_Y - 214} V ${GROUND_Y - 166} M ${CONGRESO_CX + 30} ${GROUND_Y - 214} V ${GROUND_Y - 166}`,
    ],
  },
  {
    id: "broadcast",
    anchor: [TOWER_X, GROUND_Y],
    layers: [
      `M ${TOWER_X} ${GROUND_Y} V ${GROUND_Y - 300}`,
      `M ${TOWER_X - 30} ${GROUND_Y} L ${TOWER_X - 5} ${GROUND_Y - 280} M ${TOWER_X + 30} ${GROUND_Y} L ${TOWER_X + 5} ${GROUND_Y - 280}`,
      `M ${TOWER_X - 27} ${GROUND_Y - 30} L ${TOWER_X + 24} ${GROUND_Y - 90} M ${TOWER_X + 27} ${GROUND_Y - 30} L ${TOWER_X - 24} ${GROUND_Y - 90} M ${TOWER_X - 21} ${GROUND_Y - 90} L ${TOWER_X + 18} ${GROUND_Y - 160} M ${TOWER_X + 21} ${GROUND_Y - 90} L ${TOWER_X - 18} ${GROUND_Y - 160} M ${TOWER_X - 15} ${GROUND_Y - 160} L ${TOWER_X + 11} ${GROUND_Y - 225} M ${TOWER_X + 15} ${GROUND_Y - 160} L ${TOWER_X - 11} ${GROUND_Y - 225}`,
      `M ${TOWER_X - 40} ${GROUND_Y} H ${TOWER_X + 40}`,
    ],
  },
  {
    id: "ministry",
    anchor: [MINISTRY_CX, GROUND_Y],
    layers: [
      `M ${MINISTRY_CX - 95} ${GROUND_Y} H ${MINISTRY_CX + 95}`,
      `${rect(MINISTRY_CX - 88, GROUND_Y - 112, MINISTRY_CX + 88, GROUND_Y)} M ${MINISTRY_CX - 94} ${GROUND_Y - 112} H ${MINISTRY_CX + 94} M ${MINISTRY_CX - 94} ${GROUND_Y - 118} H ${MINISTRY_CX + 94}`,
      windows(MINISTRY_CX - 76, GROUND_Y - 98, 7, 3, 22, 28, 9, 16),
      `M ${MINISTRY_CX - 12} ${GROUND_Y} V ${GROUND_Y - 22} H ${MINISTRY_CX + 12} V ${GROUND_Y}`,
    ],
  },
];

/** Broadcast rings around the mast top: the radio waves that censorship erases. */
export const BROADCAST_ORIGIN: Point = [TOWER_X, GROUND_Y - 292];
export const BROADCAST_RADII = [42, 74, 106] as const;

/** A newspaper page: masthead, three columns of rules. */
export const NEWSPAPER = {
  x: 2428,
  y: 1978,
  w: 176,
  h: 132,
  rules: (() => {
    const lines: [number, number, number][] = [];
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 8; r++) {
        const x0 = 2438 + c * 56;
        const len = r % 5 === 4 ? 26 : 46;
        lines.push([x0, 2014 + r * 11.5, x0 + len]);
      }
    }
    return lines;
  })(),
} as const;

/* ------------------------------------------------------------ civic network */

export interface CivicNode {
  id: string;
  p: Point;
  kind: "timeline" | "street" | "plaza";
  /** Frame at which the node dims (C block); optional. */
  dimAt?: number;
  /** Authored removal frame (D block): leaves an empty coordinate ring. */
  removedAt?: number;
}

const [VX, VY] = ANCHORS.woundedVoid;

export const CIVIC_NODES: readonly CivicNode[] = [
  {
    id: "node.timeline.university",
    p: [UNI_CX, CIVIC_TIMELINE_Y],
    kind: "timeline",
  },
  {
    id: "node.timeline.congreso",
    p: [CONGRESO_CX, CIVIC_TIMELINE_Y],
    kind: "timeline",
  },
  {
    id: "node.timeline.broadcast",
    p: [TOWER_X, CIVIC_TIMELINE_Y],
    kind: "timeline",
    dimAt: 1796,
  },
  {
    id: "node.timeline.ministry",
    p: [MINISTRY_CX, CIVIC_TIMELINE_Y],
    kind: "timeline",
    dimAt: 1794,
    removedAt: 1819,
  },
  { id: "node.timeline.plaza", p: [3650, CIVIC_TIMELINE_Y], kind: "timeline" },
  { id: "node.street.1", p: [2690, STREET_Y], kind: "street" },
  { id: "node.street.2", p: [2990, STREET_Y], kind: "street", removedAt: 1826 },
  { id: "node.street.3", p: [3240, STREET_Y], kind: "street" },
  { id: "node.street.4", p: [3520, STREET_Y], kind: "street" },
  { id: "node.plaza.1", p: [VX - 110, VY - 28], kind: "plaza" },
  {
    id: "node.plaza.2",
    p: [VX - 20, VY - 28],
    kind: "plaza",
    dimAt: 1794,
    removedAt: 1812,
  },
  { id: "node.plaza.3", p: [VX - 65, VY + 30], kind: "plaza" },
  { id: "node.plaza.4", p: [VX + 12, VY + 72], kind: "plaza" },
  { id: "node.plaza.5", p: [VX - 120, VY + 72], kind: "plaza" },
  // Street nodes of the eastern district: removed while off-screen, they are
  // first seen as empty rings beyond the touchlines in 1978 (storyboard §11).
  {
    id: "node.street.east.1",
    p: [gridX(7) - 52, gridY(-2) + 45],
    kind: "street",
    removedAt: 1830,
  },
  {
    id: "node.street.east.2",
    p: [gridX(5) + 52, gridY(5) + 45],
    kind: "street",
    removedAt: 1836,
  },
];

/** Civic connectors: building base → street → timeline node. */
export const CIVIC_CONNECTORS: readonly {
  id: string;
  from: Point;
  to: Point;
  stopsRespondingAt?: number;
}[] = [
  {
    id: "conn.university",
    from: [UNI_CX, GROUND_Y],
    to: [UNI_CX, CIVIC_TIMELINE_Y],
  },
  {
    id: "conn.congreso",
    from: [CONGRESO_CX, GROUND_Y],
    to: [CONGRESO_CX, CIVIC_TIMELINE_Y],
    stopsRespondingAt: 1730,
  },
  {
    id: "conn.broadcast",
    from: [TOWER_X, GROUND_Y],
    to: [TOWER_X, CIVIC_TIMELINE_Y],
    stopsRespondingAt: 1738,
  },
  {
    id: "conn.ministry",
    from: [MINISTRY_CX, GROUND_Y],
    to: [MINISTRY_CX, CIVIC_TIMELINE_Y],
  },
  { id: "conn.plaza", from: [3650, GROUND_Y], to: [3650, CIVIC_TIMELINE_Y] },
];

export const PLAZA_OUTLINE = `M ${VX - 150} ${VY - 62} H ${VX + 50} V ${VY + 100} H ${VX - 150} Z`;

/* -------------------------------------------------------------- control */

export interface ControlLine {
  id: string;
  /** Anchor the line grows from (an institution or an existing control line). */
  from: Point;
  a: Point;
  b: Point;
  start: number;
  end: number;
}

const controlLine = (
  id: string,
  from: Point,
  a: Point,
  b: Point,
  start: number,
  end: number,
): ControlLine => ({
  id,
  from,
  a,
  b,
  start,
  end,
});

export const CONTROL_LINES: readonly ControlLine[] = [
  controlLine(
    "ctl.baseH3",
    [MINISTRY_CX, gridY(3)],
    [gridX(-14), gridY(3)],
    [gridX(-1), gridY(3)],
    1722,
    1760,
  ),
  controlLine(
    "ctl.v-4",
    [gridX(-4), gridY(3)],
    [gridX(-4), gridY(-2)],
    [gridX(-4), gridY(5)],
    1736,
    1772,
  ),
  controlLine(
    "ctl.v-8",
    [gridX(-8), gridY(3)],
    [gridX(-8), gridY(-2)],
    [gridX(-8), gridY(5)],
    1742,
    1778,
  ),
  controlLine(
    "ctl.v-12",
    [gridX(-12), gridY(3)],
    [gridX(-12), gridY(-2)],
    [gridX(-12), gridY(5)],
    1748,
    1784,
  ),
  controlLine(
    "ctl.v-1",
    [gridX(-1), gridY(3)],
    [gridX(-1), gridY(-2)],
    [gridX(-1), gridY(5)],
    1754,
    1790,
  ),
  controlLine(
    "ctl.h4",
    [gridX(-4), gridY(4)],
    [gridX(-14), gridY(4)],
    [gridX(0), gridY(4)],
    1760,
    1796,
  ),
  controlLine(
    "ctl.h1",
    [gridX(-4), gridY(1)],
    [gridX(-4), gridY(1)],
    [gridX(0), gridY(1)],
    1766,
    1791,
  ),
  controlLine(
    "ctl.h-2",
    [gridX(-8), gridY(-2)],
    [gridX(-14), gridY(-2)],
    [gridX(0), gridY(-2)],
    1770,
    1806,
  ),
  // The controlled grid extends beyond the first institutions (§8.8): it will
  // still enclose the stadium on its north, east and south sides in 1978.
  controlLine(
    "ctl.h-3.east",
    [gridX(-1), gridY(-3)],
    [gridX(-1), gridY(-3)],
    [gridX(9), gridY(-3)],
    1786,
    1834,
  ),
  controlLine(
    "ctl.h6.east",
    [gridX(-1), gridY(6)],
    [gridX(-1), gridY(6)],
    [gridX(9), gridY(6)],
    1792,
    1840,
  ),
  controlLine(
    "ctl.v6",
    [gridX(6), gridY(-3)],
    [gridX(6), gridY(-3)],
    [gridX(6), gridY(6)],
    1812,
    1852,
  ),
  controlLine(
    "ctl.v8",
    [gridX(8), gridY(6)],
    [gridX(8), gridY(-3)],
    [gridX(8), gridY(6)],
    1820,
    1858,
  ),
];

export interface Enclosure {
  id: string;
  institution: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  start: number;
  end: number;
}

export const ENCLOSURES: readonly Enclosure[] = [
  {
    id: "enc.congreso",
    institution: "congreso",
    x0: gridX(-12),
    y0: gridY(-1),
    x1: gridX(-8),
    y1: gridY(3),
    start: 1724,
    end: 1752,
  },
  {
    id: "enc.broadcast",
    institution: "broadcast",
    x0: gridX(-8),
    y0: gridY(-1),
    x1: gridX(-7),
    y1: gridY(3),
    start: 1730,
    end: 1756,
  },
  {
    id: "enc.ministry",
    institution: "ministry",
    x0: gridX(-6),
    y0: gridY(1),
    x1: gridX(-4),
    y1: gridY(3),
    start: 1734,
    end: 1760,
  },
  {
    id: "enc.university",
    institution: "university",
    x0: gridX(-14),
    y0: gridY(1),
    x1: gridX(-12),
    y1: gridY(3),
    start: 1742,
    end: 1768,
  },
];

/** Interception locks where civic connectors cross control lines. */
export const LOCKS: readonly { p: Point; at: number }[] = [
  ...CIVIC_CONNECTORS.map((c, i) => ({
    p: [c.from[0], gridY(3)] as Point,
    at: 1762 + i * 5,
  })),
  ...CIVIC_CONNECTORS.map((c, i) => ({
    p: [c.from[0], gridY(4)] as Point,
    at: 1774 + i * 4,
  })),
];
/** The relay that closes the last accessible civic node (§8.5 exit, frame 1791). */
export const FINAL_RELAY_LOCK: Point = [3650, gridY(4)];

export const SURVEILLANCE_BOXES: readonly {
  c: Point;
  size: number;
  at: number;
}[] = [
  { c: [CONGRESO_CX, GROUND_Y - 248], size: 76, at: 1794 },
  { c: [TOWER_X, GROUND_Y - 262], size: 64, at: 1799 },
  { c: [MINISTRY_CX, GROUND_Y - 60], size: 92, at: 1804 },
];

export const SCAN_ZONES: readonly {
  pivot: Point;
  radius: number;
  sweep: readonly [number, number];
  width: number;
}[] = [
  { pivot: BROADCAST_ORIGIN, radius: 170, sweep: [200, 330], width: 22 },
  { pivot: [3650, gridY(3)], radius: 150, sweep: [196, 344], width: 20 },
];

/** State repression: rigid paths leaving the control grid and returning to it. */
export const REPRESSION_PATHS: readonly {
  id: string;
  d: string;
  start: number;
  end: number;
}[] = [
  {
    id: "rep.plaza",
    d: `M ${gridX(-4)} ${VY - 45} H ${VX - 20} V ${VY + 50} H ${gridX(-4)}`,
    start: 1812,
    end: 1834,
  },
  {
    id: "rep.street",
    d: `M ${2946} ${gridY(4)} V ${STREET_Y - 36} H ${3040} V ${gridY(4)}`,
    start: 1818,
    end: 1838,
  },
  {
    id: "rep.timeline",
    d: `M ${3200} ${gridY(3)} V ${CIVIC_TIMELINE_Y - 22} H ${3316} V ${gridY(3)}`,
    start: 1824,
    end: 1841,
  },
];

/** Pale shutters: censorship erasing press rules, radio waves and a façade register. */
export const CENSOR_SHUTTERS: readonly {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  start: number;
  end: number;
}[] = [
  {
    id: "cens.press.1",
    x: 2434,
    y: 2008,
    w: 164,
    h: 22,
    start: 1776,
    end: 1788,
  },
  {
    id: "cens.press.2",
    x: 2434,
    y: 2043,
    w: 164,
    h: 22,
    start: 1782,
    end: 1794,
  },
  {
    id: "cens.press.3",
    x: 2434,
    y: 2078,
    w: 110,
    h: 22,
    start: 1790,
    end: 1802,
  },
  {
    id: "cens.radio",
    x: TOWER_X + 8,
    y: 1880,
    w: 116,
    h: 150,
    start: 1792,
    end: 1806,
  },
  {
    id: "cens.ministry",
    x: MINISTRY_CX - 80,
    y: GROUND_Y - 70,
    w: 160,
    h: 18,
    start: 1798,
    end: 1811,
  },
  {
    id: "cens.east.bar",
    x: gridX(6) + 24,
    y: gridY(-3) + 22,
    w: 150,
    h: 14,
    start: 1826,
    end: 1840,
  },
];

/* --------------------------------------------------------- inherited edges */

/** Scene 09 residue confined to the edges (0.16–0.24, §8.4). */
export const PREVIOUS_ROUTES: readonly {
  id: string;
  d: string;
  style: "civic" | "rigid" | "angular";
}[] = [
  {
    id: "prev.civic.north",
    d: "M 2380 1745 C 2560 1690, 2760 1770, 2980 1712 S 3300 1700, 3420 1730",
    style: "civic",
  },
  {
    id: "prev.civic.south",
    d: "M 2380 2590 C 2560 2560, 2720 2620, 2940 2586",
    style: "civic",
  },
  { id: "prev.rigid.south", d: "M 2380 2626 H 3060", style: "rigid" },
  {
    id: "prev.angular.north",
    d: "M 3560 1700 L 3660 1652 L 3780 1716 L 3900 1662",
    style: "angular",
  },
];

/** Remaining public figures in the plaza: short strokes that withdraw to the edges. */
export const PLAZA_FIGURES: readonly { x: number; h: number; side: -1 | 1 }[] =
  (() => {
    const rand = createPrng(1976);
    const out: { x: number; h: number; side: -1 | 1 }[] = [];
    for (let i = 0; i < 22; i++) {
      const x = VX - 150 + (i / 21) * 200 + (rand() - 0.5) * 6;
      out.push({ x, h: 10 + rand() * 6, side: x < VX - 50 ? -1 : 1 });
    }
    return out;
  })();
