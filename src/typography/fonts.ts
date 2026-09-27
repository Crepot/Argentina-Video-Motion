import cormorant600 from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2";
import cormorant600Ext from "@fontsource/cormorant-garamond/files/cormorant-garamond-latin-ext-600-normal.woff2";
import sourceSans500 from "@fontsource/source-sans-3/files/source-sans-3-latin-500-normal.woff2";
import sourceSans500Ext from "@fontsource/source-sans-3/files/source-sans-3-latin-ext-500-normal.woff2";
import { cancelRender, continueRender, delayRender } from "remotion";

/**
 * Locked faces (§2.7): Cormorant Garamond SemiBold 600 for dates and anthem,
 * Source Sans 3 Medium 500 for events, coordinates and notes. Both are
 * bundled from local OFL-1.1 packages; nothing is fetched from the network.
 */
export const FONT_DISPLAY = "'Cormorant Garamond'";
export const FONT_SANS = "'Source Sans 3'";

const LATIN_EXT_RANGE =
  "U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";
const LATIN_RANGE =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";

const faces = [
  {
    family: "Cormorant Garamond",
    weight: "600",
    url: cormorant600,
    range: LATIN_RANGE,
  },
  {
    family: "Cormorant Garamond",
    weight: "600",
    url: cormorant600Ext,
    range: LATIN_EXT_RANGE,
  },
  {
    family: "Source Sans 3",
    weight: "500",
    url: sourceSans500,
    range: LATIN_RANGE,
  },
  {
    family: "Source Sans 3",
    weight: "500",
    url: sourceSans500Ext,
    range: LATIN_EXT_RANGE,
  },
];

let loading: Promise<void> | null = null;

/** Loads every face once per tab and holds the render until they are ready. */
export const loadLocalFonts = () => {
  if (loading || typeof document === "undefined") {
    return;
  }
  const handle = delayRender("Loading local fonts");
  loading = Promise.all(
    faces.map((f) =>
      new FontFace(f.family, `url(${f.url}) format('woff2')`, {
        weight: f.weight,
        style: "normal",
        unicodeRange: f.range,
      }).load(),
    ),
  )
    .then((loaded) => {
      loaded.forEach((face) => document.fonts.add(face));
      continueRender(handle);
    })
    .catch((err) => cancelRender(err));
};
