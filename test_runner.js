import assert from 'node:assert';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setupTargetProject, sanitizePath } from './src/core/projectSetup.js';
import { injectTemplate } from './src/core/fileInjector.js';
import { loadAvailableSkills, saveSkill } from './src/core/skillManager.js';
import { aggregateDependencies, getAgentCliFlag } from './src/core/dependencyInstaller.js';
import { aggregateGitIgnorePatterns, isPatternIgnored } from './src/core/gitIgnoreManager.js';
import { detectInstalledSkills, syncSkills, removeSkillsFromProject } from './src/core/skillUpdater.js';
import { loadCache, saveCache, calculateHash, syncMasterSkillLibrary } from './src/core/syncEngine.js';

async function runTests() {
  const isolatedRegistryPath = path.join(os.tmpdir(), `contextrig-test-registry-${Date.now()}.json`);
  const isolatedSettingsPath = path.join(os.tmpdir(), `contextrig-test-settings-${Date.now()}.json`);
  process.env.CONTEXTRIG_REGISTRY_PATH = isolatedRegistryPath;
  process.env.CONTEXTRIG_SETTINGS_PATH = isolatedSettingsPath;
  console.log('🧪 Starting ContextRig CLI automated integration tests...');

  try {

  // Test 1: Load available skills
  const skills = await loadAvailableSkills();
  assert(skills.length >= 1, 'Should find at least 1 skill');
  const webScraper = skills.find((s) => s.id === 'web_scraper');
  assert(webScraper, 'web_scraper skill should exist');
  assert.strictEqual(webScraper.name, 'Web Scraper');
  console.log('✔ Test 1: Skills loaded successfully.');

  // Test 2: Dependency aggregation
  const deps = aggregateDependencies([webScraper]);
  assert(deps.npm.includes('axios') && deps.npm.includes('cheerio'), 'Should include npm dependencies');
  assert(deps.pip.includes('requests') && deps.pip.includes('beautifulsoup4'), 'Should include pip dependencies');
  console.log('✔ Test 2: Dependency aggregation validated.');

  // Test 2b: Dynamic AI Agent CLI flag resolution
  assert.strictEqual(getAgentCliFlag({ value: 'claude' }), 'claude-code');
  assert.strictEqual(getAgentCliFlag({ value: 'cursor' }), 'cursor');
  assert.strictEqual(getAgentCliFlag({ value: 'copilot' }), 'github-copilot');
  assert.strictEqual(getAgentCliFlag({ value: 'opencode' }), 'opencode');
  assert.strictEqual(getAgentCliFlag({ value: 'chatgpt' }), 'chatgpt');
  const interpolated = 'npx add --agent {{agent_flag}}'.replace(/\{\{\s*agent(?:_flag)?\s*\}\}/g, getAgentCliFlag({ value: 'cursor' }));
  assert.strictEqual(interpolated, 'npx add --agent cursor');
  console.log('✔ Test 2b: Dynamic AI Agent CLI flag mapping verified.');

  // Test 3: Project setup
  const testProjectDir = './temp_test_project';
  const { fullPath, projectName } = await setupTargetProject(testProjectDir);
  assert.strictEqual(projectName, 'temp_test_project');
  console.log('✔ Test 3: Target project directory verified.');

  // Test 4: Inject Claude template
  const claudeOut = await injectTemplate({
    targetDir: fullPath,
    templateFileName: 'claude.md.hbs',
    outputFileName: 'CLAUDE.md',
    projectName,
    agentName: 'Claude (CLAUDE.md)',
    skillsInstructions: [webScraper]
  });
  const claudeContent = await fs.readFile(claudeOut, 'utf8');
  assert(claudeContent.includes('Web Scraper'), 'CLAUDE.md should contain skill name');
  assert(claudeContent.includes('temp_test_project'), 'CLAUDE.md should contain project name');
  assert(claudeContent.toLowerCase().includes('python rigtools/scraper.py'), 'CLAUDE.md should contain skill instructions');

  // Verify Claude slash command generation (.claude/commands/scrape.md)
  const scrapeCmdPath = path.join(fullPath, '.claude', 'commands', 'scrape.md');
  const scrapeCmdStat = await fs.stat(scrapeCmdPath);
  assert(scrapeCmdStat.isFile(), '.claude/commands/scrape.md should be generated for Claude profile');
  const scrapeCmdContent = await fs.readFile(scrapeCmdPath, 'utf8');
  assert(scrapeCmdContent.includes('# /scrape <url>'), 'Command file must define # /scrape <url>');
  console.log('✔ Test 4: Claude template and slash command injection verified.');

  // Test 4b: Smart Merge preserves custom rules and prevents duplicate skills
  const customRulesFile = path.join(fullPath, 'CUSTOM_RULES.md');
  await fs.writeFile(customRulesFile, '# My Custom App Rules\n- Custom security rule\n- Do not delete\n', 'utf8');
  await injectTemplate({
    targetDir: fullPath,
    templateFileName: 'claude.md.hbs',
    outputFileName: 'CUSTOM_RULES.md',
    projectName,
    agentName: 'Claude (CUSTOM_RULES.md)',
    skillsInstructions: [webScraper],
    mergeMode: 'merge'
  });
  let mergedContent = await fs.readFile(customRulesFile, 'utf8');
  assert(mergedContent.includes('My Custom App Rules'), 'Custom rules header must be preserved');
  assert(mergedContent.includes('Custom security rule'), 'User custom security rule must be preserved');
  assert(mergedContent.includes('Web Scraper'), 'Web Scraper must be injected');

  // Second merge with same skill: verify NO DUPLICATION
  await injectTemplate({
    targetDir: fullPath,
    templateFileName: 'claude.md.hbs',
    outputFileName: 'CUSTOM_RULES.md',
    projectName,
    agentName: 'Claude (CUSTOM_RULES.md)',
    skillsInstructions: [webScraper],
    mergeMode: 'merge'
  });
  mergedContent = await fs.readFile(customRulesFile, 'utf8');
  const scraperMatches = (mergedContent.match(/### Web Scraper/g) || []).length;
  assert.strictEqual(scraperMatches, 1, 'Web Scraper should not be duplicated in smart merge');
  console.log('✔ Test 4b: Smart Merge preserves custom rules and prevents duplicate skills verified.');

  // Test 5: Inject Cursor template
  const cursorOut = await injectTemplate({
    targetDir: fullPath,
    templateFileName: 'cursorrules.hbs',
    outputFileName: '.cursorrules',
    projectName,
    agentName: 'Cursor (.cursorrules)',
    skillsInstructions: [webScraper]
  });
  const cursorContent = await fs.readFile(cursorOut, 'utf8');
  assert(cursorContent.includes('Cursor Rules - temp_test_project'), 'Cursor rules should contain project name');
  assert(cursorContent.includes('Web Scraper'), 'Cursor rules should contain skill name');
  console.log('✔ Test 5: Cursor template injection verified.');

  // Test 5b: Inject Copilot nested template (.github/copilot-instructions.md)
  const copilotOut = await injectTemplate({
    targetDir: fullPath,
    templateFileName: 'copilot.md.hbs',
    outputFileName: '.github/copilot-instructions.md',
    projectName,
    agentName: 'GitHub Copilot (.github/copilot-instructions.md)',
    skillsInstructions: [webScraper]
  });
  const copilotContent = await fs.readFile(copilotOut, 'utf8');
  assert(copilotContent.includes('GitHub Copilot Instructions - temp_test_project'), 'Copilot file should contain project name');
  console.log('✔ Test 5b: Nested Copilot template injection verified.');

  // Test 5c: Inject OpenCode template (AGENTS.md)
  const opencodeOut = await injectTemplate({
    targetDir: fullPath,
    templateFileName: 'opencode.md.hbs',
    outputFileName: 'AGENTS.md',
    projectName,
    agentName: 'OpenCode (AGENTS.md)',
    skillsInstructions: [webScraper]
  });
  const opencodeContent = await fs.readFile(opencodeOut, 'utf8');
  assert(opencodeContent.includes('OpenCode Agents & Instructions - temp_test_project'), 'AGENTS.md should contain project name');
  console.log('✔ Test 5c: OpenCode (AGENTS.md) template injection verified.');

  // Test 5d: Inject ChatGPT template (CHATGPT.md)
  const chatgptOut = await injectTemplate({
    targetDir: fullPath,
    templateFileName: 'chatgpt.md.hbs',
    outputFileName: 'CHATGPT.md',
    projectName,
    agentName: 'ChatGPT (CHATGPT.md)',
    skillsInstructions: [webScraper]
  });
  const chatgptContent = await fs.readFile(chatgptOut, 'utf8');
  assert(chatgptContent.includes('ChatGPT Instructions - temp_test_project'), 'CHATGPT.md should contain project name');
  console.log('✔ Test 5d: ChatGPT (CHATGPT.md) template injection verified.');

  // Test 6: Verify copied asset
  const copiedToolPath = path.join(fullPath, 'rigtools', 'scraper.py');
  const toolStats = await fs.stat(copiedToolPath);
  assert(toolStats.isFile(), 'rigtools/scraper.py should have been copied into target project');
  console.log('✔ Test 6: Skill asset copy verified.');

  // Test 7: Gitignore pattern aggregation (Graphify & rigtools/)
  const graphifySkill = skills.find((s) => s.id === 'graphify');
  assert(graphifySkill, 'graphify skill should exist');
  const ignorePatterns = aggregateGitIgnorePatterns([graphifySkill]);
  assert(ignorePatterns.includes('graphify-out/'), 'graphify-out/ must be recommended for .gitignore');
  assert(ignorePatterns.includes('rigtools/'), 'rigtools/ must be recommended for .gitignore when skill copies tool files');
  console.log('✔ Test 7: GitIgnore pattern aggregation (including rigtools/) verified.');

  // Test 7b: Archify skill verification (no rigtools/ copied)
  const archifySkill = skills.find((s) => s.id === 'archify');
  assert(archifySkill, 'archify skill should exist');
  assert(aggregateGitIgnorePatterns([archifySkill]).includes('.archify/'), '.archify/ must be recommended for .gitignore');
  console.log('✔ Test 7b: Archify skill definition and gitignore verified.');

  // Test 7c: Playwright skill verification
  const playwrightSkill = skills.find((s) => s.id === 'playwright');
  assert(playwrightSkill, 'playwright skill should exist');
  assert(playwrightSkill.claude_command?.name === 'playwright', 'playwright slash command must be /playwright');
  assert(aggregateGitIgnorePatterns([playwrightSkill]).includes('.playwright/'), '.playwright/ must be recommended for .gitignore');
  assert(aggregateGitIgnorePatterns([playwrightSkill]).includes('rigtools/'), 'rigtools/ must be recommended for playwright');
  console.log('✔ Test 7c: Playwright skill definition and slash command verified.');

  // Test 7d: isPatternIgnored duplicate check verification
  assert.strictEqual(isPatternIgnored(['rigtools'], 'rigtools/'), true, 'rigtools should match rigtools/');
  assert.strictEqual(isPatternIgnored(['/rigtools/'], 'rigtools/'), true, '/rigtools/ should match rigtools/');
  assert.strictEqual(isPatternIgnored(['rigtools/'], 'rigtools/'), true, 'rigtools/ should match rigtools/');
  assert.strictEqual(isPatternIgnored(['other_tools'], 'rigtools/'), false, 'other_tools should not match rigtools/');
  console.log('✔ Test 7d: isPatternIgnored slash normalization verified.');

  // Test 7h: CutRig MCP built-in skill bundle & .mcp.json manifest verification
  const cutRigSkill = skills.find((s) => s.id === 'cut_rig');
  assert(cutRigSkill, 'cut_rig skill should exist');
  assert.strictEqual(cutRigSkill.claude_command?.name, 'cut');
  assert(cutRigSkill.mcp_servers?.cutrig?.command === 'npx', 'cut_rig must declare mcp_servers.cutrig');
  assert(cutRigSkill.files_to_copy?.length === 6, 'cut_rig should bundle SKILL.md + 5 editor references');
  for (const item of cutRigSkill.files_to_copy) {
    const srcExists = await fs.stat(path.resolve(item.source)).then(() => true).catch(() => false);
    assert(srcExists, `Missing local cut_rig file: ${item.source}`);
  }
  console.log('✔ Test 7h: CutRig MCP manifest, /cut command & bundled playbooks verified.');

  // Test 7e: KinetRig skill definition, complete asset manifest & gitignore verification
  const kinetRigSkill = skills.find((s) => s.id === 'kinet_rig');
  assert(kinetRigSkill, 'kinet_rig skill should exist');
  assert.strictEqual(kinetRigSkill.claude_command?.name, 'kinet-rig');
  assert(kinetRigSkill.manifest_remote_url, 'kinet_rig must define manifest_remote_url');
  assert(aggregateGitIgnorePatterns([kinetRigSkill]).includes('motion-out/'), 'motion-out/ must be recommended for .gitignore');
  assert(kinetRigSkill.files_to_copy?.length >= 60, 'kinet_rig should include all starters, scripts, and references');
  assert(kinetRigSkill.files_to_copy.some((f) => f.destination.endsWith('/SKILL.md')), 'kinet_rig must include SKILL.md');
  assert(kinetRigSkill.files_to_copy.some((f) => f.destination.endsWith('/scripts/server.mjs')), 'kinet_rig must include server.mjs');
  assert(kinetRigSkill.files_to_copy.some((f) => f.destination.endsWith('/assets/kinet-typographic-montage.html')), 'kinet_rig must include templates 11-21');
  const openerItem = kinetRigSkill.files_to_copy.find((f) => f.destination.includes('kinet-opener.html'));
  assert(openerItem && openerItem.remote_url && openerItem.remote_url.includes('/testing/'), 'kinet-opener.html must have testing remote_url');
  for (const item of kinetRigSkill.files_to_copy) {
    await fs.access(path.resolve(process.cwd(), item.source));
  }
  assert(kinetRigSkill.ai_instructions.includes('144 FPS'), 'kinet_rig must document 144 FPS');
  console.log('✔ Test 7e: KinetRig skill definition, full manifest & local sources verified.');

  // Test 7f: Git Workflow skill definition and slash command verification
  const gitWorkflowSkill = skills.find((s) => s.id === 'git_workflow');
  assert(gitWorkflowSkill, 'git_workflow skill should exist');
  assert.strictEqual(gitWorkflowSkill.claude_command?.name, 'commit', 'git_workflow slash command should be /commit');
  assert(gitWorkflowSkill.ai_instructions.includes('Change Detection & Metrics'), 'git_workflow should include metrics instructions');
  console.log('✔ Test 7f: Git Workflow skill definition and /commit slash command verified.');

  // Test 7g: UI/UX Pro Max built-in trimmed bundle verification
  const uiUxSkill = skills.find((s) => s.id === 'ui_ux_pro_max');
  assert(uiUxSkill, 'ui_ux_pro_max skill should exist');
  assert.strictEqual(uiUxSkill.claude_command?.name, 'ui-ux', 'ui_ux_pro_max slash command should be /ui-ux');
  assert(uiUxSkill.files_to_copy?.length >= 40, 'ui_ux_pro_max should include SKILL.md, references, scripts, and CSVs');
  assert(uiUxSkill.files_to_copy.some((f) => f.destination.endsWith('/scripts/search.py')), 'ui_ux_pro_max must include search.py');
  for (const item of uiUxSkill.files_to_copy) {
    await fs.access(path.resolve(process.cwd(), item.source));
  }
  console.log('✔ Test 7g: UI/UX Pro Max built-in bundle & local sources verified.');

  // Test 8: Skill update detection & sync
  // Simulate an outdated version of scraper.py in the target project
  await fs.writeFile(copiedToolPath, '# outdated version\nprint("old")', 'utf8');
  let detected = await detectInstalledSkills(fullPath, skills);
  let scraperCheck = detected.find((s) => s.id === 'web_scraper');
  assert(scraperCheck && scraperCheck.hasUpdate === true, 'Outdated scraper.py should be flagged with hasUpdate=true');
  assert(scraperCheck.outdatedFiles.includes('scraper.py'), 'outdatedFiles should include scraper.py');
  console.log('✔ Test 8: Outdated skill version correctly detected [UPDATE AVAILABLE].');

  // Test 9: Re-sync outdated skills to latest version
  await syncSkills(fullPath, projectName, [scraperCheck], { promptDeps: false });
  detected = await detectInstalledSkills(fullPath, skills);
  scraperCheck = detected.find((s) => s.id === 'web_scraper');
  assert(scraperCheck && scraperCheck.hasUpdate === false, 'After syncSkills, scraper.py should be up-to-date (hasUpdate=false)');
  console.log('✔ Test 9: Skill re-synchronization verified [UP TO DATE].');

  // Test 10: Path sanitization (Explorer "Copy as path" quotes, ~, env vars)
  assert.strictEqual(sanitizePath('  "D:\\laragon\\www\\Myra"  '), 'D:\\laragon\\www\\Myra');
  assert.strictEqual(sanitizePath("'./my-project'"), './my-project');
  assert.strictEqual(sanitizePath('%USERPROFILE%'), process.env.USERPROFILE);
  assert(sanitizePath('~/proj').endsWith('proj'), '~ should expand to home dir');
  assert(!sanitizePath('~/proj').startsWith('~'), '~ should not survive sanitization');
  console.log('✔ Test 10: Path sanitization verified.');

  // Test 10b: SyncEngine cache, ETag handling, and hash verification
  const testHash = calculateHash('print("hello world")');
  assert(typeof testHash === 'string' && testHash.length === 64, 'SHA-256 hash must be 64 characters hex');
  assert.strictEqual(
    calculateHash('line1\r\nline2\r\n'),
    calculateHash('line1\nline2\n'),
    'calculateHash must treat CRLF and LF line endings identically'
  );
  await saveCache(fullPath, {
    last_checked: Date.now(),
    etags: { 'web_scraper:tools/scraper.py': '"test-etag-123"' }
  });
  const loadedCache = await loadCache(fullPath);
  assert(loadedCache.etags['web_scraper:tools/scraper.py'] === '"test-etag-123"', 'Cache ETag must persist');

  const { checkSingleSkillUpdate, applyProjectUpdates } = await import('./src/core/syncEngine.js');
  const checkedGit = await checkSingleSkillUpdate(fullPath, gitWorkflowSkill, loadedCache, null);
  assert.strictEqual(checkedGit.id, 'git_workflow');

  // Verify Fix 1 & Fix 2: staged remote content not overwritten by local copyAssets, custom rules preserved, and missing file bypasses 304 ETag
  const prevFetch = globalThis.fetch;
  let seenIfNoneMatch = null;
  globalThis.fetch = async (_url, opts) => {
    seenIfNoneMatch = opts?.headers?.['If-None-Match'] || null;
    return {
      ok: true,
      status: 200,
      headers: new Map([['etag', '"remote-etag-new"']]),
      text: async () => '# REMOTE VERSION v99\nprint("remote")\n'
    };
  };
  try {
    // Missing local file must NOT send cached ETag
    await fs.rm(copiedToolPath, { force: true });
    const cacheWithEtag = {
      last_checked: Date.now(),
      etags: { 'web_scraper:rigtools/scraper.py': '"stale-etag"' },
      hashes: { 'web_scraper:rigtools/scraper.py': calculateHash('anything') }
    };
    const remoteCheck = await checkSingleSkillUpdate(fullPath, webScraper, cacheWithEtag, null);
    assert.strictEqual(seenIfNoneMatch, null, 'Missing file must bypass If-None-Match ETag');
    assert.strictEqual(remoteCheck.hasUpdate, true, 'Missing file should trigger update');

    // Add custom section to CLAUDE.md and ensure applyProjectUpdates preserves both custom section and remote file content
    const claudeBeforeSync = await fs.readFile(claudeOut, 'utf8');
    await fs.writeFile(claudeOut, claudeBeforeSync + '\n## Custom User Rules\n- Keep me intact\n', 'utf8');
    await applyProjectUpdates(
      {
        fullPath,
        projectName,
        configuredAgents: [{ name: 'Claude (CLAUDE.md)', value: 'claude', templateFile: 'claude.md.hbs', outputFile: 'CLAUDE.md' }],
        installedSkills: [webScraper],
        outdatedSkills: [remoteCheck],
        cache: cacheWithEtag
      },
      { promptDeps: false }
    );
    const syncedTool = await fs.readFile(copiedToolPath, 'utf8');
    assert(syncedTool.includes('REMOTE VERSION v99'), 'applyProjectUpdates must keep remote content instead of overwriting with local scripts/');
    const claudeAfterSync = await fs.readFile(claudeOut, 'utf8');
    assert(claudeAfterSync.includes('Keep me intact'), 'applyProjectUpdates must preserve custom rules via Smart Merge');
  } finally {
    globalThis.fetch = prevFetch;
  }
  console.log('✔ Test 10b: SyncEngine ETag safety, remote content preservation & Smart Merge verified.');

  // Test 10d: Project Registry lifecycle (using isolated CONTEXTRIG_REGISTRY_PATH)
  const { registerProject, loadRegistry, unregisterProject, pruneMissingProjects } = await import('./src/core/projectRegistry.js');
  await fs.rm(isolatedRegistryPath, { force: true });
  await registerProject({ projectPath: fullPath, name: projectName, agents: ['claude'], skills: ['web_scraper'] });
  let reg = await loadRegistry();
  assert.strictEqual(reg.projects.length, 1, 'Project should be saved in registry');
  await registerProject({ projectPath: fullPath + path.sep, name: projectName, agents: ['claude'], skills: ['kinet_rig'] });
  reg = await loadRegistry();
  assert.strictEqual(reg.projects.length, 1, 'Duplicate project path should upsert cleanly');
  assert(reg.projects[0].skills.includes('kinet_rig'), 'Upsert should update skill list');
  await unregisterProject(fullPath);
  reg = await loadRegistry();
  assert.strictEqual(reg.projects.length, 0, 'Project should be removed on unregister');
  await registerProject({ projectPath: path.join(fullPath, 'nonexistent_dir_xyz'), name: 'ghost', agents: [], skills: [] });
  const pruned = await pruneMissingProjects();
  assert.strictEqual(pruned.removed.length, 1, 'Missing project directories should be pruned');
  console.log('✔ Test 10d: Project Registry register/upsert/prune/unregister verified.');

  // Test 10e: inspectMasterSkillLibrary dry-run + syncMasterSkillLibrary HTTP 404 tracking
  const { inspectMasterSkillLibrary } = await import('./src/core/syncEngine.js');
  const prevMasterFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('ok.js')) {
      return { ok: true, status: 200, headers: new Map(), text: async () => '// remote check' };
    }
    return { ok: false, status: 404, statusText: 'Not Found', headers: new Map() };
  };
  try {
    const dryCheck = await inspectMasterSkillLibrary({
      id: 'mock_dry',
      name: 'Mock Dry Skill',
      files_to_copy: [{ source: 'scripts/mock_never_written.js', remote_url: 'https://example.com/ok.js' }]
    });
    assert.strictEqual(dryCheck.hasUpdate, true, 'inspectMasterSkillLibrary should detect update in memory');
    assert.strictEqual(dryCheck.updates.length, 1);
    const writtenOnInspect = await fs.stat(path.resolve('scripts/mock_never_written.js')).then(() => true).catch(() => false);
    assert.strictEqual(writtenOnInspect, false, 'inspectMasterSkillLibrary must NOT write files during check');

    const failRes = await syncMasterSkillLibrary({
      id: 'mock_fail',
      name: 'Mock Fail Skill',
      files_to_copy: [{ source: 'scripts/mock.js', remote_url: 'https://example.com/404.js' }]
    });
    assert.strictEqual(failRes.errorCount, 1, 'Master sync should report errorCount=1 on HTTP 404');
    assert.strictEqual(failRes.updatedCount, 0);
  } finally {
    globalThis.fetch = prevMasterFetch;
  }
  console.log('✔ Test 10e: Master library dry-run check & error counting verified.');

  // Test 10f: Skill Settings override (kinet.config.json + Extra AI Rule) without mutating master manifest
  const { saveSkillSettings, getSkillSettings, resetSkillSettings } = await import('./src/core/skillSettings.js');
  await saveSkillSettings('kinet_rig', {
    values: { host: '0.0.0.0', encoder: 'nvenc' },
    extraRule: 'Always export 144fps'
  });
  await injectTemplate({
    targetDir: fullPath,
    templateFileName: 'claude.md.hbs',
    outputFileName: 'CLAUDE.md',
    projectName,
    agentName: 'Claude (CLAUDE.md)',
    skillsInstructions: [kinetRigSkill],
    mergeMode: 'merge',
    copyAssets: true
  });
  const claudeWithCustom = await fs.readFile(claudeOut, 'utf8');
  assert(claudeWithCustom.includes('Always export 144fps'), 'Custom extraRule must be injected into CLAUDE.md');
  assert(claudeWithCustom.includes('Studio Host IP: 0.0.0.0'), 'Custom host override must appear in CLAUDE.md');
  const kinetCfg = JSON.parse(await fs.readFile(path.join(fullPath, 'rigtools', 'kinet_rig', 'kinet.config.json'), 'utf8'));
  assert.strictEqual(kinetCfg.host, '0.0.0.0', 'kinet.config.json should receive custom host override');
  assert.strictEqual(kinetCfg.encoder, 'nvenc', 'kinet.config.json should receive custom encoder override');
  await resetSkillSettings('kinet_rig');
  const clearedSettings = await getSkillSettings('kinet_rig');
  assert.strictEqual(Object.keys(clearedSettings.values).length, 0);
  assert.strictEqual(clearedSettings.extraRule, '');
  console.log('✔ Test 10f: Skill Settings config override, Extra AI Rule & reset verified.');

  // Test 10g: Smart GitHub Importer + Validator (offline mock)
  const {
    parseSkillSourceUrl,
    parseSkillMarkdown,
    extractDependencies,
    normalizeSkillPaths,
    validateSkillCandidate,
    inspectRemoteSkillRepo
  } = await import('./src/core/skillImporter.js');

  const ghParsed = parseSkillSourceUrl('https://github.com/acme/tools/tree/dev/skills/demo');
  assert.strictEqual(ghParsed.owner, 'acme');
  assert.strictEqual(ghParsed.branch, 'dev');
  assert.strictEqual(ghParsed.subpath, 'skills/demo');
  const shParsed = parseSkillSourceUrl('https://skills.sh/acme/repo/archify');
  assert.strictEqual(shParsed.kind, 'skills_sh');
  assert.strictEqual(shParsed.skillsShSkill, 'archify');

  const mdParsed = parseSkillMarkdown('---\nname: Demo Tool\ndescription: Runs demo\n---\nRun scripts/run.py now.', 'fallback');
  assert.strictEqual(mdParsed.id, 'demo_tool');
  assert.strictEqual(normalizeSkillPaths(mdParsed.body, 'demo_tool', ['scripts/run.py']), 'Run rigtools/demo_tool/scripts/run.py now.');
  const extDeps = extractDependencies({ packageJsonRaw: '{"dependencies":{"zod":"^3.0.0"}}', requirementsTxtRaw: 'httpx>=0.27\n# comment\n' });
  assert.deepStrictEqual(extDeps, { npm: ['zod'], pip: ['httpx'] });
  const badCheck = validateSkillCandidate({
    id: 'bad_skill',
    name: 'Bad',
    ai_instructions: 'ok',
    files_to_copy: [{ source: 'scripts/bad/.env', destination: 'rigtools/bad/.env' }]
  });
  assert.strictEqual(badCheck.valid, false, 'Validator must block .env files');

  const prevImportFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.endsWith('/repos/acme/demo')) {
      return { ok: true, status: 200, json: async () => ({ default_branch: 'main', description: 'Demo repo' }) };
    }
    if (u.includes('/git/trees/main')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          tree: [
            { type: 'blob', path: 'SKILL.md', size: 120 },
            { type: 'blob', path: 'scripts/run.py', size: 80 },
            { type: 'blob', path: 'requirements.txt', size: 20 },
            { type: 'blob', path: '.env', size: 15 },
            { type: 'blob', path: '.mcp.json', size: 40 }
          ]
        })
      };
    }
    if (u.endsWith('/SKILL.md')) {
      return { ok: true, status: 200, text: async () => '---\nname: Demo Tool\ndescription: Runs demo\n---\nExecute scripts/run.py first.' };
    }
    if (u.endsWith('/requirements.txt')) {
      return { ok: true, status: 200, text: async () => 'httpx>=0.27.0\n' };
    }
    return { ok: false, status: 404, statusText: 'Not Found', text: async () => '' };
  };
  try {
    const preview = await inspectRemoteSkillRepo('acme/demo');
    assert.strictEqual(preview.category, 'script_or_asset_pack');
    assert.strictEqual(preview.skill.id, 'demo_tool');
    assert(preview.skill.ai_instructions.includes('rigtools/demo_tool/scripts/run.py'), 'Should normalize relative script paths');
    assert.deepStrictEqual(preview.skill.dependencies.pip, ['httpx']);
    assert(!preview.skill.files_to_copy.some((f) => f.source.includes('.env')), 'Must exclude .env from import');
    assert(preview.mcpDetected === true && preview.warnings.length > 0, 'Should warn on .mcp.json');
    assert.strictEqual(preview.validation.valid, true);

    const shPreview = await inspectRemoteSkillRepo('https://skills.sh/acme/repo/archify');
    assert.strictEqual(shPreview.category, 'npx_package');
    assert(shPreview.skill.install_command.includes('npx -y skills@latest add'));
  } finally {
    globalThis.fetch = prevImportFetch;
  }
  console.log('✔ Test 10g: Smart GitHub & skills.sh importer + validator verified.');

  // Test 10h: .mcp.json safe merge & cleanup on CutRig MCP inject/remove
  const mcpPath = path.join(fullPath, '.mcp.json');
  await fs.writeFile(
    mcpPath,
    JSON.stringify({ mcpServers: { custom_srv: { command: 'node', args: ['keep.js'] } } }, null, 2),
    'utf8'
  );
  await injectTemplate({
    targetDir: fullPath,
    templateFileName: 'claude.md.hbs',
    outputFileName: 'CLAUDE.md',
    projectName,
    agentName: 'Claude (CLAUDE.md)',
    skillsInstructions: [cutRigSkill],
    mergeMode: 'merge',
    copyAssets: true
  });
  const mergedMcp = JSON.parse(await fs.readFile(mcpPath, 'utf8'));
  assert(mergedMcp.mcpServers.custom_srv, 'Existing custom_srv in .mcp.json must be preserved');
  assert(mergedMcp.mcpServers.cutrig, 'cutrig MCP server must be merged into .mcp.json');

  await removeSkillsFromProject(fullPath, projectName, [cutRigSkill], [kinetRigSkill], { deleteArtifacts: true });
  const afterRemoveMcp = JSON.parse(await fs.readFile(mcpPath, 'utf8'));
  assert(afterRemoveMcp.mcpServers.custom_srv, 'custom_srv must remain after removing cut_rig');
  assert(!afterRemoveMcp.mcpServers.cutrig, 'cutrig must be removed from .mcp.json when cut_rig is uninstalled');
  console.log('✔ Test 10h: .mcp.json safe merge & uninstall cleanup verified.');

  // Verify Fix 3: Non-empty sibling subdirectory inside rigtools/ must NOT be recursively deleted on skill removal
  const siblingFile = path.join(fullPath, 'rigtools', 'custom_helper', 'keep.js');
  await fs.mkdir(path.dirname(siblingFile), { recursive: true });
  await fs.writeFile(siblingFile, '// keep', 'utf8');

  // Test 10c: Skill removal and artifact cleanup workflow
  const fakePromoDir = path.join(fullPath, 'promo-video');
  const fakeRigMotionDir = path.join(fullPath, 'rigmotion');
  await fs.mkdir(fakePromoDir, { recursive: true });
  await fs.writeFile(path.join(fakePromoDir, 'index.html'), '<html></html>', 'utf8');
  await fs.mkdir(fakeRigMotionDir, { recursive: true });
  await fs.writeFile(path.join(fakeRigMotionDir, 'index.html'), '<html></html>', 'utf8');

  await removeSkillsFromProject(fullPath, projectName, [scraperCheck, kinetRigSkill], [], { deleteArtifacts: true });
  let scraperFileExists = true;
  try {
    await fs.access(copiedToolPath);
  } catch {
    scraperFileExists = false;
  }
  assert(!scraperFileExists, 'rigtools/scraper.py should be deleted after removal');

  let promoDirExists = true;
  try {
    await fs.access(fakePromoDir);
  } catch {
    promoDirExists = false;
  }
  assert(!promoDirExists, 'promo-video/ artifact should be deleted when deleteArtifacts=true');

  let rigMotionDirExists = true;
  try {
    await fs.access(fakeRigMotionDir);
  } catch {
    rigMotionDirExists = false;
  }
  assert(!rigMotionDirExists, 'rigmotion/ artifact should be deleted when deleteArtifacts=true');

  let scrapeCmdExists = true;
  try {
    await fs.access(scrapeCmdPath);
  } catch {
    scrapeCmdExists = false;
  }
  assert(!scrapeCmdExists, '.claude/commands/scrape.md should be deleted after removal');

  const updatedClaudeContent = await fs.readFile(claudeOut, 'utf8');
  assert(!updatedClaudeContent.includes('Web Scraper'), 'CLAUDE.md should no longer contain removed skill');
  const siblingStillExists = await fs.stat(siblingFile).then(() => true).catch(() => false);
  assert(siblingStillExists, 'Non-empty sibling subfolder inside rigtools/ must not be deleted on skill removal');
  console.log('✔ Test 10c: Skill removal and safe directory cleanup verified.');

  // Cleanup test directory
  await fs.rm(fullPath, { recursive: true, force: true });
  console.log('✔ Test 11: Cleanup test project directory completed.');

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
  } finally {
    await fs.rm(isolatedRegistryPath, { force: true }).catch(() => {});
    await fs.rm(isolatedSettingsPath, { force: true }).catch(() => {});
    delete process.env.CONTEXTRIG_REGISTRY_PATH;
    delete process.env.CONTEXTRIG_SETTINGS_PATH;
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

