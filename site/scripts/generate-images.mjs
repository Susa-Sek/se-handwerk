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

const SLOTS = [
  {
    name: 'detail-uebergabe.jpg',
    prompt:
      `${STYLE} Vertical 4:5 composition. A freshly renovated, empty German apartment interior at handover: ` +
      'matte white plaster walls, light oak flooring, a clean doorway and window with soft daylight. ' +
      'Quiet, precise, bezugsfertig — the calm after the work is done.',
  },
  {
    name: 'interior-01.jpg',
    prompt:
      `${STYLE} Wide 16:7 landscape composition. A fully renovated, unfurnished living space just handed over: ` +
      'open room, large window with soft daylight, light wood floor, matte white walls, architectural perspective, ' +
      'a sense of order and completion. Real-estate documentation feel, restrained.',
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

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download HTTP ${res.status} for ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
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
