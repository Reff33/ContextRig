import fs from 'node:fs/promises';
import path from 'node:path';
import handlebars from 'handlebars';
import { TEMPLATES_DIR, ROOT_DIR } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Compiles a Handlebars template and writes the result to the target project.
 * @param {Object} options
 * @param {string} options.targetDir - Destination project directory
 * @param {string} options.templateFileName - Name of .hbs template file
 * @param {string} options.outputFileName - Output file name (e.g. CLAUDE.md or .cursorrules)
 * @param {string} options.projectName - Name of target project
 * @param {string} options.agentName - Selected agent name
 * @param {Array<Object>} options.skillsInstructions - List of selected skills
 * @returns {Promise<string>} The output file path
 */
export async function injectTemplate({
  targetDir,
  templateFileName,
  outputFileName,
  projectName,
  agentName,
  skillsInstructions
}) {
  const templatePath = path.join(TEMPLATES_DIR, templateFileName);
  const rawTemplate = await fs.readFile(templatePath, 'utf8');

  const compiled = handlebars.compile(rawTemplate, { noEscape: true });
  const renderedContent = compiled({
    projectName,
    agentName,
    skillsInstructions
  });

  const outputPath = path.join(targetDir, outputFileName);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, renderedContent, 'utf8');

  // Copy skill asset files if defined in files_to_copy
  for (const skill of skillsInstructions) {
    if (Array.isArray(skill.files_to_copy)) {
      for (const item of skill.files_to_copy) {
        const srcFile = path.resolve(ROOT_DIR, item.source);
        const destFile = path.resolve(targetDir, item.destination);

        try {
          await fs.mkdir(path.dirname(destFile), { recursive: true });
          await fs.copyFile(srcFile, destFile);
          logger.info(`Copied ${item.source} -> ${item.destination}`);
        } catch (err) {
          logger.warn(`Could not copy skill file ${item.source}: ${err.message}`);
        }
      }
    }
  }

  return outputPath;
}
