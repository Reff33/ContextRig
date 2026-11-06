import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Validates and ensures the target directory exists.
 * @param {string} targetPath - Relative or absolute path to project directory
 * @returns {Promise<{ fullPath: string, projectName: string }>}
 */
export async function setupTargetProject(targetPath) {
  const fullPath = path.resolve(process.cwd(), targetPath.trim());
  
  try {
    const stats = await fs.stat(fullPath);
    if (!stats.isDirectory()) {
      throw new Error(`Target path '${fullPath}' exists but is not a directory.`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Directory doesn't exist, create it
      await fs.mkdir(fullPath, { recursive: true });
    } else {
      throw err;
    }
  }

  const projectName = path.basename(fullPath);
  return { fullPath, projectName };
}

