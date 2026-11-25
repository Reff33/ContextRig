import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { SKILLS_LIBRARY_DIR, getDeviceSkillsDir } from '../config.js';
import { logger } from '../utils/logger.js';

async function readSkillDir(dir) {
  if (!existsSync(dir)) return [];
  const skills = [];
  try {
    const files = await fs.readdir(dir);
    for (const file of files.filter((f) => f.endsWith('.json'))) {
      try {
        const parsed = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
        if (parsed.id && parsed.name && parsed.ai_instructions) skills.push(parsed);
      } catch (err) {
        logger.warn(`Failed to parse ${file}: ${err.message}`);
      }
    }
  } catch (err) {
    logger.error(`Error reading skills directory: ${err.message}`);
  }
  return skills;
}

/**
 * Loads installed skills from the device cache (~/.contextrig/skills_library/),
 * falling back to the bundled repository library for dev checkouts.
 * @returns {Promise<Array<Object>>}
 */
export async function loadAvailableSkills() {
  const deviceSkills = await readSkillDir(getDeviceSkillsDir());
  if (deviceSkills.length > 0) return deviceSkills;
  await fs.mkdir(SKILLS_LIBRARY_DIR, { recursive: true }).catch(() => {});
  return readSkillDir(SKILLS_LIBRARY_DIR);
}

/**
 * Saves a skill manifest into the device library (or an explicit target dir).
 * @param {Object} skillData
 * @param {string} [baseDir]
 * @returns {Promise<string>} File path where skill was saved
 */
export async function saveSkill(skillData, baseDir = getDeviceSkillsDir()) {
  await fs.mkdir(baseDir, { recursive: true });
  const filename = `${skillData.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.json`;
  const filePath = path.join(baseDir, filename);
  await fs.writeFile(filePath, `${JSON.stringify(skillData, null, 2)}\n`, 'utf8');
  return filePath;
}
