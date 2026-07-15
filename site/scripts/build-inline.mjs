// Bundles the built dist/ into a single self-contained HTML body fragment:
// CSS inlined, fonts + images embedded as data URIs, JS inlined. Output is
// meant for a Claude Artifact (strict CSP, no external hosts). The Artifact
// wrapper supplies <!doctype>/<head>/<body>, so we emit body content only.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const assetsDir = join(dist, 'assets');
const assets = readdirSync(assetsDir);
const jsFile = assets.find((f) => f.endsWith('.js'));
const cssFile = assets.find((f) => f.endsWith('.css'));

let js = readFileSync(join(assetsDir, jsFile), 'utf8');
let css = readFileSync(join(assetsDir, cssFile), 'utf8');

// 1) fonts → data URIs inside the CSS
css = css.replace(/url\(\/fonts\/([^)]+)\)/g, (_m, name) => {
  const b = readFileSync(join(dist, 'fonts', name));
  return `url(data:font/woff2;base64,${b.toString('base64')})`;
});

// 2) images → data-URI map, keyed by filename
const imgMap = {};
for (const f of readdirSync(join(dist, 'images'))) {
  if (!/\.(jpe?g|png|webp)$/i.test(f)) continue;
  const b = readFileSync(join(dist, 'images', f));
  const mime = f.endsWith('.png') ? 'image/png' : f.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  imgMap[f] = `data:${mime};base64,${b.toString('base64')}`;
}

// 3) rewrite the runtime image path (`/images/${e}`) to use the embedded map
if (!js.includes('`/images/${e}`')) {
  console.error('WARN: expected image path token not found — check the bundle');
}
js = js.replaceAll('`/images/${e}`', '(globalThis.__IMG[e]||`/images/${e}`)');

// 4) assemble the body fragment
const body = [
  '<div id="root"></div>',
  `<style>${css}</style>`,
  `<script>globalThis.__IMG=${JSON.stringify(imgMap)};</script>`,
  `<script type="module">${js}</script>`,
].join('\n');

const outFile = new URL('../se-handwerk-preview.html', import.meta.url).pathname;
writeFileSync(outFile, body);
const kb = (Buffer.byteLength(body) / 1024).toFixed(0);
console.log(`wrote ${outFile} (${kb} kB, ${Object.keys(imgMap).length} images inlined)`);
