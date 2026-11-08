import fs from 'node:fs/promises';
import path from 'node:path';
import handlebars from 'handlebars';
import { TEMPLATES_DIR, ROOT_DIR } from '../config.js';
import { logger } from '../utils/logger.js';

/**
 * Formats a skill object into markdown for injection into AI rule files.
 * @param {Object} skill
 * @returns {string}
 */
export function formatSkillBlock(skill) {
  const lines = [
    `### ${skill.name}`,
    `- **Description:** ${skill.description}`,
    `- **Usage Instructions:**\n  ${skill.ai_instructions}`
  ];
  if (skill.dependencies?.npm?.length) {
    lines.push(`- **NPM Dependencies:** \`${skill.dependencies.npm.join(', ')}\``);
  }
  if (skill.dependencies?.pip?.length) {
    lines.push(`- **Pip Dependencies:** \`${skill.dependencies.pip.join(', ')}\``);
  }
  return lines.join('\n');
}

/**
 * Safely merges selected skills into an existing rules file without duplicating skills or deleting custom rules.
 * @param {string} existingContent
 * @param {Array<Object>} skillsInstructions
 * @returns {string}
 */
export function mergeSkillsIntoContent(existingContent, skillsInstructions) {
  let content = existingContent.trimEnd();

  const skillsHeader = '## Available AI Skills & Tools';
  const hasSkillsHeader = content.includes(skillsHeader);

  if (!hasSkillsHeader) {
    content += `\n\n${skillsHeader}\nThe following skills and tools are configured for this environment:\n\n`;
    const formattedSkills = skillsInstructions.map(formatSkillBlock).join('\n\n');
    return content + formattedSkills + '\n';
  }

  // File already has ## Available AI Skills & Tools section
  for (const skill of skillsInstructions) {
    const escapedName = skill.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillRegex = new RegExp(`###\\s+${escapedName}[\\s\\S]*?(?=(?:\\n###|\\n##|$))`, 'i');
    const formattedBlock = formatSkillBlock(skill);

    if (skillRegex.test(content)) {
      // Skill already exists in file: update in-place without duplicate
      content = content.replace(skillRegex, formattedBlock);
    } else {
      // Skill is new: append under ## Available AI Skills & Tools before the next ## section
      const headerIndex = content.indexOf(skillsHeader);
      const afterHeader = content.slice(headerIndex + skillsHeader.length);
      const nextSectionMatch = afterHeader.match(/\n##\s+/);

      if (nextSectionMatch && nextSectionMatch.index !== undefined) {
        const insertPos = headerIndex + skillsHeader.length + nextSectionMatch.index;
        content = content.slice(0, insertPos).trimEnd() + '\n\n' + formattedBlock + '\n\n' + content.slice(insertPos).trimStart();
      } else {
        content = content.trimEnd() + '\n\n' + formattedBlock + '\n';
      }
    }
  }

  return content.trimEnd() + '\n';
}

/**
 * Compiles a Handlebars template and writes the result to the target project.
 * Supports 'merge' mode to preserve user's hand-written rules without duplicating skills.
 * @param {Object} options
 * @param {string} options.targetDir - Destination project directory
 * @param {string} options.templateFileName - Name of .hbs template file
 * @param {string} options.outputFileName - Output file name (e.g. CLAUDE.md or .cursorrules)
 * @param {string} options.projectName - Name of target project
 * @param {string} options.agentName - Selected agent name
 * @param {Array<Object>} options.skillsInstructions - List of selected skills
 * @param {'overwrite'|'merge'} [options.mergeMode='overwrite']
 * @returns {Promise<string>} The output file path
 */
export async function injectTemplate({
  targetDir,
  templateFileName,
  outputFileName,
  projectName,
  agentName,
  skillsInstructions,
  mergeMode = 'overwrite'
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
  let finalContent = '';

  if (mergeMode === 'merge') {
    let existingContent = '';
    try {
      existingContent = await fs.readFile(outputPath, 'utf8');
    } catch {
      existingContent = '';
    }

    if (existingContent.trim().length > 0) {
      finalContent = mergeSkillsIntoContent(existingContent, skillsInstructions);
      logger.info(`Smart Merge applied: preserved existing rules and updated skills without duplicates.`);
    } else {
      finalContent = renderedContent;
    }
  } else {
    finalContent = renderedContent;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, finalContent, 'utf8');

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

  // Generate Claude-specific slash commands (.claude/commands/*.md)
  const isClaude = outputFileName === 'CLAUDE.md' || (agentName && agentName.toLowerCase().includes('claude'));
  if (isClaude) {
    for (const skill of skillsInstructions) {
      if (skill.claude_command?.name && skill.claude_command?.content) {
        const cmdPath = path.join(targetDir, '.claude', 'commands', `${skill.claude_command.name}.md`);
        try {
          await fs.mkdir(path.dirname(cmdPath), { recursive: true });
          await fs.writeFile(cmdPath, skill.claude_command.content.trim() + '\n', 'utf8');
          logger.info(`Generated Claude command: .claude/commands/${skill.claude_command.name}.md`);
        } catch (err) {
          logger.warn(`Could not create Claude command for ${skill.name}: ${err.message}`);
        }
      }
    }
  }

  return outputPath;
}
