import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getDeviceDir, getDeviceSkillsDir } from '../config.js';
import { loadRegistry, getRegistryPath } from './projectRegistry.js';
import { getCatalogAndDeviceSkills } from './skillCatalog.js';
import { removeSkillsFromProject } from './skillUpdater.js';
import { logger } from '../utils/logger.js';

/** Files ContextRig may leave inside a target project. */
const PROJECT_ARTIFACTS = [
  '.contextrig_cache.json',
  '.mcp.json',
  'rigtools',
  'tools'
];

async function readJSON(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function projectPathsFor(project) {
  return {
    rulesFiles: new Set(
      (project.agents || []).map((a) => {
        const map = {
          claude: 'CLAUDE.md',
          cursor: '.cursorrules',
          copilot: path.join('.github', 'copilot-instructions.md'),
          opencode: 'AGENTS.md',
          chatgpt: 'CHATGPT.md'
        };
        return map[a] || null;
      }).filter(Boolean)
    )
  };
}

/**
 * Dry-run: reports exactly what a full uninstall would delete or modify.
 */
export async function previewPurge() {
  const registry = await loadRegistry();
  const deviceDir = getDeviceDir();
  const catalog = await getCatalogAndDeviceSkills();
  const byId = new Map(catalog.map((s) => [s.id, s]));

  const projects = registry.projects.map((p) => {
    const onDisk = existsSync(p.path);
    const skills = (p.skills || []).filter((id) => byId.has(id));
    return {
      name: p.name,
      path: p.path,
      onDisk,
      skills,
      skillCount: skills.length
    };
  });

  const deviceFiles = await countFiles(deviceDir);
  const deviceDirs = ['skills_library', 'scripts'].filter((d) => existsSync(path.join(deviceDir, d)));

  return {
    deviceDir,
    deviceExists: existsSync(deviceDir),
    deviceFiles,
    deviceDirs,
    registryPath: getRegistryPath(),
    projects,
    projectCount: projects.filter((p) => p.onDisk).length,
    settingsPath: path.join(deviceDir, 'skill-settings.json'),
    settingsExist: existsSync(path.join(deviceDir, 'skill-settings.json'))
  };
}

async function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.isDirectory()) stack.push(path.join(cur, e.name));
      else total++;
    }
  }
  return total;
}

/**
 * Removes every trace of ContextRig:
 *   1. strips each project's managed skill block (Smart Merge keeps custom rules)
 *   2. deletes injected tool files, slash commands, artifact dirs and caches
 *   3. empties the global registry
 *   4. deletes ~/.contextrig (manifests, scripts, settings, cache)
 *
 * @param {{ deleteDevice?: boolean, deviceDirOverride?: string }} [options]
 */
export async function purgeWorkspace({ deleteDevice = true, deviceDirOverride = null } = {}) {
  const deviceDir = deviceDirOverride || getDeviceDir();
  const registry = await loadRegistry();
  const catalog = await getCatalogAndDeviceSkills();
  const byId = new Map(catalog.map((s) => [s.id, s]));

  const report = { projectsCleaned: [], projectsSkipped: [], deviceDeleted: false, errors: [] };

  for (const proj of registry.projects) {
    if (!proj?.path || !existsSync(proj.path)) {
      report.projectsSkipped.push({ name: proj?.name || '?', path: proj?.path || '?', reason: 'directory missing' });
      continue;
    }
    const skills = (proj.skills || []).map((id) => byId.get(id)).filter(Boolean);
    try {
      if (skills.length > 0) {
        await removeSkillsFromProject(proj.path, proj.name, skills, [], {
          deleteArtifacts: true,
          rewriteRules: true
        });
      }

      // Caches and leftover runtime files that ContextRig created
      await fs.rm(path.join(proj.path, '.contextrig_cache.json'), { force: true });
      for (const dirName of ['rigtools', 'tools']) {
        const dir = path.join(proj.path, dirName);
        if (existsSync(dir)) await fs.rm(dir, { recursive: true, force: true });
      }

      const { rulesFiles } = await projectPathsFor(proj);
      report.projectsCleaned.push({ name: proj.name, path: proj.path, skills: skills.length, rulesFiles: Array.from(rulesFiles) });
    } catch (err) {
      report.errors.push({ name: proj.name, path: proj.path, message: err.message });
    }
  }

  // Empty the registry (keep the file so a re-install starts from a clean slate)
  try {
    await fs.mkdir(path.dirname(getRegistryPath()), { recursive: true });
    await fs.writeFile(getRegistryPath(), `${JSON.stringify({ projects: [] }, null, 2)}\n`, 'utf8');
  } catch (err) {
    report.errors.push({ name: 'registry', path: getRegistryPath(), message: err.message });
  }

  if (deleteDevice) {
    try {
      if (existsSync(deviceDir)) {
        await fs.rm(deviceDir, { recursive: true, force: true });
        report.deviceDeleted = true;
      }
    } catch (err) {
      report.errors.push({ name: 'device', path: deviceDir, message: err.message });
    }
  }

  return report;
}

/**
 * Prints a compact human summary of a purge report.
 */
export function printPurgeReport(report) {
  logger.divider();
  for (const p of report.projectsCleaned) {
    logger.success(`Cleaned ${p.name} (${p.skills} skill(s)) — ${p.path}`);
  }
  for (const p of report.projectsSkipped) {
    logger.warn(`Skipped ${p.name} — ${p.reason}`);
  }
  if (report.deviceDeleted) logger.success('Removed ~/.contextrig (manifests, scripts, settings, cache)');
  for (const e of report.errors) logger.error(`${e.name}: ${e.message}`);
}
