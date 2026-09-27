// Node loader hook for validation scripts: bundler-only assets (fonts, CSS,
// audio) resolve to an empty module when evaluated outside the bundle.
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function load(url, context, next) {
  if (/\\.(woff2?|css|wav|mp3|png)$/.test(url)) {
    return { format: "module", source: "export default '';", shortCircuit: true };
  }
  return next(url, context);
}`),
);
