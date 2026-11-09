import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { setupTargetProject, sanitizePath } from './src/core/projectSetup.js';
import { injectTemplate } from './src/core/fileInjector.js';
import { loadAvailableSkills, saveSkill } from './src/core/skillManager.js';
import { aggregateDependencies, getAgentCliFlag } from './src/core/dependencyInstaller.js';
import { aggregateGitIgnorePatterns, isPatternIgnored } from './src/core/gitIgnoreManager.js';
import { detectInstalledSkills, syncSkills, removeSkillsFromProject } from './src/core/skillUpdater.js';
import { loadCache, saveCache, calculateHash } from './src/core/syncEngine.js';

async function runTests() {
  console.log('🧪 Starting ContextRig CLI automated integration tests...');

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

  // Test 7e: KinetRig skill definition and gitignore verification
  const kinetRigSkill = skills.find((s) => s.id === 'kinet_rig');
  assert(kinetRigSkill, 'kinet_rig skill should exist');
  assert.strictEqual(kinetRigSkill.claude_command?.name, 'kinet-rig');
  assert(aggregateGitIgnorePatterns([kinetRigSkill]).includes('motion-out/'), 'motion-out/ must be recommended for .gitignore');
  assert(kinetRigSkill.files_to_copy?.length >= 5, 'kinet_rig should include official starters and references');
  const starterOpenerItem = kinetRigSkill.files_to_copy.find((f) => f.destination.includes('starter-opener.html'));
  assert(starterOpenerItem && starterOpenerItem.remote_url, 'starter-opener.html must have remote_url for sync');
  assert(kinetRigSkill.ai_instructions.includes('144 FPS'), 'kinet_rig must document 144 FPS');
  console.log('✔ Test 7e: KinetRig skill definition, official starters & gitignore verified.');

  // Test 7f: Git Workflow skill definition and slash command verification
  const gitWorkflowSkill = skills.find((s) => s.id === 'git_workflow');
  assert(gitWorkflowSkill, 'git_workflow skill should exist');
  assert.strictEqual(gitWorkflowSkill.claude_command?.name, 'commit', 'git_workflow slash command should be /commit');
  assert(gitWorkflowSkill.ai_instructions.includes('Change Detection & Metrics'), 'git_workflow should include metrics instructions');
  console.log('✔ Test 7f: Git Workflow skill definition and /commit slash command verified.');

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
  await saveCache(fullPath, {
    last_checked: Date.now(),
    etags: { 'web_scraper:tools/scraper.py': '"test-etag-123"' }
  });
  const loadedCache = await loadCache(fullPath);
  assert(loadedCache.etags['web_scraper:tools/scraper.py'] === '"test-etag-123"', 'Cache ETag must persist');

  const { checkSingleSkillUpdate } = await import('./src/core/syncEngine.js');
  const checkedGit = await checkSingleSkillUpdate(fullPath, gitWorkflowSkill, loadedCache, null);
  assert.strictEqual(checkedGit.id, 'git_workflow');
  console.log('✔ Test 10b: SyncEngine ETag caching, hash calculations & multi-skill checks verified.');

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
  console.log('✔ Test 10c: Skill removal and artifact cleanup verified.');

  // Cleanup test directory
  await fs.rm(fullPath, { recursive: true, force: true });
  console.log('✔ Test 11: Cleanup test project directory completed.');

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

