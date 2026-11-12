import fs from 'node:fs/promises';
import path from 'node:path';
import { SKILLS_LIBRARY_DIR } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Loads all valid skills from skills_library/
 * @returns {Promise<Array<Object>>}
 */
export async function loadAvailableSkills() {
  try {
    await fs.mkdir(SKILLS_LIBRARY_DIR, { recursive: true });
    const files = await fs.readdir(SKILLS_LIBRARY_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const skills = [];
    for (const file of jsonFiles) {
      const filePath = path.join(SKILLS_LIBRARY_DIR, file);
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.id && parsed.name && parsed.ai_instructions) {
          skills.push(parsed);
        } else {
          logger.warn(`Skipping invalid skill schema in: ${file}`);
        }
      } catch (err) {
        logger.warn(`Failed to parse ${file}: ${err.message}`);
      }
    }
    return skills;
  } catch (err) {
    logger.error(`Error reading skills directory: ${err.message}`);
    return [];
  }
}

/**
 * Saves a skill to the skills_library directory.
 * @param {Object} skillData
 * @returns {Promise<string>} File path where skill was saved
 */
export async function saveSkill(skillData) {
  await fs.mkdir(SKILLS_LIBRARY_DIR, { recursive: true });
  const filename = `${skillData.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.json`;
  const filePath = path.join(SKILLS_LIBRARY_DIR, filename);
  await fs.writeFile(filePath, `${JSON.stringify(skillData, null, 2)}\n`, 'utf8');
  return filePath;
}
