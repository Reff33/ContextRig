import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Resolves the global registry file path.
 * Supports CONTEXTRIG_REGISTRY_PATH override for isolated testing.
 * @returns {string}
 */
export function getRegistryPath() {
  if (process.env.CONTEXTRIG_REGISTRY_PATH) {
    return path.resolve(process.env.CONTEXTRIG_REGISTRY_PATH);
  }
  return path.join(os.homedir(), '.contextrig', 'projects.json');
}

function normalizeProjectKey(projectPath) {
  const resolved = path.resolve(projectPath);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

/**
 * Loads the global ContextRig project registry.
 * @returns {Promise<{ projects: Array<Object> }>}
 */
export async function loadRegistry() {
  const registryPath = getRegistryPath();
  if (!existsSync(registryPath)) {
    return { projects: [] };
  }
  try {
    const raw = await fs.readFile(registryPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.projects)) {
      return { projects: parsed.projects };
    }
    return { projects: [] };
  } catch {
    return { projects: [] };
  }
}

/**
 * Persists the global ContextRig project registry.
 * @param {{ projects: Array<Object> }} registry
 */
export async function saveRegistry(registry) {
  const registryPath = getRegistryPath();
  await fs.mkdir(path.dirname(registryPath), { recursive: true });
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf8');
}

/**
 * Registers or updates a project entry in ~/.contextrig/projects.json.
 * @param {Object} entry
 * @param {string} entry.projectPath
 * @param {string} [entry.name]
 * @param {string[]} [entry.agents]
 * @param {string[]} [entry.skills]
 * @returns {Promise<{ projects: Array<Object> }>}
 */
export async function registerProject({ projectPath, name, agents = [], skills = [] }) {
  const resolvedPath = path.resolve(projectPath);
  const key = normalizeProjectKey(resolvedPath);
  const registry = await loadRegistry();

  const existingIdx = registry.projects.findIndex((p) => normalizeProjectKey(p.path) === key);
  const nextEntry = {
    path: resolvedPath,
    name: name || path.basename(resolvedPath),
    agents: Array.from(new Set(agents)).filter(Boolean),
    skills: Array.from(new Set(skills)).filter(Boolean),
    lastSynced: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    const prev = registry.projects[existingIdx];
    registry.projects[existingIdx] = {
      ...prev,
      ...nextEntry,
      agents: nextEntry.agents.length > 0 ? nextEntry.agents : prev.agents || [],
      skills: nextEntry.skills
    };
  } else {
    registry.projects.push(nextEntry);
  }

  await saveRegistry(registry);
  return registry;
}

/**
 * Removes a project from the global registry.
 * @param {string} projectPath
 * @returns {Promise<{ projects: Array<Object> }>}
 */
export async function unregisterProject(projectPath) {
  const key = normalizeProjectKey(projectPath);
  const registry = await loadRegistry();
  registry.projects = registry.projects.filter((p) => normalizeProjectKey(p.path) !== key);
  await saveRegistry(registry);
  return registry;
}

/**
 * Filters out projects whose directories no longer exist on disk.
 * @returns {Promise<{ valid: Array<Object>, removed: Array<Object> }>}
 */
export async function pruneMissingProjects() {
  const registry = await loadRegistry();
  const valid = [];
  const removed = [];

  for (const proj of registry.projects) {
    if (proj?.path && existsSync(proj.path)) {
      valid.push(proj);
    } else {
      removed.push(proj);
    }
  }

  if (removed.length > 0) {
    await saveRegistry({ projects: valid });
  }

  return { valid, removed };
}
