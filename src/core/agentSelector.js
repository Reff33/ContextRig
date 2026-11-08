import fs from 'node:fs';
import path from 'node:path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { SUPPORTED_AGENTS } from '../config.js';

/**
 * Prompts user to select an AI Agent profile with detection of already-configured agents and back navigation.
 * @param {string|null} [targetDir] - Target project path to inspect for existing files
 * @returns {Promise<{ name: string, value: string, templateFile: string, outputFile: string } | null>}
 */
export async function selectAgent(targetDir = null) {
  let defaultChoice = undefined;

  const choices = [
    ...SUPPORTED_AGENTS.map((agent) => {
      let isConfigured = false;
      if (targetDir) {
        const fullPath = path.resolve(targetDir, agent.outputFile);
        isConfigured = fs.existsSync(fullPath);
      }

      if (isConfigured && !defaultChoice) {
        defaultChoice = agent;
      }

      const displayName = isConfigured
        ? `${agent.name} ${chalk.green('[Already Configured]')}`
        : agent.name;

      return {
        name: displayName,
        value: agent
      };
    }),
    new inquirer.Separator(),
    { name: '← Back to Main Menu', value: null }
  ];

  const { selectedAgent } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedAgent',
      message: 'Select target AI Agent profile:',
      choices,
      default: defaultChoice
    }
  ]);

  return selectedAgent;
}
