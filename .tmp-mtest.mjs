import puppeteer from 'puppeteer-core';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const b = await puppeteer.launch({ executablePath: EDGE, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text()); });

await p.goto('http://localhost:7474/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 900));

const snapshot = () => p.evaluate(() => ({
  cols: document.querySelectorAll('#matrixTable thead th').length,
  headers: [...document.querySelectorAll('#matrixTable thead th')].map((t) => t.textContent.trim()),
  allPill: document.querySelector('[data-matrix-cat="all"]')?.getAttribute('aria-pressed'),
  selVal: document.getElementById('matrixCatFilter')?.value,
  opts: [...document.querySelectorAll('#matrixCatFilter option')].map((o) => o.value)
}));

console.log('BEFORE', JSON.stringify(await snapshot()));

await p.select('#matrixCatFilter', 'workflow');
await new Promise((r) => setTimeout(r, 800));
console.log('AFTER ', JSON.stringify(await snapshot()));

await b.close();
