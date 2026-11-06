import inquirer from 'inquirer';
import { SUPPORTED_AGENTS } from '../config.js';

/**
 * Prompts user to select an AI Agent profile.
 * @returns {Promise<{ name: string, value: string, templateFile: string, outputFile: string }>}
 */
export async function selectAgent() {
  const { selectedAgent } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedAgent',
      message: 'Select the target AI Agent profile:',
      choices: SUPPORTED_AGENTS.map((agent) => ({
        name: agent.name,
        value: agent
      }))
    }
  ]);

  return selectedAgent;
}

