import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../utils/logger.js';

/**
 * Checks if a pattern is already covered by existing gitignore lines.
 * Handles variations in leading/trailing slashes (e.g. 'tools/' matches 'tools', '/tools', '/tools/').
 * @param {string[]} existingLines
 * @param {string} pattern
 * @returns {boolean}
 */
export function isPatternIgnored(existingLines, pattern) {
  if (existingLines.includes(pattern)) return true;
  const cleanPat = pattern.replace(/^\/+/, '').replace(/\/+$/, '');
  return existingLines.some((line) => {
    const cleanLine = line.replace(/^\/+/, '').replace(/\/+$/, '');
    return cleanLine === cleanPat;
  });
}

/**
 * Aggregates all gitignore recommendations from selected skills.
 * @param {Array<Object>} selectedSkills
 * @returns {string[]}
 */
export function aggregateGitIgnorePatterns(selectedSkills) {
  const patterns = new Set();

  // Always ignore ContextRig local cache
  patterns.add('.contextrig_cache.json');

  // Auto-ignore rigtools/ directory if any skill injects rigtools/ scripts
  const hasToolFiles = selectedSkills.some(
    (skill) =>
      Array.isArray(skill.files_to_copy) &&
      skill.files_to_copy.some((item) => {
        const dest = (item.destination || '').replace(/\\/g, '/');
        return dest.startsWith('rigtools/') || dest === 'rigtools' || dest.startsWith('tools/') || dest === 'tools';
      })
  );

  if (hasToolFiles) {
    patterns.add('rigtools/');
  }

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
  const missingPatterns = patterns.filter((pat) => !isPatternIgnored(existingLines, pat));

  if (missingPatterns.length === 0) {
    return; // All recommended patterns are already ignored
  }

  let updatedContent = existingContent;
  if (updatedContent && !updatedContent.endsWith('\n')) {
    updatedContent += '\n';
  }

  updatedContent += `\n# Added by ContextRig\n${missingPatterns.join('\n')}\n`;

  await fs.writeFile(gitignorePath, updatedContent, 'utf8');
  logger.success(`Automatically updated .gitignore: added ${missingPatterns.join(', ')}`);
}

