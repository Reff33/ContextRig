#!/usr/bin/env node

/**
 * Playwright Browser Runner & UI Inspector
 * Usage: node tools/playwright_runner.js <URL> [screenshot_path]
 */
import fs from 'node:fs';
import path from 'node:path';

const [,, url, screenshotArg] = process.argv;

if (!url) {
  console.log('Usage: node tools/playwright_runner.js <URL> [screenshot_path]');
  console.log('Example: node tools/playwright_runner.js http://localhost:3000 .playwright/home.png');
  process.exit(1);
}

async function run() {
  let chromium;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch {
    console.error('Playwright not installed in current project.');
    console.error('Run: npm install -D playwright && npx playwright install chromium');
    process.exit(1);
  }

  const outDir = path.resolve(process.cwd(), '.playwright');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const screenshotPath = screenshotArg
    ? path.resolve(process.cwd(), screenshotArg)
    : path.join(outDir, 'screenshot.png');

  console.log(`› Launching headless browser to inspect: ${url}...`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    try {
      // Fallback 1: Use system Microsoft Edge (pre-installed on Windows)
      browser = await chromium.launch({ headless: true, channel: 'msedge' });
    } catch {
      try {
        // Fallback 2: Use system Google Chrome if installed
        browser = await chromium.launch({ headless: true, channel: 'chrome' });
      } catch (err) {
        console.error('Could not launch any browser (bundled Chromium, Edge, or Chrome).');
        console.error('Run: npx playwright install chromium');
        process.exit(1);
      }
    }
  }
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const status = response ? response.status() : 'Unknown';
    const title = await page.title();

    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`\n✔ Page Loaded: ${title} (HTTP ${status})`);
    console.log(`✔ Screenshot captured: ${screenshotPath}`);

    if (pageErrors.length > 0) {
      console.log('\n× Browser Runtime Errors:');
      pageErrors.forEach((e) => console.log(`  • ${e}`));
    } else {
      console.log('\n✔ No unhandled browser runtime errors.');
    }

    if (consoleLogs.length > 0) {
      console.log('\n› Console Warnings & Errors:');
      consoleLogs.forEach((log) => console.log(`  ${log}`));
    }

    await browser.close();
  } catch (err) {
    console.error(`\n× Failed to load ${url}: ${err.message}`);
    await browser.close();
    process.exit(1);
  }
}

run();
