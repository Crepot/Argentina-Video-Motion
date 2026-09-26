# ARGENTINA — Remotion Implementation Specification

## Estado del documento

**Propósito:** contrato técnico previo a implementación para el film completo y, en particular, para el benchmark `00:57.4–01:12.4`.  
**No es código de producción.** Las interfaces incluidas son contratos TypeScript orientativos que el implementador deberá respetar.  
**Autoridades editoriales:**

1. `ANIMATIC_TIMELINE_v1.md` manda sobre frames, timestamps y anchors musicales.
2. `DIRECTORS_STORYBOARD.md` manda sobre composición, significado histórico, estética, continuidad y transiciones.
3. Este documento resuelve la traducción técnica entre ambos. Cuando existe una divergencia, se registra en §2.

### Constantes bloqueadas

| Parámetro | Valor |
|---|---:|
| Formato | `1920 × 1080`, 16:9 |
| FPS | `30` |
| Duración master | `105.000 s` |
| Frames master | `3150`, numerados `0–3149` |
| Benchmark global | `1722–2171`, ambos inclusive |
| Benchmark local | `0–449`, ambos inclusive |
| Duración benchmark | `450 frames = 15.000 s` |
| Mapeo temporal | `globalFrame = localFrame + 1722` |
| Siguiente frame fuera del benchmark | `2172` = inicio de reconexión cívica de 1983 |
| Atlas world-space | `7680 × 4320` unidades |

---

## 0. Inventario verificado del repositorio

La inspección se realizó antes de escribir esta especificación. Estado actual:

```text
Argentina-Video-Motion/
├── assets/
│   └── Lealtad_y_Destino_2026-09-26T210416.wav
├── src/
│   ├── index.ts
│   ├── Root.tsx
│   ├── Composition.tsx
│   └── index.css
├── Story-Board/
│   ├── DIRECTORS_STORYBOARD.md
│   ├── ANIMATIC_TIMELINE_v1.md
│   └── REMOTION_IMPLEMENTATION_SPEC.md   ← este documento
├── package.json
├── package-lock.json
├── remotion.config.ts
├── tsconfig.json
└── README.md
```

### Estado técnico existente

- Remotion `4.0.529`, React `19.2.3`, TypeScript `5.9.3`.
- Scaffold actual: una composición vacía `MyComp`, `1280 × 720`, 60 frames, 30 fps.
- `remotion.config.ts` ya usa Rspack, Tailwind v4 y JPEG para video.
- `@remotion/media` y `@remotion/paths` no están declarados como dependencias directas. La implementación deberá agregar sólo `@remotion/media@4.0.529` para audio; el morph del benchmark usará la interpolación normalizada interna descrita en §5, sin depender de `@remotion/paths`.
- No existen todavía sistemas de cámara, atlas, paths, escenas ni timeline.
- El WAV se verificó como PCM estéreo, 48 kHz, 16-bit, duración exacta `105.000000 s`.
- SHA-256 del master:

```text
aad141664df8db424fa692c4faeaa3c88af753d20be1eaea365060e8468b2b1d
```

Este hash se considera parte del contrato. El archivo no debe normalizarse, transcodificarse, recortarse, renombrarse ni reescribirse.

---

## 1. Project architecture

La implementación futura deberá migrar el scaffold plano hacia esta estructura. No es necesario conservar `src/Composition.tsx` una vez que existan las composiciones reales.

```text
src/
├── index.ts                         # registerRoot solamente
├── Root.tsx                         # registro de composiciones y folders
├── compositions/
│   ├── ArgentinaMaster.tsx          # 3150 frames; audio completo
│   ├── Benchmark1976Malvinas.tsx    # 450 frames; offset global 1722
│   └── composition-config.ts        # 1920×1080, 30 fps, IDs, duraciones
├── scenes/
│   ├── Scene09ExitState.tsx         # sólo estado heredado al frame 1722
│   ├── Scene10Dictadura.tsx
│   ├── Scene11WorldCup1978.tsx
│   ├── Scene12SouthAtlanticEntry.tsx
│   └── SceneLayerRouter.tsx         # activa capas por globalFrame
├── components/
│   ├── AtlasCanvas.tsx
│   ├── CartographicGrid.tsx
│   ├── HistoricalDate.tsx
│   ├── EventLabel.tsx
│   ├── AnthemPhrase.tsx
│   ├── MemoryLine.tsx
│   ├── RouteLine.tsx
│   ├── TerritoryHighlight.tsx
│   ├── FootballPitch.tsx
│   ├── PaperTexture.tsx
│   ├── SceneBridge.tsx
│   ├── InstitutionalControlGrid.tsx
│   ├── MissingNodeField.tsx
│   └── OceanField.tsx
├── atlas/
│   ├── atlas-constants.ts            # 7680×4320, viewport, anchors
│   ├── atlas-anchors.ts              # puntos con nombre, no números sueltos
│   ├── layers.ts                     # orden y factores de parallax
│   ├── south-atlantic-geometry.ts
│   └── geometry/
│       ├── institutions.ts
│       ├── stadium.ts
│       └── malvinas-entry.ts
├── camera/
│   ├── CameraPath.tsx
│   ├── camera-paths.ts
│   ├── evaluate-camera.ts
│   └── label-stabilization.ts
├── paths/
│   ├── path-registry.ts
│   ├── memory-line-states.ts
│   ├── normalize-path.ts
│   ├── interpolate-path.ts
│   └── path-visibility.ts
├── animation/
│   ├── easing.ts
│   ├── interpolate-clamped.ts
│   ├── frame-ranges.ts
│   ├── stroke-draw.ts
│   └── opacity-cues.ts
├── typography/
│   ├── fonts.ts
│   ├── type-scale.ts
│   └── typography.css
├── theme/
│   ├── palette.ts
│   ├── line-styles.ts
│   └── theme-types.ts
├── timeline/
│   ├── master-timeline.ts
│   ├── benchmark-timeline.ts
│   ├── audio-anchors.ts
│   └── labels.ts
├── audio/
│   ├── MasterAudio.tsx
│   └── audio-contract.ts
├── types/
│   ├── branded-frames.ts
│   ├── scene.ts
│   ├── camera.ts
│   ├── paths.ts
│   └── labels.ts
└── index.css
```

### Responsabilidades y límites

- `compositions/`: mapea frame local a global y monta audio + atlas. No contiene decisiones visuales de escena.
- `scenes/`: declara qué capas y cues están activas; no calcula cámara ni recrea la memory line.
- `components/`: primitivas visuales reutilizables; ninguna conoce el número de escena.
- `atlas/`: geometría world-space y orden espacial.
- `camera/`: única fuente para pan, zoom y rotación.
- `paths/`: identidad y transformación de paths persistentes.
- `timeline/`: datos declarativos con frames globales.
- `audio/`: única integración del master. Ninguna escena monta audio propio.
- `types/`: tipos compartidos sin imports circulares.

### Composiciones futuras

| ID propuesto | Frames | Uso |
|---|---:|---|
| `ArgentinaMaster` | `3150` | Film completo, master desde el frame 0. |
| `Benchmark-1722-2171` | `450` | Benchmark solicitado, global offset `1722`. |
| `Benchmark-Handles` | `510` | Sólo QA opcional: 30 frames previos y posteriores. No es entregable editorial. |

`Benchmark-Handles` permite comprobar continuidad con los frames `1692–2201` sin alterar el benchmark oficial. No debe usarse para aprobación de duración ni export final.

---

## 2. Contradicciones, huecos y resolución propuesta

No se resuelven silenciosamente.

### 2.1 Timings de escenas

**Divergencia:** el storyboard conserva timings conceptuales anteriores (`Scene 10 00:52–00:57`, `Scene 11 00:57–01:01`, `Scene 12 01:01–01:07`). El animatic mueve esos bloques a:

- Scene 10: `1722–1907` / `00:57.4–01:03.6`
- Scene 11: `1908–2084` / `01:03.6–01:09.5`
- Scene 12: `2085–2258` / `01:09.5–01:15.3`

**Resolución:** usar exclusivamente los frames del animatic. Los timings del storyboard se interpretan como duración/ritmo conceptual, no como montaje vigente.

### 2.2 Copy visible de la dictadura

**Divergencia:** el storyboard más reciente fija el copy conciso:

```text
1976–1983
DICTADURA
```

El political lock del animatic escribe `DICTADURA · TERRORISMO DE ESTADO`.

**Resolución propuesta:** por la precedencia indicada para composición y texto visible, usar en pantalla `1976–1983 / DICTADURA`. `stateTerrorism` será el nombre semántico de la capa y el tratamiento visual comunicará terrorismo de Estado, represión y desapariciones. No agregar una segunda línea visible sin aprobación editorial. Así no se elimina el concepto histórico ni se sobrecarga el lockup.

### 2.3 Reconexión democrática de 1983

**Divergencia aparente:** el benchmark termina en `2171`; el anchor `1983 · DEMOCRACIA` empieza en `2172`.

**Resolución:** la democracia no aparece dentro del benchmark oficial. El frame `2171` debe quedar geométricamente preparado para que `2172` pueda iniciar la reconexión sin salto. No adelantar el texto `1983`.

### 2.4 Música vs. mapa musical de diseño

**Divergencia:** el storyboard dice que todavía no había música seleccionada; ahora existe master definitivo.

**Resolución:** el WAV y los anchors del animatic reemplazan esa condición de diseño. Las categorías musicales del storyboard se conservan sólo como intención emocional.

### 2.5 SFX sugeridos

**Hueco:** el storyboard propone SFX, pero no existen archivos ni mezcla aprobada; el usuario prohíbe modificar el master.

**Resolución:** el benchmark se reproduce únicamente con el WAV master a volumen 1. Los SFX quedan como cues mudos en datos (`enabled: false`) para una fase posterior. No sintetizar, descargar ni mezclar SFX ahora.

### 2.6 Acceso al WAV

**Hueco técnico:** el WAV está en `/assets`, no en el directorio público por defecto de Remotion.

**Resolución futura:** configurar `Config.setPublicDir("assets")` y referenciar el basename mediante `staticFile()`. No mover ni duplicar el archivo. Antes de cada render final, verificar el SHA-256 bloqueado arriba.

### 2.7 Tipografía exacta

**Hueco creativo:** el storyboard define categorías y candidatos, no archivos instalados.

**Lock propuesto para evitar decisiones del implementador:**

- Fechas y anthem: **Cormorant Garamond Semibold 600**.
- Eventos, coordenadas y notas: **Source Sans 3 Medium 500**.
- Fallback temporal si las fuentes todavía no están incorporadas: `Georgia` y `Arial`, sólo para wireframe; ningún benchmark final se aprueba con fallback.
- Las fuentes definitivas deben empaquetarse localmente; no depender de red durante render.

---

## 3. Coordinate system

### 3.1 Espacios de coordenadas

Se definen cuatro espacios explícitos:

1. **Global frame space:** `0–3149`. Toda animación editorial vive aquí.
2. **World space:** atlas fijo de `7680 × 4320` unidades.
3. **Viewport space:** `1920 × 1080` píxeles de salida.
4. **Screen-label space:** píxeles estabilizados, derivados de un anchor world-space pero compensados por cámara.

Nunca usar coordenadas del viewport para geometría histórica que deba sobrevivir a una transición.

### 3.2 Convención world-space

- Origen `(0, 0)` arriba a la izquierda.
- `+x` hacia el este/derecha.
- `+y` hacia el sur/abajo.
- Cámara expresada por el punto world-space que debe quedar en el centro del viewport.
- Zoom `1` significa `1 world unit = 1 screen pixel` antes de compensación de resolución.
- Rotación positiva de cámara = giro horario del punto de vista; el grupo world se rota con signo inverso.

### 3.3 Anchors bloqueados para el benchmark

```text
institutionalEntry     = (3340, 2110)
controlledCenter       = (3550, 2180)
woundedVoid            = (3720, 2190)
stadiumWest            = (3820, 2180)
stadiumCenter          = (4090, 2170)
stadiumOverhead        = (4300, 2250)
southAtlanticThreshold = (4700, 2350)
oceanTravel            = (5140, 2530)
malvinasApproach       = (5480, 2690)
```

Estos anchors no son posiciones geográficas GIS. Son posiciones de puesta en página dentro del atlas editorial. La relación Argentina–Atlántico Sur–Malvinas debe conservar dirección y escala cartográfica relativa dentro de la estilización.

### 3.4 Transform de cámara

El grupo world-space se transforma en este orden conceptual:

```text
translate(viewportCenter)
→ rotate(-camera.rotation)
→ scale(camera.zoom)
→ translate(-camera.x, -camera.y)
```

Viewport center fijo: `(960, 540)`.

### 3.5 Jerarquía de capas y parallax

| Capa | Orden | Factor de movimiento | Uso |
|---|---:|---:|---|
| Papel base | 0 | `0.00` screen-fixed fill | Evita bordes vacíos. |
| Fibra world-space | 5 | `0.92` | Papel/cartografía; muy sutil. |
| Grilla lejana | 10 | `0.95` | Coordenadas y líneas secundarias. |
| Cartografía | 20 | `1.00` | Costa, instituciones, océano. |
| Sistemas históricos | 30 | `1.00` | Control, censura, missing nodes. |
| Memory line | 40 | `1.00` | Objeto persistente central. |
| Figuras/estadio/trofeo | 50 | `1.02` | Profundidad editorial mínima. |
| Labels world-anchored | 60 | `1.00` | Coordenadas y topónimos. |
| Labels estabilizados | 70 | anchor world + escala screen | Fechas, evento, anthem. |
| Grano final | 90 | screen-fixed | Opacidad ≤ `0.018`; patrón determinista. |

El parallax debe sentirse como profundidad de papel, no como espacio 3D.

### 3.6 Screen-space stabilized labels

Cada label declara uno de tres modos:

- `world`: escala y rota con el atlas. Para topónimos/coordinates.
- `stabilized`: el anchor se proyecta desde world, pero el texto contrarresta zoom y rotación. Para fechas y anthem.
- `hybrid`: contrarresta rotación; escala aparente limitada a `0.88–1.08`. Para event labels.

Regla de proyección:

```text
screenAnchor = projectWorldPoint(anchor, camera)
labelScale = mode === stabilized ? 1 / camera.zoom : clamp(1 / camera.zoom, 0.88, 1.08)
labelRotation = mode === world ? 0 : camera.rotation
```

Ningún label debe saltar entre modos durante su vida. Si cambia su función, se hace handoff entre dos instancias durante 8–12 frames dentro de `SceneBridge`.

---

## 4. Camera system

### 4.1 Principio

La cámara es una función pura de `globalFrame`. Ninguna escena puede aplicar un `transform` general para simular cámara. Los componentes pueden animarse dentro del atlas, pero pan, zoom y rotación global pertenecen únicamente a `CameraPath`.

### 4.2 Contrato declarativo

```ts
type EaseId =
  | 'linearTravel'
  | 'atlasDrift'
  | 'institutionalLock'
  | 'ceremonial'
  | 'restrainedImpact';

interface CameraKeyframe {
  frame: number;       // global, entero
  x: number;           // world units
  y: number;           // world units
  zoom: number;        // > 0
  rotation: number;    // grados, convención §3.2
  easeToNext: EaseId;
}

interface CameraPathSpec {
  id: string;
  keyframes: readonly CameraKeyframe[];
  extrapolate: 'clamp';
}

interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}
```

API conceptual:

```tsx
const camera = evaluateCameraPath(benchmarkCameraPath, globalFrame);

<AtlasCanvas camera={camera}>
  {/* todas las capas world-space */}
</AtlasCanvas>
```

`CameraPath` puede ser un wrapper o un evaluador + context, pero debe haber una sola evaluación por frame.

### 4.3 Easings bloqueados

Sin springs, rebotes ni overshoot.

| Ease | Curva conceptual | Uso |
|---|---|---|
| `linearTravel` | lineal | Viaje oceánico sostenido. |
| `atlasDrift` | cubic-bezier `(.33, 0, .20, 1)` | Deriva lenta, pullback, observación. |
| `institutionalLock` | cubic-bezier `(.65, 0, .35, 1)` | La geometría se vuelve rígida/controlada. |
| `ceremonial` | cubic-bezier `(.22, .61, .36, 1)` | Aparición de estadio/trofeo sin rebote. |
| `restrainedImpact` | cubic-bezier `(.18, .78, .30, 1)` | Acento deportivo breve, no social-media. |

### 4.4 Camera keyframes del benchmark

Estos valores son el lock inicial de implementación; sólo se ajustan después de un render 1080p y con evidencia de legibilidad.

| Frame global | Tiempo | x | y | zoom | rotación | ease hacia siguiente |
|---:|---:|---:|---:|---:|---:|---|
| 1722 | 57.400 | 3340 | 2110 | 1.00 | +4.5° | `institutionalLock` |
| 1752 | 58.400 | 3430 | 2140 | 1.08 | +2.5° | `institutionalLock` |
| 1812 | 60.400 | 3550 | 2180 | 1.16 | 0° | `atlasDrift` |
| 1872 | 62.400 | 3640 | 2200 | 1.08 | 0° | `atlasDrift` |
| 1907 | 63.567 | 3720 | 2190 | 0.96 | 0° | `ceremonial` |
| 1908 | 63.600 | 3725 | 2190 | 0.96 | 0° | `ceremonial` |
| 1938 | 64.600 | 3820 | 2180 | 1.04 | 0° | `restrainedImpact` |
| 1974 | 65.800 | 3970 | 2170 | 1.14 | -2.0° | `restrainedImpact` |
| 2016 | 67.200 | 4090 | 2140 | 1.08 | -3.0° | `ceremonial` |
| 2047 | 68.233 | 4160 | 2200 | 0.95 | -1.0° | `atlasDrift` |
| 2084 | 69.467 | 4300 | 2250 | 0.72 | 0° | `linearTravel` |
| 2085 | 69.500 | 4305 | 2252 | 0.72 | 0° | `linearTravel` |
| 2115 | 70.500 | 4700 | 2350 | 0.78 | -2.0° | `linearTravel` |
| 2145 | 71.500 | 5140 | 2530 | 0.82 | -4.0° | `atlasDrift` |
| 2171 | 72.367 | 5480 | 2690 | 0.88 | -5.0° | `atlasDrift` |

La duplicación `1907/1908` y `2084/2085` es intencional: evita discontinuidad al cambiar de scene range. Los valores deben quedar prácticamente coincidentes.

### 4.5 Límites de cámara

- Desplazamiento aparente máximo ordinario: `≤ 28 px/frame`; pico permitido en viaje oceánico: `≤ 42 px/frame`.
- Cambio de zoom: `≤ 1.5%` por frame.
- Cambio de rotación: `≤ 0.35°` por frame.
- No realizar zoom y rotación máximos en el mismo frame.
- No introducir focus blur ni motion blur en el benchmark.

---

## 5. Memory line / Path Registry

### 5.1 Identidad persistente

Debe existir exactamente una instancia React de `MemoryLine` en la composición, montada por encima de las escenas y por debajo de labels estabilizados. Su `key` y su `pathId` no cambian durante el film.

```text
pathId = memoryLine.main
```

Las escenas no crean ni destruyen la línea. Sólo declaran estados semánticos y cues para transformarla.

### 5.2 Registro propuesto

```ts
type PathId =
  | 'memoryLine.main'
  | 'colonialRoute'
  | 'civicTimeline'
  | 'woundedTimeline'
  | 'stadiumBoundary'
  | 'southAtlanticRoute'
  | 'maradonaThread'
  | 'messiThread'
  | 'nationalOutline';

type MemoryLineMode =
  | 'civicTimeline'
  | 'woundedTimeline'
  | 'stadiumBoundary'
  | 'southAtlanticIsobar'
  | 'southAtlanticRoute';

interface NormalizedPathGeometry {
  id: PathId;
  points: readonly (readonly [number, number])[];
  closed: false;
  sampleCount: 96;
}

interface PathStateCue {
  frame: number;
  mode: MemoryLineMode;
  geometryId: PathId;
  visibleRanges: readonly (readonly [number, number])[]; // progreso 0..1
  strokeToken: string;
  opacity: number;
  morphEase: EaseId;
}
```

### 5.3 Regla topológica

La memory line siempre es un path abierto de 96 muestras normalizadas. Para el estadio, recorre aproximadamente 315° de la elipse y deja una entrada/salida; `FootballPitch` completa visualmente el perímetro con líneas secundarias. Esto evita un morph inestable entre path abierto y cerrado.

No cambiar el número de subpaths durante un morph. Las interrupciones del período se producen mediante `visibleRanges`, máscaras y dash logic, no rompiendo el `d` en múltiples objetos.

### 5.4 Estados del benchmark

| Frames | Modo | Función visual |
|---|---|---|
| `1722–1751` | `civicTimeline` | Baseline heredada de Scene 09; deja de responder a civic nodes. |
| `1752–1811` | transición a `woundedTimeline` | Segmentación progresiva e intercepción institucional. |
| `1812–1871` | `woundedTimeline` | Línea discontinua; missing nodes permanecen como huecos. |
| `1872–1907` | wounded → stadium seed | Un rectángulo superviviente se regulariza sin borrar el contexto. |
| `1908–1973` | `stadiumBoundary` | La línea traza el acceso y parte de la elipse del estadio. |
| `1974–2046` | `stadiumBoundary` | Estable durante la celebración; gold sólo pertenece a trophy/impact, no a toda la línea. |
| `2047–2084` | stadium → isobar | La salida este de la elipse se alarga; el tramo oeste queda como contorno herido. |
| `2085–2144` | `southAtlanticIsobar` | Curva meteorológica/cartográfica; comienza el viaje. |
| `2145–2171` | `southAtlanticRoute` | La isobar adquiere dirección de ruta hacia Malvinas. |

### 5.5 Interpolación

- Las 96 muestras de cada estado se calculan/cargan una vez a nivel de módulo.
- Por frame se interpola cada par de puntos; no usar medición DOM (`getTotalLength`, `getPointAtLength`) durante render.
- La curva final se reconstruye como path suave determinista.
- Clamp obligatorio antes y después de cada morph.
- El benchmark usa `NormalizedPathGeometry` + interpolación punto a punto interna. No usar `@remotion/paths` para esta primera implementación; así la topología de 96 muestras y el tratamiento de visible ranges permanecen completamente explícitos.

### 5.6 Handoff semántico

`SceneBridge` recibe el estado saliente y entrante, pero ambos apuntan a `memoryLine.main`. Un bridge puede:

- interpolar geometría;
- cambiar stroke/opacity;
- animar `visibleRanges`;
- transferir la misma curva a otro componente como guía secundaria;
- nunca montar una segunda memory line encima para ocultar un reemplazo.

---

## 6. Scene data model

Las interfaces siguientes son contrato, no implementación final.

```ts
type GlobalFrame = number & {readonly __brand: 'GlobalFrame'};
type LocalFrame = number & {readonly __brand: 'LocalFrame'};

interface FrameRange {
  start: GlobalFrame; // inclusive
  end: GlobalFrame;   // inclusive
}

interface PaletteState {
  paper: string;
  primary: string;
  structural: string;
  subdued: string;
  gold: string;
  goldAllowed: boolean;
  saturation: number; // 0..1, aplicado a tokens, no filter CSS global
}

type LabelKind = 'date' | 'event' | 'anthem' | 'map' | 'legal';
type LabelMode = 'world' | 'hybrid' | 'stabilized';

interface LabelCue {
  id: string;
  kind: LabelKind;
  text: readonly string[];
  range: FrameRange;
  enterFrames: number;
  exitFrames: number;
  anchor: readonly [number, number];
  mode: LabelMode;
  align: 'left' | 'center' | 'right';
  maxWidthPx: number;
}

interface HistoricalLayerState {
  id: string;
  range: FrameRange;
  opacity: number;
  parallaxLayer: number;
  state:
    | 'active'
    | 'controlled'
    | 'censored'
    | 'missing'
    | 'context-only'
    | 'reopening';
}

interface TransitionState {
  id: string;
  range: FrameRange;
  fromGeometry: string;
  toGeometry: string;
  progressEase: EaseId;
  preserveIds: readonly string[];
}

interface AudioAnchor {
  id: string;
  frame: GlobalFrame;
  role: 'scene-entry' | 'internal-transform' | 'geometry-transform' | 'next-scene';
  mandatory: boolean;
}

interface SceneSpec {
  id: string;
  range: FrameRange;
  cameraPathId: string;
  paletteCues: readonly {frame: GlobalFrame; value: PaletteState}[];
  labels: readonly LabelCue[];
  pathCues: readonly PathStateCue[];
  historicalLayers: readonly HistoricalLayerState[];
  transitions: readonly TransitionState[];
  audioAnchors: readonly AudioAnchor[];
}
```

### 6.1 Reglas del modelo

- Todos los datos editoriales usan frames globales.
- Cada composición crea un `GlobalFrameProvider`.
- En master: `globalFrame = useCurrentFrame()`.
- En benchmark: `globalFrame = useCurrentFrame() + 1722`.
- Los ranges son inclusivos en datos. Para `<Sequence>`, duración = `end - start + 1`.
- No guardar segundos como autoridad; sólo se derivan para UI/documentación.
- Ningún component recibe simultáneamente `localFrame` y `globalFrame`.
- Los strings visibles se centralizan en `timeline/labels.ts`; no se escriben dentro de JSX de escena.

---

## 7. Audio contract

### 7.1 Fuente única

```text
assets/Lealtad_y_Destino_2026-09-26T210416.wav
```

- Volumen: `1`.
- Playback rate: `1`.
- Sin fade agregado.
- Sin normalización.
- Sin recorte físico.
- Sin loop.
- Sin SFX audibles en esta fase.

### 7.2 Master composition

El master monta el audio desde el frame 0 y reproduce los 3150 frames completos.

### 7.3 Benchmark composition

El benchmark usa el mismo archivo y selecciona el rango de fuente en tiempo de reproducción:

```text
trimBefore = 1722
trimAfter  = 2172   // end-exclusive
duration   = 450
```

Esto reproduce exactamente `57.4 s ≤ t < 72.4 s`. `trimBefore`/`trimAfter` son offsets temporales de Remotion; no generan un WAV nuevo.

### 7.4 Anchors obligatorios del benchmark

| Frame global | Local | Tiempo | Rol |
|---:|---:|---:|---|
| 1722 | 0 | 57.400 | Entrada a capa 1976. |
| 1812 | 90 | 60.400 | Transformación interna de dictadura/represión. |
| 1908 | 186 | 63.600 | Nace geometría de cancha/1978. |
| 2085 | 363 | 69.500 | Estadio → Atlántico Sur/Malvinas. |
| 2172 | 450 | 72.400 | Reconexión cívica; fuera del benchmark. |

Los cambios mayores deben aterrizar exactamente en estos frames. Los sub-bloques intermedios organizan animación, pero no compiten con estos anchors.

### 7.5 Compatibilidad Remotion

La implementación debe agregar como dependencia directa y usar `Audio` de `@remotion/media@4.0.529`. Debe usar `trimBefore` y `trimAfter`, no los nombres deprecados `startFrom`/`endAt`. Todos los paquetes Remotion deben permanecer en la misma versión exacta que el proyecto.

Referencias técnicas oficiales:

- [Timing and trimming](https://www.remotion.dev/docs/timing)
- [Remotion fundamentals](https://www.remotion.dev/docs/the-fundamentals)

---

## 8. Benchmark timeline — global frames 1722–2171

### 8.1 Regla de rango

- Todos los rangos de esta sección son **inclusivos**.
- El timestamp derecho mostrado en las tablas descriptivas es el primer instante fuera del bloque.
- `local = global - 1722`.
- En cada frame se renderiza el estado absoluto; no hay side effects acumulativos.

### 8.2 Palette tokens del benchmark

```text
paperIvory        #F5F0E6
paperWarm         #F7F3EA
paperCool         #F2EFE7
skyBlue           #75B6D9
skyBlueMid        #8BC4E0
skyBluePale       #A5D3E8
deepBlue          #174A73
deepBlueSoft      #245B82
goldMuted         #C49A45
goldLight         #D2AE61
grayBlue          #A9B8BE
grayBluePale      #CCD3D1
```

No crear un color rojo partidario, negro absoluto ni un gold alternativo para el bloque político.

### 8.3 Resumen de micro-bloques

| Bloque | Global | Local | Tiempo global | Frames | Función |
|---:|---:|---:|---:|---:|---|
| A | 1722–1751 | 0–29 | 57.400–58.400 | 30 | Entrada: control militar ocupa instituciones. |
| B | 1752–1791 | 30–69 | 58.400–59.733 | 40 | Cierre de red cívica; aparece lockup de dictadura. |
| C | 1792–1811 | 70–89 | 59.733–60.400 | 20 | Intercepción/censura prepara transformación interna. |
| D | 1812–1841 | 90–119 | 60.400–61.400 | 30 | Terrorismo de Estado como control institucional y ausencia. |
| E | 1842–1871 | 120–149 | 61.400–62.400 | 30 | Vacío, vigilancia y daño social sostenido. |
| F | 1872–1907 | 150–185 | 62.400–63.600 | 36 | Rectángulo superviviente se regulariza hacia cancha. |
| G | 1908–1937 | 186–215 | 63.600–64.600 | 30 | Nace cancha/estadio dentro del atlas herido. |
| H | 1938–1973 | 216–251 | 64.600–65.800 | 36 | Entra `1978`; crece celebración pública. |
| I | 1974–2015 | 252–293 | 65.800–67.200 | 42 | Acción deportiva y gol; contexto exterior permanece. |
| J | 2016–2046 | 294–324 | 67.200–68.233 | 31 | Trofeo, anthem y gold contenido. |
| K | 2047–2084 | 325–362 | 68.233–69.500 | 38 | Pullback; estadio → elipse/isobar. |
| L | 2085–2114 | 363–392 | 69.500–70.500 | 30 | Anchor Atlántico Sur; gold desaparece. |
| M | 2115–2144 | 393–422 | 70.500–71.500 | 30 | Viaje cartográfico sobre el océano. |
| N | 2145–2171 | 423–449 | 71.500–72.400 | 27 | Entrada a Malvinas; salida preparada para frame 2172. |

Los picos secundarios `1791`, `1896–1905`, `2016`, `2043`, `2106` y `2127` se usan como acentos internos observados en el master, sin sustituir los anchors obligatorios del animatic.

### 8.4 Bloque A — 1722–1751 / entrada al control militar

**Tiempo musical:** comienza exactamente en el anchor `1722`. La energía cae respecto del bloque político anterior; no hay golpe heroico.  
**Cámara:** interpola de `(3340,2110,1.00,+4.5°)` hacia el keyframe de 1752. El horizonte se corrige lentamente, como imposición de orden.  
**Objetos visibles:**

- fragmentos de ciudad/instituciones heredados de Scene 09;
- Congreso lineal, radio/broadcast marks, ministerio y dos nodos cívicos;
- rutas políticas previas en opacidad `0.16–0.24`, confinadas a bordes;
- primeras líneas rígidas de `InstitutionalControlGrid`.

**Texto:** `1976` pequeño, anchor `(3370,1940)`, modo `hybrid`; opacity `0→0.72` entre 1730–1742. Nunca supera 64 px de alto aparente.  
**Memory line:** continúa como `civicTimeline`; no cambia de instancia. Opacity `0.78→0.66`. Dos puntos institucionales dejan de responder, pero la geometría todavía no se rompe.  
**Transformación:** líneas militares paralelas entran desde anchors institucionales existentes; no desde fuera del mapa como invasión abstracta.  
**Color:** paper `paperCool`; deep blue desaturado; control grid `grayBlue` a opacity `0.20→0.48`; gold `0`.  
**Profundidad:** ciudad en layer 20, control grid 30, memory line 40, texto 70.  
**Salida:** en 1751 la cámara aún se mueve; frame 1752 continúa la misma curva sin reset.

### 8.5 Bloque B — 1752–1791 / cierre de la red cívica

**Tiempo musical:** pulso bajo controlado; el máximo secundario de 1791 acompaña la última intercepción, no una celebración.  
**Cámara:** de keyframe 1752 hacia 1812; zoom `1.08→1.16`, rotación `+2.5°→0°`.  
**Objetos visibles:** el control grid encierra Congreso, broadcast, universidad/unión y calle; shutters pálidos comienzan a cubrir reglas de periódico y ondas de radio.  
**Texto:** lockup estabilizado entra en 1760–1774:

```text
1976–1983
DICTADURA
```

Anchor `(3500,1970)`, alineación izquierda, ancho máximo 460 px. `1976` marginal del bloque A se integra como fecha superior y deja de ser instancia separada en un crossfade de 10 frames.  
**Memory line:** morph `civicTimeline → woundedTimeline` al `45%`; `visibleRanges` pasa de `[0,1]` a tres tramos todavía cercanos. Stroke aparente `3 px`, `deepBlueSoft`.  
**Transformación:** primeras intercepciones rectangulares se alinean con la grilla; evitar barras negras o diagonales agresivas.  
**Color/opacidad:** instituciones `0.52`; crowd remnants `0.14`; control grid `0.55`; background luminance alta.  
**Salida:** en 1791 un relay visual cierra el último civic node accesible y prepara la censura del bloque C.

### 8.6 Bloque C — 1792–1811 / censura e intercepción

**Tiempo musical:** breve preparación al anchor 1812.  
**Cámara:** continúa hacia `controlledCenter`; casi sin rotación al final.  
**Objetos visibles:** `CensorshipMask` borra fragmentos de texto/periódico de izquierda a derecha; scan arcs recorren sólo dos zonas, nunca toda la pantalla.  
**Texto:** lockup `1976–1983 / DICTADURA` estable; sin nuevo copy. Opacity `0.92`.  
**Memory line:** llega a `woundedTimeline`; los huecos se obtienen por máscara. La curva geométrica subyacente continúa completa.  
**Transformación:** dos civic nodes bajan a opacity `0.20`; no desaparecen todavía.  
**Color:** `skyBlue` casi ausente (`≤0.20` en rutas); `grayBluePale` domina áreas controladas; gold prohibido.  
**Profundidad:** máscaras en layer 35, por debajo de la memory line para que la interrupción sea legible como daño aplicado a ella.  
**Salida:** frame 1811 contiene los nodos a punto de desaparecer; 1812 ejecuta el cambio interno.

### 8.7 Bloque D — 1812–1841 / transformación interna: terrorismo de Estado

**Tiempo musical:** cambio obligatorio exactamente en 1812. Debe percibirse por reducción/retención, no por impacto épico.  
**Cámara:** deriva lenta de `(3550,2180,1.16,0°)` hacia el siguiente tramo; sensación de espacio controlado.  
**Objetos visibles:**

- `MissingNodeField` elimina de forma autorada 3 nodos entre 1812–1832;
- quedan anillos de coordenada vacíos a opacity `0.30`;
- líneas de represión nacen y regresan al state/security grid;
- figuras públicas se retiran hacia bordes; no hay víctimas individualizadas;
- surveillance boxes se fijan sobre instituciones, no sobre rostros.

**Texto:** `DICTADURA` permanece; no aparece `TERRORISMO DE ESTADO` como copy visible bajo la resolución §2.2.  
**Memory line:** tres visible ranges; el tramo central cae a opacity `0` durante 1812–1824. Los extremos sobreviven.  
**Transformación:** el vacío debe leerse como ausencia precisa, no como partícula que se evapora.  
**Color/opacidad:** control lines `0.58`; empty rings `0.30`; edificios `0.26–0.40`; papel `paperCool`; gold `0`.  
**Profundidad:** missing rings por encima de cartografía pero debajo de texto.  
**Salida:** el centro de la composición queda más vacío que al inicio; la cámara inicia pullback imperceptible.

### 8.8 Bloque E — 1842–1871 / daño sostenido y espacio público vacío

**Tiempo musical:** textura expuesta y silencios internos; ningún nuevo anchor.  
**Cámara:** zoom `≈1.13→1.08`, desplazamiento suave hacia `woundedVoid`.  
**Objetos visibles:** grid controlado, shutters estáticos, dos scan arcs lentos, anillos vacíos, Congreso parcialmente clausurado, calles sin crowd field.  
**Texto:** lockup empieza a salir entre 1850–1871: opacity `0.92→0.15`, tracking aumenta sólo 2 px; sin scale-out.  
**Memory line:** sostiene interrupciones; opacity global `0.62→0.54`.  
**Transformación:** un rectángulo residual en el borde inferior derecho gana regularidad métrica. Es el futuro seed de cancha, todavía no deportivo.  
**Color:** contraste mínimo del benchmark; deep blue no supera aproximadamente 14% del área.  
**Profundidad:** el rectángulo seed está en layer 30, misma capa que la grilla institucional para hacer creíble la derivación.  
**Salida:** lockup casi ausente; seed visible a `0.28`.

### 8.9 Bloque F — 1872–1907 / grilla herida hacia seed de cancha

**Tiempo musical:** ascenso controlado hacia anchor 1908; acentos secundarios 1896–1905 regularizan la geometría.  
**Cámara:** pullback a `(3720,2190,0.96,0°)`; aumenta espacio negativo.  
**Objetos visibles:** el rectángulo seed se expande; dos líneas institucionales se convierten en touchline y halfway guide. Missing nodes, censorship bars y límites de control continúan fuera del rectángulo.  
**Texto:** todo el lockup de dictadura llega a opacity `0` antes de 1892. No aparece `1978` todavía.  
**Memory line:** sólo un tramo sobreviviente se endereza, entra por el oeste del rectángulo y empieza a curvarse. La máscara wounded sigue visible en su cola.  
**Transformación geométrica:** `controlledRectangle → pitchGuide`, progreso `0→0.92`; completar exactamente en 1908, no antes.  
**Color:** el interior del rectángulo recupera `skyBluePale` desde opacity `0.08→0.30`; exterior permanece gray-blue. Gold `0`.  
**Profundidad:** seed por encima de grid, debajo de memory line.  
**Salida:** frame 1907 y 1908 deben diferir sólo por el último 8% de cierre y el inicio del estadio; nada desaparece.

### 8.10 Bloque G — 1908–1937 / nace el estadio dentro del atlas herido

**Tiempo musical:** anchor obligatorio 1908. La energía deportiva emerge sin borrar el pedal sombrío.  
**Cámara:** desde `(3725,2190,0.96,0°)` hacia `stadiumWest`; leve push, sin corte.  
**Objetos visibles:** `FootballPitch` completa touchlines, center line y círculo; latitude curves se arquean como bowl de estadio; crowd strokes todavía al `0.10–0.22`. El exterior conserva missing rings y censorship bars.  
**Texto:** `1978` comienza a entrar en 1928, opacity `0→0.35`; no hay anthem todavía.  
**Memory line:** morph hacia open stadium ellipse `0→0.45`; recorre la entrada oeste y parte del perímetro.  
**Transformación:** grid rectangular y estadio comparten exactamente los mismos cuatro corner anchors.  
**Color/opacidad:** interior `skyBluePale 0.36→0.52`; pitch `deepBlueSoft 0.55`; exterior `grayBlue 0.28`; gold `0`.  
**Parallax:** pitch y grid factor 1; crowd factor 1.02; exterior no se aplana.  
**Salida:** en 1937 el estadio es inequívoco, pero la fecha aún no domina.

### 8.11 Bloque H — 1938–1973 / 1978 y celebración pública

**Tiempo musical:** crecimiento rítmico; sin falso cambio de régimen.  
**Cámara:** push/track hacia stadium center; zoom `1.04→1.14`, rotación `0→-2°`.  
**Objetos visibles:** stadium bowl se completa; crowd pattern sube a `0.42`; flags/crowd strokes sólo dentro del estadio. El atlas herido sigue legible alrededor.  
**Texto:**

- `1978`: opacity `0.35→1` entre 1938–1950;
- `ARGENTINA · CAMPEÓN DEL MUNDO`: entra 1950–1970, max 460 px, deep blue;
- posiciones estabilizadas con anchor `(3900,1920)`.

**Memory line:** alcanza open stadium ellipse completa en 1956 y se mantiene sky blue; no recibe gold.  
**Transformación:** una `RouteLine` independiente prepara la trayectoria de pelota sobre la grilla.  
**Color:** saturación aumenta sólo dentro de pitch/stadium; exterior no cambia. Gold `0`.  
**Profundidad:** crowd 45, ball route 48, memory line 40, texto 70.  
**Salida:** ball marker listo en punto inicial; celebración todavía no llegó al máximo.

### 8.12 Bloque I — 1974–2015 / acción deportiva contenida

**Tiempo musical:** pulso deportivo activo; el movimiento concluye exactamente en el acento 2016.  
**Cámara:** arco editorial poco profundo hacia `(4090,2140)`; rotación llega gradualmente a `-3°`.  
**Objetos visibles:** ball route cruza el pitch; crowd strokes responden en ondas de baja frecuencia; no hay retrato de jugador. Trophy outline permanece a opacity `0.08` hasta el final.  
**Texto:** fecha y evento se mantienen. Anthem:

```text
CORONADOS
DE GLORIA VIVAMOS
```

Primera línea entra 1988–1998; segunda 1998–2010. Ambas deep blue, nunca gold.  
**Memory line:** estable como boundary; pequeños pulsos de opacity `±0.06`, sin deformación elástica.  
**Transformación:** `FootballTrajectory` llega al goal anchor en 2015; el impacto visual se reserva para 2016.  
**Color/opacidad:** pitch/crowd sky blue hasta `0.70`; exterior herido `0.18–0.28`; gold todavía `0`.  
**Profundidad:** el estadio no tapa missing nodes exteriores.  
**Salida:** frame 2015 contiene contacto inminente; no anticipar trophy gold.

### 8.13 Bloque J — 2016–2046 / trofeo y gold restringido

**Tiempo musical:** impacto secundario fuerte en 2016; máximo adicional alrededor de 2043.  
**Cámara:** pequeña elevación ceremonial; zoom `1.08→0.96` hacia el inicio del pullback.  
**Objetos visibles:** goal-impact ring una sola vez; trophy simplificado se dibuja desde eje vertical; crowd llega a máximo `0.56`, sin partículas.  
**Texto:** anthem plenamente legible; event label estable hasta 2038 y empieza a salir después.  
**Memory line:** continúa sky blue. El gold no recorre toda la boundary. Sólo trophy y goal ring usan `goldMuted/goldLight`.  
**Transformación:** trophy stroke draw 2016–2032; fill/hatch gold máximo `0.82`; ring se desvanece antes de 2034.  
**Color:** interior saturado, exterior desaturado; gold cubre menos de 5% del frame.  
**Profundidad:** trophy layer 52; crowd detrás; contexto exterior aún visible en al menos tres lados del estadio.  
**Salida:** en 2046 trophy empieza a perder énfasis y la cámara ya revela la elipse completa.

### 8.14 Bloque K — 2047–2084 / estadio hacia elipse e isobar

**Tiempo musical:** energía deportiva filtra hacia aire/viento; prepara anchor 2085.  
**Cámara:** pullback a `(4300,2250,0.72,0°)`; rotación vuelve a cero.  
**Objetos visibles:** crowd strokes se alinean con tangentes de la elipse; trophy y event text salen; mainland/cartographic marks reaparecen en los bordes.  
**Texto:** anthem, fecha y evento salen entre 2047–2068. En 2084 no queda copy deportivo.  
**Memory line:** el tramo este de stadium ellipse se extiende; morph `stadiumBoundary → southAtlanticIsobar` alcanza `0.55` en 2084. El tramo oeste queda como evidencia del estadio/contexto.  
**Transformación geométrica:**

- stadium ellipse aspect ratio `1.75→2.55`;
- crowd tangents → wind hatching;
- trophy vertical axis → longitude guide;
- touchlines bajan opacity `0.62→0.14`, no se apagan juntas.

**Color:** gold cae a `0` antes de 2070; sky blue se enfría hacia `skyBluePale`; exterior gray-blue gana claridad cartográfica.  
**Profundidad:** el estadio se integra a cartografía layer 20; ya no actúa como objeto foreground.  
**Salida:** frame 2084 es una elipse ambigua estadio/isobar. Frame 2085 completa el cambio semántico.

### 8.15 Bloque L — 2085–2114 / anchor Atlántico Sur

**Tiempo musical:** cambio obligatorio 2085; la energía baja y se abre espacio. Acento 2106 enfatiza el primer tick oceánico, no un impacto bélico.  
**Cámara:** inicia travel hacia `(4700,2350,0.78,-2°)`.  
**Objetos visibles:** outline parcial del este/sur de Argentina, isobars, longitude/latitude ticks, etiqueta pequeña `OCÉANO ATLÁNTICO SUR`, primeras wind lines. No barcos ni soldados todavía.  
**Texto:** sin título histórico principal. El topónimo oceánico es `world` mode y opacity máxima `0.42`.  
**Memory line:** completa morph a `southAtlanticIsobar` en 2098; luego empieza a abrirse como ruta.  
**Transformación:** stadium crowd → wind hatching termina en 2108; pitch residual queda a opacity `0.05` y se elimina visualmente por sobreimpresión cartográfica, no por fade total de pantalla.  
**Color:** paperCool; pale sky blue; deep blue softened; gold `0`.  
**Profundidad:** ocean field layer 20, route 40, labels 60/70.  
**Salida:** dirección sureste inequívoca, todavía sin declarar Malvinas.

### 8.16 Bloque M — 2115–2144 / viaje oceánico

**Tiempo musical:** textura solemne y viento; acento 2127 activa un coordinate tick.  
**Cámara:** linear travel hasta `(5140,2530,0.82,-4°)`.  
**Objetos visibles:** mainland queda hacia borde superior/izquierdo; tres isobars, dos coordinate labels y wind lines. Una naval/air route secundaria puede empezar como dotted guide a opacity `≤0.22`, sin vehículo todavía.  
**Texto:** `OCÉANO ATLÁNTICO SUR` se desplaza con el mundo; `1982` empieza a pre-revelarse sólo desde 2138 a opacity `≤0.18`.  
**Memory line:** `southAtlanticRoute`; travel head avanza del 8% al 32% del tramo oceánico.  
**Transformación:** isobar principal adquiere dash direccional muy sutil; no convertirse en flecha agresiva.  
**Color:** saturación muy baja; map marks `deepBlueSoft 0.36`; wind `skyBluePale 0.30`; gold `0`.  
**Profundidad:** wind layer 10/20 para permitir que la memory line permanezca claramente encima.  
**Salida:** en 2144 la ruta ha establecido distancia; el título puede entrar en el bloque N.

### 8.17 Bloque N — 2145–2171 / entrada a Malvinas

**Tiempo musical:** comienzo solemne del bloque; no existe resolución dentro del benchmark.  
**Cámara:** atlas drift hacia `malvinasApproach (5480,2690,0.88,-5°)`.  
**Objetos visibles:** hatching insular empieza a resolver una silueta simplificada a opacity `0→0.28`; coordinate rings y wind permanecen. No soldier silhouettes todavía dentro del benchmark.  
**Texto:**

- `1982`: entra 2145–2155, stabilized, opacity `0→0.90`;
- `GUERRA DE MALVINAS`: entra 2154–2168, opacity `0→0.82`;
- `ISLAS MALVINAS · SOBERANÍA DISPUTADA` queda para el tramo posterior a 2171, cuando la geografía sea legible.

**Memory line:** route head avanza hasta aproximadamente 48%; no se detiene todavía. La interrupción en océano pertenece al desarrollo posterior de Scene 12.  
**Transformación:** ninguna forma deportiva sobrevive como objeto; su genealogía persiste sólo en la curva/isobar de la memory line.  
**Color:** el estado más frío del benchmark; paper sigue claro, nunca gris oscuro. Gold `0`.  
**Profundidad:** islands layer 20, route 40, title 70.  
**Salida exacta en 2171:** título de 1982 legible, islas apenas emergentes, ruta activa, control grid de dictadura ya convertido en memoria cartográfica. No mostrar `1983`, ballot, Congreso reabierto ni sky-blue restoration. Frame 2172 podrá iniciar esa reconexión más adelante sin reconstruir el atlas.

---

## 9. Required reusable components

Las APIs siguientes fijan responsabilidad. Los nombres de props pueden cambiar sólo si conservan exactamente el mismo contrato.

### 9.1 `AtlasCanvas`

```ts
interface AtlasCanvasProps {
  worldWidth: 7680;
  worldHeight: 4320;
  viewportWidth: 1920;
  viewportHeight: 1080;
  camera: CameraState;
  paperColor: string;
  children: React.ReactNode;
}
```

**Responsabilidad:** crear el viewport, clip exterior y un único `<svg>`/world group transformado por cámara.  
**No debe:** evaluar timeline, montar audio, conocer escenas, crear textura aleatoria.

### 9.2 `CameraPath`

```ts
interface CameraPathProps {
  spec: CameraPathSpec;
  globalFrame: GlobalFrame;
  children: (camera: CameraState) => React.ReactNode;
}
```

**Responsabilidad:** validar keyframes, elegir segmento, interpolar x/y/zoom/rotación y exponer `CameraState`.  
**No debe:** leer componentes hijos ni aplicar correcciones ad hoc por escena.

### 9.3 `CartographicGrid`

```ts
interface CartographicGridProps {
  mode: 'institutional' | 'controlled' | 'pitch-seed' | 'ocean';
  bounds: {x: number; y: number; width: number; height: number};
  density: number;
  distortion: number;
  opacity: number;
  strokeToken: 'grid' | 'gridSubdued' | 'oceanGrid';
  transitionProgress?: number;
}
```

**Responsabilidad:** una sola geometría de grilla capaz de cambiar de función sin desmontarse.  
**Benchmark:** `institutional → controlled → pitch-seed → ocean`.

### 9.4 `HistoricalDate`

```ts
interface HistoricalDateProps {
  year: string;
  anchor: readonly [number, number];
  mode: 'hybrid' | 'stabilized';
  opacity: number;
  emphasis: 'minor' | 'major';
  colorToken: 'deepBlue' | 'skyBlue' | 'gold';
}
```

**Responsabilidad:** render de fechas editoriales con diacríticos, métricas y estabilización consistentes.  
**Regla benchmark:** `1976` siempre `minor`; `1978` puede ser `major` pero deep blue; `1982` `major` solemne. Ninguna fecha del benchmark usa gold.

### 9.5 `EventLabel`

```ts
interface EventLabelProps {
  lines: readonly string[];
  anchor: readonly [number, number];
  mode: LabelMode;
  align: 'left' | 'center' | 'right';
  opacity: number;
  maxWidthPx: number;
  tone: 'standard' | 'subdued' | 'solemn';
}
```

**Responsabilidad:** copy breve de eventos.  
**No debe:** dibujar cards, backgrounds, borders ni drop shadows.

### 9.6 `AnthemPhrase`

```ts
interface AnthemPhraseProps {
  lines: readonly string[];
  anchor: readonly [number, number];
  state: 'entering' | 'held' | 'exiting' | 'suspended' | 'resolved';
  opacity: number;
  revealProgress: number;
  align: 'left' | 'center' | 'right';
}
```

**Responsabilidad:** tipografía monumental pero refinada; reveal por máscara/linea, no typewriter.  
**Benchmark:** sólo `CORONADOS / DE GLORIA VIVAMOS`, siempre deep blue.

### 9.7 `MemoryLine`

```ts
interface MemoryLineProps {
  pathId: 'memoryLine.main';
  globalFrame: GlobalFrame;
  registry: PathRegistry;
  cues: readonly PathStateCue[];
  strokeWidthPx: number;
  debug?: boolean;
}
```

**Responsabilidad:** mantener identidad, morph, visible ranges, stroke y route head.  
**No debe:** desmontarse en un scene boundary ni recibir un raw `d` desde una escena.

### 9.8 `RouteLine`

```ts
interface RouteLineProps {
  geometryId: PathId;
  progress: number;
  opacity: number;
  style: 'solid' | 'dotted' | 'interrupted' | 'directional';
  colorToken: 'skyBlue' | 'deepBlue' | 'grayBlue' | 'gold';
  strokeWidthPx: number;
  marker?: 'none' | 'ball' | 'routeHead';
}
```

**Responsabilidad:** rutas secundarias, incluyendo trayectoria de pelota 1978 y dotted guide oceánica.  
**No debe:** usarse como sustituto de `MemoryLine`.

### 9.9 `TerritoryHighlight`

```ts
interface TerritoryHighlightProps {
  geometryId: string;
  status: 'historical' | 'modern' | 'disputed' | 'claimed';
  fillOpacity: number;
  strokeOpacity: number;
  hatch?: 'none' | 'light' | 'claim';
  labelId?: string;
}
```

**Responsabilidad:** garantizar que status jurídico/cartográfico no dependa sólo de color.  
**Benchmark:** la silueta insular comienza a aparecer, pero el label de soberanía queda después de 2171.

### 9.10 `FootballPitch`

```ts
interface FootballPitchProps {
  geometryId: 'pitch1978';
  constructionProgress: number;
  stadiumProgress: number;
  crowdIntensity: number;
  contextOpacity: number;
  lineOpacity: number;
  transitionToIsobarProgress: number;
}
```

**Responsabilidad:** pitch, center circle, stadium bowl y crowd pattern. Debe exponer geometry anchors usados por `CartographicGrid` y `MemoryLine`.  
**No debe:** crear fondo independiente; vive dentro del atlas herido.

### 9.11 `PaperTexture`

```ts
interface PaperTextureProps {
  seed: 1810;
  worldOpacity: number;
  screenGrainOpacity: number;
  fiberCount: number;
}
```

**Responsabilidad:** fibras/imperfecciones deterministas, generadas una vez.  
**Límites:** `worldOpacity ≤ 0.035`, `screenGrainOpacity ≤ 0.018`; sin `feTurbulence` animado.

### 9.12 `SceneBridge`

```ts
interface SceneBridgeProps {
  id: string;
  range: FrameRange;
  globalFrame: GlobalFrame;
  outgoingLayerIds: readonly string[];
  incomingLayerIds: readonly string[];
  preservedObjectIds: readonly string[];
  geometryProgress: number;
  children: React.ReactNode;
}
```

**Responsabilidad:** solapamiento de capas y handoff de geometría.  
**Benchmark:** preserva `memoryLine.main`, `atlas.grid.main`, `paper.world` y coordinate system en 1907/1908 y 2084/2085.

### 9.13 Componentes adicionales justificados

#### `InstitutionalControlGrid`

Necesario para separar state/security control de la grilla cartográfica general. Props mínimas: `controlProgress`, `institutionLocks`, `censorshipProgress`, `opacity`.

#### `MissingNodeField`

Necesario para que desapariciones/ausencias sean un set autorado y verificable, no partículas aleatorias. Props: `nodes`, `removedAtFrame`, `ringOpacity`, `globalFrame`.

#### `OceanField`

Necesario para isobars, wind lines y coordinate ticks con densidad controlada. Props: `bounds`, `isobarProgress`, `windProgress`, `coordinateOpacity`.

#### `MasterAudio`

Centraliza source, `trimBefore`, `trimAfter`, volumen y checksum esperado. Ninguna escena importa audio.

#### `GlobalFrameProvider`

Evita cálculos inconsistentes de offset. Expone únicamente `globalFrame`, `localFrame` y `fps`.

---

## 10. Animation rules

### 10.1 Regla general

Cada valor visual debe ser una función determinista del frame. Quedan prohibidos:

- `Math.random()`;
- timers;
- estado React que acumule animación;
- medición DOM dependiente del orden de render;
- física sin seed o con duración variable;
- assets remotos;
- animaciones CSS autónomas (`animation`, `transition`) no gobernadas por frame.

### 10.2 Stroke drawing

- Longitudes calculadas una vez y guardadas como metadata.
- `strokeDasharray = pathLength` y `strokeDashoffset = pathLength × (1-progress)`.
- Caps redondeados para rutas; caps rectos para control institucional/censura.
- Clamp de progress `0..1`.
- No dibujar más de seis paths primarios simultáneos en el benchmark.

### 10.3 Path morphing

- Mínimo recomendado: 24 frames; morphs principales: 30–60 frames.
- Paths de una misma morph family: 96 puntos y misma topología.
- No morph de shape cerrada a abierta; usar stadium secondary geometry para cerrar la elipse.
- La interrupción se resuelve por visibility mask, nunca eliminando puntos.
- En 1907/1908 y 2084/2085, displacement de la memory line en el centro del viewport debe ser `< 3 px` entre frames.

### 10.4 Opacity

- Entradas ordinarias: 8–16 frames.
- Salidas ordinarias: 10–20 frames.
- Ninguna capa histórica principal pasa de `1→0` en menos de 8 frames.
- No hacer crossfade global entre escenas.
- Empty/missing nodes persisten después de desaparecer el nodo; no fade conjunto.

### 10.5 Typography

- Entrada: opacity + desplazamiento vertical máximo `8 px` + tracking máximo `4 px`.
- Sin scale pop, bounce, blur ni glow.
- Anthem: reveal por máscara de línea en 10–16 frames.
- Fechas: sólo `1978` puede superar 112 px en el benchmark; `1976` máximo 64 px; `1982` 96–112 px.
- Safe area: 8% horizontal, 7% vertical.
- El texto nunca debe competir con el tramo activo de la memory line.

### 10.6 Easing

- Usar sólo easings §4.3 para el benchmark.
- Interpolaciones siempre con extrapolation clamp.
- No spring.
- La pelota puede acelerar, pero su route progress sigue una curva monotónica.

### 10.7 Camera movement

- Se evalúa una vez por frame.
- Los keyframes son globales; scene components no añaden pan.
- Rotación acumulada benchmark entre `+4.5°` y `-5°`.
- No shake ni micro-jitter.
- El pullback de 1978 debe revelar contexto, no miniaturizar el estadio de golpe.

### 10.8 Parallax

- Diferencia máxima entre capa cartográfica y foreground: `2%`.
- Paper fiber usa `0.92`; grid `0.95`; mundo principal `1`; foreground `1.02`.
- Typography stabilized no recibe parallax visual; sólo sigue su projected anchor.

### 10.9 Line thickness

Medida aparente a 1080p:

| Tipo | Stroke |
|---|---:|
| Cartografía secundaria | `1.0–1.25 px` |
| Grilla primaria | `1.25–1.5 px` |
| Control institucional | `1.5–2.0 px` |
| Pitch/stadium | `1.75–2.25 px` |
| Memory line | `3.0 px` |
| Route head / pelota | `3.0–3.5 px` |
| Trophy | `2.25–2.75 px` |

Usar `vector-effect="non-scaling-stroke"` o compensación equivalente. Zoom no debe engordar líneas.

### 10.10 Label stabilization

- Proyectar anchor world → screen una vez.
- Contrarrotar labels `hybrid/stabilized`.
- `stabilized`: tamaño fijo en screen px.
- `hybrid`: escala aparente clamp `0.88–1.08`.
- Si el anchor sale del safe area, reubicar mediante layout predefinido en datos; no resolver colisiones dinámicamente durante render.

### 10.11 Texture

- Fiber positions generadas con PRNG seed `1810` al cargar módulo.
- Grano no cambia por frame.
- Evitar `feTurbulence`, displacement maps y blend modes múltiples.
- La textura se juzga al 100% de escala y después de compresión H.264; si produce crawling, bajar opacity, no animarla.

---

## 11. Performance considerations

### 11.1 Presupuesto DOM/SVG

- Promedio benchmark: `≤ 500` nodos DOM/SVG visibles.
- Pico estadio/crowd: `≤ 900`.
- Crowd: pattern/instancing o grupos compactos; no cientos de componentes React independientes.
- Missing nodes: máximo 24 instancias en benchmark; sólo 3–7 se remueven dentro del rango.
- Isobars/wind: máximo 16 paths visibles simultáneos.

### 11.2 Cálculo geométrico

- Geometría y path lengths precomputados a nivel de módulo.
- Registry y scene data son objetos `readonly`.
- No parsear SVG strings ni medir DOM por frame.
- Evaluar cámara, palette y memory line una vez por frame; distribuir por context.
- Memoizar componentes estáticos por props escalares.
- No usar arrays nuevos de cientos de puntos si el frame no cambia el morph.

### 11.3 Montaje de capas

- `MemoryLine`, paper y atlas base permanecen montados.
- Scene-specific layers se limitan a su range con `<Sequence>`/router.
- Mantener overlaps sólo el tiempo necesario para bridges.
- No renderizar escenas fuera del benchmark dentro de la composición benchmark; sí sembrar el estado inicial derivado de Scene 09.

### 11.4 SVG y filtros

- Preferir strokes/fills/masks/clipPaths simples.
- Máximo dos masks activas de pantalla completa.
- No filtros SVG costosos en benchmark.
- No blur animado.
- No sombras rasterizadas.
- Reutilizar `<defs>` para patterns, markers y hatches.

### 11.5 Audio

- Una sola instancia `MasterAudio`.
- No duplicar el WAV en cada scene.
- No analizar waveform durante render.
- Metadata y anchors son constantes ya calculadas.

### 11.6 Determinismo y render

- Dos renders del mismo frame con mismos props deben producir píxeles idénticos.
- No cargar fuentes ni media desde red.
- Ejecutar TypeScript strict y ESLint antes de render.
- Registrar tiempo total y pico de memoria del benchmark como baseline; el film completo no debería multiplicar DOM por cantidad de escenas porque sólo se montan capas activas.

### 11.7 Configuración de imagen

- Preview y render final: `1920×1080`, 30 fps.
- Para control de líneas finas, hacer al menos un render benchmark con calidad suficiente para inspección; no aceptar sólo Studio preview.
- Mantener color sRGB estándar salvo decisión explícita posterior.
- El JPEG interno configurado actualmente es aceptable para video H.264, pero las capturas de QA críticas deben renderizarse como PNG para revisar strokes y textura.

---

## 12. Benchmark acceptance criteria

El benchmark puede aprobarse para expansión sólo si cumple todos los puntos obligatorios.

### 12.1 Timing y audio

- [ ] Composición exactamente `450` frames, local `0–449`.
- [ ] Cada frame usa `globalFrame = localFrame + 1722`.
- [ ] Audio corresponde exactamente a `trimBefore=1722`, `trimAfter=2172`, playback rate `1`.
- [ ] WAV conserva SHA-256 `aad141664df8db424fa692c4faeaa3c88af753d20be1eaea365060e8468b2b1d`.
- [ ] Cambios principales aterrizan en `1722`, `1812`, `1908`, `2085`.
- [ ] Frame 2172 no está incluido ni se anticipa visualmente como `1983`.
- [ ] No hay SFX, fades, normalización ni modificación del master.

### 12.2 Continuidad

- [ ] No existe hard cut visual en 1907/1908 ni 2084/2085.
- [ ] `memoryLine.main` mantiene la misma identidad/instancia durante los 450 frames.
- [ ] Desplazamiento de la memory line entre frames de boundary `< 3 px` en el centro del viewport.
- [ ] La grilla institucional deriva en pitch; el pitch deriva en cartografía oceánica.
- [ ] Al menos una capa del atlas previo permanece visible durante cada transición.
- [ ] El frame 2171 está listo para reconexión cívica en 2172 sin reconstruir mundo/cámara.

### 12.3 Tratamiento histórico/editorial

- [ ] `1976` es pequeño y no tiene impacto monumental, gold ni hero framing.
- [ ] Military/state control se origina en la capa institucional.
- [ ] Represión/censura/vigilancia/desapariciones se distinguen mediante acciones visuales diferentes.
- [ ] Missing nodes se perciben como ausencias autoradas, no partículas decorativas.
- [ ] No aparecen pañuelos blancos ni símbolos de una organización específica de derechos humanos.
- [ ] No hay violencia gráfica.
- [ ] 1978 se percibe como celebración pública genuina.
- [ ] El exterior del estadio conserva grid controlado, censura/missing nodes o daño contextual visible.
- [ ] La transición a Malvinas es solemne y no triunfalista.
- [ ] No aparece ningún líder político como protagonista.

### 12.4 Memory line y morphing

- [ ] Civic timeline → wounded line → stadium boundary → isobar/route se lee como un solo objeto lógico.
- [ ] No hay self-intersections accidentales, pops o cambios de stroke width.
- [ ] La stadium boundary no recibe gold completo.
- [ ] Gold se limita a trophy/goal-impact en 1978 y ocupa `< 5%` del frame.
- [ ] La ruta oceánica en 2171 sigue activa; no se adelanta su interrupción posterior.

### 12.5 Cámara

- [ ] Camera path coincide con la tabla §4.4.
- [ ] No hay shake, overshoot ni zoom social-media.
- [ ] Límites de velocidad §4.5 respetados.
- [ ] El pullback de 1978 revela el contexto exterior con claridad.
- [ ] El viaje oceánico comunica distancia y dirección sureste.

### 12.6 Color y textura

- [ ] Nunca aparece fondo negro ni área oscura dominante.
- [ ] Papel permanece marfil/ivory, aun en dictadura.
- [ ] Deep blue no domina más de aproximadamente 25% del frame.
- [ ] Gold es matte, sin glow.
- [ ] Textura no hace crawling ni flicker.
- [ ] No hay gradients genéricos, glassmorphism ni partículas decorativas.

### 12.7 Tipografía

- [ ] Todo copy visible está en español y coincide con §8.
- [ ] `1976` ≤ 64 px; `1978` y `1982` respetan jerarquía.
- [ ] Labels permanecen dentro de safe area.
- [ ] No hay tarjetas/UI, drop shadows, blur o glow.
- [ ] Cormorant Garamond / Source Sans 3 cargan localmente antes de aprobar.
- [ ] Texto legible a 1080p y en una reducción de control al 50%.

### 12.8 Performance y calidad técnica

- [ ] `npm run lint` y TypeScript strict pasan.
- [ ] DOM/SVG visible cumple budgets §11.1.
- [ ] No hay `Math.random()`, timers ni CSS autonomous animation.
- [ ] Dos renders PNG del mismo frame producen el mismo hash.
- [ ] Frames QA mínimos exportados: `1722`, `1812`, `1872`, `1907`, `1908`, `1974`, `2016`, `2047`, `2084`, `2085`, `2145`, `2171`.
- [ ] No hay líneas finas rotas, aliasing severo ni clipping inesperado en esos frames.
- [ ] Preview no acumula nodos ni memoria al hacer scrubbing repetido.
- [ ] Render benchmark 1080p completa sin warnings de media, fuente o layout.

### 12.9 Gate de expansión

Sólo después de aprobar todos los ítems obligatorios se habilita extender el sistema al resto de los 3150 frames. Si el benchmark falla en continuidad de memory line, cámara o tratamiento del estadio dentro del atlas herido, no se debe compensar con transiciones one-off; debe corregirse el sistema compartido.

---

## 13. Orden recomendado para la futura implementación

Este orden minimiza retrabajo; no forma parte de la ejecución de esta etapa.

1. Corregir metadata de composiciones y configurar `assets` como public dir.
2. Implementar `GlobalFrameProvider` y `MasterAudio`; validar offset con tono/anchor visual temporal.
3. Implementar `AtlasCanvas`, camera evaluator y camera debug overlay.
4. Implementar palette, fonts y line-style tokens.
5. Crear path registry y `MemoryLine` con los cinco estados del benchmark.
6. Implementar control grid, missing nodes y censorship masks.
7. Implementar pitch/stadium compartiendo anchors con la grilla.
8. Implementar ocean field y stadium→isobar bridge.
9. Agregar labels/anthem con estabilización.
10. Integrar micro-bloques §8 y retirar todos los debug overlays.
11. Renderizar frames QA y benchmark completo.
12. Revisar contra checklist §12 antes de tocar otra escena.

---

## 14. Definición final del benchmark

El benchmark no es una mini-película independiente. Es una ventana de 450 frames dentro del atlas completo:

```text
global 1722: el sistema institucional acaba de ser tomado;
global 1812: el control se transforma en represión/ausencia;
global 1908: una geometría superviviente se convierte en cancha;
global 2016: la celebración alcanza su impacto, contenida por el contexto;
global 2085: la elipse deja de ser estadio y pasa a ser Atlántico Sur;
global 2171: Malvinas comienza a emerger; la historia continúa.
```

Si el espectador percibe cinco slides enlazadas, el benchmark falla. Si percibe una sola superficie donde la misma línea cambia de control cívico a herida, estadio y ruta oceánica, el sistema está listo para escalar.
