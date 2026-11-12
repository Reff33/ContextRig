#!/usr/bin/env node

import { exec, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { logger } from './utils/logger.js';
import { setupTargetProject, sanitizePath } from './core/projectSetup.js';
import { selectAgent } from './core/agentSelector.js';
import { injectTemplate } from './core/fileInjector.js';
import { loadAvailableSkills, saveSkill } from './core/skillManager.js';
import { handleDependencies } from './core/dependencyInstaller.js';
import { handleGitIgnore } from './core/gitIgnoreManager.js';
import { detectInstalledSkills, detectConfiguredAgents, syncSkills, removeSkillsFromProject } from './core/skillUpdater.js';
import { runSyncWorkflow, runSyncMasterWorkflow } from './core/syncEngine.js';
import { registerProject, unregisterProject } from './core/projectRegistry.js';
import { printSkillsTable } from './utils/table.js';

const execAsync = promisify(exec);

// Patch Inquirer to enforce wide glyph spacing on Windows terminal (prevent ✔ and ? from touching text)
const rawPrompt = inquirer.prompt;
inquirer.prompt = function (questions, answers) {
  const patchQuestion = (q) => {
    if (!q || typeof q !== 'object') return q;
    return {
      ...q,
      theme: {
        prefix: {
          idle: chalk.cyan('? '),
          done: chalk.green('✔ ')
        },
        ...q.theme
      }
    };
  };

  const patched = Array.isArray(questions)
    ? questions.map(patchQuestion)
    : patchQuestion(questions);

  return rawPrompt.call(this, patched, answers);
};

/**
 * Handle Option [1]: Inject Skills to Project
 */
async function handleInjectSkills() {
  logger.section('Starting Skill Injection Workflow...');

  // 1. Prompt user for target folder path
  const { targetPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'targetPath',
      message: 'Enter target project folder path (or "b" to back):',
      default: './my-project'
    }
  ]);

  const cleanPath = sanitizePath(targetPath);
  if (cleanPath.toLowerCase() === 'b' || cleanPath.toLowerCase() === 'back') {
    console.log();
    logger.info('Returning to Main Menu...');
    return;
  }

  const { fullPath, projectName, created } = await setupTargetProject(cleanPath);
  console.log();
  if (created) {
    logger.warn(`Folder did not exist — created a new directory at ${fullPath}`);
  }
  logger.info(`Target directory: ${fullPath} (Project: ${projectName})`);

  // 2. Select AI profile (Claude, Cursor, etc.) with detection of existing files
  logger.section('Select Target AI Agent Profile');

  const agent = await selectAgent(fullPath);
  if (!agent) {
    console.log();
    logger.info('Returning to Main Menu...');
    return;
  }
  console.log();
  logger.info(`Selected AI profile: ${agent.name}`);
  console.log();

  // 2b. Guard against silently overwriting a hand-written rules file
  let mergeMode = 'overwrite';
  const existingRulesPath = path.resolve(fullPath, agent.outputFile);
  if (fs.existsSync(existingRulesPath)) {
    const existingRules = fs.readFileSync(existingRulesPath, 'utf8');
    const isContextRigManaged = existingRules.includes('Agent Profile:');
    if (!isContextRigManaged) {
      console.log();
      logger.warn(`${agent.outputFile} already exists and contains custom rules.`);
      console.log();
      const { handlingMode } = await inquirer.prompt([
        {
          type: 'list',
          name: 'handlingMode',
          message: `Existing ${agent.outputFile} detected. Choose action:`,
          choices: [
            {
              name: `${'Smart Merge'.padEnd(14, ' ')} ${chalk.dim('Preserve custom rules & avoid duplicates')} ${chalk.green('[Recommended]')}`,
              value: 'merge'
            },
            {
              name: `${'Overwrite'.padEnd(14, ' ')} ${chalk.dim('Reset file to fresh ContextRig template')}`,
              value: 'overwrite'
            },
            new inquirer.Separator(),
            {
              name: chalk.yellow('← Cancel & Return to Main Menu'),
              value: 'cancel'
            }
          ],
          default: 'merge'
        }
      ]);

      if (handlingMode === 'cancel') {
        console.log();
        logger.info('Cancelled — existing rules file left untouched. Returning to Main Menu...');
        return;
      }
      mergeMode = handlingMode;
      console.log();
    }
  }

  // 3. Load and present available skills with pre-checked detection of installed skills
  const skills = await loadAvailableSkills();
  if (skills.length === 0) {
    console.log();
    logger.warn('No valid skills found in skills_library/. Please add skills first.');
    return;
  }

  const installedSkills = await detectInstalledSkills(fullPath, skills);
  const installedIds = new Set(installedSkills.map((s) => s.id));

  if (installedSkills.length > 0) {
    logger.info(`Detected ${installedSkills.length} skill(s) already in ${projectName}: ${installedSkills.map((s) => s.name).join(', ')}`);
  }

  logger.section('Select Skills to Inject');

  const choices = [
    ...skills.map((skill) => {
      const shortName = skill.name.length > 34 ? `${skill.name.slice(0, 33)}…` : skill.name;
      const badge = installedIds.has(skill.id) ? ` ${chalk.green('[Installed]')}` : '';
      const shortDesc = skill.description.length > 52 ? `${skill.description.slice(0, 51)}…` : skill.description;
      return {
        name: `${chalk.cyan(`[${skill.id}]`.padEnd(16))} ${shortName.padEnd(36)} ${chalk.dim(shortDesc)}${badge}`,
        value: skill,
        checked: installedIds.has(skill.id)
      };
    }),
    new inquirer.Separator(),
    {
      name: chalk.yellow('← Back to Main Menu (Cancel)'),
      value: '__BACK__',
      checked: false
    }
  ];

  const { selectedSkills } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSkills',
      message: 'Select skills to inject (Space to toggle, select "Back" or leave empty to cancel):',
      choices
    }
  ]);

  const wantsBack = selectedSkills && selectedSkills.some((s) => s === '__BACK__' || s?.id === '__BACK__');
  if (wantsBack || !selectedSkills || selectedSkills.length === 0) {
    console.log();
    logger.info('No skills selected or cancelled. Returning to Main Menu...');
    return;
  }

  const finalSelectedSkills = selectedSkills.filter((s) => s !== '__BACK__' && s?.id !== '__BACK__');
  if (finalSelectedSkills.length === 0) {
    console.log();
    logger.info('No skills selected. Returning to Main Menu...');
    return;
  }

  // 4. Compile and inject template
  console.log();
  logger.divider();
  logger.step(`Injecting rules into ${agent.outputFile}...`);
  const outputFile = await injectTemplate({
    targetDir: fullPath,
    templateFileName: agent.templateFile,
    outputFileName: agent.outputFile,
    projectName,
    agentName: agent.name,
    skillsInstructions: finalSelectedSkills,
    mergeMode
  });

  console.log();
  logger.success(`Configuration generated successfully at: ${outputFile}`);

  await registerProject({
    projectPath: fullPath,
    name: projectName,
    agents: [agent.value],
    skills: finalSelectedSkills.map((s) => s.id)
  });

  // 5. Dependency Automation (only prompt for newly added skills if existing ones already present)
  console.log();
  const newlyAddedSkills = finalSelectedSkills.filter((s) => !installedIds.has(s.id));
  const skillsForDeps = newlyAddedSkills.length > 0 ? newlyAddedSkills : finalSelectedSkills;
  await handleDependencies(fullPath, skillsForDeps, agent);

  // 6. GitIgnore Automation
  console.log();
  await handleGitIgnore(fullPath, finalSelectedSkills);

  // 7. Initial Tool Execution (Only run on fresh Graphify injection if report does not exist yet)
  const isNewGraphify = finalSelectedSkills.some((s) => s.id === 'graphify') && !installedIds.has('graphify');
  const graphifyReportExists = fs.existsSync(path.join(fullPath, 'graphify-out', 'graph.html'));

  if (isNewGraphify && !graphifyReportExists) {
    console.log();
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
      console.log();
      const graphifyCmd = fs.existsSync(path.join(fullPath, 'rigtools', 'graphify.py'))
        ? 'python rigtools/graphify.py .'
        : 'python tools/graphify.py .';
      logger.step(`Running: ${graphifyCmd} in ${fullPath}...`);
      try {
        const { stdout } = await execAsync(graphifyCmd, { cwd: fullPath });
        if (stdout) console.log(stdout.trim());
        console.log();
        logger.success('graphify-out/graph.html generated successfully! Open it in your browser to inspect the visual graph.');
      } catch (err) {
        console.log();
        logger.error(`Could not run Graphify automatically: ${err.message}`);
      }
    }
  }
}

/**
 * Handle Option [2]: Sync & Update Existing Project Skills
 */
async function handleSyncSkills() {
  await runSyncWorkflow();
}

/**
 * Handle Option [3]: Remove Skills from Project
 */
async function handleRemoveSkills() {
  logger.section('Remove Skills from Project');

  const { targetPath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'targetPath',
      message: 'Enter target project folder path (or "b" to back):',
      default: './my-project'
    }
  ]);

  const cleanPath = sanitizePath(targetPath);
  if (cleanPath.toLowerCase() === 'b' || cleanPath.toLowerCase() === 'back') {
    console.log();
    logger.info('Returning to Main Menu...');
    return;
  }

  const { fullPath, projectName } = await setupTargetProject(cleanPath);
  console.log();
  logger.info(`Target directory: ${fullPath} (Project: ${projectName})`);
  console.log();

  const availableSkills = await loadAvailableSkills();
  const installedSkills = await detectInstalledSkills(fullPath, availableSkills);

  if (installedSkills.length === 0) {
    logger.warn(`No ContextRig skills detected in ${projectName} (${fullPath}).`);
    return;
  }

  logger.info(`Detected ${installedSkills.length} installed skill(s) in ${projectName}.`);
  console.log();
  logger.divider();
  logger.step('Select Skills to Remove');
  console.log();

  const { skillsToRemove } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'skillsToRemove',
      message: 'Select skill(s) to remove (Space to select, select "Back" or leave empty to cancel):',
      choices: [
        ...installedSkills.map((s) => {
          const shortName = s.name.length > 34 ? `${s.name.slice(0, 33)}…` : s.name;
          const shortDesc = s.description.length > 52 ? `${s.description.slice(0, 51)}…` : s.description;
          return {
            name: `${chalk.cyan(`[${s.id}]`.padEnd(16))} ${shortName.padEnd(36)} ${chalk.dim(shortDesc)}`,
            value: s
          };
        }),
        new inquirer.Separator(),
        {
          name: chalk.yellow('← Back to Main Menu (Cancel)'),
          value: '__BACK__'
        }
      ]
    }
  ]);

  const wantsBack = skillsToRemove && skillsToRemove.some((s) => s === '__BACK__' || s?.id === '__BACK__');
  if (wantsBack || !skillsToRemove || skillsToRemove.length === 0) {
    console.log();
    logger.info('No skills selected for removal or cancelled. Returning to Main Menu...');
    return;
  }

  const finalSkillsToRemove = skillsToRemove.filter((s) => s !== '__BACK__' && s?.id !== '__BACK__');
  if (finalSkillsToRemove.length === 0) {
    console.log();
    logger.info('No skills selected for removal. Returning to Main Menu...');
    return;
  }

  console.log();
  const { confirmDelete } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmDelete',
      message: `Are you sure you want to remove ${finalSkillsToRemove.length} skill(s) (${finalSkillsToRemove.map((s) => s.name).join(', ')}) from ${projectName}?`,
      default: true
    }
  ]);

  if (!confirmDelete) {
    console.log();
    logger.info('Skill removal cancelled.');
    return;
  }

  // Check for any existing artifact/output directories (e.g. .archify/, graphify-out/, promo-video/, rigmotion/)
  const existingArtifactDirs = [];
  for (const skill of finalSkillsToRemove) {
    const candidatePatterns = new Set([
      ...(Array.isArray(skill.artifacts) ? skill.artifacts : []),
      ...(Array.isArray(skill.gitignore) ? skill.gitignore : [])
    ]);

    for (const pattern of candidatePatterns) {
      const cleanPattern = pattern.replace(/\/+$/, '').trim();
      if (cleanPattern && cleanPattern !== 'rigtools' && cleanPattern !== 'tools' && !cleanPattern.startsWith('*')) {
        const artifactPath = path.resolve(fullPath, cleanPattern);
        if (fs.existsSync(artifactPath)) {
          if (!existingArtifactDirs.includes(cleanPattern)) {
            existingArtifactDirs.push(cleanPattern);
          }
        }
      }
    }
  }

  let deleteArtifacts = true;
  if (existingArtifactDirs.length > 0) {
    console.log();
    const { confirmArtifactDelete } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmArtifactDelete',
        message: `Detected generated output artifacts (${existingArtifactDirs.join(', ')}). Do you also want to delete these output folders?`,
        default: true
      }
    ]);
    deleteArtifacts = confirmArtifactDelete;
  }

  const removeIds = new Set(finalSkillsToRemove.map((s) => s.id));
  const remainingSkills = installedSkills.filter((s) => !removeIds.has(s.id));

  console.log();
  await removeSkillsFromProject(fullPath, projectName, finalSkillsToRemove, remainingSkills, { deleteArtifacts });

  if (remainingSkills.length > 0) {
    const remainingAgents = await detectConfiguredAgents(fullPath);
    await registerProject({
      projectPath: fullPath,
      name: projectName,
      agents: remainingAgents.map((a) => a.value),
      skills: remainingSkills.map((s) => s.id)
    });
  } else {
    await unregisterProject(fullPath);
  }
}

/**
 * Handle Option [4]: Manage Skills Library
 */
async function handleManageSkills() {
  logger.section('Skills Library Management');

  const { subAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'subAction',
      message: 'Choose a skill library operation:',
      choices: [
        { name: `${'List All Skills'.padEnd(24)} ${chalk.dim('Inspect installed library & instructions')}`, value: 'list' },
        { name: `${'Create New Skill'.padEnd(24)} ${chalk.dim('Add custom JSON skill definition')}`, value: 'create' },
        { name: `${'Sync Master Library'.padEnd(24)} ${chalk.dim('Update skills_library/ & scripts/ from GitHub')}`, value: 'sync_master' },
        new inquirer.Separator(),
        { name: chalk.yellow('← Back to Main Menu'), value: 'back' }
      ]
    }
  ]);

  if (subAction === 'sync_master') {
    await runSyncMasterWorkflow();
    return;
  }

  if (subAction === 'list') {
    const skills = await loadAvailableSkills();
    if (skills.length === 0) {
      console.log();
      logger.warn('No skills found in skills_library/.');
      return;
    }

    printSkillsTable(skills);
    logger.info(`Total available skills: ${skills.length}`);
    console.log();

    const { inspectChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'inspectChoice',
        message: 'Select a skill to inspect details or return to menu:',
        choices: [
          { name: chalk.yellow('← Back to Skills Management Menu'), value: 'back' },
          new inquirer.Separator(),
          ...skills.map((s, idx) => ({
            name: `${String(idx + 1).padStart(2, ' ')}. [${s.id.padEnd(14, ' ')}] ${s.name}`,
            value: s
          }))
        ]
      }
    ]);

    if (inspectChoice && inspectChoice !== 'back') {
      console.log();
      logger.divider();
      logger.step(`Skill Inspector: ${inspectChoice.name} (${inspectChoice.id})`);
      console.log();
      console.log(`  Description:      ${chalk.white(inspectChoice.description)}`);
      console.log(`  Slash Command:    ${inspectChoice.claude_command?.name ? chalk.green(`/${inspectChoice.claude_command.name}`) : chalk.dim('None')}`);
      const npmDeps = inspectChoice.dependencies?.npm?.length ? inspectChoice.dependencies.npm.join(', ') : 'none';
      const pipDeps = inspectChoice.dependencies?.pip?.length ? inspectChoice.dependencies.pip.join(', ') : 'none';
      console.log(`  Dependencies:     npm [${npmDeps}], pip [${pipDeps}]`);
      if (inspectChoice.files_to_copy?.length) {
        console.log(`  Files to Copy:    ${inspectChoice.files_to_copy.map((f) => `${f.source} -> ${f.destination}`).join(', ')}`);
      }
      if (inspectChoice.gitignore?.length) {
        console.log(`  GitIgnore Rules:  ${inspectChoice.gitignore.join(', ')}`);
      }
      console.log();
      console.log(chalk.cyan('  AI Instructions:'));
      const wrappedInstructions = inspectChoice.ai_instructions
        .replace(/(.{1,90})(\s+|$)/g, '    $1\n')
        .trimEnd();
      console.log(chalk.gray(wrappedInstructions));
      console.log();
      logger.divider();
    }
  } else if (subAction === 'create') {
    logger.step('Define a new Skill according to standard schema:');
    const { id } = await inquirer.prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Skill ID (e.g. playwright, or "b" to cancel):',
        validate: (input) => (input.trim().length > 0 ? true : 'Skill ID is required.')
      }
    ]);

    if (id.trim().toLowerCase() === 'b' || id.trim().toLowerCase() === 'back') {
      logger.info('Skill creation cancelled. Returning to Main Menu...');
      return;
    }

    const answers = await inquirer.prompt([
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
      id: id.trim(),
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
 * Fully clears the terminal screen and scrollback buffer across Windows and POSIX.
 */
function clearTerminal() {
  try {
    process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
    if (process.platform === 'win32') {
      execSync('cmd.exe /c cls', { stdio: 'inherit' });
    }
  } catch {
    console.clear();
  }
}

/**
 * Main Interactive Menu Loop
 */
async function mainMenu() {
  clearTerminal();
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
            { name: '[1] Inject Skills to Project', value: 'inject' },
            { name: '[2] Sync & Update Project Skills', value: 'sync' },
            { name: '[3] Remove Skills from Project', value: 'remove' },
            { name: '[4] Manage Skills Library', value: 'manage' },
            new inquirer.Separator(),
            { name: '[5] Exit', value: 'exit' }
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
        case 'remove':
          await handleRemoveSkills();
          break;
        case 'manage':
          await handleManageSkills();
          break;
        case 'exit':
          console.log();
          logger.info('Thank you for using ContextRig CLI. Goodbye!');
          keepRunning = false;
          process.exit(0);
          break;
      }
      if (keepRunning) {
        console.log();
        logger.divider();
        console.log();
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

function printCliHelp() {
  console.log(`
ContextRig CLI — AI Agent Context & Skill Provisioner

Usage:
  rig                                Launch interactive menu
  rig sync                           Open interactive sync hub (All / Skill / CWD / Project)
  rig sync --all [--yes]             Check & update all registered projects
  rig sync --skill <id> [--yes]      Update a specific skill across registered projects
  rig sync <path> [--yes]            Sync a specific project directory
  rig --help                         Show this help message
`);
}

async function runCli(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printCliHelp();
    return;
  }

  const cmd = argv[0];
  if (cmd === 'sync') {
    const rest = argv.slice(1);
    const autoConfirm = rest.includes('--yes') || rest.includes('-y');
    const isAll = rest.includes('--all');
    const skillFlagIdx = rest.findIndex((a) => a === '--skill' || a === '-s');
    const skillId = skillFlagIdx >= 0 ? rest[skillFlagIdx + 1] : null;
    const positionalPath = rest.find(
      (a, idx) => !a.startsWith('-') && !(skillFlagIdx >= 0 && idx === skillFlagIdx + 1)
    );

    if (isAll) {
      await runSyncWorkflow(null, { mode: 'all', skillId, autoConfirm });
    } else if (skillId) {
      await runSyncWorkflow(null, { mode: 'skill', skillId, autoConfirm });
    } else if (positionalPath) {
      await runSyncWorkflow(positionalPath, { autoConfirm });
    } else {
      await runSyncWorkflow();
    }
    return;
  }

  logger.error(`Unknown command '${cmd}'. Run 'rig --help' for usage.`);
  process.exitCode = 1;
}

// Start CLI
const cliArgs = process.argv.slice(2);
if (cliArgs.length > 0) {
  runCli(cliArgs).catch((err) => {
    logger.error(`CLI error: ${err.message}`);
    process.exit(1);
  });
} else {
  mainMenu();
}
