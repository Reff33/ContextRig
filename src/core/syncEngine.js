import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ROOT_DIR, SUPPORTED_AGENTS } from '../config.js';
import { loadAvailableSkills } from './skillManager.js';
import { setupTargetProject } from './projectSetup.js';
import { injectTemplate } from './fileInjector.js';
import { handleDependencies } from './dependencyInstaller.js';
import { handleGitIgnore } from './gitIgnoreManager.js';
import { logger } from '../utils/logger.js';

const CACHE_FILE_NAME = '.contextrig_cache.json';
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

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
    return JSON.parse(raw);
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

  // Check target project .env
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
    'Accept': 'text/plain, application/json, */*'
  };

  if (cachedEtag) {
    headers['If-None-Match'] = cachedEtag;
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(remoteUrl, { headers });

    // 304 Not Modified: Remote has not changed, 0 quota used, super fast
    if (response.status === 304) {
      return { notModified: true, etag: cachedEtag };
    }

    if (!response.ok) {
      return { error: `HTTP ${response.status} ${response.statusText}` };
    }

    const content = await response.text();
    const newEtag = response.headers.get('etag') || response.headers.get('x-amz-version-id') || null;

    return {
      notModified: false,
      content,
      etag: newEtag
    };
  } catch (err) {
    return { error: err.message };
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
  const stagedContent = {}; // filePath -> newContent
  const newEtags = {}; // fileKey -> etag
  let hasUpdate = false;

  if (Array.isArray(skill.files_to_copy) && skill.files_to_copy.length > 0) {
    for (const item of skill.files_to_copy) {
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

      // Check remote_url if configured
      if (item.remote_url) {
        const cachedEtag = cache.etags?.[fileKey] || null;
        const res = await fetchRemoteFile(item.remote_url, cachedEtag, token);

        if (res.notModified) {
          // File has not changed on remote
          continue;
        }

        if (res.error) {
          logger.warn(`Could not check remote ${destRel}: ${res.error}. Falling back to local check.`);
        } else if (res.content !== undefined) {
          const remoteHash = calculateHash(res.content);
          const localHash = localExists ? calculateHash(localContent) : '';

          if (!localExists || remoteHash !== localHash) {
            hasUpdate = true;
            outdatedFiles.push(path.basename(destRel));
            stagedContent[item.destination] = res.content;
            if (res.etag) {
              newEtags[fileKey] = res.etag;
            }
          }
          continue;
        }
      }

      // Fallback: Compare with local ContextRig master files in scripts/
      if (item.source) {
        const srcPath = path.resolve(ROOT_DIR, item.source);
        try {
          const srcContent = await fs.readFile(srcPath, 'utf8');
          const srcHash = calculateHash(srcContent);
          const localHash = localExists ? calculateHash(localContent) : '';

          if (!localExists || srcHash !== localHash) {
            hasUpdate = true;
            outdatedFiles.push(path.basename(destRel));
            stagedContent[item.destination] = srcContent;
          }
        } catch {
          // Source not readable
        }
      }
    }
  }

  return {
    ...skill,
    hasUpdate,
    outdatedFiles,
    stagedContent,
    newEtags
  };
}

/**
 * Runs the full remote synchronization workflow.
 * @param {string} [inputTargetDir]
 */
export async function runSyncWorkflow(inputTargetDir = null) {
  logger.divider();
  logger.step('Checking Project for Skill Updates (Cloud & Local Sync)...');

  let targetPath = inputTargetDir;
  if (!targetPath) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'targetPath',
        message: 'Enter target project folder path to check & update (or "b" to back):',
        default: './'
      }
    ]);
    targetPath = answer.targetPath;
  }

  const cleanPath = targetPath.trim();
  if (cleanPath.toLowerCase() === 'b' || cleanPath.toLowerCase() === 'back') {
    logger.info('Returning to Main Menu...');
    return;
  }

  const { fullPath, projectName } = await setupTargetProject(cleanPath);
  const availableSkills = await loadAvailableSkills();

  // Detect which skills are currently present in the target project
  const toolsDir = path.join(fullPath, 'tools');
  let toolFiles = [];
  try {
    toolFiles = await fs.readdir(toolsDir);
  } catch {
    toolFiles = [];
  }

  const installedSkills = availableSkills.filter((skill) => {
    if (skill.files_to_copy?.length) {
      return skill.files_to_copy.some((f) => toolFiles.includes(path.basename(f.destination)));
    }
    return false;
  });

  if (installedSkills.length === 0) {
    logger.warn(`No ContextRig skills detected in ${fullPath}. Use [1] Inject Skills to Project instead.`);
    return;
  }

  const token = await getGitHubToken(fullPath);
  if (token) {
    logger.info('GitHub Token detected (higher rate limit active: 5000/hr).');
  }

  const cache = await loadCache(fullPath);

  // Check TTL cache
  const now = Date.now();
  if (cache.last_checked && now - cache.last_checked < DEFAULT_TTL_MS) {
    const minutesAgo = Math.round((now - cache.last_checked) / (60 * 1000));
    logger.info(`Using cache (checked ${minutesAgo} min ago, TTL: 1 hr).`);
  }

  logger.step(`Checking ${installedSkills.length} installed skill(s) concurrently...`);

  // Concurrently check all skills with Promise.all
  const checkedSkills = await Promise.all(
    installedSkills.map((skill) => checkSingleSkillUpdate(fullPath, skill, cache, token))
  );

  logger.info(`Skill Status for ${projectName}:`);
  const outdatedSkills = [];

  for (const s of checkedSkills) {
    if (s.hasUpdate) {
      const filesInfo = s.outdatedFiles.length > 0 ? ` (${s.outdatedFiles.join(', ')})` : '';
      console.log(chalk.bold.yellow(`  ▲ [UPDATE AVAILABLE] ${s.name}${filesInfo}`));
      outdatedSkills.push(s);
    } else {
      console.log(chalk.green(`  ✔ [UP TO DATE] ${s.name}`));
    }
  }

  if (outdatedSkills.length === 0) {
    logger.success('All installed skills are already up to date!');
    cache.last_checked = Date.now();
    await saveCache(fullPath, cache);
    return;
  }

  logger.divider();
  const { shouldUpdate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldUpdate',
      message: `Found ${outdatedSkills.length} outdated skill(s). Do you want to apply updates now?`,
      default: true
    }
  ]);

  if (!shouldUpdate) {
    logger.info('Skill update cancelled.');
    return;
  }

  logger.step(`Applying updates for ${outdatedSkills.length} skill(s)...`);

  // Write updated files
  for (const skill of outdatedSkills) {
    for (const [destRel, content] of Object.entries(skill.stagedContent)) {
      const destPath = path.resolve(fullPath, destRel);
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, content, 'utf8');
      logger.info(`Updated: ${destRel} ✔`);
    }

    // Merge new ETags into cache
    if (skill.newEtags) {
      cache.etags = { ...cache.etags, ...skill.newEtags };
    }
  }

  // Update AI rules (CLAUDE.md, AGENTS.md, etc.)
  for (const agent of SUPPORTED_AGENTS) {
    const filePath = path.join(fullPath, agent.outputFile);
    if (existsSync(filePath)) {
      logger.step(`Re-syncing AI rules in ${agent.outputFile}...`);
      await injectTemplate({
        targetDir: fullPath,
        templateFileName: agent.templateFile,
        outputFileName: agent.outputFile,
        projectName,
        agentName: agent.name,
        skillsInstructions: installedSkills
      });
      logger.success(`Synchronized: ${agent.outputFile}`);
    }
  }

  // Ensure .gitignore ignores .contextrig_cache.json
  await handleGitIgnore(fullPath, installedSkills);

  // Check dependencies if any
  await handleDependencies(fullPath, outdatedSkills);

  // Update and save cache timestamp
  cache.last_checked = Date.now();
  await saveCache(fullPath, cache);

  logger.success(`Successfully updated ${outdatedSkills.length} skill(s) to the latest version!`);
}
