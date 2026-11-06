#!/usr/bin/env node

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { logger } from './utils/logger.js';
import { setupTargetProject } from './core/projectSetup.js';
import { selectAgent } from './core/agentSelector.js';
import { injectTemplate } from './core/fileInjector.js';
import { loadAvailableSkills, saveSkill } from './core/skillManager.js';
import { handleDependencies } from './core/dependencyInstaller.js';
import { handleGitIgnore } from './core/gitIgnoreManager.js';
import { detectInstalledSkills, syncSkills } from './core/skillUpdater.js';

const execAsync = promisify(exec);

/**
 * Handle Option [1]: Inject Skills to Project
 */
async function handleInjectSkills() {
  logger.divider();
  logger.step('Starting Skill Injection Workflow...');

  // 1. Prompt user for target folder path
  const { targetPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'targetPath',
      message: 'Enter the target project folder path:',
      default: './my-project',
      validate: (input) => (input.trim().length > 0 ? true : 'Path cannot be empty.')
    }
  ]);

  const { fullPath, projectName } = await setupTargetProject(targetPath);
  logger.info(`Target directory: ${fullPath} (Project: ${projectName})`);

  // 2. Select AI profile (Claude, Cursor, etc.)
  const agent = await selectAgent();
  logger.info(`Selected AI profile: ${agent.name}`);

  // 3. Load and present available skills
  const skills = await loadAvailableSkills();
  if (skills.length === 0) {
    logger.warn('No valid skills found in skills_library/. Please add skills first.');
    return;
  }

  const { selectedSkills } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSkills',
      message: 'Select the skills to inject into the project:',
      choices: skills.map((skill) => ({
        name: `${skill.name} - ${skill.description}`,
        value: skill
      })),
      validate: (answer) => (answer.length > 0 ? true : 'You must select at least one skill.')
    }
  ]);

  // 4. Compile and inject template
  logger.step(`Injecting rules into ${agent.outputFile}...`);
  const outputFile = await injectTemplate({
    targetDir: fullPath,
    templateFileName: agent.templateFile,
    outputFileName: agent.outputFile,
    projectName,
    agentName: agent.name,
    skillsInstructions: selectedSkills
  });

  logger.success(`Configuration generated successfully at: ${outputFile}`);

  // 5. Dependency Automation (Phase 4)
  await handleDependencies(fullPath, selectedSkills);

  // 6. GitIgnore Automation
  await handleGitIgnore(fullPath, selectedSkills);

  // 7. Initial Tool Execution (Graphify Initial Build)
  if (selectedSkills.some((s) => s.id === 'graphify')) {
    logger.divider();
    const { shouldRunGraphify } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldRunGraphify',
        message: 'Do you want to run Graphify now to generate graphify-out/graph.html and architecture report?',
        default: true
      }
    ]);

    if (shouldRunGraphify) {
      logger.step(`Running: python tools/graphify.py in ${fullPath}...`);
      try {
        const { stdout } = await execAsync('python tools/graphify.py .', { cwd: fullPath });
        if (stdout) console.log(stdout.trim());
        logger.success('graphify-out/graph.html generated successfully! Open it in your browser to inspect the visual graph.');
      } catch (err) {
        logger.error(`Could not run Graphify automatically: ${err.message}`);
      }
    }
  }
}

/**
 * Handle Option [2]: Sync & Update Existing Project Skills
 */
async function handleSyncSkills() {
  logger.divider();
  logger.step('Checking Project for Skill Updates...');

  const { targetPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'targetPath',
      message: 'Enter the target project folder path to check & update:',
      default: './',
      validate: (input) => (input.trim().length > 0 ? true : 'Path cannot be empty.')
    }
  ]);

  const { fullPath, projectName } = await setupTargetProject(targetPath);
  const availableSkills = await loadAvailableSkills();
  const installedSkills = await detectInstalledSkills(fullPath, availableSkills);

  if (installedSkills.length === 0) {
    logger.warn(`No ContextRig skills detected in ${fullPath}. Use [1] Inject Skills to Project instead.`);
    return;
  }

  logger.info(`Installed Skills in ${projectName}:`);
  const outdatedSkills = [];

  for (const s of installedSkills) {
    if (s.hasUpdate) {
      const filesInfo = s.outdatedFiles.length > 0 ? ` (${s.outdatedFiles.join(', ')})` : '';
      console.log(chalk.bold.yellow(`  ⚡ [UPDATE AVAILABLE] ${s.name}${filesInfo}`));
      outdatedSkills.push(s);
    } else {
      console.log(chalk.green(`  ✔ [UP TO DATE] ${s.name}`));
    }
  }

  if (outdatedSkills.length === 0) {
    logger.success('All installed skills and tool files are already up to date!');
    return;
  }

  logger.divider();
  const { shouldUpdate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldUpdate',
      message: `Found ${outdatedSkills.length} outdated skill(s). Do you want to apply updates now?`,
      default: true
    }
  ]);

  if (!shouldUpdate) {
    logger.info('Skill update cancelled.');
    return;
  }

  await syncSkills(fullPath, projectName, outdatedSkills);
}

/**
 * Handle Option [2]: Manage Skills Library
 */
async function handleManageSkills() {
  logger.divider();
  logger.step('Skills Library Management');

  const { subAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'subAction',
      message: 'Choose a skill library operation:',
      choices: [
        { name: '📋 List All Available Skills', value: 'list' },
        { name: '➕ Create a New Skill', value: 'create' },
        { name: '⬅ Back to Main Menu', value: 'back' }
      ]
    }
  ]);

  if (subAction === 'list') {
    const skills = await loadAvailableSkills();
    if (skills.length === 0) {
      logger.warn('No skills found in skills_library/.');
      return;
    }

    skills.forEach((skill, idx) => {
      console.log();
      console.log(`  ${idx + 1}. [${skill.id}] ${skill.name}`);
      console.log(`     Description: ${skill.description}`);
      console.log(`     AI Instructions: ${skill.ai_instructions}`);
      if (skill.dependencies) {
        const npmDeps = skill.dependencies.npm?.join(', ') || 'none';
        const pipDeps = skill.dependencies.pip?.join(', ') || 'none';
        console.log(`     Dependencies: npm [${npmDeps}], pip [${pipDeps}]`);
      }
      if (skill.files_to_copy?.length) {
        const files = skill.files_to_copy.map((f) => `${f.source} -> ${f.destination}`).join('; ');
        console.log(`     Files to copy: ${files}`);
      }
    });
    console.log();
  } else if (subAction === 'create') {
    logger.step('Define a new Skill according to standard schema:');
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Skill ID (e.g., api_tester):',
        validate: (input) => (input.trim().length > 0 ? true : 'Skill ID is required.')
      },
      {
        type: 'input',
        name: 'name',
        message: 'Skill Name (e.g., API Tester):',
        validate: (input) => (input.trim().length > 0 ? true : 'Skill Name is required.')
      },
      {
        type: 'input',
        name: 'description',
        message: 'Short description:',
        default: 'Automates API testing and endpoint validation.'
      },
      {
        type: 'input',
        name: 'ai_instructions',
        message: 'AI Instructions / prompt guidance:',
        validate: (input) => (input.trim().length > 0 ? true : 'AI instructions are required.')
      },
      {
        type: 'input',
        name: 'npm_deps',
        message: 'NPM dependencies (comma-separated, leave blank if none):'
      },
      {
        type: 'input',
        name: 'pip_deps',
        message: 'Pip dependencies (comma-separated, leave blank if none):'
      }
    ]);

    const newSkill = {
      id: answers.id.trim(),
      name: answers.name.trim(),
      description: answers.description.trim(),
      ai_instructions: answers.ai_instructions.trim(),
      dependencies: {
        npm: answers.npm_deps.split(',').map((d) => d.trim()).filter(Boolean),
        pip: answers.pip_deps.split(',').map((d) => d.trim()).filter(Boolean)
      },
      files_to_copy: []
    };

    const filePath = await saveSkill(newSkill);
    logger.success(`Skill '${newSkill.name}' saved to ${filePath}!`);
  }
}

/**
 * Main Interactive Menu Loop
 */
async function mainMenu() {
  logger.banner();

  let keepRunning = true;

  while (keepRunning) {
    try {
      const { choice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'What would you like to do?',
          choices: [
            { name: '[1] 🚀 Inject Skills to Project', value: 'inject' },
            { name: '[2] 🔄 Sync & Update Project Skills', value: 'sync' },
            { name: '[3] 📚 Manage Skills Library', value: 'manage' },
            { name: '[4] ❌ Exit', value: 'exit' }
          ]
        }
      ]);

      switch (choice) {
        case 'inject':
          await handleInjectSkills();
          break;
        case 'sync':
          await handleSyncSkills();
          break;
        case 'manage':
          await handleManageSkills();
          break;
        case 'exit':
          logger.info('Thank you for using ContextRig CLI. Goodbye!');
          keepRunning = false;
          process.exit(0);
          break;
      }
    } catch (err) {
      if (err.isTtyError) {
        logger.error('Prompt could not be rendered in the current environment.');
        keepRunning = false;
      } else {
        logger.error(`An unexpected error occurred: ${err.message}`);
      }
    }
  }
}

// Start CLI
mainMenu();
