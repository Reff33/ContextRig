import http from 'node:http';
import path from 'node:path';
import { exec } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
import { handleGitIgnore } from '../core/gitIgnoreManager.js';
import { aggregateDependencies } from '../core/dependencyInstaller.js';
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
  // so a stale instance is reused instead of forcing a new port.
  try {
    const res = await fetch(candidateUrl, { signal: AbortSignal.timeout(1200) });
    if (!res.ok) return null;
    const body = await res.text();
    if (/ContextRig Console/.test(body)) return { url: candidateUrl, version: 'unknown' };
  } catch {
    // not a ContextRig server
  }
  return null;
}

/**
 * Starts the console on the saved port, reuses a ContextRig already running there,
 * or steps forward a few ports when something unrelated holds the slot.
 * The chosen port is persisted so the URL is stable on the next launch.
 * @param {{ preferredPort?: number, host?: string, onShutdown?: Function }} [options]
 * @returns {Promise<{ url: string, port: number, reused: boolean, server: Object|null, stop: Function }>}
 */
export async function ensureWebServer({ preferredPort = DEFAULT_PORT, host = 'localhost', onShutdown = null } = {}) {
  const saved = readSavedPort();
  const first = saved || preferredPort;
  const candidates = [first, preferredPort, ...Array.from({ length: 9 }, (_, i) => first + i + 1)]
    .filter((p, i, arr) => p > 0 && p < 65536 && arr.indexOf(p) === i);

  let lastError = null;
  for (const port of candidates) {
    try {
      const started = await startWebServer({ port, host, onShutdown });
      if (port !== first || saved !== port) savePort(port);
      return { url: started.url, port: started.port, reused: false, server: started.server, stop: started.stop };
    } catch (err) {
      lastError = err;
      if (!/already in use/i.test(err.message)) throw err;
      const existing = await probeHealth(`http://${host}:${port}`);
      if (existing) {
        return { url: existing.url, port, reused: true, server: null, stop: () => {} };
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
