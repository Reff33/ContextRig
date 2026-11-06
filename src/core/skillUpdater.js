import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { ROOT_DIR, SUPPORTED_AGENTS } from '../config.js';
import { injectTemplate } from './fileInjector.js';
import { handleDependencies } from './dependencyInstaller.js';
import { handleGitIgnore } from './gitIgnoreManager.js';
import { logger } from '../utils/logger.js';

/**
 * Calculates SHA-256 hash of a file or string.
 * @param {string} content
 * @returns {string}
 */
function getHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Detects which skills from the available library are currently installed in the target project,
 * and checks whether an update is available by comparing file contents against ContextRig scripts/.
 * @param {string} targetDir - Destination project directory
 * @param {Array<Object>} availableSkills - Full library of skills
 * @returns {Promise<Array<Object>>} List of detected skills with update status
 */
export async function detectInstalledSkills(targetDir, availableSkills) {
  const installed = [];

  const toolsDir = path.join(targetDir, 'tools');
  let toolFiles = [];
  try {
    toolFiles = await fs.readdir(toolsDir);
  } catch (err) {
    toolFiles = [];
  }

  let combinedRulesText = '';
  for (const agent of SUPPORTED_AGENTS) {
    const filePath = path.join(targetDir, agent.outputFile);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      combinedRulesText += '\n' + content;
    } catch {
      // not configured
    }
  }

  for (const skill of availableSkills) {
    let isPresent = false;
    let hasFileUpdate = false;
    let outdatedFiles = [];

    if (skill.files_to_copy && skill.files_to_copy.length > 0) {
      for (const item of skill.files_to_copy) {
        const destBase = path.basename(item.destination);
        if (toolFiles.includes(destBase)) {
          isPresent = true;

          // Compare content of source vs destination
          const srcPath = path.resolve(ROOT_DIR, item.source);
          const destPath = path.resolve(targetDir, item.destination);

          try {
            const [srcContent, destContent] = await Promise.all([
              fs.readFile(srcPath, 'utf8'),
              fs.readFile(destPath, 'utf8')
            ]);

            if (getHash(srcContent.trim()) !== getHash(destContent.trim())) {
              hasFileUpdate = true;
              outdatedFiles.push(destBase);
            }
          } catch {
            hasFileUpdate = true;
            outdatedFiles.push(destBase);
          }
        }
      }
    }

    if (!isPresent && combinedRulesText) {
      if (
        combinedRulesText.includes(`### ${skill.name}`) ||
        combinedRulesText.includes(skill.id)
      ) {
        isPresent = true;
      }
    }

    if (isPresent) {
      installed.push({
        ...skill,
        hasUpdate: hasFileUpdate,
        outdatedFiles
      });
    }
  }

  return installed;
}

/**
 * Detects configured AI agent profiles in the target directory.
 * @param {string} targetDir
 * @returns {Promise<Array<Object>>} List of found agent profiles
 */
export async function detectConfiguredAgents(targetDir) {
  const found = [];
  for (const agent of SUPPORTED_AGENTS) {
    const filePath = path.join(targetDir, agent.outputFile);
    try {
      await fs.access(filePath);
      found.push(agent);
    } catch {
      // not configured
    }
  }
  return found;
}

/**
 * Re-syncs and updates all detected skills in the target project.
 * @param {string} targetDir
 * @param {string} projectName
 * @param {Array<Object>} skillsToSync
 * @param {Object} [options]
 * @param {boolean} [options.promptDeps=true]
 */
export async function syncSkills(targetDir, projectName, skillsToSync, { promptDeps = true } = {}) {
  if (skillsToSync.length === 0) return;

  logger.step(`Updating ${skillsToSync.length} skill(s) in ${targetDir}...`);

  for (const skill of skillsToSync) {
    if (Array.isArray(skill.files_to_copy)) {
      for (const item of skill.files_to_copy) {
        const srcFile = path.resolve(ROOT_DIR, item.source);
        const destFile = path.resolve(targetDir, item.destination);

        try {
          await fs.mkdir(path.dirname(destFile), { recursive: true });
          await fs.copyFile(srcFile, destFile);
          logger.info(`Updated: ${item.destination} ✔`);
        } catch (err) {
          logger.warn(`Could not update ${item.destination}: ${err.message}`);
        }
      }
    }
  }

  // Update existing AI profile rules
  const existingAgents = await detectConfiguredAgents(targetDir);
  for (const agent of existingAgents) {
    logger.step(`Re-syncing AI rules in ${agent.outputFile}...`);
    await injectTemplate({
      targetDir,
      templateFileName: agent.templateFile,
      outputFileName: agent.outputFile,
      projectName,
      agentName: agent.name,
      skillsInstructions: skillsToSync
    });
    logger.success(`Synchronized: ${agent.outputFile}`);
  }

  // Ensure .gitignore patterns are up to date
  await handleGitIgnore(targetDir, skillsToSync);

  // Ensure dependencies are up to date
  if (promptDeps) {
    await handleDependencies(targetDir, skillsToSync);
  }

  logger.success(`All ${skillsToSync.length} skill(s) are now up to date with the latest version!`);
}
