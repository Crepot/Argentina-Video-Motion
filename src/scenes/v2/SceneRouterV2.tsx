import React from "react";
import { clamp01, lerp } from "../../animation/interpolate-clamped";
import { ActorView, placeActors, type PlacedActor } from "../../actors/ActorLayer";
import { RigDefs } from "../../actors/ActorRig2D";
import { parallelY } from "../../atlas/south-atlantic-geometry";
import { useCamera, usePx } from "../../camera/CameraPath";
import { ALL_ACTORS_V2 } from "../../choreography/all-actors-v2";
import { WorldLayer } from "../../components/AtlasCanvas";
import { AnchoredLabel } from "../../components/AnchoredLabel";
import { AnthemPhrase } from "../../components/AnthemPhrase";
import { EventLabel } from "../../components/EventLabel";
import { FootballPitch } from "../../components/FootballPitch";
import { HistoricalDate } from "../../components/HistoricalDate";
import { OceanField } from "../../components/OceanField";
import { PaperFibres } from "../../components/PaperTexture";
import { RouteLine } from "../../components/RouteLine";
import { TerritoryHighlight } from "../../components/TerritoryHighlight";
import { TrophyAxis } from "../../components/TrophySymbol";
import { useGlobalFrame } from "../../context/GlobalFrameProvider";
import { PropDefs } from "../../stage/Props";
import { createProjector, type Projector } from "../../stage/projection";
import { LINE_PX } from "../../theme/line-styles";
import { mixColor, PALETTE } from "../../theme/palette";
import { TRACKS } from "../../timeline/benchmark-timeline";
import { TRACKS_V2 } from "../../timeline/benchmark-v2-timeline";
import { LABEL_CUES_V2, SCREEN_LOCKUPS, TEXT_V2 } from "../../timeline/labels-v2";
import { TYPE } from "../../typography/type-scale";
import type { CameraState } from "../../types/camera";
import { atlanticItems, IslandsGround, WindStreaks } from "./AtlanticStage";
import { CivicNodesV2, DictaduraGround, dictaduraItems, ScanPools } from "./DictaduraStage";
import { BowlRingsGround, GoalImpactRing, stadiumItems } from "./StadiumStage";
import { sortItems, type StageContext, type StageItem } from "./stage-items";

/**
 * Benchmark V2 router: ground-plane layers (cartography, city plan, pitch,
 * ocean) → memoryLine.main (mounted by the composition) → depth-sorted
 * billboards (architecture, people, vehicles, stands) → foreground plane.
 * It never evaluates the camera and never creates the memory line.
 */

const makeContext = (f: number, camera: CameraState): StageContext => {
  const cache = new Map<number, Projector>();
  const proj = (d = 1) => {
    let p = cache.get(d);
    if (!p) {
      p = createProjector(camera, d);
      cache.set(d, p);
    }
    return p;
  };
  const onScreen = (x: number, y: number, d = 1, margin = 300) => {
    const s = proj(d).point(x, y, 0);
    return s[0] > -margin && s[0] < 1920 + margin && s[1] > -margin && s[1] < 1080 + margin * 2;
  };
  return { f, proj, onScreen };
};

const actorItems = (ctx: StageContext): StageItem[] => {
  const placed: PlacedActor[] = placeActors(ALL_ACTORS_V2, ctx.f, ctx.proj).filter((a) => {
    const s = ctx.proj(a.track.depth ?? 1).point(a.frame.x, a.frame.y, 0);
    return s[0] > -500 && s[0] < 2420 && s[1] > -200 && s[1] < 1900;
  });
  return placed.map((a) => ({
    key: a.track.id,
    y: a.frame.y,
    depth: a.track.depth ?? 1,
    node: <ActorView placed={a} projector={ctx.proj(a.track.depth ?? 1)} />,
  }));
};

/** Ground plane (inside world layers) for the whole benchmark. */
const GroundV2: React.FC<{ f: number }> = ({ f }) => {
  const px = usePx();
  const V1 = TRACKS;
  const P = TRACKS_V2.pitch;
  const guide = P.guide(f);
  const lineTone = clamp01((f - 1890) / 30);
  // Ground strokes are non-scaling (.v2-nss): widths below are screen px.
  const sp = (n: number) => n;
  return (
    <>
      <WorldLayer layer="paperFiber">
        <PaperFibres seed={1810} worldOpacity={0.032} screenGrainOpacity={0} fiberCount={520} pxToWorld={px(1)} />
      </WorldLayer>
      <WorldLayer layer="cartography">
        <g className="v2-nss">
        <DictaduraGround f={f} px={sp} />
        <ScanPools f={f} px={sp} />
        {f >= 1886 && f <= 2112 ? (
          <FootballPitch
            geometryId="pitch1978"
            constructionProgress={guide}
            detailProgress={P.construction(f)}
            stadiumProgress={0}
            crowdIntensity={0}
            contextOpacity={1}
            lineOpacity={P.lineOpacity(f)}
            lineColor={mixColor(PALETTE.grayBlue, PALETTE.paperWarm, lineTone * 0.9)}
            lineWidth={lerp(LINE_PX.institutionalControl, 2.2, lineTone)}
            lockOpacity={1 - lineTone}
            fadeByGroup={{
              touch: V1.pitch.fade.touch(f),
              goal: V1.pitch.fade.goal(f),
              halfway: V1.pitch.fade.halfway(f),
              box: V1.pitch.fade.box(f),
              goalArea: V1.pitch.fade.goalArea(f),
            }}
            fillColor={mixColor(PALETTE.skyBluePale, PALETTE.skyBlue, P.fillSaturation(f))}
            fillOpacity={P.fill(f)}
            ringColor={PALETTE.deepBlueSoft}
            ringOpacity={0}
            ringWidth={1}
            transitionToIsobarProgress={V1.memory.m3(f)}
          />
        ) : null}
        <BowlRingsGround f={f} px={sp} />
        <GoalImpactRing f={f} px={sp} />
        <CivicNodesV2 f={f} px={sp} />
        {f >= 2040 ? (
          <TrophyAxis
            draw={1}
            extend={TRACKS_V2.trophy.axis(f)}
            opacity={TRACKS_V2.trophy.axisOpacity(f)}
            gold={0}
            strokeWidth={LINE_PX.hairline * 1.3}
            top={parallelY(46)}
            bottom={parallelY(55)}
          />
        ) : null}
        {f >= 2058 ? (
          <TerritoryHighlight
            geometryId="mainland.patagonia"
            status="modern"
            fillOpacity={0}
            strokeOpacity={TRACKS_V2.ocean.coastOpacity(f)}
            drawProgress={TRACKS_V2.ocean.coastDraw(f)}
            px={sp}
          />
        ) : null}
        {f >= 2085 ? (
          <OceanField
            globalFrame={f}
            isobarProgress={TRACKS_V2.ocean.isobarsDraw(f)}
            windProgress={clamp01(TRACKS_V2.ocean.wind(f) * 0.7)}
            coordinateOpacity={0.62}
            isobarColor={PALETTE.deepBlueSoft}
            px={sp}
          />
        ) : null}
        <WindStreaks f={f} px={sp} />
        <IslandsGround f={f} px={sp} />
        </g>
        {f >= 2120 ? (
          <RouteLine
            geometryId="navalGuide1982"
            progress={TRACKS_V2.ocean.navalGuide(f)}
            opacity={0.22}
            style="dotted"
            colorToken="deepBlue"
            strokeWidthPx={1.6}
          />
        ) : null}
      </WorldLayer>
    </>
  );
};

export const WorldBelowMemoryLineV2: React.FC = () => {
  const { globalFrame: f } = useGlobalFrame();
  return (
    <>
      <RigDefs />
      <PropDefs />
      <GroundV2 f={f} />
    </>
  );
};

/** Billboards and foreground plane, depth-sorted (above the memory line). */
export const WorldAboveMemoryLineV2: React.FC = () => {
  const { globalFrame: f } = useGlobalFrame();
  const camera = useCamera();
  const ctx = makeContext(f, camera);
  const items = sortItems([...dictaduraItems(ctx), ...stadiumItems(ctx), ...atlanticItems(ctx), ...actorItems(ctx)]);
  const mid = items.filter((i) => i.depth <= 1);
  const fg = items.filter((i) => i.depth > 1);
  const oceano = TRACKS_V2.labels.oceano(f);
  return (
    <>
      <g data-plane="midground">
        {mid.map((i) => (
          <React.Fragment key={i.key}>{i.node}</React.Fragment>
        ))}
      </g>
      <g data-plane="foreground">
        {fg.map((i) => (
          <React.Fragment key={i.key}>{i.node}</React.Fragment>
        ))}
      </g>
      {oceano > 0.002 ? (
        <WorldLayer layer="worldLabels">
          <text
            data-id={LABEL_CUES_V2.oceano.id}
            x={LABEL_CUES_V2.oceano.anchor[0]}
            y={LABEL_CUES_V2.oceano.anchor[1]}
            fill={PALETTE.deepBlueSoft}
            fontFamily={TYPE.map.fontFamily}
            fontWeight={TYPE.map.fontWeight}
            fontSize={23}
            letterSpacing={6.5}
            textAnchor="middle"
            opacity={oceano}
          >
            {TEXT_V2.oceano}
          </text>
        </WorldLayer>
      ) : null}
    </>
  );
};

/* ---------------------------------------------------------------- labels */

const Fixed: React.FC<{ id: string; at: readonly [number, number]; align: "left" | "right"; children: React.ReactNode }> = ({ id, at, align, children }) => (
  <div
    data-id={id}
    style={{
      position: "absolute",
      left: align === "left" ? at[0] : undefined,
      right: align === "right" ? 1920 - at[0] : undefined,
      top: at[1],
      textAlign: align,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

export const LabelsOverlayV2: React.FC = () => {
  const { globalFrame: f } = useGlobalFrame();
  const camera = useCamera();
  const L = TRACKS_V2.labels;
  const y1976 = L.year1976(f);
  const lockup = L.lockup(f);
  const y1978 = L.year1978(f);
  const campeon = L.campeon(f);
  const anthem = L.anthemOpacity(f);
  const y1982 = L.year1982(f);
  const guerra = L.guerra(f);
  const malvinas = L.malvinas(f);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {y1976 > 0.002 ? (
        <Fixed id={LABEL_CUES_V2.year1976.id} at={SCREEN_LOCKUPS.dictadura} align="left">
          <HistoricalDate year={TEXT_V2.year1976} opacity={y1976} emphasis="minor" colorToken="deepBlueSoft" enter={clamp01(y1976 / 0.72)} />
        </Fixed>
      ) : null}
      {lockup > 0.002 ? (
        <Fixed id={LABEL_CUES_V2.dictaduraLockup.id} at={SCREEN_LOCKUPS.dictadura} align="left">
          <HistoricalDate year={TEXT_V2.dictaduraDates} opacity={lockup} emphasis="lockup" colorToken="deepBlue" enter={f < 1800 ? clamp01(lockup / 0.94) : 1} trackingPx={L.lockupTracking(f)} />
          <EventLabel lines={[TEXT_V2.dictadura]} opacity={lockup} tone="solemn" marginTop={14} trackingPx={L.lockupTracking(f)} />
        </Fixed>
      ) : null}
      {y1978 > 0.002 ? (
        <Fixed id={LABEL_CUES_V2.year1978.id} at={SCREEN_LOCKUPS.year1978} align="left">
          <HistoricalDate year={TEXT_V2.year1978} opacity={y1978} emphasis="major" colorToken="deepBlue" enter={f < 1990 ? y1978 : 1} />
          <EventLabel lines={[TEXT_V2.campeon]} opacity={campeon} tone="standard" marginTop={10} enter={f < 1990 ? campeon : 1} />
        </Fixed>
      ) : null}
      {f >= 1988 && anthem > 0.002 ? (
        <Fixed id={LABEL_CUES_V2.anthem1978.id} at={SCREEN_LOCKUPS.anthem1978} align="right">
          <AnthemPhrase
            lines={TEXT_V2.anthem1978}
            state={f < 2010 ? "entering" : f < 2047 ? "held" : "exiting"}
            opacity={anthem}
            revealProgress={(L.anthemLine1(f) + L.anthemLine2(f)) / 2}
            align="right"
          />
        </Fixed>
      ) : null}
      {y1982 > 0.002 ? (
        <Fixed id={LABEL_CUES_V2.year1982.id} at={SCREEN_LOCKUPS.year1982} align="left">
          <HistoricalDate year={TEXT_V2.year1982} opacity={y1982} emphasis="solemn" colorToken="deepBlue" enter={clamp01(y1982 / 0.92)} />
          <EventLabel lines={[TEXT_V2.guerraMalvinas]} opacity={guerra} tone="solemn" marginTop={10} enter={clamp01(guerra / 0.84)} />
        </Fixed>
      ) : null}
      {malvinas > 0.002 ? (
        <AnchoredLabel id={LABEL_CUES_V2.malvinas.id} anchor={LABEL_CUES_V2.malvinas.anchor} camera={camera} mode="hybrid" align="center" maxWidthPx={LABEL_CUES_V2.malvinas.maxWidthPx}>
          <div style={{ ...TYPE.map, color: PALETTE.deepBlue, opacity: malvinas, fontSize: 20 }}>{TEXT_V2.malvinas}</div>
        </AnchoredLabel>
      ) : null}
    </div>
  );
};
