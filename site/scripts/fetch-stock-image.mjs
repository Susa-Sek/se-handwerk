// Holt ein lizenzsauberes Stockfoto von Pexels als Fallback für Blog-Hero-Bilder,
// wenn kie.ai (generate-blog-images.mjs) nicht verfügbar ist.
// Pexels-Lizenz: kommerzielle Nutzung erlaubt, keine Namensnennung nötig.
//
// Nutzung:  node --env-file=.env.local scripts/fetch-stock-image.mjs "<suchbegriff>" <dateiname.jpg>
// Beispiel: node --env-file=.env.local scripts/fetch-stock-image.mjs "mold wall renovation" blog-schimmel.jpg
//
// Braucht PEXELS_API_KEY (kostenlos unter https://www.pexels.com/api/).
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Durch den vorkonfigurierten HTTPS-Egress-Proxy leiten (wie beim kie.ai-Skript).
if (process.env.NODE_USE_ENV_PROXY == null && (process.env.HTTPS_PROXY || process.env.https_proxy)) {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, ['--env-file=.env.local', fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1' },
  });
  process.exit(r.status ?? 0);
}

const API_KEY = process.env.PEXELS_API_KEY;
const [query, outName] = process.argv.slice(2);
if (!API_KEY) { console.error('Missing PEXELS_API_KEY'); process.exit(1); }
if (!query || !outName) { console.error('Usage: fetch-stock-image.mjs "<query>" <file.jpg>'); process.exit(1); }

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

async function optimize(buf) {
  try {
    const { default: sharp } = await import('sharp');
    return await sharp(buf).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  } catch { return buf; }
}
async function writeWebp(buf, dest) {
  try {
    const { default: sharp } = await import('sharp');
    await sharp(buf).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest.replace(/\.(jpe?g|png)$/i, '.webp'));
  } catch { /* sharp optional */ }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&size=large&per_page=15`;
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const photos = json.photos || [];
  if (!photos.length) throw new Error(`Keine Treffer für "${query}"`);
  // Aus den besten Treffern eines wählen (etwas Varianz, aber relevant).
  const pick = photos[Math.floor(Math.random() * Math.min(5, photos.length))];
  const src = pick.src?.large2x || pick.src?.original || pick.src?.large;
  console.log(`→ Pexels #${pick.id} von ${pick.photographer} (${pick.url})`);
  const imgRes = await fetch(src);
  if (!imgRes.ok) throw new Error(`Bild-Download HTTP ${imgRes.status}`);
  const raw = Buffer.from(await imgRes.arrayBuffer());
  const dest = join(OUT, outName);
  await writeFile(dest, await optimize(raw));
  await writeWebp(raw, dest);
  console.log(`✓ gespeichert: public/images/${outName} (+ .webp)`);
}
main().catch((e) => { console.error('✗', e.message); process.exit(1); });
