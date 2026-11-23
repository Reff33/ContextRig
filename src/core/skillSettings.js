import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Built-in parameter schemas for skills that expose concrete runtime/output settings.
 */
const BUILTIN_SCHEMAS = {
  kinet_rig: {
    presets: [
      {
        name: 'Remotion Broadcast 1080p (60 FPS)',
        description: '60 FPS • H.264 • angle GL • renders/',
        values: { defaultFps: 60, codec: 'h264', glBackend: 'angle', outputDir: 'renders' }
      },
      {
        name: 'Remotion Ultra-Smooth (120 FPS)',
        description: '120 FPS • H.264 • angle GL • renders/',
        values: { defaultFps: 120, codec: 'h264', glBackend: 'angle', outputDir: 'renders' }
      },
      {
        name: 'ProRes Master (Lossless)',
        description: '60 FPS • ProRes 422 • angle GL • renders/',
        values: { defaultFps: 60, codec: 'prores', glBackend: 'angle', outputDir: 'renders' }
      }
    ],
    fields: [
      {
        key: 'defaultFps',
        label: 'Default FPS',
        type: 'choice',
        allowCustom: true,
        customType: 'number',
        default: 60,
        choices: [
          { name: '60 FPS (Standard Broadcast)', short: '60', value: 60 },
          { name: '120 FPS (High Frame Rate)', short: '120', value: 120 },
          { name: '30 FPS (Web)', short: '30', value: 30 }
        ]
      },
      {
        key: 'codec',
        label: 'Video Codec',
        type: 'choice',
        default: 'h264',
        choices: [
          { name: 'h264 (Universal MP4 Compatibility)', short: 'h264', value: 'h264' },
          { name: 'h265 (HEVC High Compression)', short: 'h265', value: 'h265' },
          { name: 'prores (Apple ProRes Broadcast Master)', short: 'prores', value: 'prores' }
        ]
      },
      {
        key: 'glBackend',
        label: 'OpenGL / GPU Backend',
        type: 'choice',
        default: 'angle',
        choices: [
          { name: 'angle (Default Windows GPU Rendering)', short: 'angle', value: 'angle' },
          { name: 'swiftshader (Headless / CPU Fallback)', short: 'swiftshader', value: 'swiftshader' }
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
        default: 'balanced',
        choices: [
          { name: 'Fast (Low token spend, core components only)', short: 'Fast', value: 'fast' },
          { name: 'Balanced (Recommended: full graph, god nodes, APIs)', short: 'Balanced', value: 'balanced' },
          { name: 'Deep Audit (Multi-pass verification, full edge tracing)', short: 'Deep', value: 'deep' }
        ]
      },
      {
        key: 'output_format',
        label: 'Primary Artifact Format',
        type: 'choice',
        default: 'both',
        choices: [
          { name: 'Markdown (.archify/ARCHITECTURE.md)', short: 'Markdown', value: 'markdown' },
          { name: 'Interactive Graph (.archify/graph.html)', short: 'HTML Graph', value: 'html' },
          { name: 'Both (Complete Architecture Suite)', short: 'Both', value: 'both' }
        ]
      }
    ]
  }
};

/**
 * Returns the schema definition for a skill (builtin or from manifest).
 */
export function getSkillSchema(skill) {
  if (BUILTIN_SCHEMAS[skill.id]) {
    return BUILTIN_SCHEMAS[skill.id];
  }
  if (skill.settings_schema && Array.isArray(skill.settings_schema.fields)) {
    return skill.settings_schema;
  }
  return { fields: [], presets: [] };
}

/**
 * Global settings file path: ~/.contextrig/skill-settings.json
 */
export function getSettingsPath() {
  const home = os.homedir();
  return path.join(home, '.contextrig', 'skill-settings.json');
}

/**
 * Loads all custom skill settings from the user's home directory.
 */
export async function loadAllSkillSettings() {
  const file = getSettingsPath();
  if (!existsSync(file)) return {};
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveAllSkillSettings(allSettings) {
  const settingsPath = getSettingsPath();
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(allSettings, null, 2), 'utf8');
}

/**
 * Loads custom settings for a single skill. Returns defaults if not customized.
 */
export async function getSkillSettings(skillId) {
  const all = await loadAllSkillSettings();
  const entry = all[skillId];
  return {
    values: entry?.values && typeof entry.values === 'object' ? { ...entry.values } : {},
    extraRule: typeof entry?.extraRule === 'string' ? entry.extraRule : ''
  };
}

/**
 * Saves custom settings for a single skill.
 */
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

/**
 * Resets settings for a single skill back to defaults.
 */
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
 * Writes saved JSON config overrides into a target project.
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
