import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getDeviceDir } from '../config.js';

/** Named skill presets, stored on the device so they follow the user, not the browser. */
export function getBundlesPath() {
  return path.join(getDeviceDir(), 'bundles.json');
}

export async function loadBundles() {
  const p = getBundlesPath();
  if (!existsSync(p)) return [];
  try {
    const parsed = JSON.parse(await fs.readFile(p, 'utf8'));
    if (!Array.isArray(parsed?.bundles)) return [];
    return parsed.bundles
      .filter((b) => b && typeof b.name === 'string' && Array.isArray(b.skills))
      .map((b) => ({ name: String(b.name).slice(0, 40), skills: b.skills.map(String) }));
  } catch {
    return [];
  }
}

/** Replaces the whole list; the console always sends the full set. */
export async function saveBundles(bundles) {
  if (!Array.isArray(bundles)) throw new Error('bundles must be an array.');
  const clean = bundles
    .filter((b) => b && typeof b.name === 'string' && b.name.trim() && Array.isArray(b.skills))
    .map((b) => ({ name: String(b.name).trim().slice(0, 40), skills: b.skills.map(String).filter(Boolean) }));
  const p = getBundlesPath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, `${JSON.stringify({ bundles: clean }, null, 2)}\n`, 'utf8');
  return clean;
}
