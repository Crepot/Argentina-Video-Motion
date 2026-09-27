import React from "react";
import { clamp01, lerp } from "../animation/interpolate-clamped";
import { CIVIC_NODES } from "../atlas/geometry/institutions";
import {
  BOWL_RINGS,
  ellipsePoint,
  lerpEllipse,
  type MorphSegment,
} from "../atlas/geometry/stadium";
import { parallelY } from "../atlas/south-atlantic-geometry";
import { WorldLayer } from "../components/AtlasCanvas";
import { AnchoredLabel } from "../components/AnchoredLabel";
import { AnthemPhrase } from "../components/AnthemPhrase";
import { CartographicGrid } from "../components/CartographicGrid";
import { CensorshipMask } from "../components/CensorshipMask";
import { CityInstitutions } from "../components/CityInstitutions";
import { CrowdField } from "../components/CrowdField";
import { EventLabel } from "../components/EventLabel";
import { FootballPitch } from "../components/FootballPitch";
import { HistoricalDate } from "../components/HistoricalDate";
import { InstitutionalControlGrid } from "../components/InstitutionalControlGrid";
import { MissingNodeField } from "../components/MissingNodeField";
import { OceanField } from "../components/OceanField";
import { PaperFibres, SurveyRuling } from "../components/PaperTexture";
import { RouteLine } from "../components/RouteLine";
import { SceneBridge } from "../components/SceneBridge";
import { TerritoryHighlight } from "../components/TerritoryHighlight";
import { TrophyAxis, TrophySymbol } from "../components/TrophySymbol";
import { useCamera, usePx } from "../camera/CameraPath";
import { useGlobalFrame } from "../context/GlobalFrameProvider";
import { PERSISTENT_OBJECT_IDS } from "../paths/path-registry";
import { LINE_PX } from "../theme/line-styles";
import { mixColor, PALETTE } from "../theme/palette";
import { frameRange } from "../types/branded-frames";
import { TRACKS } from "../timeline/benchmark-timeline";
import { DICTADURA_SECONDARY_LINE, LABEL_CUES, TEXT } from "../timeline/labels";
import { TYPE } from "../typography/type-scale";

/**
 * Activates layers by global frame and feeds shared components with the
 * values of the benchmark timeline. It never evaluates the camera and never
 * creates or destroys memoryLine.main (the composition owns it).
 */
const active = (f: number, a: number, b: number) => f >= a && f <= b;

const useSharedValues = () => {
  const { globalFrame: f } = useGlobalFrame();
  const G = TRACKS.grid;
  const gridColor = mixColor(
    mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, G.controlMix(f)),
    PALETTE.deepBlueSoft,
    G.oceanColor(f),
  );
  return {
    f,
    gridColor,
    gridOpacity: G.opacity(f),
    isobarProgress: TRACKS.memory.m3(f),
  };
};

const STADIUM_MASK_SAMPLES = 72;

/** Layers 5–30: paper, cartography, historical systems, pitch/stadium. */
export const WorldBelowMemoryLine: React.FC = () => {
  const { f, gridColor, gridOpacity, isobarProgress } = useSharedValues();
  const px = usePx();
  const P = TRACKS.pitch;
  const maskStrength = TRACKS.grid.stadiumMask(f);

  // Stadium exterior mask: the stadium becomes an island inside the wounded
  // atlas. Only the grid/historical layers inside the outer ring recede.
  const outer = lerpEllipse(
    BOWL_RINGS[1].stadium,
    BOWL_RINGS[1].isobar,
    isobarProgress,
  );
  const maskPath = Array.from({ length: STADIUM_MASK_SAMPLES }, (_, i) => {
    const p = ellipsePoint(outer, (i / STADIUM_MASK_SAMPLES) * 360);
    return `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  }).join(" ");

  const seedReg = P.seedRegularity(f);
  const lineTone = P.lineTone(f);
  const pitchLineColor = mixColor(
    mixColor(gridColor, PALETTE.grayBlue, seedReg),
    PALETTE.deepBlueSoft,
    lineTone,
  );
  const pitchLineWidth = lerp(
    lerp(LINE_PX.gridPrimary, LINE_PX.institutionalControl, seedReg),
    LINE_PX.pitch,
    lineTone,
  );
  const bowlTone = TRACKS.bowl.tone(f);
  const ringColor = mixColor(
    mixColor(gridColor, PALETTE.deepBlueSoft, bowlTone),
    mixColor(PALETTE.deepBlueSoft, PALETTE.grayBlue, 0.3),
    TRACKS.bowl.isobarTone(f),
  );
  const fade: Record<MorphSegment["fadeGroup"], number> = {
    touch: P.fade.touch(f),
    goal: P.fade.goal(f),
    halfway: P.fade.halfway(f),
    box: P.fade.box(f),
    goalArea: P.fade.goalArea(f),
  };
  const controlColor = mixColor(PALETTE.grayBlue, PALETTE.deepBlueSoft, 0.38);
  const T = TRACKS.trophy;

  return (
    <>
      <defs>
        <mask
          id="stadium-exterior"
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={7680}
          height={4320}
        >
          <rect x={0} y={0} width={7680} height={4320} fill="white" />
          {maskStrength > 0.001 ? (
            <path
              d={`${maskPath} Z`}
              fill="black"
              opacity={maskStrength * 0.86}
            />
          ) : null}
        </mask>
      </defs>

      <WorldLayer layer="paperFiber">
        <PaperFibres
          seed={1810}
          worldOpacity={0.032}
          screenGrainOpacity={0}
          fiberCount={520}
          pxToWorld={px(1)}
        />
      </WorldLayer>
      <WorldLayer layer="gridFar">
        <SurveyRuling opacity={0.05} pxToWorld={px(1)} />
      </WorldLayer>

      <WorldLayer layer="cartography">
        <g mask={maskStrength > 0.001 ? "url(#stadium-exterior)" : undefined}>
          <CartographicGrid
            mode={
              f < 1752
                ? "institutional"
                : f < 1842
                  ? "controlled"
                  : f < 2047
                    ? "pitch-seed"
                    : "ocean"
            }
            color={gridColor}
            opacity={gridOpacity}
            strokeWidth={px(LINE_PX.gridPrimary)}
            transitionProgress={TRACKS.grid.oceanProgress(f)}
            pitchGapClose={TRACKS.grid.pitchGapClose(f)}
            ringGapClose={TRACKS.grid.ringGapClose(f)}
          />
        </g>
        {active(f, 2058, 2171) ? (
          <TerritoryHighlight
            geometryId="mainland.patagonia"
            status="modern"
            fillOpacity={0}
            strokeOpacity={TRACKS.ocean.coastOpacity(f)}
            drawProgress={TRACKS.ocean.coastDraw(f)}
            px={px}
          />
        ) : null}
        {active(f, 2085, 2171) ? (
          <OceanField
            globalFrame={f}
            isobarProgress={TRACKS.ocean.isobarsDraw(f)}
            windProgress={TRACKS.ocean.wind(f)}
            coordinateOpacity={0.62}
            isobarColor={PALETTE.deepBlueSoft}
            px={px}
          />
        ) : null}
        {active(f, 2145, 2171) ? (
          <TerritoryHighlight
            geometryId="islands.malvinas"
            status="disputed"
            fillOpacity={TRACKS.ocean.islandsHatch(f)}
            strokeOpacity={TRACKS.ocean.islandsOutline(f)}
            drawProgress={1}
            px={px}
          />
        ) : null}
        {active(f, 2120, 2171) ? (
          <RouteLine
            geometryId="navalGuide1982"
            progress={TRACKS.ocean.navalGuide(f)}
            opacity={0.2}
            style="dotted"
            colorToken="deepBlue"
            strokeWidthPx={1.6}
          />
        ) : null}
        {active(f, 2016, 2171) ? (
          <TrophyAxis
            draw={T.axisDraw(f)}
            extend={T.axisExtend(f)}
            opacity={T.axisOpacity(f)}
            gold={T.gold(f)}
            strokeWidth={px(LINE_PX.hairline * 1.3)}
            top={parallelY(46)}
            bottom={parallelY(55)}
          />
        ) : null}
      </WorldLayer>

      <WorldLayer
        layer="historical"
        mask={maskStrength > 0.001 ? "url(#stadium-exterior)" : undefined}
      >
        {active(f, 1722, 2114) ? (
          <CityInstitutions
            globalFrame={f}
            opacity={TRACKS.city.opacity(f)}
            previousRoutesOpacity={TRACKS.city.previousRoutes(f)}
            figuresOpacity={TRACKS.city.figures(f)}
            figuresWithdraw={TRACKS.city.figuresWithdraw(f)}
            structuralColor={mixColor(
              PALETTE.deepBlueSoft,
              PALETTE.grayBlue,
              0.25,
            )}
            px={px}
          />
        ) : null}
        <InstitutionalControlGrid
          globalFrame={f}
          opacity={TRACKS.control.opacity(f)}
          scanOpacity={TRACKS.control.scan(f)}
          repressionResidual={TRACKS.control.repressionResidual(f)}
          color={controlColor}
          lockColor={PALETTE.deepBlueSoft}
          px={px}
        />
        {active(f, 1776, 2114) ? (
          <CensorshipMask
            globalFrame={f}
            opacity={TRACKS.control.censor(f)}
            px={px}
          />
        ) : null}
        <MissingNodeField
          nodes={CIVIC_NODES}
          globalFrame={f}
          nodeOpacity={TRACKS.nodes.opacity(f)}
          ringOpacity={TRACKS.nodes.rings(f)}
          nodeColor={mixColor(PALETTE.grayBlue, PALETTE.skyBlue, 0.55)}
          px={px}
        />
      </WorldLayer>

      <WorldLayer layer="historical">
        <SceneBridge
          id="bridge.institutional-to-pitch"
          range={frameRange(1872, 1937)}
          globalFrame={f}
          outgoingLayerIds={["control.seedCell"]}
          incomingLayerIds={["pitch1978", "stadium.bowl"]}
          preservedObjectIds={PERSISTENT_OBJECT_IDS}
          geometryProgress={P.guide(f)}
        >
          <SceneBridge
            id="bridge.stadium-to-isobar"
            range={frameRange(2047, 2098)}
            globalFrame={f}
            outgoingLayerIds={["pitch1978", "stadium.crowd", "trophy1978"]}
            incomingLayerIds={[
              "southAtlantic.isobars",
              "southAtlantic.wind",
              "graticule",
            ]}
            preservedObjectIds={PERSISTENT_OBJECT_IDS}
            geometryProgress={isobarProgress}
          >
            <FootballPitch
              geometryId="pitch1978"
              constructionProgress={P.guide(f)}
              detailProgress={P.construction(f)}
              stadiumProgress={TRACKS.bowl.morph(f)}
              crowdIntensity={TRACKS.crowd.intensity(f)}
              contextOpacity={1}
              lineOpacity={P.seedOpacity(f) * P.residual(f)}
              lineColor={pitchLineColor}
              lineWidth={px(pitchLineWidth)}
              lockOpacity={seedReg}
              fadeByGroup={fade}
              fillColor={mixColor(
                PALETTE.skyBluePale,
                PALETTE.skyBlue,
                P.fillSaturation(f),
              )}
              fillOpacity={P.fill(f)}
              ringColor={ringColor}
              ringOpacity={lerp(gridOpacity, TRACKS.bowl.opacity(f), bowlTone)}
              ringWidth={px(lerp(LINE_PX.gridPrimary, 1.5, bowlTone))}
              transitionToIsobarProgress={isobarProgress}
            />
          </SceneBridge>
        </SceneBridge>
      </WorldLayer>
    </>
  );
};

/** Layers 50–60: stadium figures (crowd, ball, trophy) and world labels. */
export const WorldAboveMemoryLine: React.FC = () => {
  const { f, isobarProgress } = useSharedValues();
  const px = usePx();
  const T = TRACKS.trophy;
  const B = TRACKS.ball;
  const wind = TRACKS.crowd.wind(f);
  return (
    <>
      <WorldLayer layer="figures">
        {active(f, 1908, 2171) ? (
          <CrowdField
            intensity={TRACKS.crowd.intensity(f)}
            wave={TRACKS.crowd.wave(f)}
            globalFrame={f}
            windProgress={wind}
            isobarProgress={isobarProgress}
            color={mixColor(PALETTE.skyBlue, PALETTE.skyBluePale, wind * 0.7)}
            strokeWidth={px(lerp(1.4, 1.1, wind))}
          />
        ) : null}
        {active(f, 1950, 2060) ? (
          <RouteLine
            geometryId="ballTrajectory1978"
            progress={B.progress(f)}
            opacity={B.route(f)}
            style="solid"
            colorToken="skyBlue"
            strokeWidthPx={LINE_PX.routeHead}
            marker="ball"
            guideOpacity={B.guide(f)}
          />
        ) : null}
        {active(f, 1974, 2070) ? (
          <TrophySymbol
            ghostOpacity={T.ghost(f)}
            bodyDraw={T.bodyDraw(f)}
            fillOpacity={T.fill(f)}
            goldOpacity={T.gold(f)}
            ringRadius={T.ringRadius(f)}
            ringOpacity={T.ringOpacity(f)}
            strokeWidth={px(LINE_PX.trophy)}
          />
        ) : null}
      </WorldLayer>
      <WorldLayer layer="worldLabels">
        {active(f, 2085, 2171) ? (
          <text
            data-id={LABEL_CUES.oceano.id}
            x={LABEL_CUES.oceano.anchor[0]}
            y={LABEL_CUES.oceano.anchor[1]}
            fill={PALETTE.deepBlueSoft}
            fontFamily={TYPE.map.fontFamily}
            fontWeight={TYPE.map.fontWeight}
            fontSize={23}
            letterSpacing={6.5}
            textAnchor="middle"
            opacity={TRACKS.ocean.oceanLabel(f)}
          >
            {TEXT.oceano}
          </text>
        ) : null}
      </WorldLayer>
    </>
  );
};

/** Stabilized/hybrid typography in screen space. */
export const LabelsOverlay: React.FC = () => {
  const { globalFrame: f } = useGlobalFrame();
  const camera = useCamera();
  const L = TRACKS.labels;
  const lockup = L.lockup(f);
  const y1978 = L.year1978(f);
  const campeon = L.campeon(f);
  const anthemReveal = (L.anthemLine1(f) + L.anthemLine2(f)) / 2;
  const y1982 = L.year1982(f);
  const guerra = L.guerra(f);
  const y1976 = L.year1976(f);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {y1976 > 0.002 ? (
        <AnchoredLabel
          id={LABEL_CUES.year1976.id}
          anchor={LABEL_CUES.year1976.anchor}
          camera={camera}
          mode="hybrid"
          align="left"
          maxWidthPx={LABEL_CUES.year1976.maxWidthPx}
        >
          <HistoricalDate
            year={TEXT.year1976}
            opacity={y1976}
            emphasis="minor"
            colorToken="deepBlueSoft"
            enter={clamp01(y1976 / 0.72)}
          />
        </AnchoredLabel>
      ) : null}
      {lockup > 0.002 ? (
        <AnchoredLabel
          id={LABEL_CUES.dictaduraLockup.id}
          anchor={LABEL_CUES.dictaduraLockup.anchor}
          camera={camera}
          mode="stabilized"
          align="left"
          maxWidthPx={LABEL_CUES.dictaduraLockup.maxWidthPx}
        >
          <HistoricalDate
            year={TEXT.dictaduraDates}
            opacity={lockup}
            emphasis="lockup"
            colorToken="deepBlue"
            enter={f < 1800 ? clamp01(lockup / 0.92) : 1}
            trackingPx={L.lockupTracking(f)}
          />
          <EventLabel
            lines={[TEXT.dictadura]}
            opacity={lockup}
            tone="solemn"
            marginTop={12}
            trackingPx={L.lockupTracking(f)}
          />
          {DICTADURA_SECONDARY_LINE ? (
            <EventLabel
              lines={[DICTADURA_SECONDARY_LINE]}
              opacity={lockup * 0.72}
              tone="note"
              marginTop={9}
              trackingPx={L.lockupTracking(f)}
            />
          ) : null}
        </AnchoredLabel>
      ) : null}
      {y1978 > 0.002 ? (
        <AnchoredLabel
          id={LABEL_CUES.year1978.id}
          anchor={LABEL_CUES.year1978.anchor}
          camera={camera}
          mode="stabilized"
          align="left"
          maxWidthPx={LABEL_CUES.year1978.maxWidthPx}
        >
          <HistoricalDate
            year={TEXT.year1978}
            opacity={y1978}
            emphasis="major"
            colorToken="deepBlue"
            enter={f < 1990 ? y1978 : 1}
          />
          <EventLabel
            lines={[TEXT.campeon]}
            opacity={campeon}
            tone="standard"
            marginTop={10}
            enter={f < 1990 ? campeon : 1}
          />
        </AnchoredLabel>
      ) : null}
      {f >= 1988 && L.anthemOpacity(f) > 0.002 ? (
        <AnchoredLabel
          id={LABEL_CUES.anthem1978.id}
          anchor={LABEL_CUES.anthem1978.anchor}
          camera={camera}
          mode="stabilized"
          align="left"
          maxWidthPx={LABEL_CUES.anthem1978.maxWidthPx}
        >
          <AnthemPhrase
            lines={TEXT.anthem1978}
            state={f < 2010 ? "entering" : f < 2047 ? "held" : "exiting"}
            opacity={L.anthemOpacity(f)}
            revealProgress={anthemReveal}
            align="left"
          />
        </AnchoredLabel>
      ) : null}
      {y1982 > 0.002 ? (
        <AnchoredLabel
          id={LABEL_CUES.year1982.id}
          anchor={LABEL_CUES.year1982.anchor}
          camera={camera}
          mode="stabilized"
          align="left"
          maxWidthPx={LABEL_CUES.year1982.maxWidthPx}
        >
          <HistoricalDate
            year={TEXT.year1982}
            opacity={y1982}
            emphasis="solemn"
            colorToken="deepBlue"
            enter={clamp01(y1982 / 0.9)}
          />
          <EventLabel
            lines={[TEXT.guerraMalvinas]}
            opacity={guerra}
            tone="solemn"
            marginTop={10}
            enter={clamp01(guerra / 0.82)}
          />
        </AnchoredLabel>
      ) : null}
    </div>
  );
};
