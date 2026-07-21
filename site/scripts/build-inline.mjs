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

// 3a) rewrite runtime-constructed image paths to use the inlined data-URI map.
// The minifier renames the interpolated variable per build (e.g. `rp[e.code]`),
// so match the pattern generically rather than a fixed token. Covers both
// `url(/images/${EXPR})` (CSS backgrounds) and bare `/images/${EXPR}` (img src).
const beforeJs = js;
js = js.replace(
  /`url\(\/images\/\$\{([^`}]+)\}\)`/g,
  (_m, e) => '`url(${globalThis.__IMG[' + e + ']||"/images/"+' + e + '})`',
);
js = js.replace(
  /`\/images\/\$\{([^`}]+)\}`/g,
  (_m, e) => '`${globalThis.__IMG[' + e + ']||"/images/"+' + e + '}`',
);
if (js === beforeJs) {
  console.error('WARN: no runtime image path token found — check the bundle');
}

// 3b) inline any static /images/<file> references (e.g. the logo in Nav/Footer)
for (const [name, uri] of Object.entries(imgMap)) {
  js = js.replaceAll(`/images/${name}`, uri);
  css = css.replaceAll(`/images/${name}`, uri);
}

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
