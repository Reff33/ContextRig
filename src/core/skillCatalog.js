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
        ai_instructions: '',
        dependencies: cat.dependencies || { npm: [], pip: [] },
        mcp_servers: cat.mcp_servers || [],
        claude_command: cat.claude_command ? { name: cat.claude_command, content: '' } : undefined,
        files_to_copy: [],
        files_count: Number(cat.files_count) || 0,
        size_bytes: Number(cat.size_bytes) || 0,
        manifest_remote_url: cat.manifest_remote_url || '',
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

  return {
    ok: true,
    updated: manifestUpdated || updatedCount > 0,
    manifestUpdated,
    updatedCount,
    failedFiles,
    skill: nextManifest
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
