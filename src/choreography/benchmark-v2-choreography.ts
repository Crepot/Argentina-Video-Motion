import { columnTracks, type ActorTrack } from "../actors/action-track";
import { PITCH } from "../atlas/geometry/stadium";
import { geo } from "../atlas/south-atlantic-geometry";

/**
 * Benchmark V2 choreography (spec §2B Scenes 10–12, §6 ChoreographySpec).
 * Every person visible for more than 18 frames is an ActorTrack with at
 * least two distinct actions. Positions are atlas ground coordinates; the
 * foreground plane (depth > 1) carries the large cropped figures.
 *
 * Scale convention: `scale` 0.8 → an 80-unit-tall figure on the atlas.
 */

/* ================================================================ 1976 */

const SOLDIER = 0.8;

/** Squad A marches east along the north lane; the camera tracks past it. */
const squadA = columnTracks({
  idPrefix: "army.a",
  wardrobe: "army1976",
  files: 2,
  ranks: 6,
  head: [
    // Film: the column already marches before 1700 (entry from the 1975 corridor).
    { f: 1640, x: 3180, y: 2410 },
    { f: 1700, x: 3330, y: 2410 },
    { f: 1812, x: 3610, y: 2410, ease: "institutionalLock" },
    { f: 1822, x: 3625, y: 2410 },
  ],
  rankGap: 36,
  fileGap: 34,
  scale: SOLDIER,
  detail: "mid",
  tone: 0.08,
  seed: 11,
  action: "march",
  after: (i) => [{ f: 1818 + (i % 3), action: "guard", breadth: 0.55, blend: 8 }],
  life: { from: 1640, to: 1900, enter: "rise", enterDur: 12, exit: "fold", exitDur: 22 },
});

/** Squad B arrives in front of the institution and opens to reveal Videla. */
const squadB = columnTracks({
  idPrefix: "army.b",
  wardrobe: "army1976",
  files: 2,
  ranks: 5,
  head: [
    { f: 1640, x: 3508, y: 2414 },
    { f: 1700, x: 3700, y: 2414 },
    { f: 1764, x: 3905, y: 2414, ease: "institutionalLock" },
    { f: 1770, x: 3910, y: 2414 },
  ],
  rankGap: 38,
  fileGap: 44,
  scale: SOLDIER,
  detail: "mid",
  tone: 0.02,
  seed: 29,
  action: "march",
  // The column opens: north file steps up to the façade, south file to the kerb.
  post: (i, rank, file) =>
    rank < 3
      ? { f0: 1768 + rank * 2, f1: 1788 + rank * 2, dx: 60 + rank * 72, dy: file === 0 ? -52 : 92 }
      : null,
  after: (i, rank) => [
    { f: 1770 + rank * 2, action: rank < 3 ? "walk" : "stand", blend: 6 },
    { f: 1791 + rank * 2, action: "guard", breadth: 0.6, blend: 8 },
  ],
  life: { from: 1640, to: 1898, enter: "rise", enterDur: 12, exit: "fold", exitDur: 22 },
});

/** Riot line with gas masks and shields that closes the avenue (the civic line is cut). */
const riotLine: ActorTrack[] = [0, 1, 2, 3, 4].map((i) => ({
  id: `riot.${i}`,
  wardrobe: "riot1976",
  scale: SOLDIER,
  detail: "mid",
  tone: 0.04,
  seed: 71 + i * 5,
  role: "context",
  pos: [
    { f: 1752, x: 3560 + i * 6, y: 2640 + i * 4 },
    { f: 1786 + i * 2, x: 3642 + (i % 2) * 8, y: 2372 + i * 46, ease: "institutionalLock" },
  ],
  actions: [
    { f: 1752, action: "jog", facing: 1 },
    { f: 1786 + i * 2, action: "guard", facing: -1, breadth: 0.8, blend: 8 },
  ],
  life: { from: 1752, to: 1898, enter: "rise", enterDur: 12, exit: "fold", exitDur: 22 },
}));

/** Two officers flank the general. */
const officers: ActorTrack[] = [
  {
    id: "officer.n",
    wardrobe: "officer1976",
    scale: SOLDIER * 1.02,
    detail: "mid",
    seed: 5,
    role: "secondary",
    pos: [
      { f: 1730, x: 3805, y: 2372 },
      { f: 1772, x: 3880, y: 2368, ease: "institutionalLock" },
      { f: 1796, x: 3872, y: 2350 },
    ],
    actions: [
      { f: 1730, action: "walk", facing: 1 },
      { f: 1772, action: "stand", breadth: 0.5 },
      { f: 1796, action: "guard", breadth: 0.7 },
    ],
    life: { from: 1730, to: 1896, enter: "none", exit: "fold", exitDur: 22 },
  },
  {
    id: "officer.s",
    wardrobe: "officer1976",
    scale: SOLDIER * 1.0,
    detail: "mid",
    seed: 9,
    role: "secondary",
    pos: [
      { f: 1730, x: 3790, y: 2446 },
      { f: 1772, x: 3872, y: 2444, ease: "institutionalLock" },
      { f: 1798, x: 3890, y: 2470 },
    ],
    actions: [
      { f: 1730, action: "walk", facing: 1 },
      { f: 1772, action: "stand", breadth: 0.5 },
      { f: 1798, action: "guard", breadth: 0.7 },
    ],
    life: { from: 1730, to: 1896, enter: "none", exit: "fold", exitDur: 22 },
  },
];

/**
 * Jorge Rafael Videla (HistoricalFigure, spec §2.8): revealed inside the
 * formation, advances ~30 units, turns and gives one command gesture, takes
 * half a step and is absorbed: his verticals become the control bars.
 * Visible ≈ 1760–1811 only; never isolated, never gold.
 */
export const VIDELA: ActorTrack = {
  id: "historical.videla",
  wardrobe: "generalVidela",
  build: "gaunt",
  scale: 0.9,
  detail: "hero",
  seed: 1976,
  role: "primary",
  pos: [
    { f: 1735, x: 3846, y: 2414 },
    { f: 1768, x: 3918, y: 2418, ease: "institutionalLock" },
    { f: 1780, x: 3930, y: 2452, ease: "institutionalLock" },
    { f: 1798, x: 3932, y: 2452 },
    { f: 1806, x: 3944, y: 2446, ease: "institutionalLock" },
  ],
  actions: [
    { f: 1735, action: "walk", facing: 1, breadth: 0.3 },
    { f: 1768, action: "stroll", breadth: 0.45, blend: 6 },
    { f: 1780, action: "gesture", dur: 22, blend: 6 },
    { f: 1802, action: "stand", breadth: 0.7, blend: 4 },
    { f: 1803, action: "stroll", breadth: 0.6, blend: 3 },
    { f: 1807, action: "stand", breadth: 0.6, blend: 4 },
  ],
  life: { from: 1735, to: 1811, enter: "none", exit: "absorb", exitDur: 13 },
};

/** Civilians: they cross against the flow, stop, withdraw; their nodes remain. */
const civilians: ActorTrack[] = [
  {
    id: "civ.1",
    wardrobe: "civilianCoat",
    scale: 0.78,
    detail: "mid",
    tone: 0.06,
    seed: 101,
    role: "context",
    pos: [
      { f: 1690, x: 3506, y: 2610 },
      { f: 1722, x: 3420, y: 2612 },
      { f: 1800, x: 3210, y: 2618 },
    ],
    actions: [
      { f: 1690, action: "walk", facing: -1 },
      { f: 1760, action: "retreat", facing: -1 },
    ],
    life: { from: 1690, to: 1800, enter: "rise", enterDur: 12, exit: "fade", exitDur: 12 },
  },
  {
    id: "civ.2",
    wardrobe: "civilianWoman",
    scale: 0.74,
    detail: "mid",
    tone: 0.06,
    seed: 113,
    role: "context",
    pos: [
      { f: 1690, x: 3546, y: 2620 },
      { f: 1722, x: 3460, y: 2622 },
      { f: 1796, x: 3262, y: 2628 },
    ],
    actions: [
      { f: 1690, action: "walk", facing: -1 },
      { f: 1748, action: "retreat", facing: -1 },
    ],
    life: { from: 1690, to: 1796, enter: "rise", enterDur: 12, exit: "fade", exitDur: 12 },
  },
  {
    id: "civ.3",
    wardrobe: "civilianJacket",
    scale: 0.76,
    detail: "mid",
    tone: 0.12,
    seed: 127,
    role: "context",
    pos: [
      { f: 1690, x: 3640, y: 2330 },
      { f: 1722, x: 3560, y: 2330 },
      { f: 1790, x: 3390, y: 2328 },
    ],
    actions: [
      { f: 1690, action: "walk", facing: -1 },
      { f: 1752, action: "retreat", facing: -1 },
    ],
    life: { from: 1690, to: 1790, enter: "rise", enterDur: 12, exit: "fade", exitDur: 14 },
  },
  // Waits at the bus stop (node d), then leaves: the node is removed after.
  {
    id: "civ.4",
    wardrobe: "civilianWoman",
    scale: 0.74,
    detail: "mid",
    tone: 0.04,
    seed: 139,
    role: "context",
    pos: [
      { f: 1740, x: 3712, y: 2616 },
      { f: 1792, x: 3712, y: 2616 },
      { f: 1830, x: 3840, y: 2630 },
    ],
    actions: [
      { f: 1740, action: "stand", facing: -1, breadth: 0.6 },
      { f: 1792, action: "retreat", facing: 1, blend: 8 },
    ],
    life: { from: 1740, to: 1830, enter: "rise", enterDur: 14, exit: "fade", exitDur: 12 },
  },
  // Walks toward the closed avenue, stops before the cut node and steps back.
  {
    id: "civ.5",
    wardrobe: "civilianJacket",
    scale: 0.78,
    detail: "mid",
    tone: 0.02,
    seed: 151,
    role: "secondary",
    pos: [
      { f: 1796, x: 3400, y: 2566 },
      { f: 1822, x: 3520, y: 2560, ease: "institutionalLock" },
      { f: 1830, x: 3522, y: 2560 },
      { f: 1860, x: 3440, y: 2572, ease: "atlasDrift" },
    ],
    actions: [
      { f: 1796, action: "walk", facing: 1 },
      { f: 1822, action: "stand", breadth: 0.55, blend: 6 },
      { f: 1832, action: "retreat", facing: -1, blend: 8 },
    ],
    life: { from: 1796, to: 1862, enter: "rise", enterDur: 12, exit: "fade", exitDur: 14 },
  },
];

/** Foreground plane: large cropped figures passing through frame (parallax). */
const foreground1976: ActorTrack[] = [
  {
    id: "fg.soldier.1",
    wardrobe: "army1976",
    scale: 1.0,
    depth: 2.5,
    detail: "hero",
    seed: 3,
    role: "context",
    pos: [
      { f: 1680, x: 3195, y: 2745 },
      { f: 1722, x: 3296, y: 2745 },
      { f: 1806, x: 3498, y: 2745 },
    ],
    actions: [{ f: 1680, action: "march", facing: 1 }],
    life: { from: 1680, to: 1806, enter: "none", exit: "none" },
  },
  {
    id: "fg.soldier.2",
    wardrobe: "army1976",
    scale: 1.0,
    depth: 2.5,
    detail: "hero",
    seed: 17,
    role: "context",
    pos: [
      { f: 1680, x: 3127, y: 2732 },
      { f: 1722, x: 3228, y: 2732 },
      { f: 1806, x: 3430, y: 2732 },
    ],
    actions: [{ f: 1680, action: "march", facing: 1 }],
    life: { from: 1680, to: 1806, enter: "none", exit: "none" },
  },
  {
    id: "fg.riot.1",
    wardrobe: "riot1976",
    scale: 1.0,
    depth: 2.2,
    detail: "hero",
    seed: 23,
    role: "context",
    pos: [
      { f: 1766, x: 4105, y: 2600 },
      { f: 1800, x: 4062, y: 2600, ease: "institutionalLock" },
      { f: 1872, x: 4060, y: 2600 },
    ],
    actions: [
      { f: 1766, action: "walk", facing: -1 },
      { f: 1800, action: "guard", facing: -1, breadth: 0.9, blend: 10 },
    ],
    life: { from: 1766, to: 1872, enter: "none", exit: "fade", exitDur: 18 },
  },
];

export const ACTORS_1976: readonly ActorTrack[] = [
  ...squadA,
  ...squadB,
  ...riotLine,
  ...officers,
  VIDELA,
  ...civilians,
  ...foreground1976,
];

/** Vehicles on routes (VehicleOnRoute): keys on the south lane, distance → wheels. */
export interface VehicleTrack {
  id: string;
  kind: "truck" | "jeep" | "sedan";
  scale: number;
  tone: number;
  depth?: number;
  pos: readonly { f: number; x: number; y: number; ease?: "institutionalLock" | "atlasDrift" | "linearTravel" }[];
  life: { from: number; to: number };
}

export const VEHICLES_1976: readonly VehicleTrack[] = [
  { id: "truck.1", kind: "truck", scale: 1.05, tone: 0.05, pos: [{ f: 1640, x: 3018, y: 2528 }, { f: 1700, x: 3180, y: 2528 }, { f: 1808, x: 3470, y: 2528, ease: "institutionalLock" }, { f: 1900, x: 3474, y: 2528 }], life: { from: 1640, to: 1900 } },
  { id: "truck.2", kind: "truck", scale: 1.05, tone: 0.12, pos: [{ f: 1640, x: 2788, y: 2528 }, { f: 1700, x: 2960, y: 2528 }, { f: 1812, x: 3280, y: 2528, ease: "institutionalLock" }, { f: 1900, x: 3282, y: 2528 }], life: { from: 1640, to: 1900 } },
  { id: "jeep.1", kind: "jeep", scale: 1.0, tone: 0.02, pos: [{ f: 1640, x: 3361, y: 2520 }, { f: 1700, x: 3550, y: 2520 }, { f: 1782, x: 3808, y: 2520, ease: "institutionalLock" }, { f: 1900, x: 3810, y: 2520 }], life: { from: 1640, to: 1900 } },
  // A dark saloon passes slowly at the removal beat (no victims shown).
  { id: "sedan.1", kind: "sedan", scale: 1.0, tone: 0.1, pos: [{ f: 1806, x: 3250, y: 2548 }, { f: 1856, x: 3760, y: 2548 }], life: { from: 1806, to: 1856 } },
];

/* ================================================================ 1978 */

const PLAYER = 0.44;
const [PCX, PCY] = PITCH.center;

const player = (
  id: string,
  wardrobe: ActorTrack["wardrobe"],
  seed: number,
  pos: ActorTrack["pos"],
  actions: ActorTrack["actions"],
  life: Partial<ActorTrack["life"]> = {},
  extra: Partial<ActorTrack> = {},
): ActorTrack => ({
  id,
  wardrobe,
  build: wardrobe === "footballArgentina" ? "athlete" : "standard",
  scale: PLAYER,
  detail: "mid",
  seed,
  role: "secondary",
  pos,
  actions,
  life: { from: 1912, to: 2074, enter: "rise", enterDur: 18, exit: "fold", exitDur: 20, ...life },
  ...extra,
});

/** Ball contact frames, shared by the ball track and the players' actions. */
export const BALL_KEYS: readonly { f: number; x: number; y: number; h: number }[] = [
  { f: 1946, x: 3968, y: 2176, h: 0 },
  { f: 1953, x: 3972, y: 2178, h: 0 }, // A4 passes
  { f: 1964, x: 4012, y: 2124, h: 0 }, // A2 receives
  { f: 1968, x: 4016, y: 2128, h: 0 }, // A2 passes
  { f: 1978, x: 4058, y: 2192, h: 0 }, // A1 receives
  { f: 1990, x: 4108, y: 2204, h: 0 }, // dribble
  { f: 1998, x: 4152, y: 2222, h: 0 }, // cut inside past D1
  { f: 2006, x: 4200, y: 2206, h: 0 },
  { f: 2013, x: 4222, y: 2198, h: 0 }, // strike
  { f: 2016, x: 4298, y: 2156, h: 13 }, // crosses the line
  { f: 2020, x: 4308, y: 2150, h: 7 }, // net
  { f: 2030, x: 4306, y: 2152, h: 0 },
];

export const ACTORS_1978: readonly ActorTrack[] = [
  // Argentina (attacking east).
  player("arg.a1", "footballArgentina", 1, [
    { f: 1912, x: 4000, y: 2236 },
    { f: 1950, x: 4020, y: 2222 },
    { f: 1978, x: 4052, y: 2194 },
    { f: 1990, x: 4102, y: 2206 },
    { f: 1998, x: 4146, y: 2226 },
    { f: 2006, x: 4194, y: 2210 },
    { f: 2012, x: 4214, y: 2200 },
    { f: 2020, x: 4222, y: 2210 },
    { f: 2036, x: 4232, y: 2268, ease: "atlasDrift" },
  ], [
    { f: 1912, action: "jog", facing: 1 },
    { f: 1972, action: "run", facing: 1 },
    { f: 2004, action: "kick", facing: 1, dur: 16, blend: 3 },
    { f: 2020, action: "celebrateRun", facing: 1, amount: 1 },
    { f: 2036, action: "cheer", amount: 1, breadth: 0.9 },
  ]),
  player("arg.a2", "footballArgentina", 2, [
    { f: 1912, x: 3990, y: 2150 },
    { f: 1964, x: 4010, y: 2130 },
    { f: 1990, x: 4080, y: 2140 },
    { f: 2016, x: 4150, y: 2160 },
    { f: 2034, x: 4214, y: 2256, ease: "atlasDrift" },
  ], [
    { f: 1912, action: "jog", facing: 1 },
    { f: 1962, action: "stand", breadth: 0.5 },
    { f: 1966, action: "kick", dur: 8, blend: 2 },
    { f: 1974, action: "jog", facing: 1 },
    { f: 2017, action: "celebrateRun", amount: 1 },
    { f: 2034, action: "cheer", amount: 1 },
  ]),
  player("arg.a3", "footballArgentina", 3, [
    { f: 1912, x: 3960, y: 2272 },
    { f: 1990, x: 4060, y: 2270 },
    { f: 2016, x: 4150, y: 2262 },
    { f: 2034, x: 4244, y: 2284, ease: "atlasDrift" },
  ], [
    { f: 1912, action: "jog", facing: 1 },
    { f: 2017, action: "celebrateRun", amount: 1 },
    { f: 2034, action: "cheer", amount: 1 },
  ]),
  // Captain: joins, then lifts the trophy as a consequence of the goal.
  player("arg.a4", "footballArgentina", 4, [
    { f: 1912, x: 3950, y: 2180 },
    { f: 1952, x: 3964, y: 2178 },
    { f: 1990, x: 4020, y: 2200 },
    { f: 2024, x: 4200, y: 2262, ease: "atlasDrift" },
  ], [
    { f: 1912, action: "jog", facing: 1 },
    { f: 1948, action: "stand", breadth: 0.4 },
    { f: 1950, action: "kick", dur: 8, blend: 2 },
    { f: 1958, action: "jog", facing: 1 },
    { f: 2017, action: "celebrateRun", amount: 0.6 },
    { f: 2026, action: "lift", dur: 16, blend: 5 },
  ], {}, { build: "sturdy", held: { from: 2026, to: 2074, prop: "trophy" } }),
  player("arg.a5", "footballArgentina", 5, [
    { f: 1912, x: 3930, y: 2110 },
    { f: 2010, x: 4040, y: 2112 },
    { f: 2040, x: 4180, y: 2238, ease: "atlasDrift" },
  ], [
    { f: 1912, action: "jog", facing: 1 },
    { f: 2018, action: "celebrateRun", amount: 1 },
    { f: 2040, action: "cheer", amount: 1 },
  ]),
  // Opponents.
  player("opp.d1", "footballOpponent", 11, [
    { f: 1912, x: 4160, y: 2190 },
    { f: 1984, x: 4118, y: 2200 },
    { f: 1994, x: 4130, y: 2222 },
    { f: 2012, x: 4160, y: 2232 },
    { f: 2040, x: 4150, y: 2200 },
  ], [
    { f: 1912, action: "jog", facing: -1 },
    { f: 1984, action: "run", facing: -1 },
    { f: 1996, action: "retreat", facing: 1 },
    { f: 2014, action: "stand", facing: -1, breadth: 0.4 },
  ]),
  player("opp.d2", "footballOpponent", 12, [
    { f: 1912, x: 4210, y: 2250 },
    { f: 1996, x: 4190, y: 2236 },
    { f: 2008, x: 4208, y: 2216 },
    { f: 2040, x: 4230, y: 2200 },
  ], [
    { f: 1912, action: "jog", facing: -1 },
    { f: 1996, action: "run", facing: -1 },
    { f: 2010, action: "stand", facing: 1, breadth: 0.5 },
  ]),
  player("opp.d3", "footballOpponent", 13, [
    { f: 1912, x: 4150, y: 2110 },
    { f: 2000, x: 4200, y: 2140 },
    { f: 2040, x: 4210, y: 2150 },
  ], [
    { f: 1912, action: "jog", facing: -1 },
    { f: 2012, action: "stand", facing: 1, breadth: 0.4 },
  ]),
  player("opp.gk", "goalkeeper", 14, [
    { f: 1912, x: 4284, y: 2172 },
    { f: 2004, x: 4280, y: 2178 },
    { f: 2012, x: 4284, y: 2160 },
    { f: 2020, x: 4290, y: 2150 },
  ], [
    { f: 1912, action: "stand", facing: -1, breadth: 0.8 },
    { f: 2002, action: "stroll", facing: -1 },
    { f: 2009, action: "dive", facing: -1, dur: 12, blend: 3 },
    { f: 2034, action: "stand", facing: -1, breadth: 0.6, blend: 12 },
  ]),
];

/* ============================================================ Malvinas */

/**
 * Argentine soldiers (1982), first construction only: a file walking west
 * into the wind on a foreground ridge; small figures rise on the island.
 * No combat, no triumph. The flag raise belongs to the scene after 2171.
 */
export const ACTORS_MALVINAS: readonly ActorTrack[] = [
  ...[0, 1, 2, 3, 4].map(
    (i): ActorTrack => ({
      id: `malvinas.fg.${i}`,
      wardrobe: "soldierMalvinas",
      scale: 0.5,
      depth: 1.9,
      detail: i < 2 ? "hero" : "mid",
      seed: 1982 + i * 7,
      role: "secondary",
      pos: [
        { f: 2146, x: 5852 + i * 42, y: 2974 + (i % 2) * 10 },
        { f: 2190, x: 5812 + i * 42, y: 2974 + (i % 2) * 10 },
        // Full film only (after the benchmark window): the file reaches the
        // ridge, one helps another up, two plant and hold the flag.
        ...(i === 1 ? [{ f: 2204, x: 5842, y: 2986 }] : i === 0 ? [{ f: 2200, x: 5800, y: 2972 }] : [{ f: 2198, x: 5800 + i * 40, y: 2970 + (i % 2) * 8 }]),
      ],
      actions: [
        { f: 2146, action: "wind", facing: -1 },
        ...(i === 0
          ? [{ f: 2200, action: "help" as const, facing: 1 as const, blend: 8 }, { f: 2214, action: "guard" as const, facing: -1 as const, blend: 10 }]
          : i === 1
            ? [{ f: 2204, action: "stand" as const, facing: -1 as const, blend: 8 }, { f: 2216, action: "guard" as const, facing: -1 as const }]
            : i === 2 || i === 3
              ? [{ f: 2196 + (i - 2) * 3, action: "hoist" as const, facing: -1 as const, dur: 18, blend: 8 }]
              : [{ f: 2198, action: "guard" as const, facing: -1 as const, breadth: 0.6, blend: 8 }]),
      ],
      life: { from: 2146 + i * 3, to: 2240, enter: "rise", enterDur: 16, exit: "fold", exitDur: 16 },
    }),
  ),
  ...[0, 1, 2].map(
    (i): ActorTrack => ({
      id: `malvinas.island.${i}`,
      wardrobe: "soldierMalvinas",
      scale: 0.2,
      detail: "map",
      tone: 0.1,
      seed: 1990 + i,
      role: "context",
      pos: [
        { f: 2152, x: geo(58.25 + i * 0.06, 51.66)[0], y: geo(58.25, 51.66 + i * 0.02)[1] },
        { f: 2190, x: geo(58.36 + i * 0.06, 51.66)[0], y: geo(58.25, 51.66 + i * 0.02)[1] },
      ],
      actions: [{ f: 2152, action: "wind", facing: -1 }],
      life: { from: 2152 + i * 3, to: 2236, enter: "rise", enterDur: 14, exit: "fold" },
    }),
  ),
];

export const PITCH_CENTER = [PCX, PCY] as const;
