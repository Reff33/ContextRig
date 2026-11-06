import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { setupTargetProject } from './src/core/projectSetup.js';
import { injectTemplate } from './src/core/fileInjector.js';
import { loadAvailableSkills, saveSkill } from './src/core/skillManager.js';
import { aggregateDependencies } from './src/core/dependencyInstaller.js';
import { aggregateGitIgnorePatterns } from './src/core/gitIgnoreManager.js';

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
  assert(claudeContent.includes('python tools/scraper.py <url>'), 'CLAUDE.md should contain skill instructions');
  console.log('✔ Test 4: Claude template injection verified.');

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

  // Test 6: Verify copied asset
  const copiedToolPath = path.join(fullPath, 'tools', 'scraper.py');
  const toolStats = await fs.stat(copiedToolPath);
  assert(toolStats.isFile(), 'tools/scraper.py should have been copied into target project');
  console.log('✔ Test 6: Skill asset copy verified.');

  // Test 7: Gitignore pattern aggregation (Graphify)
  const graphifySkill = skills.find((s) => s.id === 'graphify');
  assert(graphifySkill, 'graphify skill should exist');
  const ignorePatterns = aggregateGitIgnorePatterns([graphifySkill]);
  assert(ignorePatterns.includes('graphify-out/'), 'graphify-out/ must be recommended for .gitignore');
  console.log('✔ Test 7: GitIgnore pattern aggregation verified.');

  // Cleanup test directory
  await fs.rm(fullPath, { recursive: true, force: true });
  console.log('✔ Test 8: Cleanup test project directory completed.');

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

