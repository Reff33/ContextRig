import fs from 'node:fs/promises';
import path from 'node:path';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';

/**
 * Aggregates all gitignore recommendations from selected skills.
 * @param {Array<Object>} selectedSkills
 * @returns {string[]}
 */
export function aggregateGitIgnorePatterns(selectedSkills) {
  const patterns = new Set();

  for (const skill of selectedSkills) {
    if (Array.isArray(skill.gitignore)) {
      skill.gitignore.forEach((pat) => patterns.add(pat.trim()));
    } else if (skill.id === 'graphify') {
      // Fallback for graphify
      patterns.add('graphify-out/');
    }
  }

  return Array.from(patterns).filter(Boolean);
}

/**
 * Handles checking and prompting the user to update .gitignore in the target project.
 * @param {string} targetDir - Destination project directory
 * @param {Array<Object>} selectedSkills - List of chosen skills
 */
export async function handleGitIgnore(targetDir, selectedSkills) {
  const patterns = aggregateGitIgnorePatterns(selectedSkills);
  if (patterns.length === 0) return;

  const gitignorePath = path.join(targetDir, '.gitignore');
  let existingContent = '';
  try {
    existingContent = await fs.readFile(gitignorePath, 'utf8');
  } catch (err) {
    // .gitignore does not exist yet
    existingContent = '';
  }

  const existingLines = existingContent.split(/\r?\n/).map((l) => l.trim());
  const missingPatterns = patterns.filter((pat) => !existingLines.includes(pat));

  if (missingPatterns.length === 0) {
    return; // All recommended patterns are already ignored
  }

  logger.divider();
  const { shouldIgnore } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldIgnore',
      message: `Would you like to add [${missingPatterns.join(', ')}] to .gitignore?`,
      default: true
    }
  ]);

  if (!shouldIgnore) {
    logger.info('Skipping .gitignore update.');
    return;
  }

  let updatedContent = existingContent;
  if (updatedContent && !updatedContent.endsWith('\n')) {
    updatedContent += '\n';
  }

  updatedContent += `\n# Added by ContextRig\n${missingPatterns.join('\n')}\n`;

  await fs.writeFile(gitignorePath, updatedContent, 'utf8');
  logger.success(`Updated .gitignore: added ${missingPatterns.join(', ')}`);
}

