import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Built-in parameter schemas for skills that expose concrete runtime/output settings.
 */
const BUILTIN_SCHEMAS = {
  kinet_rig: {
    configTarget: 'rigtools/kinet_rig/kinet.config.json',
    presets: [
      {
        name: 'Local Studio (Default)',
        description: '127.0.0.1:4004 • auto GPU • 144 FPS',
        values: { host: '127.0.0.1', port: 4004, encoder: 'auto', defaultFps: 144, outputDir: 'renders' }
      },
      {
        name: 'Ultra HFR NVIDIA (240 FPS)',
        description: '127.0.0.1:4004 • nvenc • 240 FPS',
        values: { host: '127.0.0.1', port: 4004, encoder: 'nvenc', defaultFps: 240, outputDir: 'renders' }
      },
      {
        name: 'LAN Share (Multi-device)',
        description: '0.0.0.0:4004 • auto GPU • 144 FPS',
        values: { host: '0.0.0.0', port: 4004, encoder: 'auto', defaultFps: 144, outputDir: 'renders' }
      }
    ],
    fields: [
      {
        key: 'host',
        label: 'Studio Host IP',
        type: 'choice',
        allowCustom: true,
        customType: 'string',
        default: '127.0.0.1',
        choices: [
          { name: '127.0.0.1 (Localhost only)', short: '127.0.0.1', value: '127.0.0.1' },
          { name: '0.0.0.0 (LAN / All devices)', short: '0.0.0.0', value: '0.0.0.0' }
        ]
      },
      {
        key: 'port',
        label: 'Studio Port',
        type: 'choice',
        allowCustom: true,
        customType: 'number',
        default: 4004,
        choices: [
          { name: '4004 (Default Studio)', short: '4004', value: 4004 },
          { name: '4005', short: '4005', value: 4005 },
          { name: '8080', short: '8080', value: 8080 }
        ]
      },
      {
        key: 'encoder',
        label: 'Video Encoder',
        type: 'choice',
        default: 'cpu',
        choices: [
          { name: 'auto (Auto-detect GPU)', short: 'auto', value: 'auto' },
          { name: 'nvenc (NVIDIA RTX/GTX)', short: 'nvenc', value: 'nvenc' },
          { name: 'qsv (Intel QuickSync)', short: 'qsv', value: 'qsv' },
          { name: 'amf (AMD GPU/APU)', short: 'amf', value: 'amf' },
          { name: 'cpu (Software x264)', short: 'cpu', value: 'cpu' }
        ]
      },
      {
        key: 'defaultFps',
        label: 'Default FPS',
        type: 'choice',
        allowCustom: true,
        customType: 'number',
        default: 144,
        choices: [
          { name: '240 FPS (Studio HFR)', short: '240', value: 240 },
          { name: '144 FPS (Default)', short: '144', value: 144 },
          { name: '120 FPS', short: '120', value: 120 },
          { name: '60 FPS', short: '60', value: 60 }
        ]
      },
      { key: 'outputDir', label: 'Output Folder', type: 'string', default: 'renders' }
    ]
  },
  archify: {
    fields: [
      {
        key: 'quality_profile',
        label: 'Architecture Quality Profile',
        type: 'choice',
        default: 'showcase',
        choices: [
          { name: 'showcase (Full sidebar & lens)', short: 'showcase', value: 'showcase' },
          { name: 'standard (Compact diagram)', short: 'standard', value: 'standard' }
        ]
      },
      { key: 'outputDir', label: 'Output Folder', type: 'string', default: '.archify' }
    ]
  },
  playwright: {
    fields: [
      { key: 'outputDir', label: 'Screenshot Output Folder', type: 'string', default: '.playwright' }
    ]
  },
  graphify: {
    fields: [
      { key: 'outputDir', label: 'Graph Output Folder', type: 'string', default: 'graphify-out' }
    ]
  },
  db_inspector: {
    fields: [
      { key: 'outputFile', label: 'Schema Output Path', type: 'string', default: 'docs/db_schema.md' }
    ]
  }
};

/**
 * Resolves the user's global skill settings path (~/.contextrig/skill-settings.json).
 * Supports CONTEXTRIG_SETTINGS_PATH override for isolated testing.
 * @returns {string}
 */
export function getSettingsPath() {
  if (process.env.CONTEXTRIG_SETTINGS_PATH) {
    return path.resolve(process.env.CONTEXTRIG_SETTINGS_PATH);
  }
  return path.join(os.homedir(), '.contextrig', 'skill-settings.json');
}

export function getSkillSchema(skill) {
  if (!skill) return { fields: [] };
  if (skill.settings_schema?.fields) return skill.settings_schema;
  return BUILTIN_SCHEMAS[skill.id] || { fields: [] };
}

export async function loadAllSkillSettings() {
  const settingsPath = getSettingsPath();
  if (!existsSync(settingsPath)) return {};
  try {
    const raw = await fs.readFile(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveAllSkillSettings(allSettings) {
  const settingsPath = getSettingsPath();
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(allSettings, null, 2), 'utf8');
}

export async function getSkillSettings(skillId) {
  const all = await loadAllSkillSettings();
  const entry = all[skillId];
  return {
    values: entry?.values && typeof entry.values === 'object' ? { ...entry.values } : {},
    extraRule: typeof entry?.extraRule === 'string' ? entry.extraRule : ''
  };
}

export async function saveSkillSettings(skillId, { values = {}, extraRule = '' }) {
  const all = await loadAllSkillSettings();
  const cleanValues = Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const cleanRule = typeof extraRule === 'string' ? extraRule.trim() : '';

  if (Object.keys(cleanValues).length === 0 && !cleanRule) {
    delete all[skillId];
  } else {
    all[skillId] = {
      ...(Object.keys(cleanValues).length > 0 ? { values: cleanValues } : {}),
      ...(cleanRule ? { extraRule: cleanRule } : {})
    };
  }
  await saveAllSkillSettings(all);
  return all[skillId] || null;
}

export async function resetSkillSettings(skillId) {
  const all = await loadAllSkillSettings();
  delete all[skillId];
  await saveAllSkillSettings(all);
}

/**
 * Returns a copy of the skill enriched with saved user settings & extra AI rule
 * without mutating the source manifest on disk.
 * @param {Object} skill
 * @param {Object|null} entry
 * @returns {Object}
 */
export function applySettingsToSkill(skill, entry) {
  if (!entry) return skill;
  const schema = getSkillSchema(skill);
  const overrides = [];

  if (entry.values && schema.fields?.length) {
    for (const field of schema.fields) {
      const val = entry.values[field.key];
      if (val !== undefined && val !== field.default) {
        overrides.push(`${field.label}: ${val}`);
      }
    }
  }

  let nextInstructions = skill.ai_instructions;
  if (overrides.length > 0) {
    nextInstructions += `\n  - **Configured Defaults:** ${overrides.join(', ')}.`;
  }
  if (entry.extraRule?.trim()) {
    nextInstructions += `\n  - **Custom Rule:** ${entry.extraRule.trim()}`;
  }

  return nextInstructions === skill.ai_instructions
    ? skill
    : { ...skill, ai_instructions: nextInstructions };
}

export async function applySettingsToSkills(skills) {
  const all = await loadAllSkillSettings();
  return skills.map((s) => applySettingsToSkill(s, all[s.id]));
}

export function mergeConfigContent(rawJson, savedValues, schema) {
  if (!savedValues || Object.keys(savedValues).length === 0) return rawJson;
  let baseConfig = {};
  try {
    baseConfig = JSON.parse(rawJson);
  } catch {
    for (const field of schema?.fields || []) {
      baseConfig[field.key] = field.default;
    }
  }
  return JSON.stringify({ ...baseConfig, ...savedValues }, null, 2);
}

/**
 * Writes saved JSON config overrides (e.g., rigtools/kinet_rig/kinet.config.json) into a target project.
 * @param {string} targetDir
 * @param {Array<Object>} skills
 */
export async function syncProjectSkillConfigs(targetDir, skills) {
  const all = await loadAllSkillSettings();
  for (const skill of skills) {
    const schema = getSkillSchema(skill);
    const savedValues = all[skill.id]?.values;
    if (!schema.configTarget || !savedValues || Object.keys(savedValues).length === 0) continue;

    const configPath = path.resolve(targetDir, schema.configTarget);
    let raw = '';
    try {
      raw = await fs.readFile(configPath, 'utf8');
    } catch {}

    const nextJson = mergeConfigContent(raw, savedValues, schema);
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, nextJson, 'utf8');
  }
}
