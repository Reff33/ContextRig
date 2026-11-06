import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

/**
 * Collects and deduplicates dependencies from a list of selected skills.
 * @param {Array<Object>} skills
 * @returns {{ npm: string[], pip: string[] }}
 */
export function aggregateDependencies(skills) {
  const npmDeps = new Set();
  const pipDeps = new Set();

  for (const skill of skills) {
    if (skill.dependencies) {
      if (Array.isArray(skill.dependencies.npm)) {
        skill.dependencies.npm.forEach((dep) => npmDeps.add(dep.trim()));
      }
      if (Array.isArray(skill.dependencies.pip)) {
        skill.dependencies.pip.forEach((dep) => pipDeps.add(dep.trim()));
      }
    }
  }

  return {
    npm: Array.from(npmDeps).filter(Boolean),
    pip: Array.from(pipDeps).filter(Boolean)
  };
}

/**
 * Checks if dependencies exist and prompts user to auto-install them.
 * @param {string} targetDir - Directory where dependencies should be installed
 * @param {Array<Object>} selectedSkills - List of selected skills
 */
export async function handleDependencies(targetDir, selectedSkills) {
  const { npm, pip } = aggregateDependencies(selectedSkills);

  if (npm.length === 0 && pip.length === 0) {
    return;
  }

  logger.divider();
  logger.info('Detected Skill Dependencies:');
  if (npm.length > 0) {
    console.log(`  • npm: ${npm.join(', ')}`);
  }
  if (pip.length > 0) {
    console.log(`  • pip: ${pip.join(', ')}`);
  }

  const { shouldInstall } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldInstall',
      message: 'Do you want to auto-install dependencies for these skills?',
      default: true
    }
  ]);

  if (!shouldInstall) {
    logger.info('Skipping automated dependency installation.');
    return;
  }

  // Install NPM packages
  if (npm.length > 0) {
    const npmCmd = `npm install ${npm.join(' ')}`;
    logger.step(`Running: ${npmCmd} in ${targetDir}...`);
    try {
      // Remove npm_config_allow_scripts injected by npm run/start to prevent EALLOWSCRIPTS error in npm v11+
      const cleanEnv = { ...process.env };
      delete cleanEnv.npm_config_allow_scripts;

      const { stdout } = await execAsync(npmCmd, { cwd: targetDir, env: cleanEnv });
      if (stdout) console.log(stdout.trim());
      logger.success('NPM dependencies installed successfully.');
    } catch (err) {
      logger.error(`Failed to install NPM dependencies: ${err.message}`);
    }
  }

  // Install Pip packages
  if (pip.length > 0) {
    const pipCmd = `pip install ${pip.join(' ')}`;
    logger.step(`Running: ${pipCmd}...`);
    try {
      const { stdout } = await execAsync(pipCmd, { cwd: targetDir });
      if (stdout) console.log(stdout.trim());
      logger.success('Pip dependencies installed successfully.');
    } catch (err) {
      logger.error(`Failed to install Pip dependencies: ${err.message}`);
    }
  }
}

