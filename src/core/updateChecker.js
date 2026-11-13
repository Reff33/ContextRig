import axios from 'axios';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const UPDATE_BRANCHES = ['main', 'testing'];
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 1500;
const PACKAGE_JSON_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'package.json'
);

export function getUpdateCachePath() {
  if (process.env.CONTEXTRIG_UPDATE_CACHE_PATH) {
    return path.resolve(process.env.CONTEXTRIG_UPDATE_CACHE_PATH);
  }
  return path.join(os.homedir(), '.contextrig', 'update-check.json');
}

export function getCurrentVersionSync() {
  try {
    return JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')).version ?? null;
  } catch {
    return null;
  }
}

function parseVersion(raw) {
  const match = String(raw || '').trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Returns 1 if a > b, -1 if a < b, 0 if equal. Null when either is unparseable. */
export function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (!va || !vb) return null;
  for (let i = 0; i < 3; i++) {
    if (va[i] > vb[i]) return 1;
    if (va[i] < vb[i]) return -1;
  }
  return 0;
}

async function readCurrentVersion() {
  try {
    const raw = await fs.readFile(PACKAGE_JSON_PATH, 'utf8');
    return JSON.parse(raw).version ?? null;
  } catch {
    return null;
  }
}

async function readCache() {
  const cachePath = getUpdateCachePath();
  if (!existsSync(cachePath)) return null;
  try {
    const parsed = JSON.parse(await fs.readFile(cachePath, 'utf8'));
    if (!parsed?.checkedAt || !parsed?.latestVersion) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(latestVersion) {
  const cachePath = getUpdateCachePath();
  try {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(
      cachePath,
      JSON.stringify({ checkedAt: Date.now(), latestVersion }, null, 2),
      'utf8'
    );
  } catch {
    // Cache is best-effort; never block the CLI on it.
  }
}

async function fetchLatestVersion() {
  const fetchOne = async (branch) => {
    const res = await axios.get(
      `https://raw.githubusercontent.com/Reff33/ContextRig/${branch}/package.json`,
      {
        timeout: REQUEST_TIMEOUT_MS,
        headers: { 'Cache-Control': 'no-cache' },
        validateStatus: (s) => s === 200
      }
    );
    return res.data?.version;
  };

  try {
    const version = await Promise.any(UPDATE_BRANCHES.map(fetchOne));
    if (typeof version === 'string' && parseVersion(version)) return version;
  } catch {
    // All branches failed (offline / 404) — update check is skipped silently.
  }
  return null;
}

/**
 * Non-blocking update check. Returns null when offline, cached-fresh, or unparseable.
 * @param {{ force?: boolean }} options
 * @returns {Promise<{ currentVersion: string, latestVersion: string, updateAvailable: boolean, fromCache: boolean } | null>}
 */
export async function checkForUpdates(options = {}) {
  const currentVersion = await readCurrentVersion();
  if (!currentVersion) return null;

  if (!options.force) {
    const cached = await readCache();
    if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) {
      const cmp = compareVersions(cached.latestVersion, currentVersion);
      return {
        currentVersion,
        latestVersion: cached.latestVersion,
        updateAvailable: cmp === 1,
        fromCache: true
      };
    }
  }

  let latestVersion = null;
  try {
    latestVersion = await fetchLatestVersion();
  } catch {
    return null;
  }
  if (!latestVersion) return null;

  await writeCache(latestVersion);
  const cmp = compareVersions(latestVersion, currentVersion);
  return {
    currentVersion,
    latestVersion,
    updateAvailable: cmp === 1,
    fromCache: false
  };
}

/**
 * Prints a bordered update notice (9router-style) when a newer release exists.
 * Silently does nothing otherwise — never blocks or throws.
 */
export async function printUpdateBanner(options = {}) {
  try {
    const result = await checkForUpdates(options);
    if (!result?.updateAvailable) return result;

    const line1 = `Update available: v${result.currentVersion} → v${result.latestVersion}`;
    const line2 = 'Run: rig --update';
    const width = Math.max(line1.length, line2.length) + 2;
    const bar = '─'.repeat(width);

    console.log();
    console.log(chalk.yellow(`  ┌${bar}┐`));
    console.log(
      chalk.yellow('  │ ') + chalk.bold.white(line1.padEnd(width - 1)) + chalk.yellow('│')
    );
    console.log(chalk.yellow('  │ ') + chalk.gray(line2.padEnd(width - 1)) + chalk.yellow('│'));
    console.log(chalk.yellow(`  └${bar}┘`));
    return result;
  } catch {
    return null;
  }
}

/**
 * Pulls the latest ContextRig source from GitHub into the install directory.
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function runSelfUpdate() {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  const repoRoot = path.resolve(path.dirname(PACKAGE_JSON_PATH));

  try {
    await execFileAsync('git', ['-C', repoRoot, 'rev-parse', '--is-inside-work-tree'], {
      timeout: 10_000
    });
  } catch {
    return {
      ok: false,
      message: `Not a git checkout at ${repoRoot}. Reinstall instead: npm install -g contextrig`
    };
  }

  try {
    const { stdout } = await execFileAsync('git', ['-C', repoRoot, 'pull', '--ff-only'], {
      timeout: 120_000
    });
    await fs.rm(getUpdateCachePath(), { force: true }).catch(() => {});
    return { ok: true, message: stdout.trim() || 'Already up to date.' };
  } catch (err) {
    const detail = (err.stderr || err.message || '').toString().trim();
    return { ok: false, message: detail || 'git pull failed.' };
  }
}
