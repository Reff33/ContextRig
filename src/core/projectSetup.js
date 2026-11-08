import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Cleans user-typed paths: strips wrapping quotes (Explorer "Copy as path"),
 * expands a leading `~` to the home directory and `%VAR%`/`$VAR` env vars.
 * @param {string} input
 * @returns {string}
 */
export function sanitizePath(input) {
  let cleaned = input.trim().replace(/^["']+|["']+$/g, '').trim();
  if (cleaned === '~' || /^[~][\\/]/.test(cleaned)) {
    cleaned = path.join(os.homedir(), cleaned.slice(1));
  }
  cleaned = cleaned.replace(/%([^%]+)%/g, (match, name) => process.env[name] ?? match);
  return cleaned;
}

/**
 * Validates and ensures the target directory exists.
 * @param {string} targetPath - Relative or absolute path to project directory
 * @returns {Promise<{ fullPath: string, projectName: string, created: boolean }>}
 */
export async function setupTargetProject(targetPath) {
  const fullPath = path.resolve(process.cwd(), sanitizePath(targetPath));
  let created = false;

  try {
    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) {
      throw new Error(`Target path '${fullPath}' exists but is not a directory.`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Directory doesn't exist, create it
      await fs.mkdir(fullPath, { recursive: true });
      created = true;
    } else {
      throw err;
    }
  }

  const projectName = path.basename(fullPath);
  return { fullPath, projectName, created };
}

