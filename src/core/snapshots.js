import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getDeviceDir, SUPPORTED_AGENTS } from '../config.js';

const KEEP_PER_PROJECT = 10;

export function getSnapshotsDir() {
  return path.join(getDeviceDir(), 'snapshots');
}

function projectKey(projectPath) {
  const norm = path.resolve(projectPath).toLowerCase();
  return crypto.createHash('sha1').update(norm, 'utf8').digest('hex').slice(0, 12);
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * Copies the managed rules files of a project into a timestamped snapshot folder
 * so a bad inject can be undone.
 * @param {string} projectPath
 * @param {{ agents?: string[], reason?: string }} [meta]
 */
export async function snapshotProject(projectPath, { agents = [], reason = 'inject' } = {}) {
  const rulesFiles = (agents.length ? agents : ['claude'])
    .map((a) => SUPPORTED_AGENTS.find((x) => x.value === a)?.outputFile)
    .filter(Boolean);

  const dir = path.join(getSnapshotsDir(), projectKey(projectPath), stamp());
  const saved = [];
  for (const rel of rulesFiles) {
    const src = path.join(projectPath, rel);
    if (!existsSync(src)) continue;
    const dest = path.join(dir, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
    saved.push(rel);
  }
  if (!saved.length) return null;

  await fs.writeFile(
    path.join(dir, 'meta.json'),
    `${JSON.stringify({ projectPath: path.resolve(projectPath), reason, at: new Date().toISOString(), files: saved }, null, 2)}\n`,
    'utf8'
  );
  await prune(projectPath);
  return { id: path.basename(dir), at: new Date().toISOString(), reason, files: saved };
}

/** Keeps only the newest snapshots for a project. */
async function prune(projectPath) {
  const root = path.join(getSnapshotsDir(), projectKey(projectPath));
  let entries;
  try {
    entries = await fs.readdir(root);
  } catch {
    return;
  }
  const dirs = entries.filter((e) => !e.endsWith('.json')).sort();
  for (const old of dirs.slice(0, Math.max(0, dirs.length - KEEP_PER_PROJECT))) {
    await fs.rm(path.join(root, old), { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * @param {string} projectPath
 * @returns {Promise<Array<{ id: string, at: string, reason: string, files: string[] }>>}
 */
export async function listSnapshots(projectPath) {
  const root = path.join(getSnapshotsDir(), projectKey(projectPath));
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    try {
      const meta = JSON.parse(await fs.readFile(path.join(root, e.name, 'meta.json'), 'utf8'));
      out.push({ id: e.name, at: meta.at, reason: meta.reason || 'inject', files: meta.files || [] });
    } catch {
      // skip incomplete snapshot
    }
  }
  return out.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
}

/**
 * Restores the rules files saved in a snapshot, after snapshotting the current
 * state so the rollback itself can also be undone.
 * @param {string} projectPath
 * @param {string} snapshotId
 */
export async function restoreSnapshot(projectPath, snapshotId) {
  if (!snapshotId || typeof snapshotId !== 'string') throw new Error('snapshotId is required.');
  const root = path.join(getSnapshotsDir(), projectKey(projectPath));
  const dir = path.join(root, snapshotId);
  if (!existsSync(path.join(dir, 'meta.json')) || !existsSync(dir)) {
    throw new Error('Snapshot not found for this project.');
  }
  const meta = JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));

  const agents = (meta.files || [])
    .map((f) => SUPPORTED_AGENTS.find((a) => a.outputFile === f)?.value)
    .filter(Boolean);
  await snapshotProject(projectPath, { agents, reason: 'pre-rollback' });

  for (const rel of meta.files || []) {
    const src = path.join(dir, rel);
    if (!existsSync(src)) continue;
    const dest = path.join(projectPath, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
  return { ok: true, restored: (meta.files || []).length, snapshotId };
}
