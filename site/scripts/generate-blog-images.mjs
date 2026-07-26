// Generates dedicated hero photography for the blog articles via kie.ai
// (nano-banana). Separate from generate-images.mjs so it never overwrites the
// existing site imagery. Run: node --env-file=.env.local scripts/generate-blog-images.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

if (process.env.NODE_USE_ENV_PROXY == null && (process.env.HTTPS_PROXY || process.env.https_proxy)) {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, ['--env-file=.env.local', fileURLToPath(import.meta.url)], {
    stdio: 'inherit',
    env: { ...process.env, NODE_USE_ENV_PROXY: '1' },
  });
  process.exit(r.status ?? 0);
}

const API_KEY = process.env.KIE_AI_API_KEY;
if (!API_KEY) { console.error('Missing KIE_AI_API_KEY'); process.exit(1); }
const BASE = 'https://api.kie.ai/api/v1';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

const STYLE =
  'Bright editorial architectural photograph, realistic and inviting, natural soft daylight, ' +
  'honest materials, true-to-life — not a glossy render, not oversaturated, subtle real texture. ' +
  'No people, no tools in hands, no text, no watermark, no logos.';

const SLOTS = [
  {
    name: 'blog-vinyl.jpg',
    prompt: `${STYLE} Wide 16:9. Close-up of modern light oak-look vinyl design plank flooring freshly installed in a bright room, clean tight seams, warm daylight raking across the surface, shallow depth of field.`,
  },
  {
    name: 'blog-laminat-vinyl.jpg',
    prompt: `${STYLE} Wide 16:9. Two wood-look floor plank samples — one laminate, one vinyl — laid side by side on a bright neutral surface, soft daylight, realistic wood grain, calm minimal composition.`,
  },
  {
    name: 'blog-sanierung.jpg',
    prompt: `${STYLE} Wide 16:9. A freshly renovated bright empty apartment interior at handover, matte white walls, new light oak floor, a large window with soft daylight, clean and move-in ready.`,
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
  if (!taskId) throw new Error(`No taskId: ${JSON.stringify(json)}`);
  return taskId;
}
function extractUrls(data) {
  const tryParse = (v) => { if (!v) return null; if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } } return v; };
  const j = tryParse(data?.resultJson) || tryParse(data?.result) || data;
  return j?.resultUrls || j?.result_urls || data?.response?.resultUrls || (data?.imageUrl ? [data.imageUrl] : null) || (j?.imageUrl ? [j.imageUrl] : null) || null;
}
async function pollTask(taskId) {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`${BASE}/playground/recordInfo?taskId=${taskId}`, { headers: { Authorization: `Bearer ${API_KEY}` } });
    const json = await res.json();
    const data = json.data || {};
    const state = String(data.state ?? data.status ?? '').toLowerCase();
    const urls = extractUrls(data);
    if (['success', 'succeeded', 'completed', 'complete'].includes(state) && urls?.length) return urls;
    if (urls?.length) return urls;
    if (['fail', 'failed', 'error'].includes(state)) throw new Error(`Task failed: ${data.failMsg || JSON.stringify(data)}`);
    process.stdout.write('.');
    await sleep(3000);
  }
  throw new Error(`Task ${taskId} timed out`);
}
async function optimize(buf) {
  try {
    const { default: sharp } = await import('sharp');
    return await sharp(buf).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  } catch { return buf; }
}
async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
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
      console.log(` ✓ saved`);
    } catch (e) { console.log(`\n  ✗ ${slot.name}: ${e.message}`); }
  }
  console.log('\nDone.');
}
main();
