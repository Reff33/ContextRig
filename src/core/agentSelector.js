import inquirer from 'inquirer';
import { SUPPORTED_AGENTS } from '../config.js';

/**
 * Prompts user to select an AI Agent profile with an option to return back.
 * @returns {Promise<{ name: string, value: string, templateFile: string, outputFile: string } | null>}
 */
export async function selectAgent() {
  const choices = [
    ...SUPPORTED_AGENTS.map((agent) => ({
      name: agent.name,
      value: agent
    })),
    new inquirer.Separator(),
    { name: '← Back to Main Menu', value: null }
  ];

  const { selectedAgent } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedAgent',
      message: 'Select target AI Agent profile:',
      choices
    }
  ]);

  return selectedAgent;
}
