// Erzeugt WebP-Varianten zu allen JPG/PNG unter public/images (Original bleibt als
// Fallback). Ausnahmen: og-image (Social-Scraper) und favicon. Einmalig laufen lassen:
//   node scripts/generate-webp.mjs
import { readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';
import sharp from 'sharp';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');
const SKIP = new Set(['og-image', 'favicon']);

const files = await readdir(DIR);
let made = 0;
for (const f of files) {
  const ext = extname(f).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
  const name = basename(f, ext);
  if (SKIP.has(name)) continue;
  const src = join(DIR, f);
  const dest = join(DIR, `${name}.webp`);
  try {
    await stat(dest); // schon vorhanden -> überspringen
    continue;
  } catch {
    /* not there yet */
  }
  await sharp(src).webp({ quality: 78 }).toFile(dest);
  made++;
  process.stdout.write(`→ ${name}.webp\n`);
}
console.log(`\nFertig: ${made} WebP-Dateien erzeugt.`);
