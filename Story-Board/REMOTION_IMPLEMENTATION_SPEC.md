# ARGENTINA — Remotion Implementation Specification

## Estado del documento

**Propósito:** contrato técnico previo a implementación para el film completo y, en particular, para el benchmark `00:57.4–01:12.4`.  
**No es código de producción.** Las interfaces incluidas son contratos TypeScript orientativos que el implementador deberá respetar.  
**Autoridades editoriales:**

1. `ANIMATIC_TIMELINE_v1.md` manda sobre frames, timestamps y anchors musicales.
2. `DIRECTORS_STORYBOARD.md` manda sobre composición, significado histórico, estética, continuidad y transiciones.
3. Este documento resuelve la traducción técnica entre ambos. Cuando existe una divergencia, se registra en §2.

### Corrección global de dirección artística

Este documento incorpora una regla transversal posterior al primer technical lock: **ninguna escena puede resolverse como una composición terminada que la cámara visita**. Cada período debe construirse, actuar, alcanzar densidad, simplificarse y transformarse delante del espectador. La unidad mínima de montaje deja de ser “la ilustración” y pasa a ser:

```text
acción → transformación → acción → transformación
```

La cartografía es el mundo; la memory line conecta; personajes y grupos ejecutan acciones; la cámara participa; el elemento superviviente produce físicamente el siguiente período.

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
│   ├── Scene01World.tsx
│   ├── Scene02ColonialCrisis.tsx
│   ├── ...                          # una capa declarativa por escena 01–19
│   ├── Scene09PoliticalEscalation.tsx
│   ├── Scene10Dictadura.tsx
│   ├── Scene11WorldCup1978.tsx
│   ├── Scene12MalvinasDemocracy.tsx
│   ├── Scene13Maradona1986.tsx
│   ├── ...
│   ├── Scene19Finale.tsx
│   ├── Scene09ExitState.tsx         # seed aislado para benchmark frame 1722
│   └── SceneLayerRouter.tsx         # activa capas por globalFrame
├── choreography/
│   ├── choreography-registry.ts     # acciones humanas/vehiculares por escena
│   ├── action-tracks.ts             # tracks de pose, posición y mirada
│   ├── density-curves.ts            # vacío→densidad→simplificación
│   ├── formation-paths.ts           # columnas, multitudes, equipos
│   └── subject-camera-cues.ts       # follow/reveal sin lógica en escenas
├── actors/
│   ├── ActorRig2D.tsx
│   ├── ActorGroup.tsx
│   ├── WalkCycle.tsx
│   ├── MountedRider.tsx
│   ├── HorseRig.tsx
│   ├── FlagRig.tsx
│   ├── CrowdFlow.tsx
│   ├── ArmyColumn.tsx
│   ├── VehicleOnRoute.tsx
│   ├── SportsActor.tsx
│   └── TeamFormation.tsx
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
- `choreography/`: declara acciones, formaciones, curvas de densidad y relación sujeto-cámara. Ninguna coreografía vive como lógica improvisada dentro de JSX.
- `actors/`: rigs vectoriales y ciclos reutilizables para personas, caballos, ejércitos, multitudes, vehículos y deportes.
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

### 2.2 Copy visible de la dictadura — LOCK EDITORIAL

**Regla obligatoria (decisión del director, posterior al Benchmark V2):** la frase `TERRORISMO DE ESTADO` **está prohibida**. No puede aparecer en pantalla, en lockups, labels, notas, subtítulos ni en ninguna variante tipográfica, en ningún frame del film. Motivo: genera interpretaciones políticas sesgadas.

Copy visible único para el período:

```text
1976–1983
DICTADURA
```

La represión, la censura, la vigilancia y las desapariciones se comunican sólo mediante acciones visuales (control institucional, intercepción, nodos removidos), nunca mediante esa frase. La capa semántica se llama `militaryControl`. Cualquier implementación que muestre `TERRORISMO DE ESTADO` falla la aceptación (§12.3).

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

### 2.8 Figuras políticas y nueva directiva de acción

**Tensión previa:** el storyboard evita que un líder político se convierta en protagonista y proponía silhouettes muy breves; la corrección actual pide que Videla emerja reconociblemente dentro de la toma del poder y actúe antes de integrarse en el sistema.

**Resolución:** mantener la prohibición de protagonismo sostenido, pero permitir una aparición breve y coreografiada de Videla dentro de Scene 10. No hay retrato, hero framing, gold ni fondo aislado. La figura entra con fuerzas/vehículos, realiza una acción limitada y sus anchors se transforman en barras de control/censura. Perón, Eva y demás figuras siguen la misma regla: acción contextual breve, nunca poster.

### 2.9 Dirección editorial nacional/institucional — LOCK

La implementación debe aplicar simultáneamente estos criterios:

- Peronismo 1946–1955: industrialización e incorporación obrera conviven con personalismo, centralización y presión/conflicto sobre oposición, prensa, universidad e instituciones. Ninguna mitad puede omitirse.
- Montoneros y ERP se rotulan `ORGANIZACIONES GUERRILLERAS REVOLUCIONARIAS`. Sus secuestros, asesinatos, atentados y ataques a instalaciones se expresan mediante acciones concretas no gráficas, no sólo mediante líneas abstractas.
- Víctimas civiles, políticas, sindicales, policiales y militares de la violencia guerrillera pueden producir nodos ausentes antes de 1976. `MissingNodeField` no pertenece moral ni semánticamente a una sola categoría posterior de víctimas.
- **Triple A** se nombra como sistema paraestatal separado, unido únicamente a nodos políticos/de seguridad históricamente verificados. No se fusiona con guerrilla, Fuerzas Armadas regulares ni protesta cívica.
- Monte Chingolo usa el hecho documentado del `23 DIC 1975`: ataque del PRT-ERP al Batallón Depósito de Arsenales 601 “Domingo Viejobueno”. No se sustituye por una catedral ni por un edificio civil inventado.
- La explosión de Monte Chingolo es una fractura arquitectónica SVG sin gore. Su humo se transforma en halftone de una portada creada para el film, marcada `RECREACIÓN GRÁFICA`; headline bloqueado: `TERRORISMO: EL ERP ATACA UN ARSENAL MILITAR`. No imitar masthead ni atribuir la tapa a un diario real.
- Fuentes de verificación para ese beat: [Secretaría de Derechos Humanos de la Nación](https://www.argentina.gob.ar/node/292787) y [Museo Histórico de Monte Chingolo / Universidad Nacional de Lanús](https://vientosur.unla.edu.ar/index.php/ataque-al-viejobueno/). Las fuentes confirman objetivo, lugar, organización y fecha; el headline es una decisión editorial contemporánea del film, no una cita de archivo.
- La dictadura conserva control institucional, censura, desapariciones y represión ilegal como hechos explícitos. La precisión visual no puede quedar reservada a esas acciones: la violencia anterior también debe tener agentes, blancos y consecuencias legibles.
- 1978 es una celebración deportiva nacional genuina. Las marcas de dictadura establecen entrada y salida, pero retroceden durante gol, crowd y trophy; la alegría popular no se presenta como propiedad o propaganda automática del régimen.
- Malvinas usa `RECLAMO ARGENTINO DE SOBERANÍA`, con nota secundaria opcional `BAJO ADMINISTRACIÓN BRITÁNICA`. Soldados argentinos reciben escala humana, ayuda mutua, deber y sacrificio sin gore ni resultados de combate inventados.
- Consolidación territorial 1853–1880 muestra expansión de autoridad nacional, asentamientos, comunicaciones, puestos de frontera e integración, reconoce conflictos y presencia indígena, y evita tanto el relleno instantáneo del mapa moderno como una tesis visual única de “ocupación”.

---

## 2A. Corrección global: de atlas recorrido a atlas vivo

### 2A.1 Regla de construcción visible

Toda escena debe describirse y programarse como una secuencia de estados, nunca como un layout final ya presente:

```text
seed heredado
→ construcción de mundo
→ entrada de sujetos
→ acción principal
→ densidad máxima controlada
→ simplificación
→ selección del elemento superviviente
→ transformación física hacia el siguiente período
```

El primer frame de una escena conserva actividad del anterior. El último frame no “termina una imagen”: inicia la mecánica de la escena siguiente.

### 2A.2 Regla de actividad permanente

En cualquier intervalo de 24 frames debe ocurrir al menos una de estas acciones significativas:

- una línea se dibuja, interrumpe o cambia de función;
- un sujeto o grupo se desplaza;
- una formación humana cambia;
- una bandera, vehículo u objeto reacciona;
- arquitectura o paisaje se construye;
- la cámara sigue, revela, desciende o cambia escala;
- una forma comienza su transformación narrativa.

No cuentan como actividad suficiente: grain, breathing opacity, parallax residual o una cámara que sólo panea sobre elementos inmóviles.

### 2A.3 Curva de densidad

Escala compartida:

| Nivel | Definición |
|---:|---|
| D0 | Papel/espacio casi vacío; sólo seed o coordenada. |
| D1 | Un protagonista visual y guías mínimas. |
| D2 | Mundo en construcción y 1–3 acciones secundarias. |
| D3 | Acción clara con foreground, midground y background activos. |
| D4 | Densidad rica, jerarquizada; múltiples acciones legibles. |
| D5 | Clímax excepcional y breve; nunca cobertura total del frame. |

Cada escena debe empezar entre D0–D2, alcanzar su máximo sólo después de construir capas y volver al menos un nivel antes del handoff. Se prohíbe iniciar una escena con su composición de densidad máxima.

### 2A.3A Perfiles temporales normalizados

Los porcentajes se aplican dentro del range ya bloqueado de cada escena; no cambian frames ni anchors. Las fases se solapan para que la transición empiece mientras la acción todavía tiene inercia.

| Perfil | Escenas | Entrada/seed | Construcción | Acción humana | Máxima densidad | Simplificación | Transformación de salida |
|---|---|---:|---:|---:|---:|---:|---:|
| `journey` | 01, 02, 04, 08, 12 | 0–12% | 6–32% | 18–70% | 52–72% | 68–88% | 78–100% |
| `civic` | 03, 05, 07, 15 | 0–15% | 8–38% | 24–68% | 50–72% | 68–88% | 80–100% |
| `conflict` | 06, 09, 10, 14 | 0–10% | 5–28% | 16–76% | 54–78% | 72–90% | 82–100% |
| `sport` | 11, 13, 16, 17, 18 | 0–10% | 4–25% | 15–78% | 62–82% | 76–91% | 84–100% |
| `finale` | 19 | 0–8% | 0–34% | 6–46% | 36–56% | 48–82% | 60–100% |

La implementación puede refinar frames internos para respetar musical anchors, pero no puede eliminar ninguna fase.

### 2A.4 Humanidad sin retrato estático

- Figura principal: rig de 9–14 joints y 8–24 paths, sin rasgos faciales.
- Reconocimiento por postura, vestuario, montura, objeto y contexto.
- Toda figura principal visible más de 18 frames debe ejecutar al menos dos cambios perceptibles: desplazamiento, paso, giro, gesto, transferencia de peso, acción con objeto o interacción grupal.
- Una pose final puede sostenerse, pero debe ser consecuencia visible de una acción.
- Multitudes no son wallpaper: entran, convergen, se separan, responden o se retiran.
- Armas aparecen dentro de una cadena causal/coreográfica y nunca reciben beauty-shot, gold ni rotación fetichizada.

### 2A.5 Cámara cinematográfica

La cámara siempre tiene una motivación narrativa declarada:

- `follow`: acompaña un sujeto móvil;
- `lead`: se adelanta y revela escala/destino;
- `lateral-track`: muestra formación o marcha;
- `push-in`: concentra poder, decisión o acción;
- `pullback-reveal`: descubre contexto que seguía presente;
- `descend-scale`: pasa de mapa a territorio/acción humana;
- `rise-overhead`: vuelve de acción a cartografía;
- `spatial-rack`: cambia jerarquía mediante parallax, escala y oclusión, sin blur fotográfico.

Cada cue de cámara nombra sujeto o geometría objetivo. “Mover hacia la derecha” no es una dirección suficiente.

### 2A.6 Transformación primaria y fades

Toda frontera de escena define una transformación primaria con IDs de objeto preservados. Opacity puede ocultar detalle secundario, pero no puede ser el mecanismo principal de reemplazo. Como regla:

- al menos un objeto mantiene identidad a través del boundary;
- al menos una geometría cambia de función delante de cámara;
- no más del 35% de los elementos visibles puede desaparecer simultáneamente sólo por opacity;
- ningún boundary usa `fade out → frame vacío → fade in`.

### 2A.7 Acción, no simulación compleja

La animación debe ser limitada pero clara. No se busca character animation realista:

- ciclos de 6–16 poses interpoladas;
- walk/ride/run con silueta legible;
- flags por 3–5 curvas controladas;
- crowd motion mediante flow fields deterministas;
- deportes mediante tracks autorados de cuerpo, pelota, formación y cámara;
- impactos por cambio de trayectoria, postura, líneas y sonido musical, no partículas.

---

## 2B. Dirección viva por escena — 19-scene lock

Los frames y tiempos son los del animatic y no se alteran.

### Scene 01 — 1492–1776 · frames 0–179

- **Protagonista visual:** `memoryLine.main` como ruta atlántica naciente.
- **Acción principal:** el mundo se dibuja alrededor de una ruta que avanza; barcos recorren el arco y alteran corrientes/guías.
- **Elementos humanos:** tripulaciones sugeridas por 1–2 gestos mínimos sobre barcos; sin figuras heroicas legibles.
- **Foreground:** compass needle y trazos de navegación que cruzan cerca de cámara.
- **Midground:** 2–3 barcos desplazándose a velocidades distintas; ruta activa.
- **Background:** planisferio, latitudes y costas que aparecen a medida que la cámara llega.
- **Cámara:** follow oblicuo de la ruta, luego lead hacia Sudamérica; no contempla un mapa prearmado.
- **Densidad:** inicia D0; máximo D3; simplifica a D2.
- **Elemento heredado:** papel vacío/primer punto de coordenada.
- **Transformación de entrada:** compass tick rota y estira hasta ser ruta.
- **Elemento superviviente:** ramal sur de la ruta.
- **Transformación de salida:** ramales marítimos se adhieren a ríos/contornos y se vuelven límites administrativos de 1776; una onda del estuario recibe a los barcos de Scene 02.

### Scene 02 — 1806–1808 · frames 180–335

- **Protagonista visual:** conexión imperial bajo presión.
- **Acción principal:** barcos se acercan; defensores/civiles se movilizan; las rutas chocan, revierten y la conexión transatlántica se debilita.
- **Elementos humanos:** pequeñas columnas urbanas, milicia/civiles en movimiento; Napoleon sólo como silueta gestual breve integrada a flechas europeas.
- **Foreground:** aparejos/velas y una ruta de invasión que cruza frame.
- **Midground:** costa, movimientos cívicos y barcos que viran.
- **Background:** Buenos Aires lineal y luego Europa en construcción.
- **Cámara:** primero tracks los barcos hacia costa; toma la línea de conexión y viaja de regreso a España.
- **Densidad:** D2→D4→D2.
- **Elemento heredado:** onda/ruta del Río de la Plata.
- **Transformación de entrada:** la onda se levanta como proa/vela y multiplica barcos.
- **Elemento superviviente:** segmento quebrado España–Río de la Plata.
- **Transformación de salida:** extremos rotos rotan y se convierten en laterales/axis del Cabildo.

### Scene 03 — 1810 · frames 336–479

- **Protagonista visual:** multitud cívica + Cabildo que se construye.
- **Acción principal:** la plaza pasa de vacío a reunión; figuras llegan, paraguas se abren, la multitud reacciona y emite el pulso celeste.
- **Elementos humanos:** 12 rigs base instanciados como crowd flow, con pasos, giros y elevación de brazos muy limitada.
- **Foreground:** paraguas y dos figuras cruzan cerca de cámara.
- **Midground:** multitud que converge y responde.
- **Background:** Cabildo dibujándose en orden arquitectónico.
- **Cámara:** push por el eje del Cabildo, breve pullback en el impacto para revelar masa humana.
- **Densidad:** D1→D4→D3.
- **Elemento heredado:** dos segmentos imperiales rotos.
- **Transformación de entrada:** segmentos completan fachada/axis; lluvia/hatching cae desde guías cartográficas.
- **Elemento superviviente:** pulso celeste que atraviesa crowd.
- **Transformación de salida:** el pulso se estira como ribbon/flag route y abandona la plaza en movimiento.

### Scene 04 — 1810–1816/17 · frames 480–674

- **Protagonista visual:** columna del Ejército de los Andes y ruta que se dibuja detrás.
- **Acción principal:** planificación → marcha → ascenso; soldados caminan, caballos avanzan, banderas reaccionan, San Martín montado acompaña la columna.
- **Elementos humanos:** Belgrano aparece brevemente junto al nacimiento de bandera/ruta; San Martín es un mounted rig móvil, no pose; 8–14 soldados en foreground/midground y una columna reducida por instancing en profundidad.
- **Foreground:** caballo/soldado cruzando lateralmente, rocas y flag edge.
- **Midground:** San Martín y columna sobre la ruta.
- **Background:** cordillera que emerge en contours y aumenta de escala.
- **Cámara:** follow lateral, se adelanta (`lead`) y rota levemente para revelar cordillera/escala; termina skimming ridge.
- **Densidad:** D1→D4→D3.
- **Elemento heredado:** ribbon celeste de Scene 03.
- **Transformación de entrada:** ribbon se vuelve bandera y luego ruta bajo los pies/caballos.
- **Elemento superviviente:** línea recorrida + linkage imperial quebrado.
- **Transformación de salida:** hoof/terrain contours y links rotos se aplanan como reglas y escritura de declaración. El cruce históricamente fechado en 1817 debe respetar la solución editorial ya bloqueada.

### Scene 05 — 1816 · frames 675–809

- **Protagonista visual:** documento/Casa de Tucumán construidos por llegada de delegados.
- **Acción principal:** delegados entran por rutas, suben/atraviesan el umbral y una mano/pen rig genera firmas abstractas; el sello aparece como consecuencia.
- **Elementos humanos:** 5–7 delegados con walk cycles mínimos; clerk/hand action; ninguna pose solemne congelada desde el inicio.
- **Foreground:** borde de papel, mano/pluma y un delegado que sale de cuadro.
- **Midground:** puerta y figuras convergiendo.
- **Background:** fachada dibujándose desde axis a detalle.
- **Cámara:** desciende con el papel, tracks una ruta de delegado y se centra sólo al sellarse la declaración.
- **Densidad:** D1→D3→D2.
- **Elemento heredado:** contours/escritura de Scene 04.
- **Transformación de entrada:** montaña se endereza en hoja; pasos se convierten en arrival ticks.
- **Elemento superviviente:** endpoints provinciales alineados + perímetro del documento.
- **Transformación de salida:** endpoints se separan y tiran del perímetro, fragmentando la geometría.

### Scene 06 — 1816–1853 · frames 810–1043

- **Protagonista visual:** territorio y grupos montados/couriers que lo tensan.
- **Acción principal:** formaciones pequeñas avanzan en direcciones incompatibles; mensajeros cruzan; provincias se desplazan; rutas se sobreescriben.
- **Elementos humanos:** mounted groups y caudillo silhouettes siempre móviles, a escala cartográfica; no retratos.
- **Foreground:** flecha/ruta y jinete que cruza diagonal.
- **Midground:** provincias separándose y columnas rivales.
- **Background:** mosaic regional y vacío de unión.
- **Cámara:** lateral inquieta que sigue un grupo, lo pierde y toma otro; nunca observa todo quieto.
- **Densidad:** D2→D4→D3.
- **Elemento heredado:** endpoints/perímetro roto de declaración.
- **Transformación de entrada:** edges del documento se vuelven límites regionales y caminos.
- **Elemento superviviente:** intersecciones de rutas como potential nodes.
- **Transformación de salida:** rutas conflictivas curvan su dirección hacia nodes compartidos.

### Scene 07 — 1853–1880 · frames 1044–1199

- **Protagonista visual:** red institucional y territorial ensamblada por conexiones activas.
- **Acción principal:** delegates/couriers llegan; nodes se conectan; una línea constitucional circula; caminos, comunicaciones, settlements y outposts de frontera extienden autoridad efectiva sin rellenar instantáneamente el mapa moderno. Zonas de conflicto y nodos indígenas permanecen identificables mientras la cámara prioriza integración territorial y construcción estatal.
- **Elementos humanos:** figuras cívicas mínimas, couriers, pobladores/outpost figures y presencia indígena contextual sin estereotipo ni desaparición visual; no crowd hero.
- **Foreground:** documento/compass rule que pasa cerca.
- **Midground:** nodes que se activan al recibir figuras/rutas.
- **Background:** contornos todavía cambiantes.
- **Cámara:** rise-overhead progresivo mientras el movimiento local se organiza.
- **Densidad:** D2→D3→D2.
- **Elemento heredado:** potential nodes de Scene 06.
- **Transformación de entrada:** cada cruce conflictivo se regulariza como node institucional.
- **Elemento superviviente:** edge atlántico de la red.
- **Transformación de salida:** edge sale del continente, curva hacia Europa y se convierte en ruta migratoria.

### Scene 08 — 1880–1930 · frames 1200–1361

- **Protagonista visual:** flujo humano que llega, desembarca y se redistribuye como ferrocarril/ciudad.
- **Acción principal:** barcos viajan; pasajeros bajan; dock workers mueven carga; un tren parte; farmers/urban workers activan territorio y ciudad.
- **Elementos humanos:** migrant groups con equipaje, dock workers, rail passengers, 1–2 agricultural actions; diversidad colectiva, no estereotipos.
- **Foreground:** pasajero/equipaje y vapor/rueda de tren.
- **Midground:** puerto, tren en recorrido, station crowd.
- **Background:** rutas atlánticas, pampas y skyline que se construye.
- **Cámara:** follow transatlántico, descend al puerto, lateral tracking del tren, lead hacia ciudad.
- **Densidad:** D1→D4→D3.
- **Elemento heredado:** edge atlántico institucional.
- **Transformación de entrada:** edge se multiplica en rutas de barcos.
- **Elemento superviviente:** track ferroviario y station clock.
- **Transformación de salida:** sleepers se comprimen como ventanas de fábrica; reloj se vuelve gauge urbano/industrial.

### Scene 09 — 1930–1976 · frames 1362–1721

- **Protagonista visual:** civic timeline que incorpora trabajadores y multitudes, se concentra alrededor de liderazgo personalista, sufre rupturas y queda finalmente sobrepasada por guerrilla, violencia paraestatal, crisis política y militarización.
- **Acción principal:** trabajadores/multitudes avanzan; Perón habla/gesticula brevemente mientras nodos de oposición, prensa, universidad e instituciones se comprimen hacia el eje político; Eva atraviesa como bridge corto; proscripción y resistencia quiebran la línea; Montoneros/ERP ejecutan acciones armadas concretas; nodos civiles/políticos/sindicales/policiales/militares afectados dejan rings; Triple A entra por una ruta paraestatal separada; Monte Chingolo produce explosión arquitectónica → humo/halftone → portada reconstruida; seguridad/represión y crisis institucional empujan hacia 1976.
- **Elementos humanos:** workers, crowd, oposición cívica, Perón rig breve, Eva rig de 8–10 frames, Montoneros/ERP como grupos guerrilleros diferenciados, víctimas por clase de nodo, Triple A vinculada a nodos verificados y security formations; sin gore ni glamour.
- **Foreground:** armed actor breve, target node, fractura de fachada del arsenal, humo plano, pliegue/halftone de diario y security figure en oposición espacial.
- **Midground:** Plaza/city flows, oposición/instituciones comprimidas, confrontación, vehículos/columnas de seguridad y ruta Triple A separada.
- **Background:** fábricas, Congreso, Casa Rosada, prensa/radio, universidad, Batallón de Arsenales 601 y timeline interrumpida.
- **Cámara:** fast lateral tracking; breves follows de crowd y guerrilla; push a Monte Chingolo; blast-match a portada `RECREACIÓN GRÁFICA`; spatial rack hacia Triple A/security; pierde horizonte y vuelve a rigidez en 1722.
- **Densidad:** D2→D5 breve→D3 al takeover.
- **Elemento heredado:** railway/factory rhythm.
- **Transformación de entrada:** ventanas se vuelven industria/city; rail rhythm se vuelve civic pulse.
- **Elemento superviviente:** civilian/government baseline interceptada.
- **Transformación de salida:** security lines ocupan sus anchors; vehículos/figuras militares entran y empujan la red hacia Scene 10.

### Scene 10 — 1976–1983 context · frames 1722–1907

- **Protagonista visual:** orden militar impuesto que detiene trayectorias armadas y ocupa el atlas, seguido por clausura institucional, censura y represión ilegal.
- **Acción principal:** fuerzas/vehículos ocupan calles y detienen competing armed routes; instituciones se rigidizan; Videla emerge brevemente dentro de la formación, avanza/gesticula una vez y queda absorbido por barras/geometry; censura, vigilancia, intercepción y represión ilegal reemplazan su figura; personas se retiran y nodes desaparecen. Los rings continúan una gramática de víctimas ya iniciada antes de 1976.
- **Elementos humanos:** military column, 1–2 vehicles, Videla rig reconocible por uniforme/postura sin detalle facial, civiles que se retiran; no pañuelos blancos ni emblema de organización.
- **Foreground:** vehicle edge, boots/figures crossing, censorship shutter.
- **Midground:** Videla integrado a control grid y luego ocultado por machinery institucional.
- **Background:** Congreso/broadcast/street network clausurados y paper vacío.
- **Cámara:** follow corto de ocupación → partial push-in sobre estructura/Videla → pullback lento que revela extensión del control y vacío.
- **Densidad:** D3 heredada→D4→D2.
- **Elemento heredado:** baseline cívica y security geometry de Scene 09.
- **Transformación de entrada:** vehículos/figuras alinean la geometría; baseline queda controlada.
- **Elemento superviviente:** rectángulo institucional + tramo controlado/discontinuo de memory line.
- **Transformación de salida:** vehicle tracks/rectángulo se regularizan como primeras líneas de cancha; figuras se convierten en crowd marks sólo mediante transformación espacial, no equivalencia semántica.

### Scene 11 — 1978 · frames 1908–2084

- **Protagonista visual:** cancha que nace de la grilla y se convierte en una celebración deportiva nacional con agencia propia.
- **Acción principal:** líneas crecen; jugadores entran; equipos toman posiciones; pelota circula; cámara acompaña ataque; gol; crowd responde; jugadores celebran; trophy se eleva como consecuencia.
- **Elementos humanos:** 8–12 sports actors en tracks simplificados, goalkeeper, scoring player/team group y crowd flow de estadio.
- **Foreground:** jugador/ball crossing y goal net line.
- **Midground:** acción colectiva y celebración.
- **Background:** tribunas que se construyen; marcas de control sobreviven en la entrada, retroceden durante la acción/celebración y reaparecen sólo en el pullback de salida.
- **Cámara:** descend al pitch, follow de pelota/jugador, follow humano de celebración, rise con trophy y pullback de salida hacia el atlas.
- **Densidad:** D1→D5 breve→D3.
- **Elemento heredado:** rectángulo controlado + memory line discontinua; ambos pierden primacía al comenzar el juego.
- **Transformación de entrada:** barras se estiran como touchlines; tracks de vehículos se vuelven pitch guides.
- **Elemento superviviente:** stadium ellipse y crowd tangents.
- **Transformación de salida:** ellipse se alarga; crowd tangents se vuelven wind lines; trophy axis se vuelve longitude; gold queda atrás.

### Scene 12 — 1982→1983 · frames 2085–2258

- **Protagonista visual:** ruta soberana argentina del Atlántico que aumenta de escala hasta convertirse en paisaje humano de deber, combate y sacrificio.
- **Acción principal:** cámara sigue la ruta bajo `RECLAMO ARGENTINO DE SOBERANÍA`; islas crecen; contours se vuelven terreno; soldados argentinos avanzan contra viento, se ayudan, aseguran una posición y sostienen la bandera en un gesto digno —localización/fecha exacta a verificar—; luego cartografía/civic timeline se reabre hacia 1983 sin borrar su memoria.
- **Elementos humanos:** 5–8 soldiers con walk cycles pesados, flag team y pequeñas silhouettes en profundidad; sin combate gráfico.
- **Foreground:** grass/rock hatching, coat/flag edge sacudido por viento.
- **Midground:** soldados desplazándose y flag action.
- **Background:** islas, mar, wind layers y distancia continental.
- **Cámara:** linear travel oceánico → descend-scale cartografía/territorio → lateral follow a escala humana de soldados → pullback a timeline nacional para 1983.
- **Densidad:** D1→D4→D2.
- **Elemento heredado:** stadium ellipse/isobar.
- **Transformación de entrada:** crowd strokes se convierten en viento; ellipse en isobar; pitch coordinates en ocean grid.
- **Elemento superviviente:** ruta interrumpida + una civic line subyacente.
- **Transformación de salida:** terrain contours rectifican; civic line se reconecta y curva hacia center circle de 1986. El flag se simplifica a dos bandas/route accent, no trophy.

### Scene 13 — 1986 · frames 2259–2444

- **Protagonista visual:** Maradona en acción y memory line siguiendo exactamente su recorrido narrativo.
- **Acción principal:** recepción/avance → primer defensor → cambio de dirección → segundo defensor → aceleración → más jugadores quedan atrás → arquero → último movimiento → gol → celebración/trophy → left laurel.
- **Elementos humanos:** Maradona sports rig, 5–7 defender rigs, goalkeeper, teammates de celebración; figuras inglesas se construyen al entrar en relación y se desarman en trazos al quedar atrás.
- **Foreground:** ball y defender crossings con oclusión parcial.
- **Midground:** Maradona + memory line/defensores.
- **Background:** pitch/stadium reducido a guides y crowd response.
- **Cámara:** tracking cercano con look-ahead; micro-reframes por cambios de dirección; rise-overhead después del gol.
- **Densidad:** D1→D4 acción→D5 gol→D3.
- **Elemento heredado:** center circle/civic line reconectada.
- **Transformación de entrada:** civic curve se convierte en first dribble path; reopened nodes en player positions.
- **Elemento superviviente:** trayectoria exacta de Maradona.
- **Transformación de salida:** trajectory se vuelve gold después del gol, asciende por trophy y dibuja sólo left laurel; sale como buried memory thread.

### Scene 14 — 1990–2001 · frames 2445–2531

- **Protagonista visual:** gold thread que atraviesa una ciudad humana acelerada.
- **Acción principal:** commuters/vehicles/ledger flows aceleran; grupos cruzan, se congestionan y encuentran closed nodes; sistemas pierden sincronía en 2001.
- **Elementos humanos:** urban flow reducido, workers/commuters y crowd abstracto; sin líderes.
- **Foreground:** figura y vehicle streak cruzan timeline.
- **Midground:** city routes/closed node.
- **Background:** blocks y ledger marks.
- **Cámara:** lateral track ligado al thread; speed ramp y jolt seco en fracture.
- **Densidad:** D2→D4→D2.
- **Elemento heredado:** gold trophy/laurel thread.
- **Transformación de entrada:** stadium marks se comprimen como year ticks.
- **Elemento superviviente:** thread bajo papel.
- **Transformación de salida:** paper fissure rota en stem vertical del siglo XXI sin cortar el thread.

### Scene 15 — 2001–2014 · frames 2532–2699

- **Protagonista visual:** timeline que se recompone mientras un nuevo `10` crece como actor en movimiento.
- **Acción principal:** flujos urbanos/cívicos vuelven a conectarse; sports actor de Messi atraviesa year nodes mediante breves acciones de carrera/pase; la trayectoria asciende hacia 2014.
- **Elementos humanos:** grupos contemporáneos mínimos, young/adult Messi rig por cambios de escala, compañeros/oponentes abstractos.
- **Foreground:** Messi/ball pass que cruza un year marker.
- **Midground:** civic/science/culture actions breves.
- **Background:** timeline vertical y city grid reparado por overdraw.
- **Cámara:** crane/upward follow del `10`; no mera panorámica temporal.
- **Densidad:** D1→D3→D2.
- **Elemento heredado:** vertical fissure + buried gold thread.
- **Transformación de entrada:** people/routes redibujan grieta como timeline.
- **Elemento superviviente:** Messi blue trajectory cerca del gold thread.
- **Transformación de salida:** year line se aplana físicamente como halfway line de 2014.

### Scene 16 — 2014 · frames 2700–2804

- **Protagonista visual:** Messi corre hacia una oportunidad que no completa la geometría heredada.
- **Acción principal:** recepción → carrera diagonal → defensor/arquero → remate/oportunidad → trayectoria pasa cerca del thread pero no conecta → cuerpo desacelera y se detiene.
- **Elementos humanos:** Messi rig, 2–3 defenders, goalkeeper, teammates lejanos; sin pose melodramática.
- **Foreground:** ball/defender crossing.
- **Midground:** Messi y pale right-laurel guide.
- **Background:** pitch/stadium aireado, trophy distante.
- **Cámara:** follow con leve lead al trophy; overshoot espacial mínimo y retorno al sujeto quieto.
- **Densidad:** D1→D4→D1/2.
- **Elemento heredado:** rising blue trajectory + buried gold thread.
- **Transformación de entrada:** timeline/2014 tick se vuelve center mark y la carrera lo atraviesa.
- **Elemento superviviente:** right-laurel leaf incompleta.
- **Transformación de salida:** leaf rota/escala hasta ser South America; stem se vuelve ruta a Rio.

### Scene 17 — 2021 · frames 2805–2891

- **Protagonista visual:** acción de equipo que transforma burden individual en logro colectivo.
- **Acción principal:** 3–5 pases/relaciones espaciales → avance → resolución abstracta → jugadores convergen y celebran como círculo/equipo.
- **Elementos humanos:** Messi, teammates y opponents como sports rigs; group embrace/celebration limitado pero claro.
- **Foreground:** pass line/teammate receiving.
- **Midground:** team formation y convergencia.
- **Background:** South America/Rio geometry y stadium guides.
- **Cámara:** geographic push que desciende a play; espiral ascendente alrededor del team circle.
- **Densidad:** D1→D4→D3.
- **Elemento heredado:** leaf/South America y route stem.
- **Transformación de entrada:** continent outline abre como pitch boundary y jugadores nacen en route nodes.
- **Elemento superviviente:** parallel blue/gold lines y right-laurel leaves parciales.
- **Transformación de salida:** team-circle motion estira ambas líneas en double-strand hacia Qatar.

### Scene 18 — 2022 · frames 2892–3065

- **Protagonista visual:** Messi + equipo completan la acción y la frase suspendida desde 1986.
- **Acción principal:** build-up de equipo → Messi avanza/interactúa → compañeros crean espacio → acción decisiva original → líneas 1986/2022 se encuentran → celebración colectiva → trophy lift → right laurel completa.
- **Elementos humanos:** Messi, 6–10 teammates/opponents, goalkeeper/goal guides, team trophy group; pose final nace de movimiento.
- **Foreground:** player/ball/pass occlusions controladas.
- **Midground:** Messi/team action + merged strands.
- **Background:** Qatar grid, stadium crowd y incomplete laurel watermark.
- **Cámara:** shallow action tracking → impossible pullback por 36 años → race forward → rise centrado con trophy.
- **Densidad:** D1→D4→D5→D3.
- **Elemento heredado:** double-strand 1986/2021 y partial laurel.
- **Transformación de entrada:** travel arc aterriza como passing lane y player formation.
- **Elemento superviviente:** completed laurel y merged gold line.
- **Transformación de salida:** leaves se desprenden ordenadamente y se convierten en rutas/acciones contemporáneas.

### Scene 19 — 2023–2026 / LIBERTAD · frames 3066–3149

- **Protagonista visual:** sociedad argentina activa; después, síntesis geográfica y palabra.
- **Acción principal:** people move entre ciudad/campo/ciencia/industria/cultura; máquina/tren/fields/orbit actúan brevemente; rutas históricas responden y convergen; tres `LIBERTAD` reducen el sistema hasta lockup final.
- **Elementos humanos:** commuters, agricultural workers, scientists, industrial/cultural figures y civic crowd; ninguno domina.
- **Foreground:** 2–3 acciones contemporáneas que se convierten en líneas.
- **Midground:** living national network.
- **Background:** bicontinental geography que se dibuja por convergencia.
- **Cámara:** close entre personas → pullback continuo → three axial typography impacts → quietud final.
- **Densidad:** D3→D5 muy breve→D0/1.
- **Elemento heredado:** laurel leaves/merged line.
- **Transformación de entrada:** leaf veins se vuelven rail/street/field/science routes activadas por personas.
- **Elemento superviviente:** national outline + Sun/date baseline.
- **Transformación de salida:** no siguiente escena; personas/acciones simplifican en geografía, geografía en `LIBERTAD`, y texto/papel sostienen silencio. El fade final sólo limpia residuos después de la transformación, no la reemplaza.

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

type CameraMove =
  | 'follow'
  | 'lead'
  | 'lateral-track'
  | 'push-in'
  | 'pullback-reveal'
  | 'descend-scale'
  | 'rise-overhead'
  | 'spatial-rack';

interface CameraSubjectCue {
  id: string;
  range: FrameRange;
  move: CameraMove;
  targetTrackId: string;
  screenTarget: readonly [number, number]; // pixels del viewport
  lookAheadWorld: readonly [number, number];
  blend: number; // 0..1 sobre el authored base path
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

### 4.2A Cámara ligada a acción

Para escenas con sujetos, `CameraPath` evalúa primero el base path y luego un `CameraSubjectCue` centralizado. El cue consulta el `ActionTrack` del actor/grupo y mezcla su posición con el base path. La escena no puede mover el viewport directamente.

- `follow`: sujeto cerca de 45–55% horizontal, con look-ahead hacia su dirección.
- `lead`: cámara se adelanta y deja entrar al sujeto en profundidad.
- `lateral-track`: mantiene formación completa y parallax de foreground.
- `descend-scale`: cambia de cartografía a terreno mientras conserva el anchor geográfico.
- `rise-overhead`: acción humana se simplifica de nuevo en mapa.
- `spatial-rack`: cambia jerarquía mediante oclusión, parallax y escala; blur fotográfico prohibido.

Para el benchmark, los cues de sujetos deben compilarse sin modificar los keyframes bloqueados de §4.4: sólo ajustan framing dentro de un margen máximo de `±70 world units` y nunca desplazan anchors musicales.

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

type ActorKind =
  | 'civilian'
  | 'historical-figure'
  | 'soldier'
  | 'mounted-rider'
  | 'crowd-member'
  | 'worker'
  | 'sports-player'
  | 'vehicle';

type ActionId =
  | 'walk'
  | 'march'
  | 'ride'
  | 'run'
  | 'turn'
  | 'gesture'
  | 'retreat'
  | 'carry'
  | 'raise-flag'
  | 'pass-ball'
  | 'dribble'
  | 'shoot'
  | 'save-attempt'
  | 'celebrate'
  | 'lift-trophy';

interface ActionKeyframe {
  frame: GlobalFrame;
  position: readonly [number, number];
  rotation: number;
  scale: number;
  pose: string;
  lookDirection: -1 | 1;
}

interface ActorTrack {
  id: string;
  kind: ActorKind;
  rigId: string;
  range: FrameRange;
  action: ActionId;
  keyframes: readonly ActionKeyframe[];
  pathId?: string;
  formationId?: string;
  depthLayer: number;
  semanticRole: 'primary' | 'secondary' | 'context';
}

interface DensityCue {
  frame: GlobalFrame;
  level: 0 | 1 | 2 | 3 | 4 | 5;
  activeActorCount: number;
  activeEnvironmentLayers: number;
}

interface ChoreographySpec {
  actorTracks: readonly ActorTrack[];
  groupTracks: readonly string[];
  propTracks: readonly string[];
  densityCues: readonly DensityCue[];
  cameraSubjectCues: readonly CameraSubjectCue[];
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
  choreography: ChoreographySpec;
  inheritedObjectIds: readonly string[];
  survivingObjectIds: readonly string[];
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
- Cada figura o grupo visible más de 18 frames debe existir como `ActorTrack`/group track, no como silhouette inmóvil dentro del SVG de fondo.
- Cada escena declara `DensityCue` inicial, máximo y salida; un implementador no decide simultaneidad por intuición.
- `inheritedObjectIds` y `survivingObjectIds` deben compartir al menos un ID en cada boundary.

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
| D | 1812–1841 | 90–119 | 60.400–61.400 | 30 | Represión y ausencia bajo control institucional. |
| E | 1842–1871 | 120–149 | 61.400–62.400 | 30 | Vacío, vigilancia y daño social sostenido. |
| F | 1872–1907 | 150–185 | 62.400–63.600 | 36 | Rectángulo superviviente se regulariza hacia cancha. |
| G | 1908–1937 | 186–215 | 63.600–64.600 | 30 | Nace cancha/estadio; el contexto de control comienza a retroceder. |
| H | 1938–1973 | 216–251 | 64.600–65.800 | 36 | Entra `1978`; crece celebración pública. |
| I | 1974–2015 | 252–293 | 65.800–67.200 | 42 | Acción deportiva y gol; celebración nacional ocupa el frame. |
| J | 2016–2046 | 294–324 | 67.200–68.233 | 31 | Trofeo, anthem y gold nacional. |
| K | 2047–2084 | 325–362 | 68.233–69.500 | 38 | Pullback; estadio → elipse/isobar. |
| L | 2085–2114 | 363–392 | 69.500–70.500 | 30 | Anchor Atlántico Sur; gold desaparece. |
| M | 2115–2144 | 393–422 | 70.500–71.500 | 30 | Viaje cartográfico sobre el océano. |
| N | 2145–2171 | 423–449 | 71.500–72.400 | 27 | Entrada a Malvinas; salida preparada para frame 2172. |

Los picos secundarios `1791`, `1896–1905`, `2016`, `2043`, `2106` y `2127` se usan como acentos internos observados en el master, sin sustituir los anchors obligatorios del animatic.

**Density schedule bloqueado:** `A D3 → B D4 → C D3 → D D3 → E D2 → F D2 → G D2 → H D3 → I D4 → J D5 breve → K D3 → L D1 → M D2 → N D2`. El benchmark nunca presenta todas sus capas/personas simultáneamente.

### 8.4 Bloque A — 1722–1751 / entrada al control militar

**Tiempo musical:** comienza exactamente en el anchor `1722`. La energía cae respecto del bloque político anterior; no hay golpe heroico.  
**Cámara:** interpola de `(3340,2110,1.00,+4.5°)` hacia el keyframe de 1752. El horizonte se corrige lentamente, como imposición de orden.  
**Objetos visibles:**

- fragmentos de ciudad/instituciones heredados de Scene 09;
- Congreso lineal, radio/broadcast marks, ministerio y dos nodos cívicos;
- rutas políticas previas en opacidad `0.16–0.24`, confinadas a bordes;
- primeras líneas rígidas de `InstitutionalControlGrid`;
- una columna militar de 5–7 figuras y un vehículo lineal que avanzan por la calle/timeline desde foreground hacia midground.

**Texto:** `1976` pequeño, anchor `(3370,1940)`, modo `hybrid`; opacity `0→0.72` entre 1730–1742. Nunca supera 64 px de alto aparente.  
**Memory line:** continúa como `civicTimeline`; no cambia de instancia. Opacity `0.78→0.66`. Dos puntos institucionales dejan de responder, pero la geometría todavía no se rompe.  
**Acción humana:** la columna cruza dos civic nodes; civiles residuales se desplazan en sentido contrario y salen por bordes. Las ruedas/pasos generan intervalos que se alinean con la futura grilla rígida.  
**Transformación:** líneas militares paralelas entran desde anchors institucionales existentes; no desde fuera del mapa como invasión abstracta. El vehicle track se conserva como una de esas líneas.  
**Color:** paper `paperCool`; deep blue desaturado; control grid `grayBlue` a opacity `0.20→0.48`; gold `0`.  
**Profundidad:** ciudad en layer 20, control grid 30, memory line 40, texto 70.  
**Salida:** en 1751 la cámara aún se mueve; frame 1752 continúa la misma curva sin reset.

### 8.5 Bloque B — 1752–1791 / cierre de la red cívica

**Tiempo musical:** pulso bajo controlado; el máximo secundario de 1791 acompaña la última intercepción, no una celebración.  
**Cámara:** de keyframe 1752 hacia 1812; zoom `1.08→1.16`, rotación `+2.5°→0°`.  
**Objetos visibles:** el control grid encierra Congreso, broadcast, universidad/unión y calle; shutters pálidos comienzan a cubrir reglas de periódico y ondas de radio. La columna se abre para revelar brevemente un rig reconocible de Videla integrado a la formación, nunca aislado sobre fondo limpio.  
**Texto:** lockup estabilizado entra en 1760–1774:

```text
1976–1983
DICTADURA
```

Anchor `(3500,1970)`, alineación izquierda, ancho máximo 460 px. `1976` marginal del bloque A se integra como fecha superior y deja de ser instancia separada en un crossfade de 10 frames.  
**Memory line:** morph `civicTimeline → woundedTimeline` al `45%`; `visibleRanges` pasa de `[0,1]` a tres tramos todavía cercanos. Stroke aparente `3 px`, `deepBlueSoft`.  
**Acción humana:** Videla avanza 20–30 world units, gira torso/cabeza hacia la estructura institucional y realiza un solo gesto de mando; figuras militares ocupan posiciones. No permanece como poster.  
**Transformación:** primeras intercepciones rectangulares se alinean con la grilla; evitar barras negras o diagonales agresivas. Barras institucionales comienzan a cruzar por delante de Videla, anticipando su absorción visual.  
**Color/opacidad:** instituciones `0.52`; crowd remnants `0.14`; control grid `0.55`; background luminance alta.  
**Salida:** en 1791 un relay visual cierra el último civic node accesible y prepara la censura del bloque C.

### 8.6 Bloque C — 1792–1811 / censura e intercepción

**Tiempo musical:** breve preparación al anchor 1812.  
**Cámara:** continúa hacia `controlledCenter`; casi sin rotación al final.  
**Objetos visibles:** `CensorshipMask` borra fragmentos de texto/periódico de izquierda a derecha; scan arcs recorren sólo dos zonas, nunca toda la pantalla.  
**Texto:** lockup `1976–1983 / DICTADURA` estable; sin nuevo copy. Opacity `0.92`.  
**Memory line:** llega a `woundedTimeline`; los huecos se obtienen por máscara. La curva geométrica subyacente continúa completa.  
**Acción humana:** Videla queda parcialmente ocluido por barras/control geometry, da medio paso y se integra/desaparece detrás de la maquinaria institucional antes del frame 1812. La columna se dispersa en puestos de control con pequeños cambios de guardia/postura mientras civiles continúan retirándose.  
**Transformación:** dos civic nodes bajan a opacity `0.20`; no desaparecen todavía. La silueta de Videla no hace fade aislado: sus verticales de uniforme/gorra se alinean y transfieren a las barras de censura/control.  
**Color:** `skyBlue` casi ausente (`≤0.20` en rutas); `grayBluePale` domina áreas controladas; gold prohibido.  
**Profundidad:** máscaras en layer 35, por debajo de la memory line para que la interrupción sea legible como daño aplicado a ella.  
**Salida:** frame 1811 contiene los nodos a punto de desaparecer; 1812 ejecuta el cambio interno.

### 8.7 Bloque D — 1812–1841 / transformación interna: represión y ausencia

**Tiempo musical:** cambio obligatorio exactamente en 1812. Debe percibirse por reducción/retención, no por impacto épico.  
**Cámara:** deriva lenta de `(3550,2180,1.16,0°)` hacia el siguiente tramo; sensación de espacio controlado.  
**Objetos visibles:**

- `MissingNodeField` elimina de forma autorada 3 nodos entre 1812–1832;
- quedan anillos de coordenada vacíos a opacity `0.30`;
- líneas de represión nacen y regresan al state/security grid;
- figuras públicas se retiran hacia bordes; no hay víctimas individualizadas;
- surveillance boxes se fijan sobre instituciones, no sobre rostros.

**Acción humana:** los últimos civiles atraviesan una ruta que se cierra detrás de ellos; una figura se detiene ante un nodo clausurado y retrocede. Las fuerzas permanecen como parte del sistema, con microcambios de guardia/postura, no como estatuas heroicas.

**Texto:** `DICTADURA` permanece. `TERRORISMO DE ESTADO` está prohibido como copy visible (lock editorial §2.2).  
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
**Objetos visibles:** el rectángulo seed se expande; dos líneas institucionales se convierten en touchline y halfway guide. Missing nodes, censorship bars y límites de control continúan fuera del rectángulo. Las últimas figuras militares se alejan hacia el perímetro y sus spacing marks alimentan la futura distribución de tribunas, sin equiparar semánticamente ambos grupos.  
**Texto:** todo el lockup de dictadura llega a opacity `0` antes de 1892. No aparece `1978` todavía.  
**Memory line:** sólo un tramo sobreviviente se endereza, entra por el oeste del rectángulo y empieza a curvarse. La máscara wounded sigue visible en su cola.  
**Transformación geométrica:** `controlledRectangle → pitchGuide`, progreso `0→0.92`; completar exactamente en 1908, no antes.  
**Color:** el interior del rectángulo recupera `skyBluePale` desde opacity `0.08→0.30`; exterior permanece gray-blue. Gold `0`.  
**Profundidad:** seed por encima de grid, debajo de memory line.  
**Salida:** frame 1907 y 1908 deben diferir sólo por el último 8% de cierre y el inicio del estadio; nada desaparece.

### 8.10 Bloque G — 1908–1937 / nace el estadio desde la grilla controlada

**Tiempo musical:** anchor obligatorio 1908. La energía deportiva emerge y desplaza gradualmente el pedal sombrío.  
**Cámara:** desde `(3725,2190,0.96,0°)` hacia `stadiumWest`; leve push, sin corte.  
**Objetos visibles:** `FootballPitch` completa touchlines, center line y círculo; latitude curves se arquean como bowl de estadio; 6–8 player rigs se construyen desde route nodes y entran caminando/trotando a posiciones; crowd strokes todavía al `0.10–0.22`. Missing rings y censorship bars sobreviven sólo en el borde durante la entrada y caen por debajo de `0.10` al terminar el bloque.  
**Texto:** `1978` comienza a entrar en 1928, opacity `0→0.35`; no hay anthem todavía.  
**Memory line:** morph hacia open stadium ellipse `0→0.45`; recorre la entrada oeste y parte del perímetro.  
**Acción humana:** jugadores cruzan líneas todavía en crecimiento; dos intercambian posición mientras goalkeeper ocupa el arco. La cancha se termina alrededor de cuerpos ya activos.  
**Transformación:** grid rectangular y estadio comparten exactamente los mismos cuatro corner anchors. Los route nodes se convierten en player start positions.  
**Color/opacidad:** interior `skyBluePale 0.36→0.58`; pitch `deepBlueSoft 0.55`; exterior `grayBlue 0.28→0.08`; gold `0`.  
**Parallax:** pitch y grid factor 1; crowd factor 1.02; exterior no se aplana.  
**Salida:** en 1937 el estadio es inequívoco, pero la fecha aún no domina.

### 8.11 Bloque H — 1938–1973 / 1978 y celebración pública

**Tiempo musical:** crecimiento rítmico; sin falso cambio de régimen.  
**Cámara:** push/track hacia stadium center; zoom `1.04→1.14`, rotación `0→-2°`.  
**Objetos visibles:** stadium bowl se completa; crowd pattern sube a `0.48`; 8–12 players toman formation; la pelota circula en dos pases previos; flags/crowd strokes expanden el lenguaje nacional desde el estadio hacia el atlas cercano. Las marcas políticas dejan de ser legibles durante el centro del bloque.  
**Texto:**

- `1978`: opacity `0.35→1` entre 1938–1950;
- `ARGENTINA · CAMPEÓN DEL MUNDO`: entra 1950–1970, max 460 px, deep blue;
- posiciones estabilizadas con anchor `(3900,1920)`.

**Memory line:** alcanza open stadium ellipse completa en 1956 y se mantiene sky blue; no recibe gold.  
**Acción humana:** jugadores realizan jog, giro y recepción con pose tracks compartidos; la pelota nunca se mueve sola sin respuesta corporal.  
**Transformación:** una `RouteLine` independiente nace de los dos pases y prepara la trayectoria de ataque sobre la grilla.  
**Color:** saturación aumenta en pitch, stadium y atlas nacional cercano; exterior político cae a background residual. Gold `0`.  
**Profundidad:** crowd 45, ball route 48, memory line 40, texto 70.  
**Salida:** ball marker listo en punto inicial; celebración todavía no llegó al máximo.

### 8.12 Bloque I — 1974–2015 / acción deportiva nacional

**Tiempo musical:** pulso deportivo activo; el movimiento concluye exactamente en el acento 2016.  
**Cámara:** arco editorial poco profundo hacia `(4090,2140)`; rotación llega gradualmente a `-3°`.  
**Objetos visibles:** ball route cruza el pitch; un atacante recibe, acelera y ejecuta el movimiento de gol; defenders/goalkeeper reaccionan; crowd strokes responden en ondas de baja frecuencia. No hay retrato detallado. Trophy outline permanece a opacity `0.08` hasta el final.  
**Texto:** fecha y evento se mantienen. Anthem:

```text
CORONADOS
DE GLORIA VIVAMOS
```

Primera línea entra 1988–1998; segunda 1998–2010. Ambas deep blue, nunca gold.  
**Memory line:** estable como boundary; pequeños pulsos de opacity `±0.06`, sin deformación elástica.  
**Acción humana:** el tracking de cámara acompaña atacante/pelota; el jugador transfiere peso, goalkeeper se desplaza y el equipo comienza a converger sólo después de la definición.  
**Transformación:** `FootballTrajectory` llega al goal anchor en 2015; el impacto visual se reserva para 2016.  
**Color/opacidad:** pitch/crowd sky blue hasta `0.78`; atlas nacional cercano `0.38–0.52`; las marcas de censura/missing nodes no permanecen legibles durante la jugada. Gold todavía `0`.  
**Profundidad:** jugadores, pelota y crowd dominan sin que la grilla política compita semánticamente con el gol.  
**Salida:** frame 2015 contiene contacto inminente; no anticipar trophy gold.

### 8.13 Bloque J — 2016–2046 / trofeo y gold restringido

**Tiempo musical:** impacto secundario fuerte en 2016; máximo adicional alrededor de 2043.  
**Cámara:** pequeña elevación ceremonial; zoom `1.08→0.96` hacia el inicio del pullback.  
**Objetos visibles:** goal-impact ring una sola vez; jugadores completan carrera y se agrupan; uno o varios levantan el trophy simplificado, que se dibuja desde eje vertical; crowd llega a máximo `0.56`, sin partículas.  
**Texto:** anthem plenamente legible; event label estable hasta 2038 y empieza a salir después.  
**Memory line:** continúa sky blue. El gold no recorre toda la boundary. Trophy, goal ring y un único crowd pulse usan `goldMuted/goldLight`.  
**Acción humana:** celebración breve de equipo con convergencia/levantamiento, sin loop jubiloso infinito; el trophy alcanza altura máxima después de que manos/cuerpos lo impulsen.  
**Transformación:** trophy stroke draw 2016–2032; fill/hatch gold máximo `0.82`; ring se desvanece antes de 2034.  
**Color:** estadio y atlas nacional saturados; gold cubre menos de 8% del frame y se mantiene matte.  
**Profundidad:** trophy layer 52; crowd detrás; no se exige que la dictadura permanezca visible durante el levantamiento.  
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
- `ISLAS MALVINAS · RECLAMO ARGENTINO DE SOBERANÍA` queda para el tramo posterior a 2171, cuando la geografía sea legible; nota secundaria opcional: `BAJO ADMINISTRACIÓN BRITÁNICA`.

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
**No debe:** crear fondo independiente; nace del atlas controlado, pero durante la acción deportiva puede desplazar visualmente sus marcas políticas hacia el borde.

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

### 9.14 Sistema reutilizable de personas y acciones

#### `ActorRig2D`

```ts
interface ActorRig2DProps {
  rigId: string;
  pose: string;
  poseMix?: {from: string; to: string; progress: number};
  position: readonly [number, number];
  rotation: number;
  scale: number;
  facing: -1 | 1;
  paletteRole: 'civilian' | 'military' | 'worker' | 'sport-home' | 'sport-away';
  detailLevel: 'map' | 'midground' | 'hero';
}
```

Rig base con joints `head`, `neck`, `shoulders`, `elbows`, `hands`, `hips`, `knees`, `feet` y props opcionales. Las poses interpolan transforms de grupos; no morph arbitrario de toda la silueta por frame. Rigs históricos comparten skeleton y reemplazan contour sets de ropa/props.

#### `ActionTrackPlayer`

```ts
interface ActionTrackPlayerProps {
  track: ActorTrack;
  globalFrame: GlobalFrame;
  rigId: string;
}
```

Evalúa posición, pose, facing y profundidad desde data. Es la única capa que traduce `ActorTrack` a `ActorRig2D`; ninguna escena escribe lógica de caminar/correr.

#### `ActorGroup`

```ts
interface ActorGroupProps {
  formationId: string;
  memberRigIds: readonly string[];
  pathId: string;
  progress: number;
  spacing: number;
  depthFalloff: number;
  action: 'walk' | 'march' | 'run' | 'retreat' | 'converge' | 'disperse';
  seed: number;
}
```

Distribuye grupos con variación determinista de fase/escala. Se usa para delegados, migrantes, soldiers, teams y small political groups. No usar para multitudes masivas.

#### `WalkCycle` / `RunCycle`

- Curvas cerradas de pose de 12 frames base a 30 fps.
- Velocidad de pies derivada de avance para evitar sliding.
- Variantes: civilian, soldier, worker, football.
- Fase derivada de `seed + distanceTravelled`, no de tiempo local arbitrario.

#### `HorseRig` + `MountedRider`

```ts
interface MountedRiderProps {
  riderRigId: string;
  horseRigId: string;
  track: ActorTrack;
  gait: 'walk' | 'climb';
  flagId?: string;
}
```

Horse gait de 8 poses; rider pelvis/torso reciben offset de montura. San Martín se construye como mounted actor sobre el mismo formation path que la columna, con framing de cámara específico pero sin una animación one-off.

#### `FlagRig`

```ts
interface FlagRigProps {
  anchorTrackId: string;
  windVector: readonly [number, number];
  amplitude: number;
  phase: number;
  stripeMode: 'argentina' | 'abstract';
  tension: number;
}
```

Paño mediante 4–6 control columns y 3–5 ondas autoradas. La bandera responde al mismo `WindField` de la escena. No usar noise por frame. Debe funcionar montada, transportada o izada.

#### `ArmyColumn`

Combina `ActorGroup`, `MountedRider`, `FlagRig` y optional pack/vehicle tracks sobre un formation path. Props: `formationId`, `routeId`, `marchProgress`, `frontActorId`, `depthCount`, `windFieldId`. Usos: Andes, fuerzas 1976, Malvinas; cada caso cambia rigs/acciones, no arquitectura.

#### `CrowdFlow`

```ts
interface CrowdFlowProps {
  fieldId: string;
  maskId: string;
  count: number;
  flow: 'arrive' | 'gather' | 'respond' | 'fragment' | 'withdraw' | 'stadium-wave';
  progress: number;
  density: number;
  seed: number;
  rigSet: readonly string[];
}
```

Usa paths de flow precomputados y 8–12 variantes de rig. Crowd no es un patrón estático: cada modo tiene entrada, dirección y respuesta. Para estadio, puede consolidarse en `<use>`/compound paths después de la fase de entrada, conservando waves por grupos.

#### `VehicleOnRoute`

```ts
interface VehicleOnRouteProps {
  vehicleId: 'ship' | 'train' | 'military-truck' | 'civilian-car';
  routeId: string;
  progress: number;
  scale: number;
  suspensionPhase?: number;
  trailMode: 'none' | 'wake' | 'rail' | 'institutional-track';
}
```

Orienta el vehículo por tangente y permite que wake/rail/track se transforme en otra geometría. No usar translate lineal desconectado del path.

#### `SportsActor`

```ts
interface SportsActorProps {
  actorId: string;
  role: 'ball-carrier' | 'defender' | 'goalkeeper' | 'teammate';
  actionTrack: ActorTrack;
  ballTrackId?: string;
  contactFrames: readonly GlobalFrame[];
  kitRole: 'argentina' | 'opponent';
}
```

Pose library: jog, receive, dribble-left/right, accelerate, evade, strike, save-attempt, decelerate, celebrate, trophy-lift. Contacto de pelota se fija por frames explícitos; la pelota no se parenta permanentemente al pie.

#### `TeamFormation`

Define player start/end nodes, passing graph y converge/disperse cues. 1978, 2021 y 2022 comparten el mismo sistema; cambia el graph. Defenders pueden convertirse en trazos al quedar atrás, pero su acción se completa antes de simplificarse.

#### `BallTrack`

Path independiente con `contactFrames`, curvas aéreas/rasantes y ownership cues. La `MemoryLine` puede copiar su geometría sólo en beats narrativamente bloqueados (1986/2022); no todas las pelotas se vuelven memory line.

#### `SilhouetteToGeometryBridge`

Transforma partes estructurales de una figura/objeto en líneas del atlas mediante mapping autorado de anchors. Ejemplos:

- uniforme/figura de Videla → barras de control;
- paso/casco de columna → timeline ticks;
- crowd tangents → viento;
- trophy axis → longitude;
- player trajectory → laurel/thread.

No es un crossfade genérico: requiere mapping explícito `sourceAnchor → targetAnchor`.

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

### 10.1A Coreografía humana

- Toda figura principal visible más de 18 frames tiene al menos dos pose/action keyframes distintos.
- Toda figura secundaria visible más de 30 frames cambia posición o formación; un breathing loop aislado no alcanza.
- El movimiento de pies/cascos/ruedas corresponde a distancia recorrida para evitar sliding.
- Entrada de actor: se construye desde route node, contour o foreground reveal; no pop por opacity solamente.
- Salida de actor: abandona frame, se ocluye por elemento narrativo o transfiere anchors a geometría siguiente.
- Los grupos no comparten fase exacta; offsets provienen de seed estable.
- Mirada/facing sigue dirección de acción, no cámara por defecto.
- Personajes históricos no reciben pose de poster antes de ejecutar acción.

### 10.1B Densidad progresiva

- Scene data debe contener al menos tres `DensityCue`: inicial, máximo y salida.
- Foreground se incorpora después de establecer orientación básica, salvo cuando sea el seed heredado.
- D4/D5 dura el mínimo necesario para leer acción; luego se simplifica.
- No más de dos acciones humanas primarias compiten simultáneamente.
- Background puede continuar construyéndose mientras midground actúa, pero con contraste menor.

### 10.1C Props y entorno reactivo

- Flags responden a `WindField`; smoke responde a evento concreto y se convierte en hatching/control geometry.
- Vehículos siguen paths y dejan geometría útil: wake, rail, institutional track.
- Arquitectura se construye en orden funcional mientras personas llegan/actúan; no espera terminada desde el primer frame.
- Landscape contours pueden elevarse, densificarse o convertirse en terrain; no son fondos inmóviles.
- Ball y trophy sólo se mueven como consecuencia de acción corporal.

### 10.1D Transformación primaria

- Cada `SceneBridge` incluye `sourceObjectId`, `targetFunction` y anchor mapping.
- Un fade puede reducir detalle secundario, pero el objeto superviviente mantiene geometry/position continua.
- Transformación inicia antes del último 20% de la escena, no después de que toda acción termina.
- La cámara debe poder observar la transformación o participar en ella; no viajar después hacia un resultado ya finalizado.

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
- Hero/midground rigs: máximo 14 simultáneos con joints individuales; figuras adicionales deben consolidarse mediante `<use>`, compound paths o detail-level `map`.
- Cada `ActorRig2D` hero/midground: objetivo `≤ 24` paths; map actor `≤ 6` paths.
- Sports scenes: máximo 12 rigs detallados visibles; stadium crowd se agrupa por sectors, no por persona React.
- Missing nodes: máximo 24 instancias en benchmark; sólo 3–7 se remueven dentro del rango.
- Isobars/wind: máximo 16 paths visibles simultáneos.

### 11.2 Cálculo geométrico

- Geometría y path lengths precomputados a nivel de módulo.
- Pose libraries son matrices/transforms inmutables; no recalcular skeleton constraints por frame.
- `ActionTrack` se evalúa una vez por actor/frame y comparte resultado con cámara, props y rig.
- Crowd/army formation paths se precomputan por seed; sólo progress cambia por frame.
- Registry y scene data son objetos `readonly`.
- No parsear SVG strings ni medir DOM por frame.
- Evaluar cámara, palette y memory line una vez por frame; distribuir por context.
- Memoizar componentes estáticos por props escalares.
- No usar arrays nuevos de cientos de puntos si el frame no cambia el morph.

### 11.3 Montaje de capas

- `MemoryLine`, paper y atlas base permanecen montados.
- Rigs principales permanecen montados durante su action range para evitar pops de DOM; detail-level puede bajar antes del unmount.
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

### 12.2A Vida cinematográfica

- [ ] En todo intervalo de 24 frames ocurre al menos una acción narrativa significativa; grain/parallax solo no cuenta.
- [ ] Ningún bloque comienza con foreground, midground y background ya completos.
- [ ] Cada bloque recorre construcción → acción → simplificación/transformación.
- [ ] La cámara sigue o revela sujetos/geometry activos; nunca se limita a visitar composiciones quietas.
- [ ] Actores visibles más de 18 frames ejecutan al menos dos cambios de pose/acción.
- [ ] No hay foot sliding, vehículos fuera de path ni pelota moviéndose sin acción corporal asociada.
- [ ] Foreground produce parallax/oclusiones controladas sin tapar la memory line.
- [ ] Scene transitions se comprenden sin depender de fades globales.

### 12.3 Tratamiento histórico/editorial

- [ ] `1976` es pequeño y no tiene impacto monumental, gold ni hero framing.
- [ ] La frase `TERRORISMO DE ESTADO` no aparece en ningún texto visible (lock editorial §2.2); el período se nombra sólo `DICTADURA`.
- [ ] Military/state control se origina en la capa institucional.
- [ ] Represión/censura/vigilancia/desapariciones se distinguen mediante acciones visuales diferentes.
- [ ] Missing nodes se perciben como ausencias autoradas, no partículas decorativas.
- [ ] No aparecen pañuelos blancos ni símbolos de una organización específica de derechos humanos.
- [ ] No hay violencia gráfica.
- [ ] Fuerzas/vehículos ocupan el espacio en 1976; el takeover no se reduce a líneas abstractas inmóviles.
- [ ] Videla aparece brevemente integrado a la estructura, ejecuta una acción limitada y se transforma/absorbe en la maquinaria institucional; no funciona como poster ni héroe.
- [ ] 1978 se percibe como celebración deportiva nacional genuina, no como propiedad ni propaganda automática del régimen.
- [ ] Jugadores entran, se posicionan, actúan y celebran; cancha/tribunas se construyen progresivamente alrededor de ellos.
- [ ] Grid controlado y censura son legibles en la entrada/salida de 1978, pero no compiten con gol, crowd y trophy durante el centro de la celebración.
- [ ] Malvinas muestra `RECLAMO ARGENTINO DE SOBERANÍA`; la nota `BAJO ADMINISTRACIÓN BRITÁNICA` es secundaria.
- [ ] Soldados argentinos reciben escala humana, ayuda mutua, deber y sacrificio sin gore ni combate inventado.
- [ ] Ningún líder político se convierte en protagonista sostenido del período o del film.

### 12.4 Memory line y morphing

- [ ] Civic timeline → wounded line → stadium boundary → isobar/route se lee como un solo objeto lógico.
- [ ] No hay self-intersections accidentales, pops o cambios de stroke width.
- [ ] La stadium boundary no recibe gold completo.
- [ ] Gold se limita a trophy/goal-impact/un crowd pulse en 1978 y ocupa `< 8%` del frame.
- [ ] La ruta oceánica en 2171 sigue activa; no se adelanta su interrupción posterior.

### 12.5 Cámara

- [ ] Camera path coincide con la tabla §4.4.
- [ ] No hay shake, overshoot ni zoom social-media.
- [ ] Límites de velocidad §4.5 respetados.
- [ ] El pullback de salida de 1978 reconecta estadio, atlas nacional y contexto histórico sin disminuir la celebración.
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

Sólo después de aprobar todos los ítems obligatorios se habilita extender el sistema al resto de los 3150 frames. Si el benchmark falla en continuidad de memory line, cámara o apertura progresiva desde grilla controlada hacia celebración nacional, no se debe compensar con transiciones one-off; debe corregirse el sistema compartido.

---

## 13. Orden recomendado para la futura implementación

Este orden minimiza retrabajo; no forma parte de la ejecución de esta etapa.

1. Corregir metadata de composiciones y configurar `assets` como public dir.
2. Implementar `GlobalFrameProvider` y `MasterAudio`; validar offset con tono/anchor visual temporal.
3. Implementar `AtlasCanvas`, camera evaluator y camera debug overlay.
4. Implementar palette, fonts y line-style tokens.
5. Crear path registry y `MemoryLine` con los cinco estados del benchmark.
6. Implementar `ActorRig2D`, action-track evaluator, walk/run cycles y group formations con debug skeletons.
7. Implementar `VehicleOnRoute`, `CrowdFlow`, `SportsActor`, `TeamFormation` y camera subject cues.
8. Implementar control grid, missing nodes y censorship masks; coreografiar fuerzas/vehículos/Videla del benchmark.
9. Implementar pitch/stadium compartiendo anchors con la grilla; coreografiar jugadores/ball/trophy.
10. Implementar ocean field y stadium→isobar bridge.
11. Agregar labels/anthem con estabilización.
12. Integrar micro-bloques §8, validar density schedule y retirar todos los debug overlays.
13. Renderizar frames QA y benchmark completo.
14. Revisar contra checklist §12 antes de tocar otra escena.

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

---

## 15. Global transition registry — no-slide contract

Cada boundary del film debe registrarse con estos IDs antes de implementar escenas completas.

| Boundary | Objeto heredado | Acción al cruzar | Transformación física | Objeto resultante |
|---|---|---|---|---|
| 01→02 | `memoryLine.atlantic` | barcos avanzan hacia estuario | wave crest levanta barcos/rutas de invasión | `rioPlate.waveRoute` |
| 02→03 | `imperialConnection.broken` | conexión pierde segmentos | extremos rotan y trazan eje/laterales | `cabildo.architectureSeed` |
| 03→04 | `civicPulse.1810` | atraviesa crowd y sale de plaza | pulse ensancha en flag ribbon/route | `campaignRoute.independence` |
| 04→05 | `andesContour + brokenLink` | ejército deja ruta detrás | contour se aplana; links se vuelven escritura | `declaration.pageRules` |
| 05→06 | `declaration.perimeter + provinceEndpoints` | endpoints tiran del sello/perímetro | hoja se fragmenta en regiones/caminos | `civilConflict.regionalSystem` |
| 06→07 | `conflictIntersections` | routes rivales curvan dirección | crossings se regularizan como nodes | `nationalOrganization.network` |
| 07→08 | `network.atlanticEdge` | edge sale del continente | se arquea y multiplica en migration routes | `migration.atlanticRoutes` |
| 08→09 | `rail.track + stationClock` | tren acelera hacia ciudad | sleepers→factory windows; clock→gauge | `industrialCivic.rhythm` |
| 09→10 | `civicTimeline.intercepted + newspaper.rules` | Monte Chingolo blast→reconstructed press; Triple A/security/crisis saturate anchors | newspaper rules→controlled grid/discontinuous ranges | `memoryLine.woundedTimeline` |
| 10→11 | `institutionalRectangle + vehicleTracks` | figuras se retiran al perímetro | rectangle/tracks→pitch guides | `pitch1978.seed` |
| 11→12 | `stadiumEllipse + crowdTangents` | cámara se eleva y crowd se alinea | ellipse→isobar; crowd→wind; trophy axis→longitude | `southAtlantic.field` |
| 12→13 | `interruptedRoute + civicLine` | 1983 reabre nodes | civic curve→center circle/dribble lane | `pitch1986.actionSpace` |
| 13→14 | `maradonaTrajectory.gold` | sale del trophy/laurel | pitch marks comprimen en years | `memoryThread.buried` |
| 14→15 | `paperFissure + buriedThread` | city flow colapsa y reaparece | fissure rota vertical; thread pasa debajo | `newCentury.timeline` |
| 15→16 | `messiTrajectory + year2014` | actor asciende y llega al tick | year line se aplana como pitch center | `pitch2014.opportunity` |
| 16→17 | `incompleteLaurel.leaf` | carrera se detiene; leaf queda | leaf escala/rota en South America | `southAmerica.2021` |
| 17→18 | `parallelThreads + teamCircle` | team converge y gira | círculo abre flight arc/double strand | `qatar2022.entryRoute` |
| 18→19 | `completedLaurel + mergedLine` | trophy action libera leaves | veins→rail/street/field/science routes | `contemporary.network` |
| 19→end | `contemporaryNetwork` | acciones convergen y se reducen | routes→map→LIBERTAD→title | `argentina.finalLockup` |

### 15.1 Datos obligatorios por boundary

```ts
interface GlobalTransitionSpec {
  id: string;
  range: FrameRange;
  inheritedObjectId: string;
  incomingActionId: string;
  sourceAnchors: readonly string[];
  targetAnchors: readonly string[];
  survivingObjectId: string;
  cameraMove: CameraMove;
  maxFadeContribution: number; // <= 0.35
}
```

### 15.2 Criterios globales para el film completo

- [ ] Las 19 escenas declaran protagonista, action tracks, density cues, camera subject cues, inherited y surviving IDs.
- [ ] Los 18 boundaries están presentes en `GlobalTransitionRegistry`.
- [ ] Ningún boundary depende principalmente de fade.
- [ ] Ningún tramo de más de 24 frames se sostiene sólo con pan sobre un dibujo inmóvil.
- [ ] Scene 07 muestra integración territorial/autoridad efectiva, frontera activa y presencia indígena sin reducir todo el proceso a ocupación ni fingir control instantáneo del mapa moderno.
- [ ] Scene 09 presenta incorporación obrera/industrial y personalismo peronista en el mismo sistema visual.
- [ ] Montoneros/ERP aparecen como organizaciones guerrilleras revolucionarias con acciones y targets concretos; los nodos de víctimas anteriores a 1976 incluyen civiles, políticos, sindicalistas, policías y militares según hechos verificados.
- [ ] Monte Chingolo identifica arsenal, lugar y fecha; la explosión es arquitectónica/no gráfica y la tapa siguiente dice `RECREACIÓN GRÁFICA` + `TERRORISMO: EL ERP ATACA UN ARSENAL MILITAR` sin masthead real.
- [ ] Triple A está nombrada y visualmente separada de guerrilla, protesta cívica, Fuerzas Armadas regulares y represión ilegal.
- [ ] San Martín/columna, crowds de 1810, migrantes, grupos políticos, fuerzas 1976, jugadores 1978, soldados de Malvinas, Maradona y Messi ejecutan acciones visibles.
- [ ] 1986 contiene una secuencia corporal completa de avance/evasión/gol, no sólo path + número 10.
- [ ] 2014, 2021 y 2022 distinguen oportunidad, equipo y resolución mediante coreografías diferentes.
- [ ] La cámara alterna follow/lead/lateral/descend/rise/pullback según §2B; no usa un único travelling de atlas.
- [ ] Cada escena alcanza densidad progresivamente y simplifica antes de transformarse.
- [ ] Personajes no desplazan a Argentina como protagonista histórica; humanizan acciones dentro del sistema cartográfico.
- [ ] La memory line sigue siendo una única identidad lógica aun cuando copia temporalmente la trayectoria de sujetos.

Este registry es un gate previo a producir escenas fuera del benchmark. Claude no debe inventar una transición local si el boundary correspondiente no está definido aquí.
