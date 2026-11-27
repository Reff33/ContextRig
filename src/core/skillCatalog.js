import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  ROOT_DIR,
  CATALOG_PATH,
  SKILLS_LIBRARY_DIR,
  getDeviceDir,
  getDeviceSkillsDir
} from '../config.js';
import { getGitHubToken } from './syncEngine.js';
import { parseSkillMarkdown } from './skillImporter.js';

const FETCH_CONCURRENCY = 8;

function normalizeMainUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  return rawUrl.replace(
    'https://raw.githubusercontent.com/Reff33/ContextRig/testing/',
    'https://raw.githubusercontent.com/Reff33/ContextRig/main/'
  );
}

function isInsideDir(targetPath, baseDir) {
  const rel = path.relative(path.resolve(baseDir), path.resolve(targetPath));
  return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel);
}

function sha256(text) {
  return crypto.createHash('sha256').update(String(text).replace(/\r\n/g, '\n').trim(), 'utf8').digest('hex');
}

async function runConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let nextIdx = 0;
  async function loop() {
    while (nextIdx < items.length) {
      const idx = nextIdx++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => loop()));
  return results;
}

async function fetchTextWithCandidates(urls, headers) {
  const seen = new Set();
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return await res.text();
    } catch {
      // try next candidate
    }
  }
  return null;
}

function buildHeaders(token) {
  const headers = { 'User-Agent': 'ContextRig-CLI', Accept: 'text/plain' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function loadCatalog() {
  try {
    const raw = await fs.readFile(CATALOG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.skills) ? parsed.skills : [];
  } catch {
    return [];
  }
}

async function readSkillsFromDir(dir) {
  if (!existsSync(dir)) return [];
  try {
    const files = await fs.readdir(dir);
    const out = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const parsed = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
        if (parsed?.id && parsed?.name && parsed?.ai_instructions) {
          out.push(parsed);
        }
      } catch {
        // skip corrupt manifest
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function loadDeviceSkills() {
  return readSkillsFromDir(getDeviceSkillsDir());
}

async function measureSkillBytes(skill, baseDir) {
  let total = Buffer.byteLength(JSON.stringify(skill, null, 2), 'utf8');
  const items = Array.isArray(skill?.files_to_copy) ? skill.files_to_copy : [];
  for (const item of items) {
    if (!item?.source) continue;
    const devPath = path.resolve(baseDir, item.source);
    const rootPath = path.resolve(ROOT_DIR, item.source);
    try {
      const st = await fs.stat(existsSync(devPath) ? devPath : rootPath);
      total += st.size;
    } catch {
      // ignore missing
    }
  }
  return total;
}

export async function getCatalogAndDeviceSkills() {
  const [catalog, deviceSkills] = await Promise.all([loadCatalog(), loadDeviceSkills()]);
  const deviceDir = getDeviceDir();
  const deviceById = new Map(deviceSkills.map((s) => [s.id, s]));
  const seen = new Set();
  const merged = [];

  for (const cat of catalog) {
    seen.add(cat.id);
    const installed = deviceById.get(cat.id);
    if (installed) {
      const sizeBytes = await measureSkillBytes(installed, deviceDir);
      merged.push({
        ...installed,
        // Category and token_saver live in the shipped catalog; older device manifests
        // predate them, so fall back to the catalog entry instead of showing nothing.
        category: installed.category || cat.category,
        token_saver: Boolean(installed.token_saver ?? cat.token_saver),
        // Attribution and upstream tracking live in the shipped catalog; the device
        // manifest may be older than those fields.
        origin: installed.origin || cat.origin || 'own',
        author: installed.author || cat.author || '',
        repo: installed.repo || cat.repo || '',
        url: installed.url || cat.url || '',
        license: installed.license || cat.license || '',
        upstream_skill: installed.upstream_skill || cat.upstream_skill || '',
        upstream_skill_url: installed.upstream_skill_url || cat.upstream_skill_url || '',
        upstream_sha: installed.upstream_sha || cat.upstream_sha || '',
        upstream_project: installed.upstream_project || cat.upstream_project || '',
        upstream_project_url: installed.upstream_project_url || cat.upstream_project_url || '',
        upstream_license: installed.upstream_license || cat.upstream_license || '',
        wrapper_note: installed.wrapper_note || cat.wrapper_note || '',
        related_project: installed.related_project || cat.related_project || '',
        related_project_url: installed.related_project_url || cat.related_project_url || '',
        related_license: installed.related_license || cat.related_license || '',
        related_note: installed.related_note || cat.related_note || '',
        on_device: true,
        files_count: Array.isArray(installed.files_to_copy) ? installed.files_to_copy.length : (cat.files_count || 0),
        size_bytes: sizeBytes || Number(cat.size_bytes) || 0,
        in_catalog: true
      });
    } else {
      merged.push({
        id: cat.id,
        name: cat.name,
        description: cat.description || '',
        category: cat.category || '',
        token_saver: Boolean(cat.token_saver),
        ai_instructions: '',
        dependencies: cat.dependencies || { npm: [], pip: [] },
        mcp_servers: cat.mcp_servers || [],
        claude_command: cat.claude_command ? { name: cat.claude_command, content: '' } : undefined,
        files_to_copy: Array.isArray(cat.pack_files)
          ? cat.pack_files.map((dest) => ({ source: '', destination: dest }))
          : [],
        files_count: Number(cat.files_count) || 0,
        size_bytes: Number(cat.size_bytes) || 0,
        manifest_remote_url: cat.manifest_remote_url || '',
        origin: cat.origin || 'own',
        author: cat.author || '',
        repo: cat.repo || '',
        url: cat.url || '',
        license: cat.license || '',
        upstream_skill: cat.upstream_skill || '',
        upstream_skill_url: cat.upstream_skill_url || '',
        upstream_sha: cat.upstream_sha || '',
        upstream_project: cat.upstream_project || '',
        upstream_project_url: cat.upstream_project_url || '',
        upstream_license: cat.upstream_license || '',
        wrapper_note: cat.wrapper_note || '',
        related_project: cat.related_project || '',
        related_project_url: cat.related_project_url || '',
        related_license: cat.related_license || '',
        related_note: cat.related_note || '',
        on_device: false,
        in_catalog: true
      });
    }
  }

  for (const dev of deviceSkills) {
    if (seen.has(dev.id)) continue;
    merged.push({
      ...dev,
      on_device: true,
      files_count: Array.isArray(dev.files_to_copy) ? dev.files_to_copy.length : 0,
      size_bytes: await measureSkillBytes(dev, deviceDir),
      in_catalog: false
    });
  }

  return merged;
}

async function resolveSkillManifestRemoteOrLocal(skillId, catalogEntry, headers) {
  const mainUrl = `https://raw.githubusercontent.com/Reff33/ContextRig/main/skills_library/${skillId}.json`;
  const candidates = [
    mainUrl,
    normalizeMainUrl(catalogEntry?.manifest_remote_url),
    catalogEntry?.manifest_remote_url
  ];

  const remoteText = await fetchTextWithCandidates(candidates, headers);
  if (remoteText) {
    const parsed = JSON.parse(remoteText);
    if (parsed?.id && parsed?.name && parsed?.ai_instructions) {
      return { manifest: parsed, fromLocalFallback: false };
    }
  }

  const localSeedPath = path.join(SKILLS_LIBRARY_DIR, `${skillId}.json`);
  if (existsSync(localSeedPath)) {
    const parsed = JSON.parse(await fs.readFile(localSeedPath, 'utf8'));
    if (parsed?.id && parsed?.name && parsed?.ai_instructions) {
      return { manifest: parsed, fromLocalFallback: true };
    }
  }

  throw new Error(`Unable to download manifest for '${skillId}'. Check internet connection.`);
}

export async function installSkillToDevice(skillId) {
  if (!skillId || typeof skillId !== 'string') throw new Error('skillId is required.');
  const safeId = skillId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const catalog = await loadCatalog();
  const catEntry = catalog.find((c) => c.id === skillId || c.id === safeId) || null;
  const targetId = catEntry ? catEntry.id : skillId;

  const token = await getGitHubToken(ROOT_DIR);
  const headers = buildHeaders(token);
  const { manifest, fromLocalFallback } = await resolveSkillManifestRemoteOrLocal(targetId, catEntry, headers);

  const deviceDir = getDeviceDir();
  const deviceSkillsDir = getDeviceSkillsDir();
  const items = Array.isArray(manifest.files_to_copy) ? manifest.files_to_copy : [];

  let downloadedCount = 0;
  const failedFiles = [];

  if (items.length > 0) {
    await runConcurrent(items, FETCH_CONCURRENCY, async (item) => {
      if (!item?.source) return;
      const destPath = path.resolve(deviceDir, item.source);
      if (!isInsideDir(destPath, deviceDir)) {
        failedFiles.push(`${item.source} (unsafe path)`);
        return;
      }

      const mainAssetUrl = `https://raw.githubusercontent.com/Reff33/ContextRig/main/${String(item.source).replace(/^[/\\]+/, '')}`;
      const assetCandidates = [
        normalizeMainUrl(item.remote_url),
        item.remote_url,
        mainAssetUrl
      ];
      let content = await fetchTextWithCandidates(assetCandidates, headers);
      if (content === null) {
        const localSeedAsset = path.resolve(ROOT_DIR, item.source);
        if (isInsideDir(localSeedAsset, ROOT_DIR) && existsSync(localSeedAsset)) {
          content = await fs.readFile(localSeedAsset, 'utf8');
        }
      }

      if (content === null) {
        failedFiles.push(item.source);
        return;
      }

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, content, 'utf8');
      downloadedCount++;
    });
  }

  if (failedFiles.length > 0 && downloadedCount === 0 && items.length > 0) {
    throw new Error(`Failed to download files for '${targetId}': ${failedFiles[0]}`);
  }

  await fs.mkdir(deviceSkillsDir, { recursive: true });
  const manifestPath = path.join(deviceSkillsDir, `${manifest.id}.json`);
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    ok: true,
    skill: manifest,
    manifestPath,
    downloadedCount,
    failedFiles,
    fromLocalFallback
  };
}

export async function removeSkillFromDevice(skillId) {
  if (!skillId || typeof skillId !== 'string') throw new Error('skillId is required.');
  const deviceDir = getDeviceDir();
  const deviceSkillsDir = getDeviceSkillsDir();
  const safeFile = `${skillId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.json`;
  const manifestPath = path.join(deviceSkillsDir, safeFile);
  const directPath = path.join(deviceSkillsDir, `${skillId}.json`);
  const targetManifest = existsSync(directPath) ? directPath : manifestPath;

  let removedFiles = 0;
  if (existsSync(targetManifest)) {
    try {
      const parsed = JSON.parse(await fs.readFile(targetManifest, 'utf8'));
      const items = Array.isArray(parsed?.files_to_copy) ? parsed.files_to_copy : [];
      for (const item of items) {
        if (!item?.source) continue;
        const assetPath = path.resolve(deviceDir, item.source);
        if (isInsideDir(assetPath, deviceDir) && existsSync(assetPath)) {
          await fs.rm(assetPath, { force: true });
          removedFiles++;
        }
      }
      const skillScriptsDir = path.join(deviceDir, 'scripts', parsed?.id || skillId);
      if (isInsideDir(skillScriptsDir, deviceDir) && existsSync(skillScriptsDir)) {
        await fs.rm(skillScriptsDir, { recursive: true, force: true });
      }
    } catch {
      // still remove manifest
    }
    await fs.rm(targetManifest, { force: true });
  }

  return { ok: true, skillId, removedFiles };
}

/**
 * Pulls the author's own latest content for a third-party skill. This is what makes
 * Update meaningful for skills ContextRig only packages: the mirror here can be
 * stale, but the original repo is always the source of truth.
 * @param {Object} manifest  device manifest (has upstream_files / upstream_base)
 * @param {Object} headers
 * @returns {Promise<{ updatedCount: number, failedFiles: string[] }>}
 */
async function syncFromUpstream(manifest, headers) {
  const deviceDir = getDeviceDir();
  const items = Array.isArray(manifest.upstream_files) ? manifest.upstream_files : [];
  let updatedCount = 0;
  const failedFiles = [];

  await runConcurrent(items, FETCH_CONCURRENCY, async (item) => {
    const url = item.url || (manifest.upstream_base ? manifest.upstream_base + item.rel : null);
    if (!url || !item.source) return;
    const remote = await fetchTextWithCandidates([url], headers);
    if (remote === null) { failedFiles.push(item.source); return; }
    const destPath = path.resolve(deviceDir, item.source);
    if (!isInsideDir(destPath, deviceDir)) return;
    const existing = existsSync(destPath) ? await fs.readFile(destPath, 'utf8').catch(() => '') : '';
    if (!existsSync(destPath) || sha256(existing) !== sha256(remote)) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, remote, 'utf8');
      updatedCount++;
    }
  });

  // Prompt-only skills have no files; their body is the updatable part.
  if (manifest.refresh_instructions && manifest.upstream_skill_url) {
    const raw = await fetchTextWithCandidates([manifest.upstream_skill_url], headers);
    if (raw) {
      const parsed = parseSkillMarkdown(raw, manifest.id);
      // Same shape the package uses: bounded body stored verbatim. Heading
      // flattening happens at inject time (fileInjector), not here, so an update
      // compares against the packaged bytes instead of always looking changed.
      const body = parsed.body.replace(/\r\n/g, '\n').trim();
      const next = body.length <= 3200
        ? body
        : `${body.slice(0, 3200).trimEnd()}\n\n(Full guide: rigtools/${manifest.id}/SKILL.md)`;
      if (sha256(next) !== sha256(manifest.ai_instructions || '')) {
        manifest.ai_instructions = next;
        if (parsed.description) manifest.description = parsed.description;
        if (manifest.claude_command) {
          manifest.claude_command.content = `# /${manifest.claude_command.name}\n\n${manifest.ai_instructions}`;
        }
        updatedCount++;
      }
      // Record what was just pulled, so the skill reads as current afterwards
      // instead of staying flagged as outdated forever.
      manifest.upstream_sha = sha256(raw);
    }
  }

  return { updatedCount, failedFiles };
}

export async function updateSkillOnDevice(skillId) {
  if (!skillId || typeof skillId !== 'string') throw new Error('skillId is required.');
  const deviceDir = getDeviceDir();
  const deviceSkillsDir = getDeviceSkillsDir();
  const manifestPath = path.join(deviceSkillsDir, `${skillId}.json`);
  if (!existsSync(manifestPath)) {
    return installSkillToDevice(skillId);
  }

  const currentManifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const token = await getGitHubToken(ROOT_DIR);
  const headers = buildHeaders(token);

  const mainUrl = `https://raw.githubusercontent.com/Reff33/ContextRig/main/skills_library/${skillId}.json`;
  const remoteManifestRaw = await fetchTextWithCandidates(
    [mainUrl, normalizeMainUrl(currentManifest.manifest_remote_url), currentManifest.manifest_remote_url],
    headers
  );

  let nextManifest = currentManifest;
  let manifestUpdated = false;
  if (remoteManifestRaw) {
    try {
      const parsed = JSON.parse(remoteManifestRaw);
      if (parsed?.id && parsed?.name && parsed?.ai_instructions) {
        const curRaw = await fs.readFile(manifestPath, 'utf8');
        if (sha256(curRaw) !== sha256(remoteManifestRaw)) {
          nextManifest = parsed;
          manifestUpdated = true;
        }
      }
    } catch {
      // ignore invalid remote json
    }
  }

  const items = Array.isArray(nextManifest.files_to_copy) ? nextManifest.files_to_copy : [];
  let updatedCount = 0;
  const failedFiles = [];

  if (items.length > 0) {
    await runConcurrent(items, FETCH_CONCURRENCY, async (item) => {
      if (!item?.source) return;
      const destPath = path.resolve(deviceDir, item.source);
      if (!isInsideDir(destPath, deviceDir)) return;

      const mainAssetUrl = `https://raw.githubusercontent.com/Reff33/ContextRig/main/${String(item.source).replace(/^[/\\]+/, '')}`;
      const remoteContent = await fetchTextWithCandidates(
        [normalizeMainUrl(item.remote_url), item.remote_url, mainAssetUrl],
        headers
      );
      if (remoteContent === null) {
        failedFiles.push(item.source);
        return;
      }

      let existingContent = '';
      if (existsSync(destPath)) {
        existingContent = await fs.readFile(destPath, 'utf8').catch(() => '');
      }
      if (!existsSync(destPath) || sha256(existingContent) !== sha256(remoteContent)) {
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.writeFile(destPath, remoteContent, 'utf8');
        updatedCount++;
      }
    });
  }

  if (manifestUpdated) {
    await fs.writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');
  }

  // Third-party skills: refresh from the author's repo, not this project's mirror.
  let upstreamFiles = 0;
  let upstreamFailed = [];
  if (nextManifest.upstream_files || nextManifest.upstream_skill_url) {
    const up = await syncFromUpstream(nextManifest, headers);
    upstreamFiles = up.updatedCount;
    upstreamFailed = up.failedFiles;
    if (up.updatedCount > 0 || up.failedFiles.length === 0) {
      nextManifest.upstream_checked_at = new Date().toISOString();
      await fs.writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');
    }
  }

  return {
    ok: true,
    updated: manifestUpdated || updatedCount > 0 || upstreamFiles > 0,
    manifestUpdated,
    updatedCount: updatedCount + upstreamFiles,
    upstreamUpdated: upstreamFiles,
    failedFiles: failedFiles.concat(upstreamFailed),
    skill: nextManifest
  };
}

/**
 * Asks each tracked skill's own source whether it moved. Cached briefly so opening
 * the Skills tab does not hammer GitHub, and `force` skips the cache.
 * @param {{ force?: boolean }} [opts]
 * @returns {Promise<Record<string, 'current'|'outdated'|'none'|'unknown'>>}
 */
let updateCache = { at: 0, states: {} };

export async function getSkillUpdateStates({ force = false } = {}) {
  const CACHE_MS = 10 * 60 * 1000;
  if (!force && updateCache.at && Date.now() - updateCache.at < CACHE_MS) {
    return updateCache.states;
  }

  const catalog = await loadCatalog();
  const device = await loadDeviceSkills();
  const deviceById = new Map(device.map((s) => [s.id, s]));
  const token = await getGitHubToken(ROOT_DIR);
  const headers = buildHeaders(token);
  const states = {};

  await runConcurrent(catalog, FETCH_CONCURRENCY, async (entry) => {
    const local = deviceById.get(entry.id);
    if (!local) { states[entry.id] = 'none'; return; }

    const sourceUrl = local.upstream_skill_url || entry.upstream_skill_url;
    const baseline = local.upstream_sha || entry.upstream_sha || '';

    if (!sourceUrl) {
      // First-party skill: compare the installed manifest against the release mirror.
      const mirrorUrl = `https://raw.githubusercontent.com/Reff33/ContextRig/main/skills_library/${entry.id}.json`;
      const raw = await fetchTextWithCandidates([mirrorUrl], headers);
      if (raw === null) { states[entry.id] = 'unknown'; return; }
      states[entry.id] = baseline && baseline !== sha256(raw) ? 'outdated' : 'current';
      return;
    }

    const raw = await fetchTextWithCandidates([sourceUrl], headers);
    if (raw === null) { states[entry.id] = 'unknown'; return; }
    states[entry.id] = baseline && baseline !== sha256(raw) ? 'outdated' : 'current';
  });

  updateCache = { at: Date.now(), states };
  return states;
}

/**
 * Compares a skill against the author's own repo, not this project's mirror.
 * Third-party skills change upstream; the mirror here only freezes a snapshot, so
 * "is there an update?" must be answered by the original source.
 * @param {string} skillId
 */
export async function checkUpstreamSkill(skillId) {
  const deviceDir = getDeviceSkillsDir();
  const manifestPath = path.join(deviceDir, `${skillId}.json`);
  const catalogEntry = (await loadCatalog()).find((s) => s.id === skillId) || null;
  const deviceManifest = existsSync(manifestPath)
    ? JSON.parse(await fs.readFile(manifestPath, 'utf8'))
    : null;
  if (!deviceManifest && !catalogEntry) throw new Error(`Unknown skill '${skillId}'.`);
  // A manifest installed before the attribution fields existed still needs them,
  // so fall back to the shipped catalog entry rather than reporting "untracked".
  const local = {
    ...(catalogEntry || {}),
    ...(deviceManifest || {}),
    origin: (deviceManifest && deviceManifest.origin) || (catalogEntry && catalogEntry.origin) || 'own',
    upstream_skill_url: (deviceManifest && deviceManifest.upstream_skill_url) || (catalogEntry && catalogEntry.upstream_skill_url) || '',
    upstream_sha: (deviceManifest && deviceManifest.upstream_sha) || (catalogEntry && catalogEntry.upstream_sha) || ''
  };
  const token = await getGitHubToken(ROOT_DIR);
  const headers = buildHeaders(token);

  // First-party skills ship with ContextRig: their update path is the package
  // mirror below, and their source repository is ContextRig itself.
  if (!local.upstream_skill_url && local.origin === 'own') {
    const mainUrl = `https://raw.githubusercontent.com/Reff33/ContextRig/main/skills_library/${skillId}.json`;
    const raw = await fetchTextWithCandidates([mainUrl, local.manifest_remote_url], headers);
    if (raw === null) throw new Error('Could not reach the ContextRig repository.');
    let remote;
    try { remote = JSON.parse(raw); } catch { throw new Error('Mirror returned invalid JSON.'); }
    const localRaw = existsSync(manifestPath) ? await fs.readFile(manifestPath, 'utf8') : '';
    return {
      ok: true,
      tracked: true,
      firstParty: true,
      skillId,
      upstreamUrl: mainUrl,
      drift: Boolean(localRaw) && sha256(localRaw) !== sha256(raw),
      checkedAt: new Date().toISOString(),
      message: remote?.name ? 'Compared against the ContextRig release mirror.' : undefined
    };
  }

  const raw = await fetchTextWithCandidates([local.upstream_skill_url], headers);
  if (raw === null) throw new Error('Could not reach the upstream repository.');

  const upstreamSha = sha256(raw);
  const baseline = local.upstream_sha || '';
  return {
    ok: true,
    tracked: true,
    skillId,
    upstreamUrl: local.upstream_skill_url,
    upstreamSha,
    baselineSha: baseline,
    drift: Boolean(baseline) && upstreamSha !== baseline,
    firstCheck: !baseline,
    checkedAt: new Date().toISOString()
  };
}

export async function ensureSkillInstalled(skillId) {
  const deviceSkillsDir = getDeviceSkillsDir();
  const manifestPath = path.join(deviceSkillsDir, `${skillId}.json`);
  if (existsSync(manifestPath)) {
    try {
      const parsed = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      if (parsed?.id && parsed?.name && parsed?.ai_instructions) {
        // Ensure any missing files_to_copy are also present in deviceDir or ROOT_DIR
        const deviceDir = getDeviceDir();
        const items = Array.isArray(parsed.files_to_copy) ? parsed.files_to_copy : [];
        const allPresent = items.every(
          (i) => existsSync(path.resolve(deviceDir, i.source)) || existsSync(path.resolve(ROOT_DIR, i.source))
        );
        if (allPresent) return parsed;
      }
    } catch {
      // re-install below
    }
  }
  const installed = await installSkillToDevice(skillId);
  return installed.skill;
}
