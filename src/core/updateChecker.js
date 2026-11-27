import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UPDATE_BRANCHES = ['main'];
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 4000;
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
    // Invalidate stale or corrupt future timestamps (> 1 day in the future)
    const now = Date.now();
    if (parsed.checkedAt > now + 24 * 60 * 60 * 1000) {
      await fs.rm(cachePath, { force: true }).catch(() => {});
      return null;
    }
    // Invalidate any stale v1.0.0 artifact while repo is on 0.x
    if (parsed.latestVersion === '1.0.0') {
      await fs.rm(cachePath, { force: true }).catch(() => {});
      return null;
    }
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
  for (const branch of UPDATE_BRANCHES) {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/Reff33/ContextRig/${branch}/package.json`,
        {
          headers: { 'Cache-Control': 'no-cache' },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const version = data?.version;
      if (typeof version === 'string' && parseVersion(version)) return version;
    } catch {
      // Branch offline / 404 — try the next one, then skip silently.
    }
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
      // If the cache says we are already current, re-check once per launch instead of
      // trusting it for a full day — a release published after the last check would
      // otherwise stay invisible until the TTL expired.
      if (compareVersions(cached.latestVersion, currentVersion) !== 0) {
        return {
          currentVersion,
          latestVersion: cached.latestVersion,
          updateAvailable: compareVersions(cached.latestVersion, currentVersion) === 1,
          fromCache: true
        };
      }
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
 * Reports the git state of a checkout: branch, upstream, behind/ahead counts,
 * and whether the working tree is clean.
 * @returns {Promise<null | { branch: string, upstream: string|null, behind: number, ahead: number, dirty: boolean, root: string }>}
 */
export async function getGitState() {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  const root = path.resolve(path.dirname(PACKAGE_JSON_PATH));

  if (!existsSync(path.join(root, '.git'))) return null;

  const run = async (args) => {
    try {
      const { stdout } = await execFileAsync('git', ['-C', root, ...args], { timeout: 15_000 });
      return stdout.trim();
    } catch {
      return '';
    }
  };

  const branch = await run(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!branch) return null;

  const upstream = await run(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  let behind = 0;
  let ahead = 0;
  if (upstream) {
    const counts = await run(['rev-list', '--left-right', '--count', `@{upstream}...HEAD`]);
    const [b, a] = counts.split(/\s+/).map(Number);
    behind = Number.isFinite(b) ? b : 0;
    ahead = Number.isFinite(a) ? a : 0;
  }

  const status = await run(['status', '--porcelain']);

  return { branch, upstream: upstream || null, behind, ahead, dirty: status.length > 0, root };
}

/**
 * Moves a git checkout onto a branch and fast-forwards it.
 * @param {'main'|'testing'} branch
 * @returns {Promise<{ ok: boolean, message: string, state?: Object }>}
 */
export async function switchReleaseChannel(branch) {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  const root = path.resolve(path.dirname(PACKAGE_JSON_PATH));

  const run = async (args, timeout = 60_000) => {
    const { stdout } = await execFileAsync('git', ['-C', root, ...args], { timeout });
    return stdout.trim();
  };

  if (!existsSync(path.join(root, '.git'))) {
    return { ok: false, message: 'This is not a git checkout. Reinstall from the repository to switch channels.' };
  }

  const clean = await run(['status', '--porcelain']);
  if (clean.length > 0) {
    return {
      ok: false,
      message: `Working tree has uncommitted changes in ${root}. Commit or stash them first:\n  git -C "${root}" stash`
    };
  }

  try {
    await run(['fetch', 'origin', branch]);
    await run(['checkout', '-B', branch, `origin/${branch}`]);
    await run(['branch', '--set-upstream-to', `origin/${branch}`, branch]);
    await fs.rm(getUpdateCachePath(), { force: true }).catch(() => {});
    const state = await getGitState();
    return { ok: true, message: `Switched to ${branch} at ${await run(['rev-parse', '--short', 'HEAD'])}.`, state };
  } catch (err) {
    const detail = (err.stderr || err.message || '').toString().trim();
    return { ok: false, message: detail || `Could not switch to ${branch}.` };
  }
}

/**
 * Prints a bordered update notice (9router-style) when a newer release exists.
 * Silently does nothing otherwise — never blocks or throws.
 */
export async function printUpdateBanner(options = {}) {
  try {
    const result = await checkForUpdates(options);
    return result?.updateAvailable ? result : null;
  } catch {
    return null;
  }
}

/**
 * Detects how this copy of ContextRig was installed.
 * @returns {Promise<'git'|'npm'|'unknown'>}
 */
export async function detectInstallKind() {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  const repoRoot = path.resolve(path.dirname(PACKAGE_JSON_PATH));

  if (!existsSync(path.join(repoRoot, '.git'))) return 'npm';
  try {
    const { stdout } = await execFileAsync('git', ['-C', repoRoot, 'rev-parse', '--is-inside-work-tree'], {
      timeout: 10_000
    });
    return stdout.trim() === 'true' ? 'git' : 'npm';
  } catch {
    return 'npm';
  }
}

/**
 * Updates ContextRig using the method it was installed with:
 * git checkout → `git pull --ff-only`, npm global → `npm install -g contextrig@latest`.
 * @returns {Promise<{ ok: boolean, message: string, method: string }>}
 */
export async function runSelfUpdate() {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);
  const repoRoot = path.resolve(path.dirname(PACKAGE_JSON_PATH));
  const method = await detectInstallKind();

  if (method === 'npm') {
    try {
      const { stdout } = await execFileAsync('npm', ['install', '-g', 'contextrig@latest'], {
        timeout: 180_000,
        shell: process.platform === 'win32'
      });
      await fs.rm(getUpdateCachePath(), { force: true }).catch(() => {});
      return { ok: true, method, message: (stdout || '').trim() || 'Updated to the latest npm release.' };
    } catch (err) {
      const detail = (err.stderr || err.message || '').toString().trim();
      return {
        ok: false,
        method,
        message: `${detail}\nRetry manually: npm install -g contextrig@latest`
      };
    }
  }

  const state = await getGitState();
  if (!state) {
    return {
      ok: false,
      method,
      message: `Not a git checkout at ${repoRoot}. Reinstall instead: npm install -g contextrig`
    };
  }

  // Follow whatever branch this checkout tracks instead of hard-coding `main`, so a
  // dev machine parked on `testing` pulls dev builds and a release install pulls main.
  try {
    const args = ['pull', '--ff-only'];
    const { stdout } = await execFileAsync('git', ['-C', repoRoot, ...args], {
      timeout: 120_000
    });
    await fs.rm(getUpdateCachePath(), { force: true }).catch(() => {});
    const after = await getGitState();
    const summary = stdout.trim() || 'Already up to date.';
    return {
      ok: true,
      method,
      branch: state.branch,
      message: `${summary}\nOn ${state.branch}${after ? ` · ${after.behind} behind origin` : ''}.`
    };
  } catch (err) {
    const detail = (err.stderr || err.message || '').toString().trim();
    if (/no tracking information|divergent|not possible to fast-forward/i.test(detail)) {
      return {
        ok: false,
        method,
        message: `${detail}\nSet the release channel first: rig --channel main\nOr follow dev builds: rig --channel testing`
      };
    }
    return { ok: false, method, message: detail || 'git pull failed.' };
  }
}
