import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from '../config.js';
import { saveSkill } from './skillManager.js';
import { formatSkillBlock } from './fileInjector.js';
import { getGitHubToken } from './syncEngine.js';

const MAX_IMPORT_FILES = 120;
const FETCH_CONCURRENCY = 8;

const SENSITIVE_FILE_RE = /(?:^|\/)(?:\.env(?:\..+)?|id_rsa.*|.*\.pem|.*\.key|.*credentials.*|.*secret.*)$/i;
const SKIP_TOP_FILES = new Set([
  'readme.md',
  'license',
  'license.md',
  'changelog.md',
  '.gitignore',
  '.gitattributes',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
]);

async function runConcurrent(items, limit, worker) {
  const results = new Array(items.length);
  let nextIdx = 0;
  async function loop() {
    while (nextIdx < items.length) {
      const idx = nextIdx++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => loop()));
  return results;
}

/**
 * Parses GitHub URL, skills.sh URL, or owner/repo shorthand.
 * @param {string} rawInput
 */
export function parseSkillSourceUrl(rawInput) {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) {
    throw new Error('Repository URL cannot be empty.');
  }

  // Shorthand: owner/repo
  const shortMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?$/);
  if (shortMatch) {
    return {
      kind: 'github',
      owner: shortMatch[1],
      repo: shortMatch[2],
      branch: null,
      subpath: '',
      repoUrl: `https://github.com/${shortMatch[1]}/${shortMatch[2]}`
    };
  }

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL. Enter a GitHub URL (e.g. https://github.com/user/repo) or owner/repo.');
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);

  if (host === 'skills.sh' || host === 'www.skills.sh') {
    if (segments.length < 2) {
      throw new Error('Invalid skills.sh URL. Expected https://skills.sh/<owner>/<repo>[/<skill>].');
    }
    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/, '');
    return {
      kind: 'skills_sh',
      owner,
      repo,
      branch: null,
      subpath: '',
      skillsShSkill: segments[2] || repo,
      repoUrl: `https://github.com/${owner}/${repo}`
    };
  }

  if (host === 'raw.githubusercontent.com') {
    if (segments.length < 4) {
      throw new Error('Invalid raw.githubusercontent.com URL.');
    }
    const [owner, repo, branch, ...rest] = segments;
    const relPath = rest.join('/');
    const subpath = relPath.toLowerCase().endsWith('skill.md')
      ? rest.slice(0, -1).join('/')
      : rest.join('/');
    return {
      kind: 'github',
      owner,
      repo: repo.replace(/\.git$/, ''),
      branch,
      subpath,
      repoUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, '')}`
    };
  }

  if (host === 'github.com' || host === 'www.github.com') {
    if (segments.length < 2) {
      throw new Error('Invalid GitHub URL. Expected https://github.com/<owner>/<repo>.');
    }
    const owner = segments[0];
    const repo = segments[1].replace(/\.git$/, '');
    let branch = null;
    let subpath = '';

    if ((segments[2] === 'tree' || segments[2] === 'blob') && segments.length >= 4) {
      branch = segments[3];
      const rest = segments.slice(4);
      if (segments[2] === 'blob' && rest.length > 0 && rest[rest.length - 1].toLowerCase() === 'skill.md') {
        rest.pop();
      }
      subpath = rest.join('/');
    }

    return {
      kind: 'github',
      owner,
      repo,
      branch,
      subpath,
      repoUrl: `https://github.com/${owner}/${repo}`
    };
  }

  throw new Error(`Unsupported host '${host}'. Use github.com, raw.githubusercontent.com, or skills.sh.`);
}

export function slugifySkillId(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom_skill';
}

/**
 * Extracts YAML frontmatter (name, description) and markdown body from SKILL.md.
 * @param {string} rawMd
 * @param {string} fallbackId
 */
export function parseSkillMarkdown(rawMd, fallbackId = 'custom_skill') {
  const normalized = String(rawMd || '').replace(/\r\n/g, '\n');
  let name = '';
  let description = '';
  let body = normalized.trim();

  const fmMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (fmMatch) {
    const fm = fmMatch[1];
    body = fmMatch[2].trim();

    const nameMatch = fm.match(/^name:\s*(.+)$/m);
    const descMatch = fm.match(/^description:\s*(.+)$/m);
    if (nameMatch) name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');
    if (descMatch) description = descMatch[1].trim().replace(/^['"]|['"]$/g, '');
  }

  if (!name) {
    const h1Match = body.match(/^#\s+(.+)$/m);
    name = h1Match ? h1Match[1].trim() : fallbackId;
  }

  const id = slugifySkillId(name || fallbackId);
  return { id, name, description, body };
}

/**
 * Extracts npm & pip package names from raw package.json and requirements.txt.
 */
export function extractDependencies({ packageJsonRaw = null, requirementsTxtRaw = null } = {}) {
  const npm = [];
  const pip = [];

  if (packageJsonRaw) {
    try {
      const pkg = JSON.parse(packageJsonRaw);
      if (pkg?.dependencies && typeof pkg.dependencies === 'object') {
        npm.push(...Object.keys(pkg.dependencies));
      }
    } catch {}
  }

  if (requirementsTxtRaw) {
    const lines = requirementsTxtRaw.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.split('#')[0].trim();
      if (!line || line.startsWith('-')) continue;
      const pkgName = line.split(/[<>=!~;\[\s]/)[0].trim();
      if (pkgName) pip.push(pkgName);
    }
  }

  return {
    npm: Array.from(new Set(npm)),
    pip: Array.from(new Set(pip))
  };
}

/**
 * Rewrites relative repo script/reference/asset paths inside instructions to rigtools/<id>/...
 */
export function normalizeSkillPaths(text, skillId, importedRelPaths = []) {
  if (!text || !importedRelPaths.length) return text;
  let result = text;
  const sorted = [...importedRelPaths].sort((a, b) => b.length - a.length);

  for (const rel of sorted) {
    const cleanRel = rel.replace(/\\/g, '/').replace(/^\.\//, '');
    if (!cleanRel || cleanRel.startsWith('rigtools/')) continue;
    const escaped = cleanRel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!rigtools\\/${skillId}\\/)(?<![A-Za-z0-9_/-])${escaped}`, 'g');
    result = result.replace(regex, `rigtools/${skillId}/${cleanRel}`);
  }
  return result;
}

/**
 * Validates a skill definition and staged file paths before writing anything.
 */
export function validateSkillCandidate(skill) {
  const errors = [];
  const warnings = [];

  if (!skill.id || !/^[a-z0-9][a-z0-9_-]*$/.test(skill.id)) {
    errors.push(`Invalid skill id '${skill.id}'. Use lowercase letters, numbers, underscores, or hyphens.`);
  }
  if (!skill.name?.trim()) {
    errors.push('Skill name cannot be empty.');
  }
  if (!skill.ai_instructions?.trim()) {
    errors.push('AI instructions cannot be empty.');
  }

  if (Array.isArray(skill.files_to_copy)) {
    for (const item of skill.files_to_copy) {
      if (SENSITIVE_FILE_RE.test(item.source || '') || SENSITIVE_FILE_RE.test(item.destination || '')) {
        errors.push(`Blocked sensitive file path: ${item.source || item.destination}`);
      }
      if ((item.destination || '').includes('..') || (item.source || '').includes('..')) {
        errors.push(`Blocked unsafe traversal path: ${item.destination || item.source}`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function buildGitHubHeaders(token, accept = 'application/vnd.github+json') {
  const headers = {
    'User-Agent': 'ContextRig-CLI',
    Accept: accept
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} (${url})`);
  }
  return res.json();
}

async function fetchTextSafe(url, headers) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function summarizeSkillInstructions(parsedMd, skillId, entryScript) {
  if (parsedMd.body) {
    // Keep concise usable instructions (first ~1200 chars if huge SKILL.md)
    const clean = parsedMd.body.replace(/\s+\n/g, '\n').trim();
    if (clean.length <= 1200) return clean;
    return `${clean.slice(0, 1180).trimEnd()}\n\n(Read full guide at rigtools/${skillId}/SKILL.md before executing.)`;
  }
  if (entryScript) {
    const runner = entryScript.endsWith('.py') ? 'python' : 'node';
    return `Run '${runner} rigtools/${skillId}/${entryScript}' when this skill is requested.`;
  }
  return '';
}

function isRelevantSkillFile(relPath) {
  const lower = relPath.toLowerCase();
  if (SENSITIVE_FILE_RE.test(lower)) return false;
  if (lower.startsWith('.git/') || lower.includes('/node_modules/') || lower.startsWith('node_modules/')) return false;
  if (SKIP_TOP_FILES.has(path.posix.basename(lower)) && !lower.includes('/')) return false;

  if (lower === 'skill.md') return true;
  if (/^(scripts|references|assets|templates|api|prompts)\//.test(lower)) return true;
  if (/\.(py|js|mjs|cjs|sh|md|json|html|css|hbs)$/i.test(lower) && !lower.includes('test')) return true;
  return false;
}

/**
 * Inspects a GitHub or skills.sh repository and returns an import preview without writing to disk.
 * @param {string} sourceUrl
 * @param {{ token?: string|null, installMode?: 'auto'|'copy'|'npx' }} [options]
 */
export async function inspectRemoteSkillRepo(sourceUrl, { token = null, installMode = 'auto' } = {}) {
  const parsed = parseSkillSourceUrl(sourceUrl);
  const authToken = token || (await getGitHubToken(ROOT_DIR));

  if (parsed.kind === 'skills_sh' || installMode === 'npx') {
    const skillId = slugifySkillId(parsed.skillsShSkill || parsed.repo);
    const skill = {
      id: skillId,
      name: parsed.skillsShSkill || parsed.repo,
      description: `Installed via skills.sh (${parsed.owner}/${parsed.repo})`,
      install_command: `npx -y skills@latest add ${parsed.repoUrl} --skill ${parsed.skillsShSkill || parsed.repo} --agent {{agent_flag}} --copy --yes`,
      ai_instructions: `Use the ${parsed.skillsShSkill || parsed.repo} skill installed under .claude/skills/ or .agents/skills/ when relevant.`,
      dependencies: { npm: [], pip: [] },
      gitignore: ['.agents/'],
      files_to_copy: []
    };
    return {
      category: 'npx_package',
      parsed,
      skill,
      warnings: [],
      mcpDetected: false,
      needsManualInstructions: false,
      validation: validateSkillCandidate(skill)
    };
  }

  const apiHeaders = buildGitHubHeaders(authToken);
  const repoMeta = await fetchJson(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, apiHeaders);
  const branch = parsed.branch || repoMeta.default_branch || 'main';

  const treeData = await fetchJson(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`,
    apiHeaders
  );
  const allBlobs = Array.isArray(treeData.tree)
    ? treeData.tree.filter((n) => n.type === 'blob' && n.path)
    : [];

  const prefix = parsed.subpath ? `${parsed.subpath.replace(/\/+$/, '')}/` : '';
  const scopedFiles = allBlobs
    .filter((n) => !prefix || n.path.startsWith(prefix))
    .map((n) => ({
      repoPath: n.path,
      relPath: prefix ? n.path.slice(prefix.length) : n.path,
      size: n.size || 0
    }))
    .filter((f) => f.size <= 5 * 1024 * 1024);

  const warnings = [];
  const mcpDetected = scopedFiles.some((f) => f.relPath.toLowerCase() === '.mcp.json');
  if (mcpDetected) {
    warnings.push('Repo includes .mcp.json (MCP server configuration is not auto-registered by ContextRig).');
  }

  const skillMdEntry = scopedFiles.find((f) => f.relPath.toLowerCase() === 'skill.md');
  const pkgJsonEntry = scopedFiles.find((f) => f.relPath.toLowerCase() === 'package.json');
  const reqTxtEntry = scopedFiles.find((f) => f.relPath.toLowerCase() === 'requirements.txt');

  const rawBase = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}`;
  const rawHeaders = buildGitHubHeaders(authToken, 'text/plain');

  const [skillMdRaw, pkgJsonRaw, reqTxtRaw] = await Promise.all([
    skillMdEntry ? fetchTextSafe(`${rawBase}/${skillMdEntry.repoPath}`, rawHeaders) : Promise.resolve(null),
    pkgJsonEntry ? fetchTextSafe(`${rawBase}/${pkgJsonEntry.repoPath}`, rawHeaders) : Promise.resolve(null),
    reqTxtEntry ? fetchTextSafe(`${rawBase}/${reqTxtEntry.repoPath}`, rawHeaders) : Promise.resolve(null)
  ]);

  const fallbackName = parsed.subpath ? path.posix.basename(parsed.subpath) : parsed.repo;
  const parsedMd = skillMdRaw
    ? parseSkillMarkdown(skillMdRaw, fallbackName)
    : { id: slugifySkillId(fallbackName), name: fallbackName, description: repoMeta.description || '', body: '' };

  const skillId = parsedMd.id;
  const dependencies = extractDependencies({ packageJsonRaw: pkgJsonRaw, requirementsTxtRaw: reqTxtRaw });

  const relevantFiles = scopedFiles
    .filter((f) => isRelevantSkillFile(f.relPath))
    .slice(0, MAX_IMPORT_FILES);

  if (scopedFiles.filter((f) => isRelevantSkillFile(f.relPath)).length > MAX_IMPORT_FILES) {
    warnings.push(`Capped imported files at ${MAX_IMPORT_FILES} files.`);
  }

  const hasNonDocFiles = relevantFiles.some((f) => f.relPath.toLowerCase() !== 'skill.md');
  const category = hasNonDocFiles ? 'script_or_asset_pack' : 'prompt_only';

  const filesToCopy = hasNonDocFiles
    ? relevantFiles.map((f) => ({
        source: `scripts/${skillId}/${f.relPath}`,
        destination: `rigtools/${skillId}/${f.relPath}`,
        remote_url: `${rawBase}/${f.repoPath}`
      }))
    : [];

  const entryScript = relevantFiles.find((f) => /\.(py|js|mjs)$/i.test(f.relPath))?.relPath || null;
  let instructions = summarizeSkillInstructions(parsedMd, skillId, entryScript);
  if (hasNonDocFiles && instructions) {
    instructions = normalizeSkillPaths(
      instructions,
      skillId,
      relevantFiles.map((f) => f.relPath)
    );
  }

  const skill = {
    id: skillId,
    name: parsedMd.name || fallbackName,
    description: parsedMd.description || repoMeta.description || `Imported from ${parsed.owner}/${parsed.repo}`,
    source_repo: parsed.repoUrl,
    ai_instructions: instructions,
    claude_command: {
      name: skillId.replace(/_/g, '-'),
      content: `# /${skillId.replace(/_/g, '-')}\n\n${instructions || `Run ${parsedMd.name || skillId}.`}`
    },
    dependencies,
    ...(hasNonDocFiles ? { gitignore: ['rigtools/'] } : {}),
    files_to_copy: filesToCopy
  };

  return {
    category,
    parsed: { ...parsed, branch },
    skill,
    warnings,
    mcpDetected,
    needsManualInstructions: !skill.ai_instructions.trim(),
    validation: validateSkillCandidate(skill)
  };
}

/**
 * Downloads staged files, saves skills_library/<id>.json, and runs dry-run verification.
 * @param {Object} preview
 * @param {{ token?: string|null }} [options]
 */
export async function commitImportedSkill(preview, { token = null } = {}) {
  const { skill } = preview;
  const validation = validateSkillCandidate(skill);
  if (!validation.valid) {
    throw new Error(`Skill validation failed: ${validation.errors.join(' ')}`);
  }

  const authToken = token || (await getGitHubToken(ROOT_DIR));
  const rawHeaders = buildGitHubHeaders(authToken, 'text/plain');
  const downloaded = [];
  const failed = [];

  if (Array.isArray(skill.files_to_copy) && skill.files_to_copy.length > 0) {
    await runConcurrent(skill.files_to_copy, FETCH_CONCURRENCY, async (item) => {
      if (SENSITIVE_FILE_RE.test(item.source) || SENSITIVE_FILE_RE.test(item.destination)) {
        failed.push(`${item.source} (blocked sensitive path)`);
        return;
      }
      const content = await fetchTextSafe(item.remote_url, rawHeaders);
      if (content === null) {
        failed.push(`${item.source} (download failed)`);
        return;
      }
      const outPath = path.resolve(ROOT_DIR, item.source);
      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, content, 'utf8');
      downloaded.push(item.source);
    });
  }

  if (failed.length > 0 && downloaded.length === 0 && skill.files_to_copy.length > 0) {
    throw new Error(`All file downloads failed (${failed[0]})`);
  }

  const manifestPath = await saveSkill(skill);

  // Dry-run verification: confirm block renders cleanly & copied local sources exist
  const renderedBlock = formatSkillBlock(skill);
  const missingLocalSources = skill.files_to_copy
    .filter((f) => !existsSync(path.resolve(ROOT_DIR, f.source)))
    .map((f) => f.source);

  return {
    manifestPath,
    downloadedCount: downloaded.length,
    failedFiles: failed,
    dryRunOk: renderedBlock.includes(`### ${skill.name}`) && missingLocalSources.length === 0,
    missingLocalSources
  };
}
