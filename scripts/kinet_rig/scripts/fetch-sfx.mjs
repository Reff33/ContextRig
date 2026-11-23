/* =========================================================
   KinetRig SFX-Kit Downloader & Sync Bridge
   Downloads curated studio WAV sound effects from wyzowl/sfx-kit (CC0)
   with precise transient sync metadata (sync.at).
   Zero runtime dependencies (pure Node.js stdlib).

   Usage:
     node scripts/fetch-sfx.mjs --index         # Download sounds.json metadata (~600KB)
     node scripts/fetch-sfx.mjs --archetypes    # Download core 6 archetypes pack (~2MB)
     node scripts/fetch-sfx.mjs --sound=<id>    # Download single sound by ID
     node scripts/fetch-sfx.mjs --all          # Download entire 320-sound library (~67MB)
   ========================================================= */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SFX_DIR = resolve(__dirname, '../sfx');
const RAW_BASE = 'https://raw.githubusercontent.com/wyzowl/sfx-kit/main';

export const ARCHETYPE_MAP = {
  impact: 'impact-deep-soft',
  sub_reveal: 'tone-step-2',
  card_pop: 'foley-card-touch',
  paper_slide: 'foley-paper-slide',
  card_slide: 'foley-card-slide',
  paper_touch: 'foley-paper-touch',
  soft_tap: 'click-tap-soft',
  whoosh: 'whoosh-medium-soft',
  exit_sweep: 'riser-1s-soft',
  terminal_chirp: 'digital-blip-clear'
};

const CORE_ARCHETYPE_SOUNDS = [
  // 1. Impacts
  'impact-deep-soft',
  'impact-medium-firm',
  // 2. Whooshes & Motion
  'whoosh-fast-soft',
  'whoosh-medium-soft',
  'whoosh-slow-soft',
  // 3. Sub reveals & Tones
  'tone-step-2',
  'tone-ding-mid',
  // 4. Card pops & Chimes
  'pop-small-in',
  'pop-medium-in',
  'tone-ding-high',
  // 5. Exit sweeps & Risers
  'riser-1s-soft',
  'pop-small-out',
  // 6. Terminal chirps & Digital
  'digital-blip-clear',
  'digital-blip-subtle',
  // 7. Tactile Foley & Catalog Materials
  'foley-card-touch',
  'foley-card-slide',
  'foley-paper-touch',
  'foley-paper-slide',
  'click-tap-soft',
  'click-snap-soft'
];

async function downloadFile(url, destPath) {
  const dir = dirname(destPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  writeFileSync(destPath, Buffer.from(arrayBuffer));
}

export async function fetchIndex() {
  const indexPath = resolve(SFX_DIR, 'sounds.json');
  console.log(`📡 Fetching SFX metadata index from wyzowl/sfx-kit...`);
  await downloadFile(`${RAW_BASE}/sounds.json`, indexPath);
  console.log(`✔ Saved SFX index to: ${indexPath}`);
  return JSON.parse(readFileSync(indexPath, 'utf8'));
}

export async function getIndex() {
  const indexPath = resolve(SFX_DIR, 'sounds.json');
  if (existsSync(indexPath)) {
    return JSON.parse(readFileSync(indexPath, 'utf8'));
  }
  return await fetchIndex();
}

export async function fetchSound(soundId, indexData) {
  const index = indexData || await getIndex();
  const sound = index.sounds.find(s => s.id === soundId);
  if (!sound) {
    console.warn(`⚠ Sound ID '${soundId}' not found in sfx-kit catalog.`);
    return null;
  }

  const localPath = resolve(SFX_DIR, sound.file);
  if (existsSync(localPath)) {
    return { sound, localPath, cached: true };
  }

  const remoteUrl = `${RAW_BASE}/${sound.file}`;
  console.log(`⬇ Downloading [${sound.category}] ${sound.id} -> ${sound.file}`);
  await downloadFile(remoteUrl, localPath);
  return { sound, localPath, cached: false };
}

async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const isIndex = args.includes('--index');
  const isArchetypes = args.includes('--archetypes') || (!isAll && !isIndex && !args.some(a => a.startsWith('--sound=')));
  const soundArg = args.find(a => a.startsWith('--sound='));

  console.log(`\n======================================================`);
  console.log(`🎵 KinetRig — Studio SFX-Kit Downloader (wyzowl/sfx-kit)`);
  console.log(`   Destination: ${SFX_DIR}`);
  console.log(`======================================================\n`);

  if (!existsSync(SFX_DIR)) mkdirSync(SFX_DIR, { recursive: true });

  const index = await getIndex();
  console.log(`✔ Loaded catalogue: ${index.sounds.length} studio sounds across ${index.categories.length} categories.`);

  if (soundArg) {
    const id = soundArg.split('=')[1];
    await fetchSound(id, index);
    console.log(`\n✔ Completed single sound download.`);
    return;
  }

  if (isIndex && !isArchetypes && !isAll) {
    return;
  }

  if (isAll) {
    console.log(`\n⬇ Downloading full library (320 sounds, ~67MB)...`);
    let count = 0;
    for (const s of index.sounds) {
      await fetchSound(s.id, index);
      count++;
      if (count % 10 === 0) console.log(`   Progress: ${count}/${index.sounds.length}...`);
    }
    console.log(`\n✔ Completed full 320 sound library download.`);
    return;
  }

  if (isArchetypes) {
    console.log(`\n⬇ Downloading Core Archetype Pack (${CORE_ARCHETYPE_SOUNDS.length} sounds, ~2MB)...`);
    for (const id of CORE_ARCHETYPE_SOUNDS) {
      await fetchSound(id, index);
    }
    console.log(`\n✔ Core Archetype Pack ready in ${SFX_DIR}/`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch(err => {
    console.error(`❌ Error fetching SFX:`, err.message);
    process.exit(1);
  });
}
