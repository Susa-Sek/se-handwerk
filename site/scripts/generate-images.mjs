// Generates the site's photography via the kie.ai "nano-banana" model
// (Google Gemini 2.5 Flash Image) and downloads it into public/images/.
//
// Run:  npm run images
//   (needs KIE_AI_API_KEY — kept in site/.env.local, loaded via --env-file)
//
// Requires outbound access to api.kie.ai. In restricted environments add that
// host to the network egress allowlist first, or run this on your own machine.

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// In restricted/proxied environments (e.g. Claude Code on the web) Node's global
// fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY is set *before* the process
// starts — undici snapshots the proxy config at startup, so setting it at runtime
// or via --env-file is too late. Re-exec ourselves once with the flag enabled so
// api.kie.ai stays reachable. On a machine without a proxy this is a no-op.
if (process.env.NODE_USE_ENV_PROXY == null && (process.env.HTTPS_PROXY || process.env.https_proxy)) {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1' },
  });
  process.exit(r.status ?? 0);
}

const API_KEY = process.env.KIE_AI_API_KEY;
if (!API_KEY) {
  console.error('Missing KIE_AI_API_KEY. Put it in site/.env.local, then: npm run images');
  process.exit(1);
}

const BASE = 'https://api.kie.ai/api/v1';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

// Shared art direction — keep every shot in one series: natural, documentary,
// honest, NOT glossy AI-perfect; no people holding tools, no text/watermark.
const STYLE =
  'Editorial architectural documentary photograph, realistic and understated, ' +
  'natural soft daylight, honest materials, subtle real imperfections (fine dust in the light, ' +
  'slightly uneven wall texture), calm cool-neutral color grade with warm daylight, shot on 35mm, ' +
  'true-to-life — not a glossy render, not oversaturated. No people, no tools, no text, no watermark, no logos.';

// Dark, low-key art direction for the SCHWARZ-AUF-WEISS card imagery.
const DARK_STYLE =
  'Moody low-key editorial photograph, dark charcoal ambience, a single warm tungsten/gold accent light, ' +
  'realistic craft subject, subtle grain, shot on 35mm, true-to-life — not a glossy render. ' +
  'No people, no tools in hands, no text, no watermark, no logos.';

// Twin composition for the before/after slider — both images must describe the
// exact same camera setup so the drag comparison reads as one room.
const TWIN =
  'Wide 16:9 shot of an empty rectangular room. One large window centered on the back wall, ' +
  'a door opening on the left wall, camera at chest height, strict one-point perspective, centered symmetrical framing.';

const SLOTS = [
  {
    name: 'vorher.jpg',
    prompt:
      `${TWIN} The room is mid-renovation at day 0: bare grey screed floor, stripped patched plaster walls, ` +
      'a few cables hanging from the ceiling, light construction dust in the air, cool grey daylight. ' +
      'Documentary, honest, no equipment clutter. No people, no text, no watermark.',
  },
  {
    name: 'nachher.jpg',
    prompt:
      `${TWIN} The same room fully renovated at handover: light oak plank floor, matte white plaster walls, ` +
      'clean window with warm soft daylight, crisp shadows, bezugsfertig. ' +
      'Documentary, honest. No people, no furniture, no text, no watermark.',
  },
  {
    name: 'leistung-komplett.jpg',
    prompt:
      `${DARK_STYLE} Vertical 4:5. A gutted apartment mid-renovation at night: raw walls and screed floor, ` +
      'two warm work lights glowing gold in the dark, scaffolding shadows, sense of transformation in progress.',
  },
  {
    name: 'leistung-boden.jpg',
    prompt:
      `${DARK_STYLE} Vertical 4:5. Close-up of light oak parquet planks mid-installation on a dark underfloor, ` +
      'raking warm light across the wood grain, precise seams, shallow depth of field.',
  },
  {
    name: 'leistung-wand.jpg',
    prompt:
      `${DARK_STYLE} Vertical 4:5. Freshly troweled plaster wall in raking warm light, ` +
      'subtle trowel arcs and texture, dark shadow falloff at the edges.',
  },
  {
    name: 'leistung-bad.jpg',
    prompt:
      `${DARK_STYLE} Vertical 4:5. Detail of a modern dark bathroom during finishing: matte black fixtures, ` +
      'large-format dark tiles, one warm spotlight, water-free, precise joints.',
  },
  {
    name: 'leistung-einzel.jpg',
    prompt:
      `${DARK_STYLE} Vertical 4:5. A neat flat-lay of classic hand tools on dark waxed wood — folding rule, ` +
      'pencil, chisel, level — arranged with precision, warm side light, workshop calm.',
  },
  {
    name: 'bento-invest.jpg',
    prompt:
      `${DARK_STYLE} Wide 16:9. A finished, empty premium apartment at dusk seen from the doorway: ` +
      'oak floor reflecting a warm pendant light, deep shadows, city lights faint through the window.',
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createTask(prompt) {
  const res = await fetch(`${BASE}/playground/createTask`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'google/nano-banana', input: { prompt } }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`createTask HTTP ${res.status}: ${json.msg || JSON.stringify(json)}`);
  const taskId = json.data?.taskId || json.data?.task_id;
  if (!taskId) throw new Error(`No taskId in response: ${JSON.stringify(json)}`);
  return taskId;
}

// pull the first image URL out of whatever shape recordInfo returns
function extractUrls(data) {
  const tryParse = (v) => {
    if (!v) return null;
    if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
    return v;
  };
  const j = tryParse(data?.resultJson) || tryParse(data?.result) || data;
  return (
    j?.resultUrls || j?.result_urls || data?.response?.resultUrls ||
    (data?.imageUrl ? [data.imageUrl] : null) || (j?.imageUrl ? [j.imageUrl] : null) || null
  );
}

async function pollTask(taskId) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`${BASE}/playground/recordInfo?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const json = await res.json();
    const data = json.data || {};
    const state = String(data.state ?? data.status ?? '').toLowerCase();
    if (['success', 'succeeded', 'completed', 'complete'].includes(state) || extractUrls(data)) {
      const urls = extractUrls(data);
      if (urls?.length) return urls;
    }
    if (['fail', 'failed', 'error'].includes(state)) {
      throw new Error(`Task ${taskId} failed: ${data.failMsg || data.errorMessage || JSON.stringify(data)}`);
    }
    process.stdout.write('.');
    await sleep(3000);
  }
  throw new Error(`Task ${taskId} timed out`);
}

// Compress the downloaded photo to a web-ready JPEG (mozjpeg, max 1600px on the
// long edge, metadata stripped). The raw model output is ~1.5 MB; this brings it
// to well under 100 kB with no visible loss on these smooth interior shots.
// Falls back to the raw bytes if sharp isn't installed.
async function optimize(buf) {
  try {
    const { default: sharp } = await import('sharp');
    return await sharp(buf)
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
  } catch {
    return buf;
  }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download HTTP ${res.status} for ${url}`);
  await writeFile(dest, await optimize(Buffer.from(await res.arrayBuffer())));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const slot of SLOTS) {
    process.stdout.write(`→ ${slot.name} `);
    try {
      const taskId = await createTask(slot.prompt);
      const urls = await pollTask(taskId);
      await download(urls[0], join(OUT, slot.name));
      console.log(` ✓ saved (${urls[0].slice(0, 60)}…)`);
    } catch (e) {
      console.log(`\n  ✗ ${slot.name}: ${e.message}`);
    }
  }
  console.log('\nDone. Rebuild the site (npm run build) — the photos replace the placeholders automatically.');
}

main();
