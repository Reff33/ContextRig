import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import crypto from 'node:crypto';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ROOT_DIR, SKILLS_LIBRARY_DIR, SUPPORTED_AGENTS } from '../config.js';
import { loadAvailableSkills, saveSkill } from './skillManager.js';
import { setupTargetProject, sanitizePath } from './projectSetup.js';
import { injectTemplate } from './fileInjector.js';
import { handleDependencies } from './dependencyInstaller.js';
import { handleGitIgnore } from './gitIgnoreManager.js';
import { detectInstalledSkills, detectConfiguredAgents } from './skillUpdater.js';
import { registerProject, pruneMissingProjects } from './projectRegistry.js';
import { getSkillSchema, getSkillSettings, mergeConfigContent, syncProjectSkillConfigs } from './skillSettings.js';
import { logger } from '../utils/logger.js';

const CACHE_FILE_NAME = '.contextrig_cache.json';
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour TTL
const FETCH_CONCURRENCY = 8;

/**
 * Runs an async task over items with bounded concurrency.
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await worker(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

/**
 * Calculates SHA-256 hash of a string.
 * @param {string} content
 * @returns {string}
 */
export function calculateHash(content) {
  return crypto.createHash('sha256').update(content.trim(), 'utf8').digest('hex');
}

/**
 * Loads cache from .contextrig_cache.json in the target project.
 * @param {string} targetDir
 * @returns {Promise<Object>}
 */
export async function loadCache(targetDir) {
  const cachePath = path.join(targetDir, CACHE_FILE_NAME);
  if (!existsSync(cachePath)) {
    return { last_checked: null, etags: {}, hashes: {} };
  }
  try {
    const raw = await fs.readFile(cachePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      last_checked: parsed.last_checked || null,
      etags: parsed.etags || {},
      hashes: parsed.hashes || {}
    };
  } catch {
    return { last_checked: null, etags: {}, hashes: {} };
  }
}

/**
 * Saves cache to .contextrig_cache.json in the target project.
 * @param {string} targetDir
 * @param {Object} cache
 */
export async function saveCache(targetDir, cache) {
  const cachePath = path.join(targetDir, CACHE_FILE_NAME);
  try {
    await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch (err) {
    logger.warn(`Could not save sync cache: ${err.message}`);
  }
}

/**
 * Reads GITHUB_TOKEN from process.env or target project's .env file.
 * @param {string} targetDir
 * @returns {Promise<string|null>}
 */
export async function getGitHubToken(targetDir) {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN.trim();
  }

  const envPath = path.join(targetDir, '.env');
  if (existsSync(envPath)) {
    try {
      const content = await fs.readFile(envPath, 'utf8');
      const match = content.match(/^GITHUB_TOKEN\s*=\s*['"]?([^'"\r\n]+)['"]?/m);
      if (match && match[1]) {
        return match[1].trim();
      }
    } catch {
      // Ignore read errors
    }
  }

  return null;
}

/**
 * Fetches a remote file using Conditional Request (ETag / If-None-Match).
 * @param {string} remoteUrl
 * @param {string|null} cachedEtag
 * @param {string|null} token
 * @returns {Promise<{ notModified: boolean, content?: string, etag?: string, error?: string }>}
 */
export async function fetchRemoteFile(remoteUrl, cachedEtag = null, token = null) {
  const headers = {
    'User-Agent': 'ContextRig-SyncEngine/1.0',
    Accept: 'text/plain, application/json, */*'
  };

  if (cachedEtag) {
    headers['If-None-Match'] = cachedEtag;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(remoteUrl, { headers });

    if (response.status === 304) {
      return { notModified: true, etag: cachedEtag };
    }

    if (!response.ok) {
      return { notModified: false, error: `HTTP ${response.status} ${response.statusText}` };
    }

    const content = await response.text();
    const newEtag = response.headers.get('etag') || response.headers.get('x-amz-version-id') || null;

    return {
      notModified: false,
      content,
      etag: newEtag
    };
  } catch (err) {
    return { notModified: false, error: err.message };
  }
}

/**
 * Checks a single installed skill for available updates against remote_url or local source.
 * @param {string} targetDir
 * @param {Object} skill
 * @param {Object} cache
 * @param {string|null} token
 * @returns {Promise<Object>}
 */
export async function checkSingleSkillUpdate(targetDir, skill, cache, token) {
  const outdatedFiles = [];
  const stagedContent = {};
  const newEtags = {};
  const newHashes = {};
  let hasUpdate = false;

  const schema = getSkillSchema(skill);
  const savedSettings = schema.configTarget ? await getSkillSettings(skill.id) : { values: {} };
  const hasSavedConfig = Boolean(schema.configTarget && Object.keys(savedSettings.values).length > 0);

  if (Array.isArray(skill.files_to_copy) && skill.files_to_copy.length > 0) {
    const results = await mapWithConcurrency(skill.files_to_copy, FETCH_CONCURRENCY, async (item) => {
      const destPath = path.resolve(targetDir, item.destination);
      const destRel = item.destination.replace(/\\/g, '/');
      const fileKey = `${skill.id}:${destRel}`;
      const isConfigTarget = hasSavedConfig && destRel === schema.configTarget;

      let localContent = '';
      let localExists = false;
      try {
        localContent = await fs.readFile(destPath, 'utf8');
        localExists = true;
      } catch {
        localExists = false;
      }

      const localHash = localExists ? calculateHash(localContent) : '';
      const cachedEtag = cache.etags?.[fileKey] || null;
      const cachedHash = cache.hashes?.[fileKey] || null;

      if (item.remote_url) {
        // Only allow 304 Not Modified skip if local file exists AND matches last synced hash
        const canUseEtag = Boolean(localExists && cachedEtag && cachedHash && localHash === cachedHash && !isConfigTarget);
        const res = await fetchRemoteFile(item.remote_url, canUseEtag ? cachedEtag : null, token);

        if (res.notModified) {
          return { destRel, fileKey, outdated: false };
        }

        if (res.error) {
          logger.warn(`Could not check remote ${destRel}: ${res.error}. Falling back to local check.`);
        } else if (res.content !== undefined) {
          const expectedContent = isConfigTarget
            ? mergeConfigContent(res.content, savedSettings.values, schema)
            : res.content;
          const remoteHash = calculateHash(expectedContent);
          const outdated = !localExists || remoteHash !== localHash;
          return {
            destRel,
            destination: item.destination,
            fileKey,
            outdated,
            content: outdated ? expectedContent : undefined,
            etag: isConfigTarget ? null : res.etag || null,
            hash: remoteHash
          };
        }
      }

      // Fallback: Compare with local ContextRig master files in scripts/
      if (item.source) {
        const srcPath = path.resolve(ROOT_DIR, item.source);
        try {
          const srcContent = await fs.readFile(srcPath, 'utf8');
          const expectedContent = isConfigTarget
            ? mergeConfigContent(srcContent, savedSettings.values, schema)
            : srcContent;
          const srcHash = calculateHash(expectedContent);
          const outdated = !localExists || srcHash !== localHash;
          return {
            destRel,
            destination: item.destination,
            fileKey,
            outdated,
            content: outdated ? expectedContent : undefined,
            hash: srcHash
          };
        } catch {
          // Source not readable
        }
      }

      return { destRel, fileKey, outdated: false };
    });

    for (const r of results) {
      if (!r) continue;
      if (r.etag) newEtags[r.fileKey] = r.etag;
      if (r.hash) newHashes[r.fileKey] = r.hash;
      if (r.outdated) {
        hasUpdate = true;
        outdatedFiles.push(path.basename(r.destRel));
        stagedContent[r.destination] = r.content;
      }
    }
  }

  // Only check/sync Claude slash command when project uses Claude (CLAUDE.md or .claude/)
  const hasClaudeProfile =
    existsSync(path.join(targetDir, 'CLAUDE.md')) ||
    existsSync(path.join(targetDir, '.claude'));

  if (hasClaudeProfile && skill.claude_command?.name && skill.claude_command?.content) {
    const cmdRel = `.claude/commands/${skill.claude_command.name}.md`;
    const cmdPath = path.join(targetDir, cmdRel);
    const expectedCmd = skill.claude_command.content.trim() + '\n';
    try {
      const existingCmd = await fs.readFile(cmdPath, 'utf8');
      if (calculateHash(existingCmd) !== calculateHash(expectedCmd)) {
        hasUpdate = true;
        outdatedFiles.push(cmdRel);
        stagedContent[cmdRel] = expectedCmd;
      }
    } catch {
      hasUpdate = true;
      outdatedFiles.push(cmdRel);
      stagedContent[cmdRel] = expectedCmd;
    }
  }

  return {
    ...skill,
    hasUpdate,
    outdatedFiles,
    stagedContent,
    newEtags,
    newHashes
  };
}

/**
 * Inspects a single project directory for skill updates.
 * @param {string} targetPath
 * @param {Array<Object>} availableSkills
 * @param {{ skillFilterId?: string|null }} [options]
 * @returns {Promise<Object|null>}
 */
export async function inspectProjectUpdates(targetPath, availableSkills, { skillFilterId = null } = {}) {
  const { fullPath, projectName } = await setupTargetProject(targetPath);
  const installedSkills = await detectInstalledSkills(fullPath, availableSkills);
  const configuredAgents = await detectConfiguredAgents(fullPath);

  if (installedSkills.length === 0) {
    return {
      fullPath,
      projectName,
      configuredAgents,
      installedSkills: [],
      checkedSkills: [],
      outdatedSkills: [],
      cache: await loadCache(fullPath)
    };
  }

  await registerProject({
    projectPath: fullPath,
    name: projectName,
    agents: configuredAgents.map((a) => a.value),
    skills: installedSkills.map((s) => s.id)
  });

  const skillsToCheck = skillFilterId
    ? installedSkills.filter((s) => s.id === skillFilterId)
    : installedSkills;

  if (skillsToCheck.length === 0) {
    return {
      fullPath,
      projectName,
      configuredAgents,
      installedSkills,
      checkedSkills: [],
      outdatedSkills: [],
      cache: await loadCache(fullPath)
    };
  }

  const token = await getGitHubToken(fullPath);
  const cache = await loadCache(fullPath);

  const checkedSkills = await Promise.all(
    skillsToCheck.map((skill) => checkSingleSkillUpdate(fullPath, skill, cache, token))
  );

  // Merge fresh ETags & hashes from all checked skills so subsequent runs hit 304 Not Modified
  for (const s of checkedSkills) {
    if (s.newEtags && Object.keys(s.newEtags).length > 0) {
      cache.etags = { ...cache.etags, ...s.newEtags };
    }
    if (s.newHashes && Object.keys(s.newHashes).length > 0) {
      cache.hashes = { ...cache.hashes, ...s.newHashes };
    }
  }

  const outdatedSkills = checkedSkills.filter((s) => s.hasUpdate);

  return {
    fullPath,
    projectName,
    configuredAgents,
    installedSkills,
    checkedSkills,
    outdatedSkills,
    cache
  };
}

function printCompactFileList(files, maxVisible = 6) {
  if (!files || files.length === 0) return;
  console.log();
  const visible = files.slice(0, maxVisible);
  for (const file of visible) {
    console.log(`  ${chalk.green('✔')}  ${chalk.dim(file)}`);
  }
  if (files.length > maxVisible) {
    console.log(`  ${chalk.cyan(`… +${files.length - maxVisible} more file(s)`)}`);
  }
  console.log();
}

function formatSkillOptionName(skill) {
  const shortTitle = skill.name.length > 42 ? `${skill.name.slice(0, 41)}…` : skill.name;
  return `${chalk.cyan(`[${skill.id}]`.padEnd(16))} ${shortTitle}`;
}

/**
 * Applies staged updates for a single project inspection without clobbering remote files or custom rules.
 * @param {Object} inspection
 * @param {{ promptDeps?: boolean }} [options]
 */
export async function applyProjectUpdates(inspection, { promptDeps = true } = {}) {
  const { fullPath, projectName, configuredAgents, installedSkills, outdatedSkills, cache } = inspection;

  const updatedFiles = [];
  for (const skill of outdatedSkills) {
    for (const [destRel, content] of Object.entries(skill.stagedContent)) {
      const destPath = path.resolve(fullPath, destRel);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, content, 'utf8');
      updatedFiles.push(destRel);
    }
  }
  await syncProjectSkillConfigs(fullPath, installedSkills);
  printCompactFileList(updatedFiles);

  // Re-sync AI rules with Smart Merge & copyAssets: false (never overwrite remote staged files or user custom rules)
  for (const agent of configuredAgents) {
    logger.step(`Re-syncing AI rules in ${agent.outputFile}...`);
    await injectTemplate({
      targetDir: fullPath,
      templateFileName: agent.templateFile,
      outputFileName: agent.outputFile,
      projectName,
      agentName: agent.name,
      skillsInstructions: installedSkills,
      mergeMode: 'merge',
      copyAssets: false
    });
    logger.success(`Synchronized: ${agent.outputFile}`);
  }

  await handleGitIgnore(fullPath, installedSkills);

  if (promptDeps) {
    await handleDependencies(fullPath, outdatedSkills, configuredAgents[0] || null);
  }

  cache.last_checked = Date.now();
  await saveCache(fullPath, cache);

  await registerProject({
    projectPath: fullPath,
    name: projectName,
    agents: configuredAgents.map((a) => a.value),
    skills: installedSkills.map((s) => s.id)
  });
}

function hasLocalUncommittedManifest(skillId) {
  if (!existsSync(path.join(ROOT_DIR, '.git'))) return false;
  try {
    const status = execFileSync('git', ['status', '--porcelain', '--', `skills_library/${skillId}.json`], {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Inspects a single skill's remote manifest & master scripts in memory without writing to disk.
 * @param {Object} skill
 * @param {{ token?: string|null }} [options]
 */
export async function inspectMasterSkillLibrary(skill, { token = null } = {}) {
  const authToken = token || (await getGitHubToken(ROOT_DIR));
  let effectiveSkill = skill;
  let manifestUpdate = null;
  let manifestNote = null;

  if (skill.manifest_remote_url) {
    if (hasLocalUncommittedManifest(skill.id)) {
      manifestNote = `Local skills_library/${skill.id}.json has uncommitted changes — keeping local manifest.`;
    } else {
      const manifestRes = await fetchRemoteFile(skill.manifest_remote_url, null, authToken);
      if (manifestRes.error) {
        manifestNote = `Manifest check skipped (${manifestRes.error}); using local ${skill.id}.json.`;
      } else if (manifestRes.content) {
        try {
          const parsed = JSON.parse(manifestRes.content);
          if (parsed.id === skill.id && parsed.ai_instructions) {
            const localManifestPath = path.join(SKILLS_LIBRARY_DIR, `${skill.id}.json`);
            let currentRaw = '';
            try {
              currentRaw = await fs.readFile(localManifestPath, 'utf8');
            } catch {}
            if (calculateHash(currentRaw) !== calculateHash(manifestRes.content)) {
              manifestUpdate = { parsed };
              effectiveSkill = parsed;
            }
          }
        } catch (err) {
          manifestNote = `Invalid remote manifest JSON for ${skill.id}: ${err.message}`;
        }
      }
    }
  }

  const items = Array.isArray(effectiveSkill.files_to_copy)
    ? effectiveSkill.files_to_copy.filter((i) => i.source && i.remote_url)
    : [];

  const updates = [];
  const failedFiles = [];

  if (items.length > 0) {
    const results = await mapWithConcurrency(items, FETCH_CONCURRENCY, async (item) => {
      const masterPath = path.resolve(ROOT_DIR, item.source);
      let localContent = '';
      let localExists = false;
      try {
        localContent = await fs.readFile(masterPath, 'utf8');
        localExists = true;
      } catch {}

      const res = await fetchRemoteFile(item.remote_url, null, authToken);
      if (res.error || res.content === undefined) {
        return { source: item.source, error: res.error || 'empty' };
      }

      if (!localExists || calculateHash(localContent) !== calculateHash(res.content)) {
        return { source: item.source, masterPath, content: res.content, updated: true };
      }
      return { source: item.source, updated: false };
    });

    for (const r of results) {
      if (r.error) {
        failedFiles.push(`${r.source} (${r.error})`);
      } else if (r.updated) {
        updates.push({ source: r.source, masterPath: r.masterPath, content: r.content });
      }
    }
  }

  return {
    skill: effectiveSkill,
    manifestUpdate,
    manifestNote,
    updates,
    failedFiles,
    hasRemoteFiles: items.length > 0 || Boolean(skill.manifest_remote_url),
    hasUpdate: Boolean(manifestUpdate) || updates.length > 0
  };
}

/**
 * Applies previously inspected Master Library updates to ContextRig's skills_library/ and scripts/.
 * @param {Object} inspection
 */
export async function applyMasterSkillInspection(inspection) {
  let manifestUpdated = false;
  if (inspection.manifestUpdate?.parsed) {
    await saveSkill(inspection.manifestUpdate.parsed);
    manifestUpdated = true;
  }

  const updatedFiles = [];
  for (const u of inspection.updates) {
    await fs.mkdir(path.dirname(u.masterPath), { recursive: true });
    await fs.writeFile(u.masterPath, u.content, 'utf8');
    updatedFiles.push(u.source);
  }

  return {
    updatedCount: updatedFiles.length,
    manifestUpdated,
    updatedFiles,
    errorCount: inspection.failedFiles.length,
    skill: inspection.skill
  };
}

function printMasterStatusLine(inspection) {
  const id = inspection.skill.id.padEnd(16);
  if (!inspection.hasRemoteFiles) {
    console.log(`${chalk.dim('  —  [LOCAL ONLY]')}       ${chalk.dim(id)} ${chalk.dim('(no remote URLs)')}`);
    return;
  }
  if (inspection.failedFiles.length > 0 && !inspection.hasUpdate) {
    console.log(`${chalk.red('  !  [CHECK FAILED]')}     ${chalk.white(id)} ${chalk.red(`(${inspection.failedFiles.length} unreachable)`)}`);
    return;
  }
  if (inspection.hasUpdate) {
    const parts = [];
    if (inspection.manifestUpdate) parts.push('manifest');
    if (inspection.updates.length > 0) parts.push(`${inspection.updates.length} file(s)`);
    console.log(`${chalk.bold.yellow('  ▲ [UPDATE AVAILABLE]')} ${chalk.white(id)} ${chalk.cyan(`[${parts.join(' + ')}]`)}`);
    return;
  }
  console.log(`${chalk.green('  ✔  [UP TO DATE]')}       ${chalk.dim(inspection.skill.id)}`);
}

/**
 * Syncs a single skill's remote manifest & master scripts directly into ContextRig itself.
 * @param {Object} skill
 * @param {{ token?: string|null }} [options]
 */
export async function syncMasterSkillLibrary(skill, { token = null } = {}) {
  logger.step(`Checking master library for ${skill.id}...`);
  const inspection = await inspectMasterSkillLibrary(skill, { token });

  if (inspection.manifestNote) {
    logger.warn(inspection.manifestNote);
  }

  if (!inspection.hasRemoteFiles) {
    logger.info(`No remote files configured for ${inspection.skill.id} master library.`);
    return { updatedCount: 0, errorCount: 0, skill: inspection.skill };
  }

  const applied = await applyMasterSkillInspection(inspection);
  if (applied.manifestUpdated) {
    logger.success(`Updated manifest: skills_library/${inspection.skill.id}.json`);
  }
  printCompactFileList(applied.updatedFiles);

  if (applied.errorCount > 0) {
    console.log();
    for (const errLine of inspection.failedFiles.slice(0, 6)) {
      logger.warn(`Failed: ${errLine}`);
    }
    if (inspection.failedFiles.length > 6) {
      logger.warn(`... +${inspection.failedFiles.length - 6} more failed file(s)`);
    }
    console.log();
  }

  if (applied.errorCount > 0 && applied.updatedCount === 0) {
    logger.error(`${inspection.skill.id} master sync failed (${applied.errorCount} file(s) unreachable).`);
  } else if (applied.errorCount > 0) {
    logger.warn(`Updated ${applied.updatedCount} file(s) for ${inspection.skill.id}, but ${applied.errorCount} failed.`);
  } else if (applied.updatedCount === 0 && !applied.manifestUpdated) {
    logger.success(`${inspection.skill.id} master library is already up to date.`);
  } else {
    logger.success(`Updated ${applied.updatedCount} master file(s) for ${inspection.skill.id}.`);
  }

  return { updatedCount: applied.updatedCount, errorCount: applied.errorCount, skill: applied.skill };
}

/**
 * Prints status badges for a single inspected project.
 * @param {Object} inspection
 */
function printInspectionSummary(inspection) {
  logger.info(`Skill Status for ${inspection.projectName} (${inspection.fullPath}):`);
  for (const s of inspection.checkedSkills) {
    if (s.hasUpdate) {
      const count = s.outdatedFiles.length;
      const filesBadge =
        count === 1
          ? ` ${chalk.dim(`(${s.outdatedFiles[0]})`)}`
          : count <= 2
            ? ` ${chalk.dim(`(${s.outdatedFiles.join(', ')})`)}`
            : ` ${chalk.cyan(`[${count} files to update]`)}`;
      console.log(`${chalk.bold.yellow('  ▲ [UPDATE AVAILABLE]')} ${chalk.white(s.name)}${filesBadge}`);
    } else {
      console.log(`${chalk.green('  ✔  [UP TO DATE]')}      ${chalk.dim(s.name)}`);
    }
  }
}

/**
 * Syncs a single target project interactively (or with autoConfirm).
 * @param {string} targetPath
 * @param {{ skillFilterId?: string|null, autoConfirm?: boolean, promptDeps?: boolean }} [options]
 */
async function syncSingleProject(targetPath, { skillFilterId = null, autoConfirm = false, promptDeps = true } = {}) {
  const availableSkills = await loadAvailableSkills();
  const inspection = await inspectProjectUpdates(targetPath, availableSkills, { skillFilterId });

  console.log();
  logger.info(`Target directory: ${inspection.fullPath} (Project: ${inspection.projectName})`);
  console.log();

  if (inspection.installedSkills.length === 0) {
    logger.warn(`No ContextRig skills detected in ${inspection.fullPath}. Use [1] Inject Skills to Project instead.`);
    return;
  }

  if (inspection.checkedSkills.length === 0) {
    logger.info(`Skill '${skillFilterId}' is not installed in ${inspection.projectName}.`);
    return;
  }

  const token = await getGitHubToken(inspection.fullPath);
  if (token) {
    logger.info('GitHub Token detected (higher rate limit active: 5000/hr).');
  }

  const now = Date.now();
  if (inspection.cache.last_checked && now - inspection.cache.last_checked < DEFAULT_TTL_MS) {
    const minutesAgo = Math.round((now - inspection.cache.last_checked) / (60 * 1000));
    logger.info(`Last checked ${minutesAgo} min ago (ETag cache active).`);
  }

  printInspectionSummary(inspection);

  if (inspection.outdatedSkills.length === 0) {
    logger.success('All checked skills are already up to date!');
    inspection.cache.last_checked = Date.now();
    await saveCache(inspection.fullPath, inspection.cache);
    await registerProject({
      projectPath: inspection.fullPath,
      name: inspection.projectName,
      agents: inspection.configuredAgents.map((a) => a.value),
      skills: inspection.installedSkills.map((s) => s.id)
    });
    return;
  }

  logger.divider();

  let proceedWithUpdate = autoConfirm;
  if (!autoConfirm) {
    console.log();
    while (true) {
      const totalFilesCount = inspection.outdatedSkills.length > 0
        ? inspection.outdatedSkills.reduce((acc, s) => acc + s.outdatedFiles.length, 0)
        : 0;
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: `Found ${inspection.outdatedSkills.length} outdated skill(s) (${totalFilesCount} files):`,
          choices: [
            {
              name: `${chalk.bold.green('Apply All Updates')} ${chalk.green('[Recommended]')}`,
              short: 'Apply All Updates',
              description: `Apply updates to ${inspection.outdatedSkills.length} skill(s) (${totalFilesCount} files total)`,
              value: 'apply'
            },
            {
              name: chalk.cyan('Inspect File Details'),
              short: 'Inspect File Details',
              description: 'View full list of changed files per skill',
              value: 'inspect'
            },
            new inquirer.Separator(),
            {
              name: chalk.yellow('← Cancel & Back to Main Menu'),
              short: 'Cancelled',
              value: 'cancel'
            }
          ]
        }
      ]);

      if (action === 'apply') {
        proceedWithUpdate = true;
        break;
      } else if (action === 'inspect') {
        console.log();
        logger.divider();
        logger.step('Update Details & File Breakdown:');
        console.log();
        for (const s of inspection.outdatedSkills) {
          console.log(`  ${chalk.bold.yellow('●')} ${chalk.bold.white(s.name)} ${chalk.dim(`(${s.outdatedFiles.length} file(s))`)}:`);
          for (const file of s.outdatedFiles) {
            console.log(`    ${chalk.dim('↳')} ${chalk.cyan(file)}`);
          }
          console.log();
        }
        logger.divider();
        console.log();
      } else {
        proceedWithUpdate = false;
        break;
      }
    }
  }

  if (!proceedWithUpdate) {
    logger.info('Skill update cancelled.');
    return;
  }

  logger.step(`Applying updates for ${inspection.outdatedSkills.length} skill(s)...`);
  await applyProjectUpdates(inspection, { promptDeps: autoConfirm ? false : promptDeps });
  logger.success(`Successfully updated ${inspection.outdatedSkills.length} skill(s) in ${inspection.projectName}!`);
}

/**
 * Syncs all registered projects in ~/.contextrig/projects.json (optionally filtered by skillId).
 * @param {{ skillFilterId?: string|null, autoConfirm?: boolean }} [options]
 */
export async function runSyncAllWorkflow({ skillFilterId = null, autoConfirm = false } = {}) {
  const { valid: projects, removed } = await pruneMissingProjects();
  if (removed.length > 0) {
    logger.info(`Pruned ${removed.length} missing project directory(s) from registry.`);
  }

  if (projects.length === 0) {
    logger.warn('No registered projects found yet. Inject or sync a project once to auto-register it.');
    return;
  }

  const availableSkills = await loadAvailableSkills();
  const targetProjects = skillFilterId
    ? projects.filter((p) => !p.skills?.length || p.skills.includes(skillFilterId))
    : projects;

  if (targetProjects.length === 0) {
    logger.warn(`No registered projects use skill '${skillFilterId}'.`);
    return;
  }

  logger.step(`Checking ${targetProjects.length} registered project(s)...`);
  console.log();

  const inspections = [];
  for (const proj of targetProjects) {
    const inspection = await inspectProjectUpdates(proj.path, availableSkills, { skillFilterId });
    if (inspection.checkedSkills.length > 0) {
      inspections.push(inspection);
      printInspectionSummary(inspection);
      console.log();
    } else {
      inspection.cache.last_checked = Date.now();
      await saveCache(inspection.fullPath, inspection.cache);
    }
  }

  const projectsWithUpdates = inspections.filter((i) => i.outdatedSkills.length > 0);
  if (projectsWithUpdates.length === 0) {
    for (const insp of inspections) {
      insp.cache.last_checked = Date.now();
      await saveCache(insp.fullPath, insp.cache);
    }
    logger.success('All registered projects are already up to date!');
    return;
  }

  let proceed = autoConfirm;
  if (!autoConfirm) {
    const totalFiles = projectsWithUpdates.reduce(
      (sum, insp) => sum + insp.outdatedSkills.reduce((sSum, s) => sSum + s.outdatedFiles.length, 0),
      0
    );
    console.log();
    const { confirmAll } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmAll',
        message: `Apply updates across ${projectsWithUpdates.length} project(s) (${totalFiles} files total)?`,
        default: true
      }
    ]);
    proceed = confirmAll;
  }

  if (!proceed) {
    console.log();
    logger.info('Batch sync cancelled.');
    return;
  }

  for (const insp of projectsWithUpdates) {
    console.log();
    logger.divider();
    console.log();
    logger.step(`Updating ${insp.projectName} (${insp.fullPath})...`);
    console.log();
    await applyProjectUpdates(insp, { promptDeps: !autoConfirm });
  }

  console.log();
  logger.success(`Batch sync complete: updated ${projectsWithUpdates.length} project(s)!`);
}

/**
 * Skill-first update workflow: update all registered projects using a skill, or ContextRig's master scripts/.
 * @param {{ skillId?: string|null, autoConfirm?: boolean }} [options]
 */
export async function runUpdateBySkillWorkflow({ skillId = null, autoConfirm = false } = {}) {
  const availableSkills = await loadAvailableSkills();
  if (availableSkills.length === 0) {
    logger.warn('No skills found in skills_library/.');
    return;
  }

  let chosenSkill = skillId ? availableSkills.find((s) => s.id === skillId) : null;
  if (skillId && !chosenSkill) {
    logger.error(`Unknown skill ID: '${skillId}'.`);
    return;
  }

  if (!chosenSkill) {
    console.log();
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select skill to sync/update:',
        choices: [
          ...availableSkills.map((s) => ({
            name: formatSkillOptionName(s),
            short: s.id,
            description: s.description,
            value: s
          })),
          new inquirer.Separator(),
          { name: chalk.yellow('← Back'), short: 'Back', value: null }
        ]
      }
    ]);
    if (!selected) return;
    chosenSkill = selected;
  }

  if (autoConfirm) {
    console.log();
    await runSyncAllWorkflow({ skillFilterId: chosenSkill.id, autoConfirm: true });
    return;
  }

  console.log();
  const { targetScope } = await inquirer.prompt([
    {
      type: 'list',
      name: 'targetScope',
      message: `Update scope for ${chalk.cyan(chosenSkill.id)}:`,
      choices: [
        {
          name: `Registered Projects ${chalk.green('[Recommended]')}`,
          short: 'Registered Projects',
          description: `Push updates to saved projects using ${chosenSkill.id}`,
          value: 'projects'
        },
        {
          name: 'Master Library',
          short: 'Master Library',
          description: 'Refresh local skills_library/ and scripts/ from GitHub',
          value: 'master'
        },
        {
          name: 'Both (Master + Projects)',
          short: 'Both',
          description: 'Update Master Library first, then push to saved projects',
          value: 'both'
        },
        new inquirer.Separator(),
        { name: chalk.yellow('← Back'), short: 'Back', value: 'back' }
      ]
    }
  ]);

  if (targetScope === 'back') return;

  console.log();
  if (targetScope === 'master' || targetScope === 'both') {
    const masterInsp = await inspectMasterSkillLibrary(chosenSkill);
    if (masterInsp.manifestNote) logger.warn(masterInsp.manifestNote);
    printMasterStatusLine(masterInsp);
    console.log();

    if (masterInsp.hasUpdate) {
      const { confirmMaster } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmMaster',
          message: `Apply Master Library update for ${chosenSkill.id} (${masterInsp.updates.length} file(s))?`,
          default: true
        }
      ]);
      if (confirmMaster) {
        const applied = await applyMasterSkillInspection(masterInsp);
        printCompactFileList(applied.updatedFiles);
        logger.success(`Updated ${applied.updatedCount} master file(s) for ${chosenSkill.id}.`);
      } else {
        logger.info('Master Library update skipped.');
      }
      console.log();
    } else if (masterInsp.hasRemoteFiles && masterInsp.failedFiles.length === 0) {
      logger.success(`${chosenSkill.id} Master Library is already up to date.`);
      console.log();
    }
  }
  if (targetScope === 'projects' || targetScope === 'both') {
    await runSyncAllWorkflow({ skillFilterId: chosenSkill.id, autoConfirm: false });
  }
}

/**
 * Checks all skills in ContextRig Master Library and all registered projects in one flow,
 * printing a status breakdown before asking once to apply any available updates.
 */
export async function runCheckAndUpdateAllWorkflow({ autoConfirm = false } = {}) {
  const availableSkills = await loadAvailableSkills();
  const { valid: projects, removed } = await pruneMissingProjects();
  if (removed.length > 0) {
    logger.info(`Pruned ${removed.length} missing project directory(s) from registry.`);
    console.log();
  }

  // 1. Check ContextRig Master Library
  let masterOutdated = [];
  if (availableSkills.length > 0) {
    logger.step(`Checking ContextRig Master Library (${availableSkills.length} skill(s))...`);
    console.log();
    const token = await getGitHubToken(ROOT_DIR);
    const masterInspections = await mapWithConcurrency(availableSkills, 3, (s) =>
      inspectMasterSkillLibrary(s, { token })
    );

    for (const insp of masterInspections) {
      if (insp.manifestNote) logger.warn(insp.manifestNote);
      printMasterStatusLine(insp);
    }
    console.log();
    masterOutdated = masterInspections.filter((i) => i.hasUpdate);
  }

  // 2. Check Registered Projects
  const projectInspections = [];
  if (projects.length > 0) {
    logger.step(`Checking ${projects.length} registered project(s)...`);
    console.log();
    for (const proj of projects) {
      const inspection = await inspectProjectUpdates(proj.path, availableSkills);
      if (inspection.checkedSkills.length > 0) {
        projectInspections.push(inspection);
        printInspectionSummary(inspection);
        console.log();
      } else {
        inspection.cache.last_checked = Date.now();
        await saveCache(inspection.fullPath, inspection.cache);
      }
    }
  } else {
    logger.info('No registered projects yet — checked Master Library only.');
    console.log();
  }

  const projectsWithUpdates = projectInspections.filter((i) => i.outdatedSkills.length > 0);
  if (masterOutdated.length === 0 && projectsWithUpdates.length === 0) {
    for (const insp of projectInspections) {
      insp.cache.last_checked = Date.now();
      await saveCache(insp.fullPath, insp.cache);
    }
    logger.success('Everything is up to date! No updates needed.');
    return;
  }

  const masterFilesTotal = masterOutdated.reduce(
    (sum, i) => sum + i.updates.length + (i.manifestUpdate ? 1 : 0),
    0
  );
  const projectFilesTotal = projectsWithUpdates.reduce(
    (sum, insp) => sum + insp.outdatedSkills.reduce((sSum, s) => sSum + s.outdatedFiles.length, 0),
    0
  );

  const summaryParts = [];
  if (masterOutdated.length > 0) {
    summaryParts.push(`${masterOutdated.length} Master skill(s) (${masterFilesTotal} file(s))`);
  }
  if (projectsWithUpdates.length > 0) {
    summaryParts.push(`${projectsWithUpdates.length} project(s) (${projectFilesTotal} file(s))`);
  }

  let proceed = autoConfirm;
  if (!autoConfirm) {
    const { confirmAll } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmAll',
        message: `Apply updates for ${summaryParts.join(' and ')}?`,
        default: true
      }
    ]);
    proceed = confirmAll;
  }

  if (!proceed) {
    console.log();
    logger.info('Update cancelled — no files were modified.');
    return;
  }

  for (const insp of masterOutdated) {
    console.log();
    logger.step(`Updating Master Library: ${insp.skill.id}...`);
    const applied = await applyMasterSkillInspection(insp);
    if (applied.manifestUpdated) {
      logger.success(`Updated manifest: skills_library/${insp.skill.id}.json`);
    }
    printCompactFileList(applied.updatedFiles);
  }

  for (const insp of projectsWithUpdates) {
    console.log();
    logger.divider();
    console.log();
    logger.step(`Updating ${insp.projectName} (${insp.fullPath})...`);
    console.log();
    await applyProjectUpdates(insp, { promptDeps: !autoConfirm });
  }

  console.log();
  logger.success('All selected updates applied successfully!');
}

/**
 * Interactive workflow to update ContextRig's own local skills_library/ & scripts/ from GitHub.
 */
export async function runSyncMasterWorkflow() {
  const availableSkills = await loadAvailableSkills();
  if (availableSkills.length === 0) {
    logger.warn('No skills found in skills_library/.');
    return;
  }

  console.log();
  const { chosen } = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosen',
      message: 'Select skill(s) to check in ContextRig Master Library:',
      choices: [
        {
          name: chalk.bold.green(`All Master Skills (${availableSkills.length})`),
          short: 'All Master Skills',
          description: 'Check all manifests and scripts inside ContextRig',
          value: '__ALL__'
        },
        new inquirer.Separator(),
        ...availableSkills.map((s) => ({
          name: formatSkillOptionName(s),
          short: s.id,
          description: s.description,
          value: s
        })),
        new inquirer.Separator(),
        { name: chalk.yellow('← Back'), short: 'Back', value: null }
      ]
    }
  ]);

  if (!chosen) return;

  console.log();
  const targets = chosen === '__ALL__' ? availableSkills : [chosen];
  const token = await getGitHubToken(ROOT_DIR);
  const inspections = await mapWithConcurrency(targets, 3, (s) => inspectMasterSkillLibrary(s, { token }));
  for (const insp of inspections) {
    if (insp.manifestNote) logger.warn(insp.manifestNote);
    printMasterStatusLine(insp);
  }
  console.log();

  const outdated = inspections.filter((i) => i.hasUpdate);
  if (outdated.length === 0) {
    logger.success('Selected Master Library skill(s) are already up to date.');
    return;
  }

  const totalFiles = outdated.reduce((sum, i) => sum + i.updates.length + (i.manifestUpdate ? 1 : 0), 0);
  const { confirmApply } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmApply',
      message: `Apply Master Library updates for ${outdated.length} skill(s) (${totalFiles} file(s))?`,
      default: true
    }
  ]);

  if (!confirmApply) {
    logger.info('Master Library update cancelled.');
    return;
  }

  for (const insp of outdated) {
    const applied = await applyMasterSkillInspection(insp);
    printCompactFileList(applied.updatedFiles);
  }
  logger.success(`Updated ${outdated.length} skill(s) in ContextRig Master Library.`);
}

async function runSyncOneProjectWorkflow(projects) {
  const cwdName = path.basename(process.cwd());
  const choices = [
    {
      name: `${chalk.bold.green(`Current Folder (${cwdName})`)} ${chalk.green('[Quick]')}`,
      short: `Current Folder (${cwdName})`,
      description: process.cwd(),
      value: { type: 'path', path: process.cwd() }
    },
    ...(projects.length > 0
      ? [
          new inquirer.Separator('── Saved Projects ──'),
          ...projects.map((p) => {
            const skillCount = p.skills?.length ? `${p.skills.length} skill(s)` : 'no skills listed';
            return {
              name: `${chalk.white(p.name.padEnd(20))} ${chalk.dim(`(${skillCount})`)}`,
              short: p.name,
              description: p.path,
              value: { type: 'path', path: p.path }
            };
          })
        ]
      : []),
    new inquirer.Separator(),
    {
      name: chalk.cyan('Enter Folder Path manually...'),
      short: 'Enter Folder Path',
      description: 'Type or paste any target project directory path',
      value: { type: 'manual' }
    },
    { name: chalk.yellow('← Back'), short: 'Back', value: null }
  ];

  const { picked } = await inquirer.prompt([
    {
      type: 'list',
      name: 'picked',
      message: 'Select project to check & sync:',
      choices
    }
  ]);

  if (!picked) return;

  if (picked.type === 'path') {
    await syncSingleProject(picked.path);
    return;
  }

  console.log();
  const { targetPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'targetPath',
      message: 'Enter target project folder path (or "b" to back):',
      default: './'
    }
  ]);

  const cleanPath = sanitizePath(targetPath);
  if (cleanPath.toLowerCase() === 'b' || cleanPath.toLowerCase() === 'back') {
    console.log();
    logger.info('Returning to Main Menu...');
    return;
  }

  await syncSingleProject(cleanPath);
}

/**
 * Runs the full synchronization workflow (supports interactive hub, direct path, --all, and --skill).
 * @param {string|null} [inputTargetDir]
 * @param {Object} [options]
 */
export async function runSyncWorkflow(inputTargetDir = null, options = {}) {
  logger.section('ContextRig Sync & Update Engine');

  const { mode = null, skillId = null, autoConfirm = false, promptDeps = true } = options;

  if (mode === 'all') {
    await runSyncAllWorkflow({ skillFilterId: skillId, autoConfirm });
    return;
  }

  if (mode === 'skill' || skillId) {
    await runUpdateBySkillWorkflow({ skillId, autoConfirm });
    return;
  }

  if (inputTargetDir) {
    const cleanPath = sanitizePath(inputTargetDir);
    if (cleanPath.toLowerCase() === 'b' || cleanPath.toLowerCase() === 'back') {
      logger.info('Returning to Main Menu...');
      return;
    }
    await syncSingleProject(cleanPath, { autoConfirm, promptDeps });
    return;
  }

  const { valid: projects, removed } = await pruneMissingProjects();
  if (removed.length > 0) {
    logger.info(`Pruned ${removed.length} missing project(s) from registry.`);
    console.log();
  }

  const projectCountLabel = projects.length > 0 ? ` + ${projects.length} Project(s)` : '';
  const { syncAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'syncAction',
      message: 'Choose sync mode:',
      choices: [
        {
          name: `${chalk.bold.green('Check & Update All')} ${chalk.green('[Recommended]')}`,
          short: 'Check & Update All',
          description: `Check all skills in Master Library${projectCountLabel} first, then confirm updates`,
          value: 'all'
        },
        {
          name: 'Sync One Project',
          short: 'Sync One Project',
          description: 'Check & update current folder, a saved project, or any custom path',
          value: 'project'
        },
        {
          name: chalk.cyan('Sync One Skill'),
          short: 'Sync One Skill',
          description: 'Check & update a specific skill across Master Library or saved projects',
          value: 'skill'
        },
        new inquirer.Separator(),
        { name: chalk.yellow('← Back to Main Menu'), short: 'Back', value: 'back' }
      ]
    }
  ]);

  if (syncAction === 'back') {
    console.log();
    logger.info('Returning to Main Menu...');
    return;
  }

  if (syncAction === 'all') {
    console.log();
    await runCheckAndUpdateAllWorkflow();
    return;
  }

  if (syncAction === 'project') {
    console.log();
    await runSyncOneProjectWorkflow(projects);
    return;
  }

  await runUpdateBySkillWorkflow();
}
