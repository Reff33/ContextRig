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

  if (Array.isArray(skill.files_to_copy) && skill.files_to_copy.length > 0) {
    const results = await mapWithConcurrency(skill.files_to_copy, FETCH_CONCURRENCY, async (item) => {
      const destPath = path.resolve(targetDir, item.destination);
      const destRel = item.destination.replace(/\\/g, '/');
      const fileKey = `${skill.id}:${destRel}`;

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
        const canUseEtag = Boolean(localExists && cachedEtag && cachedHash && localHash === cachedHash);
        const res = await fetchRemoteFile(item.remote_url, canUseEtag ? cachedEtag : null, token);

        if (res.notModified) {
          return { destRel, fileKey, outdated: false };
        }

        if (res.error) {
          logger.warn(`Could not check remote ${destRel}: ${res.error}. Falling back to local check.`);
        } else if (res.content !== undefined) {
          const remoteHash = calculateHash(res.content);
          const outdated = !localExists || remoteHash !== localHash;
          return {
            destRel,
            destination: item.destination,
            fileKey,
            outdated,
            content: outdated ? res.content : undefined,
            etag: res.etag || null,
            hash: remoteHash
          };
        }
      }

      // Fallback: Compare with local ContextRig master files in scripts/
      if (item.source) {
        const srcPath = path.resolve(ROOT_DIR, item.source);
        try {
          const srcContent = await fs.readFile(srcPath, 'utf8');
          const srcHash = calculateHash(srcContent);
          const outdated = !localExists || srcHash !== localHash;
          return {
            destRel,
            destination: item.destination,
            fileKey,
            outdated,
            content: outdated ? srcContent : undefined,
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

/**
 * Applies staged updates for a single project inspection without clobbering remote files or custom rules.
 * @param {Object} inspection
 * @param {{ promptDeps?: boolean }} [options]
 */
export async function applyProjectUpdates(inspection, { promptDeps = true } = {}) {
  const { fullPath, projectName, configuredAgents, installedSkills, outdatedSkills, cache } = inspection;

  for (const skill of outdatedSkills) {
    for (const [destRel, content] of Object.entries(skill.stagedContent)) {
      const destPath = path.resolve(fullPath, destRel);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, content, 'utf8');
      logger.info(`Updated: ${destRel} ✔`);
    }
  }

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
 * Syncs a single skill's remote manifest & master scripts directly into ContextRig itself.
 * @param {Object} skill
 * @param {{ token?: string|null }} [options]
 */
export async function syncMasterSkillLibrary(skill, { token = null } = {}) {
  const authToken = token || (await getGitHubToken(ROOT_DIR));
  let activeSkill = skill;

  // 1. Refresh skill JSON manifest if manifest_remote_url is present and local copy is clean
  if (skill.manifest_remote_url) {
    if (hasLocalUncommittedManifest(skill.id)) {
      logger.warn(`Local skills_library/${skill.id}.json has uncommitted changes — keeping local manifest.`);
    } else {
      logger.step(`Checking manifest for ${skill.name}...`);
      const manifestRes = await fetchRemoteFile(skill.manifest_remote_url, null, authToken);
      if (manifestRes.error) {
        logger.warn(`Manifest fetch skipped (${manifestRes.error}); using local ${skill.id}.json.`);
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
              await saveSkill(parsed);
              activeSkill = parsed;
              logger.success(`Updated manifest: skills_library/${skill.id}.json`);
            } else {
              logger.info(`Manifest skills_library/${skill.id}.json is up to date.`);
            }
          }
        } catch (err) {
          logger.warn(`Invalid remote manifest JSON for ${skill.id}: ${err.message}`);
        }
      }
    }
  }

  // 2. Refresh ContextRig/scripts/* master files from each item.remote_url
  const items = Array.isArray(activeSkill.files_to_copy)
    ? activeSkill.files_to_copy.filter((i) => i.source && i.remote_url)
    : [];

  if (items.length === 0) {
    logger.info(`No remote files configured for ${activeSkill.name} master library.`);
    return { updatedCount: 0, errorCount: 0, skill: activeSkill };
  }

  logger.step(`Syncing ${items.length} master file(s) for ${activeSkill.name} into ContextRig...`);
  let updatedCount = 0;
  let errorCount = 0;

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
      await fs.mkdir(path.dirname(masterPath), { recursive: true });
      await fs.writeFile(masterPath, res.content, 'utf8');
      return { source: item.source, updated: true };
    }
    return { source: item.source, updated: false };
  });

  for (const r of results) {
    if (r.error) {
      errorCount++;
      logger.warn(`Could not fetch ${r.source}: ${r.error}`);
    } else if (r.updated) {
      updatedCount++;
      logger.info(`Master updated: ${r.source} ✔`);
    }
  }

  if (errorCount > 0 && updatedCount === 0) {
    logger.error(`${activeSkill.name} master library sync failed (${errorCount} file(s) could not be fetched).`);
  } else if (errorCount > 0) {
    logger.warn(`Updated ${updatedCount} file(s), but ${errorCount} file(s) failed to fetch.`);
  } else if (updatedCount === 0) {
    logger.success(`${activeSkill.name} master library is already up to date.`);
  } else {
    logger.success(`Updated ${updatedCount} master file(s) for ${activeSkill.name}.`);
  }

  return { updatedCount, errorCount, skill: activeSkill };
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
              name: `${chalk.bold.green('Apply All Updates'.padEnd(22))} ${chalk.dim(`${inspection.outdatedSkills.length} skill(s), ${totalFilesCount} files`)} ${chalk.green('[Recommended]')}`,
              value: 'apply'
            },
            {
              name: `${chalk.cyan('Inspect File Details'.padEnd(22))} ${chalk.dim('View changed files per skill')}`,
              value: 'inspect'
            },
            new inquirer.Separator(),
            {
              name: chalk.yellow('← Cancel & Back to Main Menu'),
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
            name: `${chalk.cyan(`[${s.id}]`.padEnd(16))} ${s.name}`,
            value: s
          })),
          new inquirer.Separator(),
          { name: chalk.yellow('← Back'), value: null }
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
          name: `${'Registered Projects'.padEnd(22)} ${chalk.dim(`Push updates to saved projects`)} ${chalk.green('[Recommended]')}`,
          value: 'projects'
        },
        {
          name: `${'Master Library'.padEnd(22)} ${chalk.dim('Refresh local skills_library/ & scripts/')}`,
          value: 'master'
        },
        {
          name: `${'Both'.padEnd(22)} ${chalk.dim('Master Library + Registered Projects')}`,
          value: 'both'
        },
        new inquirer.Separator(),
        { name: chalk.yellow('← Back'), value: 'back' }
      ]
    }
  ]);

  if (targetScope === 'back') return;

  console.log();
  if (targetScope === 'master' || targetScope === 'both') {
    await syncMasterSkillLibrary(chosenSkill);
    console.log();
  }
  if (targetScope === 'projects' || targetScope === 'both') {
    await runSyncAllWorkflow({ skillFilterId: chosenSkill.id, autoConfirm: false });
  }
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
      message: 'Select skill(s) to refresh in ContextRig Master Library:',
      choices: [
        {
          name: `${chalk.bold.green('All Master Skills'.padEnd(22))} ${chalk.dim(`Sync all ${availableSkills.length} skill(s) into skills_library/ & scripts/`)}`,
          value: '__ALL__'
        },
        new inquirer.Separator(),
        ...availableSkills.map((s) => ({
          name: `${chalk.cyan(`[${s.id}]`.padEnd(16))} ${s.name}`,
          value: s
        })),
        new inquirer.Separator(),
        { name: chalk.yellow('← Back'), value: null }
      ]
    }
  ]);

  if (!chosen) return;

  console.log();
  const targets = chosen === '__ALL__' ? availableSkills : [chosen];
  for (const skill of targets) {
    await syncMasterSkillLibrary(skill);
    console.log();
  }
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

  const cwdName = path.basename(process.cwd());
  const choices = [
    ...(projects.length > 0
      ? [
          {
            name: `${chalk.bold.green('Sync All Projects'.padEnd(22))} ${chalk.dim(`${projects.length} registered`)} ${chalk.green('[Recommended]')}`,
            value: 'all'
          }
        ]
      : []),
    {
      name: `${chalk.cyan('Update by Skill'.padEnd(22))} ${chalk.dim('Update projects or master library')}`,
      value: 'skill'
    },
    {
      name: `${'Sync Current Folder'.padEnd(22)} ${chalk.dim(cwdName)}`,
      value: 'cwd'
    },
    ...(projects.length > 0
      ? [
          {
            name: `${'Pick Saved Project'.padEnd(22)} ${chalk.dim(`${projects.length} registered`)}`,
            value: 'pick'
          }
        ]
      : []),
    {
      name: `${'Enter Folder Path'.padEnd(22)} ${chalk.dim('Type or paste path manually')}`,
      value: 'manual'
    },
    new inquirer.Separator(),
    { name: chalk.yellow('← Back to Main Menu'), value: 'back' }
  ];

  const { syncAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'syncAction',
      message: 'Choose sync mode:',
      choices
    }
  ]);

  if (syncAction === 'back') {
    console.log();
    logger.info('Returning to Main Menu...');
    return;
  }

  if (syncAction === 'all') {
    console.log();
    await runSyncAllWorkflow();
    return;
  }

  if (syncAction === 'skill') {
    await runUpdateBySkillWorkflow();
    return;
  }

  if (syncAction === 'cwd') {
    await syncSingleProject(process.cwd());
    return;
  }

  if (syncAction === 'pick') {
    console.log();
    const { chosenPath } = await inquirer.prompt([
      {
        type: 'list',
        name: 'chosenPath',
        message: 'Select a registered project to sync:',
        choices: [
          ...projects.map((p) => {
            const skillCount = p.skills?.length ? ` (${p.skills.length} skill(s))` : '';
            return {
              name: `${chalk.white(p.name.padEnd(22))} ${chalk.dim(p.path)}${chalk.cyan(skillCount)}`,
              value: p.path
            };
          }),
          new inquirer.Separator(),
          { name: chalk.yellow('← Back'), value: null }
        ]
      }
    ]);
    if (!chosenPath) return;
    await syncSingleProject(chosenPath);
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
