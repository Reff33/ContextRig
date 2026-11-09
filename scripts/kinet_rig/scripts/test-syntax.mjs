import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('assets').filter(f => f.endsWith('.html'));

let hadError = false;
for (const file of files) {
  const content = fs.readFileSync(path.join('assets', file), 'utf8');
  const scripts = [...content.matchAll(/<script(?:\s+type="([^"]*)")?[^>]*>([\s\S]*?)<\/script>/gi)];

  for (let i = 0; i < scripts.length; i++) {
    const type = scripts[i][1] || 'text/javascript';
    const code = scripts[i][2];
    if (type === 'importmap' || !code.trim()) continue;

    // Check basic JS syntax
    try {
      new Function(code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, ''));
    } catch (e) {
      console.error(`Syntax error in ${file} (script ${i}):`, e.message);
      hadError = true;
    }
  }
}

if (!hadError) {
  console.log('All templates syntax-checked clean!');
}
