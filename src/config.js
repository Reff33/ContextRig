import os from 'node:os';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directory of ContextRig CLI
export const ROOT_DIR = path.resolve(__dirname, '..');

// Templates and skills directory paths
export const TEMPLATES_DIR = path.resolve(ROOT_DIR, 'templates');
export const SKILLS_LIBRARY_DIR = path.resolve(ROOT_DIR, 'skills_library');
export const CATALOG_PATH = path.resolve(ROOT_DIR, 'skills_catalog.json');

export function getDeviceDir() {
  if (process.env.CONTEXTRIG_DEVICE_DIR) {
    return path.resolve(process.env.CONTEXTRIG_DEVICE_DIR);
  }
  return path.join(os.homedir(), '.contextrig');
}

export function getDeviceSkillsDir() {
  return path.join(getDeviceDir(), 'skills_library');
}

/**
 * Resolves a skill asset source path (`scripts/...`) from the user's device cache first,
 * falling back to the package/repo ROOT_DIR when present.
 */
export function resolveAssetSourcePath(relSource) {
  const safeRel = String(relSource || '').replace(/^[/\\]+/, '');
  const deviceCandidate = path.resolve(getDeviceDir(), safeRel);
  if (existsSync(deviceCandidate)) return deviceCandidate;
  return path.resolve(ROOT_DIR, safeRel);
}

export const SUPPORTED_AGENTS = [
  {
    name: 'Claude (CLAUDE.md)',
    value: 'claude',
    templateFile: 'claude.md.hbs',
    outputFile: 'CLAUDE.md'
  },
  {
    name: 'Cursor (.cursorrules)',
    value: 'cursor',
    templateFile: 'cursorrules.hbs',
    outputFile: '.cursorrules'
  },
  {
    name: 'ChatGPT (CHATGPT.md)',
    value: 'chatgpt',
    templateFile: 'chatgpt.md.hbs',
    outputFile: 'CHATGPT.md'
  },
  {
    name: 'GitHub Copilot (.github/copilot-instructions.md)',
    value: 'copilot',
    templateFile: 'copilot.md.hbs',
    outputFile: '.github/copilot-instructions.md'
  },
  {
    name: 'OpenCode (AGENTS.md)',
    value: 'opencode',
    templateFile: 'opencode.md.hbs',
    outputFile: 'AGENTS.md'
  }
];

