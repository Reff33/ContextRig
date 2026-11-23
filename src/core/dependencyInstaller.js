import { exec, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
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
 * Resolves the CLI agent identifier (e.g. claude-code, cursor, github-copilot)
 * based on the user's selected AI profile.
 * @param {Object|string} [agent]
 * @returns {string}
 */
export function getAgentCliFlag(agent) {
  const agentVal = typeof agent === 'object' && agent?.value ? agent.value : (agent || 'claude');
  const agentMap = {
    claude: 'claude-code',
    cursor: 'cursor',
    copilot: 'github-copilot',
    opencode: 'opencode',
    chatgpt: 'chatgpt',
    codex: 'codex'
  };
  return agentMap[agentVal] || 'claude-code';
}

/**
 * Finds a Windows Python launcher that works (py, python, python3).
 * Windows Store stub "python" fails, so each candidate is probed.
 * @returns {Promise<string|null>}
 */
async function findPythonLauncher() {
  const candidates = ['py', 'python', 'python3'];
  for (const cmd of candidates) {
    // exec() rejects on any non-zero exit (incl. Microsoft Store stub 9009)
    try {
      await execAsync(`${cmd} -m pip --version`);
      return cmd;
    } catch {}
  }
  // Fallback for non-PATH installs: Scripts\pip.exe under common Python roots
  return findPythonPipOnDisk();
}

/**
 * Locates python.exe inside standard Python install roots (used when PATH is stale).
 * @returns {string|null} unquoted path to python.exe
 */
export function findPythonExeOnDisk() {
  const exe = findInPythonRoots('Scripts', 'pip.exe');
  return exe ? path.join(path.dirname(path.dirname(exe)), 'python.exe') : null;
}

/**
 * Locates pip.exe inside standard Python install roots (used when PATH is stale).
 * @returns {string|null} quoted path to pip.exe
 */
export function findPythonPipOnDisk() {
  const exe = findInPythonRoots('Scripts', 'pip.exe');
  return exe ? jsonQuote(exe) : null;
}

/**
 * Scans per-user/per-machine Python roots for a file at <root>/<version>/<sub>/<file>.
 * @returns {string|null} raw path
 */
function findInPythonRoots(sub, file) {
  const local = process.env.LOCALAPPDATA || '';
  const roots = [
    path.join(local, 'Programs', 'Python'),
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles, 'Python') : ''
  ].filter(Boolean);
  // per-user installs register their install path here
  try {
    const out = fsSync.execFileSync('reg', ['query', 'HKCU\\Software\\Python\\PythonCore', '/s'], { encoding: 'utf8' });
    for (const m of out.matchAll(/InstallPath\s+REG_SZ\s+(\S+)/g)) roots.push(m[1]);
  } catch {}
  for (const root of roots) {
    // root itself may be the install dir, or contain versioned subdirs
    const dirs = [''];
    try {
      dirs.push(...fsSync.readdirSync(root));
    } catch {}
    for (const d of dirs) {
      const candidate = path.join(root, d, sub, file);
      if (fsSync.existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/** Quotes a path for cmd.exe; backslash-escaped quotes survive exec()'s own re-escaping. */
function jsonQuote(p) {
  return JSON.stringify(p);
}

/**
 * Resolves a working Python command for shell use (quoted absolute path or bare launcher).
 * Needed because a just-installed Python is not on this process's PATH.
 * @returns {string|null}
 */
export function resolvePythonCmd() {
  const exe = findPythonExeOnDisk();
  if (exe) return jsonQuote(exe);
  const candidates = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python'];
  for (const c of candidates) {
    const r = spawnSync(c, ['-V'], { encoding: 'utf8' });
    if (r.status === 0) return c;
  }
  return null;
}

/**
 * Returns the exact winget package id of the latest stable Python 3, e.g. Python.Python.3.14.
 * @returns {Promise<string|null>}
 */
async function latestPythonWingetId() {
  try {
    const { stdout } = await execAsync('winget search Python.Python.3 --exact', { maxBuffer: 4 * 1024 * 1024 });
    const versions = [...stdout.matchAll(/^Python\.Python\.(3\.\d{1,2})\s+(\d+\.\d+(?:\.\d+)?)$/gm)]
      .map(([, minor, ver]) => ({ id: `Python.Python.${minor}`, v: ver.split('.').map(Number) }));
    if (!versions.length) return null;
    versions.sort((a, b) => b.v[0] - a.v[0] || b.v[1] - a.v[1]);
    return versions[0].id;
  } catch {
    return null;
  }
}

/**
 * Installs the newest Python 3 via winget and returns the new pip launcher, if any.
 * @returns {Promise<string|null>}
 */
async function installPython() {
  const pkgId = (await latestPythonWingetId()) || 'Python.Python.3.14';
  logger.step(`Installing ${pkgId} via winget...`);
  try {
    await execAsync(`winget install --id ${pkgId} --exact --silent --accept-package-agreements --accept-source-agreements`, {
      maxBuffer: 8 * 1024 * 1024
    });
    logger.success('Python installed.');
  } catch (err) {
    logger.error(`Failed to install Python: ${err.message.split('\n')[0]}`);
    logger.info(`Install manually: winget install --id ${pkgId} --exact`);
    return null;
  }
  // PATH changes made by the installer are not visible to this process
  return (await findPythonLauncher()) || findPythonPipOnDisk();
}

/**
 * Checks if dependencies exist and prompts user to auto-install them.
 * @param {string} targetDir - Directory where dependencies should be installed
 * @param {Array<Object>} selectedSkills - List of selected skills
 * @param {Object|string} [agent] - Selected AI agent profile
 */
export async function handleDependencies(targetDir, selectedSkills, agent = null) {
  const { npm, pip } = aggregateDependencies(selectedSkills);

  if (npm.length === 0 && pip.length === 0 && !selectedSkills.some((s) => s.install_command)) {
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
      // pip lives in Scripts\ on Windows and may not be on PATH
      if (process.platform !== 'win32') {
        logger.error(`Failed to install Pip dependencies: ${err.message}`);
      } else {
        let launcher = await findPythonLauncher();
        logger.step(`pip check: ${launcher ? 'found ' + launcher : 'not found'}`);
        if (!launcher) {
          const { installPy } = await inquirer.prompt([
            { type: 'confirm', name: 'installPy', message: 'Python not found. Install the latest Python 3 via winget?', default: true }
          ]);
          if (installPy) {
            launcher = await installPython();
            if (!launcher) {
              logger.warn('Python installed but pip is not visible yet. Open a new terminal, then rerun ContextRig.');
              return;
            }
          }
        }
        if (launcher) {
          // fallback launcher is a quoted pip.exe path; bare launchers need -m pip
          const altCmd = launcher.startsWith('"')
            ? `${launcher} install ${pip.join(' ')}`
            : `${launcher} -m pip install ${pip.join(' ')}`;
          logger.step(`Retrying via Python launcher: ${altCmd}...`);
          try {
            const { stdout } = await execAsync(altCmd, { cwd: targetDir });
            if (stdout) console.log(stdout.trim());
            logger.success('Pip dependencies installed successfully.');
            return;
          } catch (retryErr) {
            logger.error(`Failed to install Pip dependencies: ${retryErr.message}`);
          }
        }
        logger.warn('pip not found on PATH, so Python dependencies were skipped.');
        logger.info('Install Python 3 (with "Add to PATH") from https://www.python.org/downloads/ then run: python -m pip install ' + pip.join(' '));
      }
    }
  }

  // Execute custom skill install commands (e.g. external skill repositories)
  const agentFlag = getAgentCliFlag(agent);
  for (const skill of selectedSkills) {
    if (skill.install_command) {
      const cmd = skill.install_command
        .replace(/\{\{\s*agent(?:_flag)?\s*\}\}/g, agentFlag)
        .replace(/\{\{\s*targetDir\s*\}\}/g, targetDir);

      logger.step(`Running setup for ${skill.name}: ${cmd}...`);
      try {
        const cleanEnv = { ...process.env };
        delete cleanEnv.npm_config_allow_scripts;
        const { stdout } = await execAsync(cmd, { cwd: targetDir, env: cleanEnv });
        if (stdout) console.log(stdout.trim());

        // Automatically clean up redundant agent directories generated by multi-agent skill installers
        const junkPaths = ['.commandcode', '.grok', '.hermes', 'skills-lock.json'];
        for (const junk of junkPaths) {
          const junkPath = path.join(targetDir, junk);
          try {
            await fs.rm(junkPath, { recursive: true, force: true });
          } catch {}
        }

        logger.success(`${skill.name} setup completed successfully.`);
      } catch (err) {
        logger.warn(`Could not run setup for ${skill.name}: ${err.message}`);
      }
    }
  }
}

