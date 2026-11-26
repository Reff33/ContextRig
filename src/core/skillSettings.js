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
  },
  web_fetch: {
    fields: [
      {
        key: 'max_chars',
        label: 'Output Character Cap',
        type: 'choice',
        default: 8000,
        choices: [
          { name: '4,000 (short pages, lowest token spend)', short: '4000', value: 4000 },
          { name: '8,000 (recommended balance)', short: '8000', value: 8000 },
          { name: '16,000 (long-form docs)', short: '16000', value: 16000 },
          { name: '32,000 (full article dumps)', short: '32000', value: 32000 }
        ]
      },
      {
        key: 'include_json',
        label: 'Default Output Format',
        type: 'choice',
        default: 'text',
        choices: [
          { name: 'Human-readable text block', short: 'Text', value: 'text' },
          { name: 'Structured JSON (--json)', short: 'JSON', value: 'json' }
        ]
      }
    ]
  },
  no_ai_slop: {
    fields: [
      {
        key: 'mode',
        label: 'Default Mode',
        type: 'choice',
        default: 'edit',
        choices: [
          { name: 'Edit and list what changed', short: 'Edit', value: 'edit' },
          { name: 'Detect only (quote patterns)', short: 'Detect', value: 'detect' },
          { name: 'Generate slop as satire', short: 'Satire', value: 'satire' }
        ]
      },
      {
        key: 'preserve_voice',
        label: 'Voice Preservation',
        type: 'choice',
        default: 'strict',
        choices: [
          { name: 'Strict — keep vocabulary and cadence', short: 'Strict', value: 'strict' },
          { name: 'Light — allow minor tightening', short: 'Light', value: 'light' }
        ]
      }
    ]
  },
  i_have_adhd: {
    fields: [
      {
        key: 'list_cap',
        label: 'Maximum List Items',
        type: 'choice',
        default: 5,
        choices: [
          { name: '3 items (ultra-short)', short: '3', value: 3 },
          { name: '5 items (default)', short: '5', value: 5 },
          { name: '7 items', short: '7', value: 7 },
          { name: 'No cap', short: 'All', value: 0 }
        ]
      },
      {
        key: 'closing_step',
        label: 'Ending Style',
        type: 'choice',
        default: 'next_step',
        choices: [
          { name: 'One concrete next step', short: 'Next step', value: 'next_step' },
          { name: 'Short recap', short: 'Recap', value: 'recap' },
          { name: 'Nothing extra', short: 'None', value: 'none' }
        ]
      }
    ]
  },
  playwright: {
    fields: [
      {
        key: 'viewport',
        label: 'Browser Viewport',
        type: 'choice',
        default: '1280x720',
        choices: [
          { name: '1280×720 (default laptop)', short: '720p', value: '1280x720' },
          { name: '1440×900 (desktop inspection)', short: '900p', value: '1440x900' },
          { name: '375×812 (mobile breakpoint)', short: 'Mobile', value: '375x812' }
        ]
      },
      {
        key: 'wait_until',
        label: 'Page Load Strategy',
        type: 'choice',
        default: 'networkidle',
        choices: [
          { name: 'networkidle (wait for quiet network)', short: 'networkidle', value: 'networkidle' },
          { name: 'load (faster, may miss late errors)', short: 'load', value: 'load' },
          { name: 'domcontentloaded (fastest, DOM only)', short: 'DOM', value: 'domcontentloaded' }
        ]
      }
    ]
  },
  graphify: {
    fields: [
      {
        key: 'report_first',
        label: 'Read Report Before Searching',
        type: 'choice',
        default: 'always',
        choices: [
          { name: 'Always inspect GRAPH_REPORT.md first', short: 'Always', value: 'always' },
          { name: 'Only when tracing architecture', short: 'Architecture', value: 'architecture' },
          { name: 'Never — always read source', short: 'Never', value: 'never' }
        ]
      },
      {
        key: 'exclude_patterns',
        label: 'Excluded Paths',
        type: 'string',
        default: 'node_modules,dist,build,.git'
      }
    ]
  },
  ui_ux_pro_max: {
    fields: [
      {
        key: 'default_stack',
        label: 'Default Tech Stack',
        type: 'choice',
        default: 'html-tailwind',
        choices: [
          { name: 'HTML + Tailwind (framework-free)', short: 'HTML', value: 'html-tailwind' },
          { name: 'React / Next.js', short: 'React', value: 'nextjs' },
          { name: 'Vue / Svelte', short: 'Vue', value: 'vue' },
          { name: 'Laravel / Flutter / React Native', short: 'Other', value: 'laravel' }
        ]
      },
      {
        key: 'contrast_floor',
        label: 'Minimum Text Contrast',
        type: 'choice',
        default: '4.5',
        choices: [
          { name: '4.5:1 (WCAG AA body text)', short: 'AA', value: '4.5' },
          { name: '7:1 (WCAG AAA)', short: 'AAA', value: '7' },
          { name: '3:1 (large text only)', short: 'Large', value: '3' }
        ]
      }
    ]
  },
  git_workflow: {
    fields: [
      {
        key: 'auto_commit',
        label: 'Commit Execution',
        type: 'choice',
        default: 'confirm',
        choices: [
          { name: 'Ask before running git commit', short: 'Ask', value: 'confirm' },
          { name: 'Commit immediately after drafting', short: 'Auto', value: 'auto' },
          { name: 'Draft only, never commit', short: 'Draft', value: 'draft' }
        ]
      },
      {
        key: 'attribution',
        label: 'AI Attribution Trailer',
        type: 'choice',
        default: 'never',
        choices: [
          { name: 'Never add AI attribution', short: 'Never', value: 'never' },
          { name: 'Add Co-Authored-By trailer', short: 'Trailer', value: 'trailer' }
        ]
      }
    ]
  },
  cut_rig: {
    fields: [
      {
        key: 'default_editor',
        label: 'Target NLE Editor',
        type: 'choice',
        default: 'davinci',
        choices: [
          { name: 'DaVinci Resolve', short: 'DaVinci', value: 'davinci' },
          { name: 'Adobe Premiere Pro', short: 'Premiere', value: 'adobe' },
          { name: 'CapCut drafts', short: 'CapCut', value: 'capcut' },
          { name: 'FFmpeg only (no NLE)', short: 'FFmpeg', value: 'ffmpeg' }
        ]
      },
      {
        key: 'probe_first',
        label: 'Probe Media Before Editing',
        type: 'choice',
        default: 'always',
        choices: [
          { name: 'Always probe source clips first', short: 'Always', value: 'always' },
          { name: 'Skip probe for known-good assets', short: 'Skip', value: 'skip' }
        ]
      }
    ]
  },
  artcraft: {
    fields: [
      {
        key: 'default_app',
        label: 'Primary ArtCraft App',
        type: 'choice',
        default: 'effectcraft',
        choices: [
          { name: 'EffectCraft — VFX, motion & kinetic titles', short: 'EffectCraft', value: 'effectcraft' },
          { name: 'FilmCraft — NLE video editing', short: 'FilmCraft', value: 'filmcraft' },
          { name: 'AniCraft — 2D animation', short: 'AniCraft', value: 'anicraft' },
          { name: 'DesignCraft — UI & graphic design', short: 'DesignCraft', value: 'designcraft' },
          { name: 'PhotoCraft — photo editing & retouch', short: 'PhotoCraft', value: 'photocraft' },
          { name: 'VectorCraft — vector illustration', short: 'VectorCraft', value: 'vectorcraft' },
          { name: 'SolidCraft — 3D modelling', short: 'SolidCraft', value: 'solidcraft' },
          { name: 'MaterialCraft — materials & shaders', short: 'MaterialCraft', value: 'materialcraft' },
          { name: 'LightCraft — lighting & look dev', short: 'LightCraft', value: 'lightcraft' },
          { name: 'TextureCraft — texture painting', short: 'TextureCraft', value: 'texturecraft' },
          { name: 'GridCraft — layout grids & systems', short: 'GridCraft', value: 'gridcraft' },
          { name: 'CADCraft — CAD & technical drawing', short: 'CADCraft', value: 'cadcraft' },
          { name: 'FigCraft — interface prototyping', short: 'FigCraft', value: 'figcraft' },
          { name: 'DeckCraft — presentations', short: 'DeckCraft', value: 'deckcraft' },
          { name: 'MailCraft — email design', short: 'MailCraft', value: 'mailcraft' },
          { name: 'PDFCraft — PDF documents', short: 'PDFCraft', value: 'pdfcraft' },
          { name: 'WordCraft — long-form documents', short: 'WordCraft', value: 'wordcraft' },
          { name: 'SoundCraft — audio & SFX', short: 'SoundCraft', value: 'soundcraft' },
          { name: 'Craft Anything — pick per task', short: 'Any', value: 'craft-anything' }
        ]
      },
      {
        key: 'missing_cli_mood',
        label: 'When Native CLI Is Missing',
        type: 'choice',
        default: 'ask',
        choices: [
          { name: 'Stop and ask before scaffolding', short: 'Ask', value: 'ask' },
          { name: 'Scaffold native project file only', short: 'Scaffold', value: 'scaffold' },
          { name: 'Fall back to kinet_rig / cut_rig', short: 'Fallback', value: 'fallback' }
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
