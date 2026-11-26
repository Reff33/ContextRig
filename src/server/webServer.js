import http from 'node:http';
import path from 'node:path';
import { exec } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import os from 'node:os';
import fs from 'node:fs/promises';
import { getDeviceDir, SUPPORTED_AGENTS } from '../config.js';
import { loadRegistry, registerProject, unregisterProject } from '../core/projectRegistry.js';
import {
  getCatalogAndDeviceSkills,
  installSkillToDevice,
  removeSkillFromDevice,
  updateSkillOnDevice,
  ensureSkillInstalled
} from '../core/skillCatalog.js';
import { getCurrentVersionSync, checkForUpdates } from '../core/updateChecker.js';
import { setupTargetProject } from '../core/projectSetup.js';
import { injectTemplate } from '../core/fileInjector.js';
import { handleGitIgnore, aggregateGitIgnorePatterns } from '../core/gitIgnoreManager.js';
import { aggregateDependencies } from '../core/dependencyInstaller.js';
import { getSkillCommands } from '../core/slashCommands.js';
import { removeSkillsFromProject } from '../core/skillUpdater.js';
import { inspectRemoteSkillRepo, commitImportedSkill } from '../core/skillImporter.js';
import {
  loadAllSkillSettings,
  saveSkillSettings,
  resetSkillSettings,
  getSkillSchema
} from '../core/skillSettings.js';
import { previewPurge, purgeWorkspace } from '../core/purgeEngine.js';

const PORT_PREF_PATH = () => path.join(getDeviceDir(), 'web-port.json');

/** Remembers the last port that worked so the URL stays stable across launches. */
function readSavedPort() {
  try {
    const parsed = JSON.parse(readFileSync(PORT_PREF_PATH(), 'utf8'));
    const n = Number(parsed?.port);
    return Number.isFinite(n) && n > 0 && n < 65536 ? n : null;
  } catch {
    return null;
  }
}

function savePort(port) {
  try {
    mkdirSync(getDeviceDir(), { recursive: true });
    writeFileSync(PORT_PREF_PATH(), `${JSON.stringify({ port }, null, 2)}\n`, 'utf8');
  } catch {
    // best effort — a missing preference only means we retry the default
  }
}

/** Returns { url, version } when a ContextRig server answers on this URL. */
async function probeHealth(candidateUrl) {
  try {
    const res = await fetch(`${candidateUrl}/api/health`, { signal: AbortSignal.timeout(1200) });
    if (res.ok) {
      const data = await res.json();
      if (data?.ok && data?.url) return { url: data.url, version: data.version };
    }
  } catch {
    // fall through to the legacy probe below
  }

  // Older builds predate /api/health. Recognise them by the console document itself
  // and read the version from the rendered title so a stale build is never mistaken
  // for this one.
  try {
    const res = await fetch(candidateUrl, { signal: AbortSignal.timeout(1200) });
    if (!res.ok) return null;
    const body = await res.text();
    if (!/ContextRig Console/.test(body)) return null;
    const match = body.match(/ContextRig Console\s*·\s*v([0-9][0-9.]*[0-9])/);
    return { url: candidateUrl, version: match ? match[1] : 'unknown' };
  } catch {
    // not a ContextRig server
  }
  return null;
}

/**
 * Finds the process listening on a TCP port, so a stale console can be named
 * instead of leaving the user to hunt for an invisible terminal window.
 * @param {number} port
 * @returns {Promise<number|null>} pid, or null when unknown
 */
export async function findPortOwnerPid(port) {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(execFile);
  const portToken = `:${port}`;

  try {
    if (process.platform === 'win32') {
      const { stdout } = await run('netstat', ['-ano'], { timeout: 10_000 });
      // netstat rows are whitespace separated: Proto  Local  Foreign  State  PID
      for (const raw of stdout.split(/\r?\n/)) {
        const parts = raw.trim().split(/ +/).filter(Boolean);
        if (parts.length < 5) continue;
        if (parts[parts.length - 2] !== 'LISTENING') continue;
        if (!parts[1].endsWith(portToken)) continue;
        const pid = Number(parts[parts.length - 1]);
        if (Number.isInteger(pid) && pid > 0) return pid;
      }
      return null;
    }
    const { stdout } = await run('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], { timeout: 10_000 });
    const line = stdout.split('\n')[1];
    if (!line) return null;
    const pid = Number(line.split(/ +/).filter(Boolean)[1]);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

/**
 * Stops a stale ContextRig that is holding the port. Only ever kills a PID whose
 * process answers as a ContextRig console, and only when the caller asked for it.
 * @param {number} port
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
export async function stopStaleServer(port) {
  const pid = await findPortOwnerPid(port);
  if (!pid) {
    return { ok: false, message: `Could not identify the process on port ${port}. Close the console window manually, then retry.` };
  }
  try {
    const stopCmd = process.platform === 'win32' ? ['taskkill', ['/PID', String(pid), '/F']] : ['kill', ['-TERM', String(pid)]];
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    await promisify(execFile)(stopCmd[0], stopCmd[1], { timeout: 10_000 });
    return { ok: true, message: `Stopped the old console (pid ${pid}) that was holding port ${port}.` };
  } catch (err) {
    const detail = (err.stderr || err.message || '').toString().trim();
    return { ok: false, message: `${detail || 'Could not stop the old console.'} — close that terminal window manually, then retry.` };
  }
}

/**
 * Starts the console on the saved port, reuses a ContextRig already running there,
 * or steps forward a few ports when something unrelated holds the slot.
 * The chosen port is persisted so the URL is stable on the next launch.
 *
 * A running instance is only reused when it reports the same version as this
 * process. An older build would otherwise keep serving its own stale catalogue,
 * which is exactly how a console ends up missing features added since.
 * @param {{ preferredPort?: number, host?: string, onShutdown?: Function }} [options]
 * @returns {Promise<{ url: string, port: number, reused: boolean, stale?: Object, server: Object|null, stop: Function }>}
 */
export async function ensureWebServer({ preferredPort = DEFAULT_PORT, host = 'localhost', onShutdown = null } = {}) {
  const saved = readSavedPort();
  const first = saved || preferredPort;
  const localVersion = getCurrentVersionSync();
  const candidates = [first, preferredPort, ...Array.from({ length: 9 }, (_, i) => first + i + 1)]
    .filter((p, i, arr) => p > 0 && p < 65536 && arr.indexOf(p) === i);

  let lastError = null;
  for (const port of candidates) {
    try {
      const started = await startWebServer({ port, host, onShutdown });
      if (port !== first || saved !== port) savePort(port);
      return { url: started.url, port, reused: false, server: started.server, stop: started.stop };
    } catch (err) {
      lastError = err;
      if (!/already in use/i.test(err.message)) throw err;
      const existing = await probeHealth(`http://${host}:${port}`);
      if (existing) {
        if (existing.version === localVersion) {
          return { url: existing.url, port, reused: true, server: null, stop: () => {} };
        }
        // A different build owns the port. Starting elsewhere would leave the user
        // with two consoles and the browser opening the stale one, so stop here.
        const stalePid = await findPortOwnerPid(port).catch(() => null);
        return {
          url: existing.url,
          port,
          reused: false,
          stale: { url: existing.url, port, version: existing.version, localVersion, pid: stalePid },
          server: null,
          stop: () => {}
        };
      }
      // Port belongs to something else — try the next candidate.
    }
  }
  throw lastError || new Error('Could not find a free port for the Web console.');
}

export function openBrowser(url) {
  const startCmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(startCmd, (err) => {
    if (err) {
      console.log(`Could not open a browser automatically. Open this URL manually: ${url}`);
    }
  });
}
import { fileURLToPath } from 'node:url';

const CONSOLE_HTML = fileURLToPath(new URL('./console.tpl.html', import.meta.url));

/** Static favicon assets served from this directory. */
const FAVICONS = {
  '/favicon-16.png': 'image/png',
  '/favicon-32.png': 'image/png',
  '/favicon-64.png': 'image/png',
  '/favicon-128.png': 'image/png',
  '/favicon.ico': 'image/png'
};

function readFavicon(pathname) {
  const type = FAVICONS[pathname];
  if (!type) return null;
  const file = pathname === '/favicon.ico' ? 'favicon-32.png' : pathname.slice(1);
  try {
    return { type, bytes: readFileSync(fileURLToPath(new URL('./' + file, import.meta.url))) };
  } catch {
    return null;
  }
}

/** Serves the console document with the runtime version/URL substituted. */
function renderConsole(version, serverUrl) {
  const raw = readFileSync(CONSOLE_HTML, 'utf8');
  return raw
    .split('__CONTRIG_VERSION__').join(version)
    .split('__CONTRIG_SERVER__').join(serverUrl.replace(/^https?:\/\//, ''));
}

/**
 * Injects selected skills into a target directory and registers it.
 * Mirrors the CLI inject flow minus interactive prompts (deps are reported, not installed).
 * @param {{ targetPath: string, agentValue?: string, skillIds?: string[], mergeMode?: 'merge'|'overwrite' }} input
 */
async function injectToProject({ targetPath, agentValue = 'claude', skillIds = [], mergeMode = 'merge' }) {
  if (!targetPath || typeof targetPath !== 'string' || !targetPath.trim()) {
    throw new Error('targetPath is required.');
  }
  if (!Array.isArray(skillIds) || skillIds.length === 0) {
    throw new Error('Select at least one skill to inject.');
  }

  const agent = SUPPORTED_AGENTS.find((a) => a.value === agentValue);
  if (!agent) throw new Error(`Unknown agent profile '${agentValue}'.`);

  const catalog = await getCatalogAndDeviceSkills();
  const byId = new Map(catalog.map((s) => [s.id, s]));
  const unknown = skillIds.filter((id) => !byId.has(id));
  if (unknown.length) throw new Error(`Unknown skill id(s): ${unknown.join(', ')}`);
  const selected = [];
  for (const id of skillIds) {
    selected.push(await ensureSkillInstalled(id));
  }

  const { fullPath, projectName, created } = await setupTargetProject(targetPath);

  const outputFile = await injectTemplate({
    targetDir: fullPath,
    templateFileName: agent.templateFile,
    outputFileName: agent.outputFile,
    projectName,
    agentName: agent.name,
    skillsInstructions: selected,
    mergeMode
  });

  await registerProject({
    projectPath: fullPath,
    name: projectName,
    agents: [agent.value],
    skills: selected.map((s) => s.id),
    mergeSkills: mergeMode !== 'overwrite'
  });

  await handleGitIgnore(fullPath, selected);

  const deps = aggregateDependencies(selected);
  return {
    ok: true,
    path: fullPath,
    projectName,
    created,
    agent: agent.name,
    outputFile,
    injected: selected.map((s) => s.id),
    dependencies: deps
  };
}

/**
 * Syncs one or all registered projects right from the Web UI.
 * Re-injects active agent templates & skills using Smart Merge, updates lastSynced.
 * @param {{ projectPath?: string, all?: boolean }} input
 */
async function syncProjectsFromWeb({ projectPath, all = false } = {}) {
  const registry = await loadRegistry();
  const norm = (p) => path.resolve(p).toLowerCase();
  const targets = all
    ? registry.projects
    : registry.projects.filter((p) => projectPath && norm(p.path) === norm(projectPath));

  if (!targets.length) {
    throw new Error(all ? 'No registered projects to sync.' : 'Project is not registered.');
  }

  const catalog = await getCatalogAndDeviceSkills();
  const byId = new Map(catalog.map((s) => [s.id, s]));
  const results = [];

  for (const proj of targets) {
    const skillIds = (proj.skills || []).filter((id) => byId.has(id));
    const selected = [];
    for (const id of skillIds) {
      selected.push(await ensureSkillInstalled(id));
    }

    const agentValues = Array.isArray(proj.agents) && proj.agents.length ? proj.agents : ['claude'];
    for (const av of agentValues) {
      const agent = SUPPORTED_AGENTS.find((a) => a.value === av);
      if (!agent) continue;
      await injectTemplate({
        targetDir: proj.path,
        templateFileName: agent.templateFile,
        outputFileName: agent.outputFile,
        projectName: proj.name,
        agentName: agent.name,
        skillsInstructions: selected,
        mergeMode: 'merge'
      });
    }

    await handleGitIgnore(proj.path, selected);
    await registerProject({
      projectPath: proj.path,
      name: proj.name,
      agents: agentValues,
      skills: skillIds
    });

    results.push({ path: proj.path, name: proj.name, syncedSkills: skillIds.length });
  }

  return { ok: true, syncedCount: results.length, results };
}

/**
 * Dry-run of an injection: reports the target files, resolved skills, gitignore
 * patterns and conflicts without writing anything to disk.
 * @param {{ targetPath: string, agentValue?: string, skillIds?: string[], mergeMode?: string }} input
 */
async function planInjection({ targetPath, agentValue = 'claude', skillIds = [], mergeMode = 'merge' }) {
  if (!targetPath || !String(targetPath).trim()) throw new Error('targetPath is required.');
  if (!Array.isArray(skillIds) || skillIds.length === 0) throw new Error('Select at least one skill.');

  const agent = SUPPORTED_AGENTS.find((a) => a.value === agentValue);
  if (!agent) throw new Error(`Unknown agent profile '${agentValue}'.`);

  const catalog = await getCatalogAndDeviceSkills();
  const byId = new Map(catalog.map((s) => [s.id, s]));

  const { fullPath, projectName, created } = await setupTargetProject(targetPath);
  const rulesPath = path.join(fullPath, agent.outputFile);
  const rulesExists = existsSync(rulesPath);

  const selected = [];
  const notOnDevice = [];
  for (const id of skillIds) {
    const entry = byId.get(id);
    if (!entry) continue;
    if (entry.on_device === false) { notOnDevice.push(id); continue; }
    selected.push(entry);
  }

  const files = [];
  const commands = [];
  const mcpServers = [];
  for (const s of selected) {
    for (const f of s.files_to_copy || []) {
      files.push({ skill: s.id, destination: f.destination, exists: existsSync(path.join(fullPath, f.destination)) });
    }
    for (const c of getSkillCommands(s)) {
      commands.push({ skill: s.id, name: c.name, exists: existsSync(path.join(fullPath, '.claude', 'commands', `${c.name}.md`)) });
    }
    if (s.mcp_servers && typeof s.mcp_servers === 'object') {
      for (const key of Object.keys(s.mcp_servers)) mcpServers.push({ skill: s.id, name: key });
    }
  }

  return {
    ok: true,
    path: fullPath,
    projectName,
    created,
    agent: { value: agent.value, name: agent.name, outputFile: agent.outputFile },
    mergeMode: mergeMode === 'overwrite' ? 'overwrite' : 'merge',
    rulesFile: { name: agent.outputFile, exists: rulesExists },
    skills: selected.map((s) => ({ id: s.id, name: s.name })),
    notOnDevice,
    files,
    commands,
    mcpServers,
    gitignore: aggregateGitIgnorePatterns(selected),
    dependencies: aggregateDependencies(selected),
    conflicts: detectSkillConflicts(selected)
  };
}

/**
 * Flags duplicate slash command names, duplicate MCP server keys and skills that
 * manage the same artifact directory — the three ways two skills collide today.
 * @param {Array<Object>} skills
 */
function detectSkillConflicts(skills) {
  const conflicts = [];
  const cmdOwners = new Map();
  const mcpOwners = new Map();
  const artifactOwners = new Map();

  for (const s of skills) {
    for (const c of getSkillCommands(s)) {
      const key = c.name.toLowerCase();
      if (!cmdOwners.has(key)) cmdOwners.set(key, []);
      cmdOwners.get(key).push(s.id);
    }
    if (s.mcp_servers && typeof s.mcp_servers === 'object') {
      for (const key of Object.keys(s.mcp_servers)) {
        if (!mcpOwners.has(key)) mcpOwners.set(key, []);
        mcpOwners.get(key).push(s.id);
      }
    }
    const artifacts = Array.isArray(s.artifacts) ? s.artifacts : [];
    for (const a of artifacts) {
      const clean = String(a).replace(/\/+$/, '');
      if (!clean) continue;
      if (!artifactOwners.has(clean)) artifactOwners.set(clean, []);
      artifactOwners.get(clean).push(s.id);
    }
  }

  for (const [name, owners] of cmdOwners) {
    if (owners.length > 1) conflicts.push({ kind: 'command', key: '/' + name, skills: owners, message: `Slash command /${name} is declared by ${owners.length} skills; the last write wins.` });
  }
  for (const [name, owners] of mcpOwners) {
    if (owners.length > 1) conflicts.push({ kind: 'mcp', key: name, skills: owners, message: `MCP server '${name}' is declared by ${owners.length} skills; only one entry can exist in .mcp.json.` });
  }
  for (const [dir, owners] of artifactOwners) {
    if (owners.length > 1) conflicts.push({ kind: 'artifact', key: dir, skills: owners, message: `Artifact directory ${dir} is shared by ${owners.length} skills.` });
  }

  return conflicts;
}

/**
 * Per-project health signals for the console: sync state, orphan refs, skills
 * that are not cached on this device, and which agent rule files exist on disk.
 * @returns {Promise<Array<Object>>}
 */
async function collectProjectHealth() {
  const registry = await loadRegistry();
  const catalog = await getCatalogAndDeviceSkills();
  const byId = new Map(catalog.map((s) => [s.id, s]));
  const agentFileFor = (a) => SUPPORTED_AGENTS.find((x) => x.value === a)?.outputFile || null;

  return registry.projects.map((p) => {
    const onDisk = existsSync(p.path);
    const orphans = (p.skills || []).filter((id) => !byId.has(id));
    const uncached = (p.skills || []).filter((id) => byId.has(id) && byId.get(id).on_device === false);
    const agents = (p.agents || []).map((a) => {
      const file = agentFileFor(a);
      return { agent: a, file, present: Boolean(file) && onDisk && existsSync(path.join(p.path, file)) };
    });
    const missingAgentFiles = agents.filter((a) => a.file && !a.present).map((a) => a.file);

    return {
      id: p.name,
      name: p.name,
      path: p.path,
      onDisk,
      synced: Boolean(p.lastSynced),
      lastSynced: p.lastSynced || null,
      skillCount: (p.skills || []).length,
      orphans,
      uncached,
      agents,
      missingAgentFiles,
      healthy: onDisk && Boolean(p.lastSynced) && orphans.length === 0 && uncached.length === 0 && missingAgentFiles.length === 0
    };
  });
}

/**
 * Removes a project registration, optionally deleting its folder from disk.
 * Only registered projects qualify, and folder deletion is restricted to paths
 * that look like a project directory and are not a context file's parent root.
 * @param {{ projectPath: string, deleteFolder?: boolean, confirm?: boolean }} input
 */
async function removeProject({ projectPath, deleteFolder = false, confirm = false }) {
  if (!projectPath || typeof projectPath !== 'string') throw new Error('projectPath is required.');

  const registry = await loadRegistry();
  const norm = (p) => path.resolve(p).toLowerCase();
  const entry = registry.projects.find((p) => norm(p.path) === norm(projectPath));
  if (!entry) throw new Error('Project is not registered.');

  const onDisk = existsSync(entry.path);

  if (!deleteFolder) {
    await unregisterProject(entry.path);
    return { ok: true, action: 'unregistered', path: entry.path, folderDeleted: false, folderMissing: !onDisk };
  }

  if (!onDisk) {
    // Folder already gone — drop the stale registry entry and say so plainly.
    await unregisterProject(entry.path);
    return { ok: true, action: 'unregistered', path: entry.path, folderDeleted: false, folderMissing: true };
  }

  if (!confirm) throw new Error('Folder deletion requires confirm: true.');

  const resolved = path.resolve(entry.path);
  const protectedPaths = [path.parse(resolved).root, os.homedir()];
  if (protectedPaths.some((p) => norm(p) === norm(resolved))) {
    throw new Error(`Refusing to delete ${resolved}: it is a protected root path.`);
  }
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    throw new Error(`Refusing to delete ${resolved}: not a directory.`);
  }

  // Guard against wiping something that is clearly not a project folder: a directory
  // holding a repository root marker is allowed, but a folder containing several
  // unrelated sibling projects is not.
  const entries = readdirSync(resolved, { withFileTypes: true });
  const looksLikeProject = entries.some((e) =>
    ['.git', 'package.json', 'CLAUDE.md', 'AGENTS.md', '.cursorrules'].includes(e.name)
  );
  const siblingProjects = entries.filter((e) => {
    if (!e.isDirectory()) return false;
    if (['node_modules', '.git', 'dist', 'build'].includes(e.name)) return false;
    return existsSync(path.join(resolved, e.name, 'package.json'));
  });
  if (!looksLikeProject && siblingProjects.length >= 2) {
    throw new Error(
      `Refusing to delete ${resolved}: it contains ${siblingProjects.length} project folders (${siblingProjects
        .map((e) => e.name)
        .join(', ')}). Unregister it instead, or delete the folder yourself.`
    );
  }

  try {
    await fs.rm(resolved, { recursive: true, force: true, maxRetries: 3 });
  } catch (err) {
    const map = {
      EBUSY: 'the folder is in use by another program',
      EPERM: 'permission denied',
      ENOTEMPTY: 'the folder still contains files after deletion',
      EACCES: 'permission denied'
    };
    throw new Error(`Could not delete ${resolved}: ${map[err.code] || err.message}`);
  }

  await unregisterProject(resolved);
  return { ok: true, action: 'deleted', path: resolved, folderDeleted: true, folderMissing: false };
}

/**
 * Removes selected skills from a project — deletes copied files and re-renders
 * the agent files, then updates the registry. Mirrors the CLI remove flow.
 * @param {{ projectPath: string, skillIds: string[] }} input
 */
async function removeFromProject({ projectPath, skillIds = [] }) {
  if (!projectPath) throw new Error('projectPath is required.');
  if (!Array.isArray(skillIds) || skillIds.length === 0) throw new Error('Select at least one skill to remove.');

  const registry = await loadRegistry();
  const norm = (p) => path.resolve(p).toLowerCase();
  const entry = registry.projects.find((p) => norm(p.path) === norm(projectPath));
  if (!entry) throw new Error('Project is not registered.');

  const installed = entry.skills || [];
  const validIds = skillIds.filter((id) => installed.includes(id));
  if (validIds.length === 0) {
    throw new Error('None of the selected skills are installed in this project.');
  }

  const library = await getCatalogAndDeviceSkills();
  const byId = new Map(library.map((s) => [s.id, s]));
  const skillsToRemove = validIds.map((id) => byId.get(id)).filter(Boolean);
  const remainingIds = installed.filter((id) => !validIds.includes(id));
  const remainingSkills = remainingIds.map((id) => byId.get(id)).filter(Boolean);

  await removeSkillsFromProject(entry.path, entry.name, skillsToRemove, remainingSkills);

  await registerProject({
    projectPath: entry.path,
    name: entry.name,
    agents: entry.agents || [],
    skills: remainingIds,
    mergeSkills: false
  });

  return { ok: true, projectPath: entry.path, removed: validIds, remaining: remainingIds };
}

/** Imports a skill manifest from a GitHub/skills.sh URL into the master library. */
async function importSkill({ sourceUrl }) {
  if (!sourceUrl || typeof sourceUrl !== 'string') throw new Error('sourceUrl is required.');
  const preview = await inspectRemoteSkillRepo(sourceUrl.trim());
  if (!preview.validation.valid) {
    throw new Error(`Skill validation failed: ${preview.validation.errors.join(' ')}`);
  }
  const result = await commitImportedSkill(preview);
  return {
    ok: true,
    skillId: preview.skill.id,
    name: preview.skill.name,
    manifestPath: result.manifestPath,
    downloadedCount: result.downloadedCount,
    failedFiles: result.failedFiles || [],
    warnings: preview.warnings || []
  };
}

export const DEFAULT_PORT = Number(process.env.CONTEXTRIG_PORT) || 7474;

export function startWebServer({ port = DEFAULT_PORT, host = 'localhost', onShutdown = null, allowRandomPort = false } = {}) {
  const version = getCurrentVersionSync();
  const startedAt = new Date().toISOString();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${host}:${port}`);

    // Helper: JSON response
    const sendJson = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    // Helper: Parse POST JSON body
    const readBody = () => new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try { resolve(body ? JSON.parse(body) : {}); }
        catch (e) { reject(e); }
      });
      req.on('error', reject);
    });

    const fav = readFavicon(url.pathname);
    if (fav) {
      res.writeHead(200, {
        'Content-Type': fav.type,
        'Content-Length': fav.bytes.length,
        'Cache-Control': 'public, max-age=86400'
      });
      res.end(fav.bytes);
      return;
    }

    if (url.pathname === '/' || url.pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      const livePort = server.address() ? server.address().port : port;
      res.end(renderConsole(version, `http://${host}:${livePort}`));
      return;
    }

    if (url.pathname === '/api/projects') {
      const reg = await loadRegistry();
      sendJson(200, reg);
      return;
    }

    if (url.pathname === '/api/skills') {
      const skills = await getCatalogAndDeviceSkills();
      // Enrich with schema definitions for web inspector
      const enriched = skills.map(s => ({
        ...s,
        settings_schema: getSkillSchema(s)
      }));
      sendJson(200, { skills: enriched });
      return;
    }

    if (url.pathname === '/api/skills/install' && req.method === 'POST') {
      try {
        const { skillId } = await readBody();
        if (!skillId) { sendJson(400, { ok: false, message: 'skillId is required' }); return; }
        sendJson(200, await installSkillToDevice(skillId));
      } catch (err) {
        sendJson(400, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/skills/update' && req.method === 'POST') {
      try {
        const { skillId } = await readBody();
        if (!skillId) { sendJson(400, { ok: false, message: 'skillId is required' }); return; }
        sendJson(200, await updateSkillOnDevice(skillId));
      } catch (err) {
        sendJson(400, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/skills/uninstall' && req.method === 'POST') {
      try {
        const { skillId } = await readBody();
        if (!skillId) { sendJson(400, { ok: false, message: 'skillId is required' }); return; }
        sendJson(200, await removeSkillFromDevice(skillId));
      } catch (err) {
        sendJson(400, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/settings' && req.method === 'GET') {
      const settings = await loadAllSkillSettings();
      sendJson(200, { settings });
      return;
    }

    if (url.pathname === '/api/settings' && req.method === 'POST') {
      try {
        const { skillId, values, extraRule } = await readBody();
        if (!skillId) {
          sendJson(400, { ok: false, message: 'skillId is required' });
          return;
        }
        await saveSkillSettings(skillId, { values, extraRule });
        sendJson(200, { ok: true, skillId });
      } catch (err) {
        sendJson(500, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/settings/reset' && req.method === 'POST') {
      try {
        const { skillId } = await readBody();
        if (!skillId) {
          sendJson(400, { ok: false, message: 'skillId is required' });
          return;
        }
        await resetSkillSettings(skillId);
        sendJson(200, { ok: true, skillId });
      } catch (err) {
        sendJson(500, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/inject' && req.method === 'POST') {
      try {
        const body = await readBody();
        sendJson(200, await injectToProject(body));
      } catch (err) {
        sendJson(400, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/projects/remove' && req.method === 'POST') {
      try {
        const body = await readBody();
        sendJson(200, await removeProject(body));
      } catch (err) {
        sendJson(400, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/remove' && req.method === 'POST') {
      try {
        const body = await readBody();
        sendJson(200, await removeFromProject(body));
      } catch (err) {
        sendJson(400, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/import' && req.method === 'POST') {
      try {
        const body = await readBody();
        sendJson(200, await importSkill(body));
      } catch (err) {
        sendJson(400, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/project-health') {
      try {
        sendJson(200, { projects: await collectProjectHealth() });
      } catch (err) {
        sendJson(500, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/plan-inject' && req.method === 'POST') {
      try {
        const body = await readBody();
        sendJson(200, await planInjection(body));
      } catch (err) {
        sendJson(400, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/sync' && req.method === 'POST') {
      try {
        const body = await readBody();
        sendJson(200, await syncProjectsFromWeb(body));
      } catch (err) {
        sendJson(400, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/purge/preview') {
      try {
        sendJson(200, await previewPurge());
      } catch (err) {
        sendJson(500, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/purge' && req.method === 'POST') {
      try {
        const body = await readBody();
        if (body?.confirm !== true) {
          sendJson(400, { ok: false, message: 'Set confirm: true to run a full uninstall.' });
          return;
        }
        sendJson(200, { ok: true, report: await purgeWorkspace({ deleteDevice: body.deleteDevice !== false }) });
      } catch (err) {
        sendJson(500, { ok: false, message: err.message });
      }
      return;
    }

    if (url.pathname === '/api/shutdown' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: 'ContextRig is shutting down.' }));
      setTimeout(() => {
        server.close(() => {
          if (typeof onShutdown === 'function') onShutdown();
          else process.exit(0);
        });
      }, 120);
      return;
    }

    if (url.pathname === '/api/update-check') {
      try {
        const result = await checkForUpdates({ force: url.searchParams.get('force') === '1' });
        sendJson(200, {
          currentVersion: version,
          latestVersion: result ? result.latestVersion : version,
          updateAvailable: Boolean(result && result.updateAvailable),
          fromCache: Boolean(result && result.fromCache),
          command: 'rig --update'
        });
      } catch (err) {
        sendJson(200, { currentVersion: version, latestVersion: version, updateAvailable: false, error: err.message });
      }
      return;
    }

    if (url.pathname === '/api/health') {
      const livePort = server.address() ? server.address().port : port;
      sendJson(200, {
        ok: true,
        version,
        url: `http://${host}:${livePort}`,
        startedAt
      });
      return;
    }

    if (url.pathname === '/api/agents') {
      sendJson(200, {
        agents: SUPPORTED_AGENTS.map((a) => ({ value: a.value, name: a.name, outputFile: a.outputFile }))
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  return new Promise((resolve, reject) => {
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Only tests and callers that explicitly opt in may take a random port.
        if (!allowRandomPort) {
          const hint = port === DEFAULT_PORT
            ? `Port ${port} is already in use. Stop the other ContextRig instance, or start this one on another port:\n  rig --web --port <n>\n  CONTEXTRIG_PORT=<n> rig --web`
            : `Port ${port} is already in use. Pick another with:\n  rig --web --port <n>`;
          reject(new Error(hint));
          return;
        }
        server.listen(0, host, () => {
          const actualPort = server.address().port;
          const serverUrl = `http://${host}:${actualPort}`;
          resolve({ server, port: actualPort, url: serverUrl, requestedPort: port, stop: () => server.close() });
        });
      } else {
        reject(err);
      }
    });

    server.listen(port, host, () => {
      const actualPort = server.address().port;
      const serverUrl = `http://${host}:${actualPort}`;
      resolve({ server, port: actualPort, url: serverUrl, requestedPort: port, stop: () => server.close() });
    });
  });
}
