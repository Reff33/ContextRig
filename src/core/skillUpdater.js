import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import chalk from 'chalk';
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

  let toolFiles = [];
  try {
    const rigFiles = await fs.readdir(path.join(targetDir, 'rigtools'));
    toolFiles.push(...rigFiles);
  } catch {}
  try {
    const legacyFiles = await fs.readdir(path.join(targetDir, 'tools'));
    toolFiles.push(...legacyFiles);
  } catch {}

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
        const destPath = path.resolve(targetDir, item.destination);

        let destExists = false;
        try {
          await fs.access(destPath);
          destExists = true;
        } catch {
          destExists = toolFiles.includes(destBase);
        }

        if (destExists) {
          isPresent = true;

          // Compare content of source vs destination
          const srcPath = path.resolve(ROOT_DIR, item.source);

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

  // Update existing AI profile rules (preserve custom user rules via Smart Merge, don't re-copy assets)
  const existingAgents = await detectConfiguredAgents(targetDir);
  for (const agent of existingAgents) {
    logger.step(`Re-syncing AI rules in ${agent.outputFile}...`);
    await injectTemplate({
      targetDir,
      templateFileName: agent.templateFile,
      outputFileName: agent.outputFile,
      projectName,
      agentName: agent.name,
      skillsInstructions: skillsToSync,
      mergeMode: 'merge',
      copyAssets: false
    });
    logger.success(`Synchronized: ${agent.outputFile}`);
  }

  // Ensure .gitignore patterns are up to date
  await handleGitIgnore(targetDir, skillsToSync);

  // Ensure dependencies are up to date
  if (promptDeps) {
    await handleDependencies(targetDir, skillsToSync, existingAgents[0]);
  }

  logger.success(`All ${skillsToSync.length} skill(s) are now up to date with the latest version!`);
}

/**
 * Uninstalls and removes selected skills from a project, deleting their files,
 * slash commands, and re-syncing AI rules without them.
 * @param {string} targetDir
 * @param {string} projectName
 * @param {Array<Object>} skillsToRemove
 * @param {Array<Object>} remainingSkills
 * @param {Object} [options]
 * @param {boolean} [options.deleteArtifacts=true]
 */
export async function removeSkillsFromProject(
  targetDir,
  projectName,
  skillsToRemove,
  remainingSkills,
  { deleteArtifacts = true } = {}
) {
  if (skillsToRemove.length === 0) return;

  logger.step(`Removing ${skillsToRemove.length} skill(s) from ${targetDir}...`);

  for (const skill of skillsToRemove) {
    // 1. Remove copied tool files
    if (Array.isArray(skill.files_to_copy) && skill.files_to_copy.length > 0) {
      let deletedCount = 0;
      for (const item of skill.files_to_copy) {
        const destFile = path.resolve(targetDir, item.destination);
        try {
          await fs.unlink(destFile);
          deletedCount++;
        } catch (err) {
          if (err.code !== 'ENOENT') {
            logger.warn(`Could not delete ${item.destination}: ${err.message}`);
          }
        }
      }
      if (deletedCount > 0) {
        const tag = chalk.cyan(`[${skill.id}]`.padEnd(16));
        const label = skill.files_to_copy.length === 1
          ? `Deleted ${skill.files_to_copy[0].destination}`
          : `Deleted ${deletedCount} file(s)`;
        console.log(`  ${chalk.green('✔')} ${tag} ${chalk.white(label)}`);
      }
    }

    // 2. Remove Claude slash commands (.claude/commands/<name>.md)
    if (skill.claude_command?.name) {
      const cmdPath = path.join(targetDir, '.claude', 'commands', `${skill.claude_command.name}.md`);
      try {
        await fs.unlink(cmdPath);
        console.log(`  ${chalk.green('✔')} ${chalk.cyan(`[${skill.id}]`.padEnd(16))} ${chalk.dim(`Removed /${skill.claude_command.name}`)}`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          logger.warn(`Could not delete Claude command: ${err.message}`);
        }
      }
    }

    // 3. Remove artifact/output directories associated with this skill (e.g. .archify/, graphify-out/, rigmotion/, promo-video/)
    const artifactPatterns = new Set([
      ...(Array.isArray(skill.artifacts) ? skill.artifacts : []),
      ...(Array.isArray(skill.gitignore) ? skill.gitignore : [])
    ]);

    for (const pattern of artifactPatterns) {
      const cleanPattern = pattern.replace(/\/+$/, '').trim();
      // Skip shared 'rigtools' / 'tools' directory (handled separately in step 4)
      if (cleanPattern && cleanPattern !== 'rigtools' && cleanPattern !== 'tools' && !cleanPattern.startsWith('*')) {
        const artifactPath = path.resolve(targetDir, cleanPattern);
        try {
          const stat = await fs.stat(artifactPath);
          if (deleteArtifacts) {
            if (stat.isDirectory()) {
              await fs.rm(artifactPath, { recursive: true, force: true });
              logger.info(`Deleted artifact directory: ${cleanPattern}/`);
            } else if (stat.isFile()) {
              await fs.unlink(artifactPath);
              logger.info(`Deleted artifact file: ${cleanPattern}`);
            }
          } else {
            logger.info(`Preserved generated output: ${cleanPattern}/`);
          }
        } catch {
          // Path didn't exist or already removed
        }
      }
    }
  }

  // 3. Re-sync AI rules in all detected agents with remaining skills
  const existingAgents = await detectConfiguredAgents(targetDir);
  for (const agent of existingAgents) {
    logger.step(`Re-syncing AI rules in ${agent.outputFile}...`);
    await injectTemplate({
      targetDir,
      templateFileName: agent.templateFile,
      outputFileName: agent.outputFile,
      projectName,
      agentName: agent.name,
      skillsInstructions: remainingSkills,
      copyAssets: false
    });
    logger.success(`Updated ${agent.outputFile} (removed ${skillsToRemove.map((s) => s.name).join(', ')})`);
  }

  // 3.5 Remove orphaned MCP server entries declared by removed skills from .mcp.json
  const keepMcpKeys = new Set();
  for (const s of remainingSkills) {
    if (s.mcp_servers && typeof s.mcp_servers === 'object') {
      for (const k of Object.keys(s.mcp_servers)) keepMcpKeys.add(k);
    }
  }
  const removeMcpKeys = new Set();
  for (const s of skillsToRemove) {
    if (s.mcp_servers && typeof s.mcp_servers === 'object') {
      for (const k of Object.keys(s.mcp_servers)) {
        if (!keepMcpKeys.has(k)) removeMcpKeys.add(k);
      }
    }
  }
  if (removeMcpKeys.size > 0) {
    const mcpPath = path.join(targetDir, '.mcp.json');
    try {
      const parsed = JSON.parse(await fs.readFile(mcpPath, 'utf8'));
      if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
        let changed = false;
        for (const k of removeMcpKeys) {
          if (k in parsed.mcpServers) {
            delete parsed.mcpServers[k];
            changed = true;
          }
        }
        if (changed) {
          if (Object.keys(parsed.mcpServers).length === 0 && Object.keys(parsed).length === 1) {
            await fs.unlink(mcpPath);
          } else {
            await fs.writeFile(mcpPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
          }
        }
      }
    } catch {}
  }

  // 4. Safely prune ONLY empty subdirectories and empty rigtools/, tools/, or .claude/commands/ directories
  async function pruneEmptyDirs(dirPath) {
    let entries;
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return false;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        await pruneEmptyDirs(path.join(dirPath, entry.name));
      }
    }

    try {
      const remaining = await fs.readdir(dirPath);
      if (remaining.length === 0) {
        await fs.rmdir(dirPath);
        return true;
      }
    } catch {}
    return false;
  }

  for (const dirName of ['rigtools', 'tools']) {
    const dirPath = path.join(targetDir, dirName);
    if (await pruneEmptyDirs(dirPath)) {
      logger.info(`Cleaned up empty ${dirName}/ directory.`);
    }
  }

  try {
    const commandsDir = path.join(targetDir, '.claude', 'commands');
    const remainingCommands = await fs.readdir(commandsDir);
    if (remainingCommands.length === 0) {
      await fs.rmdir(commandsDir);
    }
  } catch {}

  logger.success(`Successfully removed ${skillsToRemove.length} skill(s) from ${projectName}!`);
}
