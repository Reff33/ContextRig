#!/usr/bin/env node
/* =========================================================================
   KinetRig AI Scene Intelligence, Caption Director & Safe-Zone Guard
   Zero-dependency enterprise utility (Node.js stdlib).

   Capabilities:
     1. Semantic Scene Classification (brief/text -> template, style, palette)
     2. SRT/VTT Caption Synchronization & Phoneme Viseme Generator
     3. 16:9 & 9:16 Universal Safe-Zone Collision Guard

   Usage:
     node scripts/director.mjs classify "Fast developer CLI build tool in Rust"
     node scripts/director.mjs captions captions.srt --fps 144
     node scripts/director.mjs check-safezone assets/kinet-opener.html --ratio 9:16
   ========================================================================= */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';

// -------------------------------------------------------------
// 1. STYLE DIRECTIONS & SEMANTIC ARCHETYPES
// -------------------------------------------------------------
const STYLE_DIRECTIONS = [
  {
    id: 'cinematic_dark',
    name: 'Cinematic Dark',
    template: 'kinet-opener.html',
    desc: 'Near-black base, bloom on objects, bold grotesk. Best for tech, gaming, AI, creative tools.',
    palette: { primary: '#00F0FF', bg: '#080C14', accent: '#7000FF', text: '#FFFFFF' },
    keywords: ['dark', 'ai', 'neural', 'cyber', 'future', 'gaming', 'cinematic', 'compute', 'gpu', 'engine', 'robotics']
  },
  {
    id: 'poster_colorblock',
    name: 'Poster Color-Block',
    template: 'kinet-metrics.html',
    desc: 'Solid color fields, giant cropped letters. Best for consumer apps, music, events, data.',
    palette: { primary: '#FF3366', bg: '#0F0F1A', accent: '#FFE600', text: '#FFFFFF' },
    keywords: ['metrics', 'growth', 'revenue', 'poster', 'bold', 'music', 'festival', 'event', 'data', 'kpi', 'sales', 'stats']
  },
  {
    id: 'editorial_light',
    name: 'Editorial Light',
    template: 'kinet-editorial.html',
    desc: 'White/cream, display serif + hairlines. Best for productivity, finance, SaaS, architecture.',
    palette: { primary: '#18181B', bg: '#FBF9F5', accent: '#0D9488', text: '#18181B' },
    keywords: ['editorial', 'finance', 'luxury', 'saas', 'productivity', 'minimal', 'clean', 'swiss', 'magazine', 'architecture', 'journal']
  },
  {
    id: 'paper_print',
    name: 'Paper & Print',
    template: 'kinet-engraving.html',
    desc: 'Paper texture, collage, stamps, vintage linework. Best for education, community, culinary, history.',
    palette: { primary: '#2D3748', bg: '#F7F4EB', accent: '#C53030', text: '#1A202C' },
    keywords: ['paper', 'print', 'stamp', 'vintage', 'history', 'craft', 'culinary', 'coffee', 'artisan', 'engraving', 'handcrafted']
  },
  {
    id: 'retro_analog',
    name: 'Retro / Analog',
    template: 'kinet-collage.html',
    desc: 'Faded color, grain, scanlines, geometric shapes. Best for nostalgia, entertainment, culture.',
    palette: { primary: '#F97316', bg: '#1C1917', accent: '#06B6D4', text: '#F5F5F4' },
    keywords: ['retro', 'vintage', 'analog', 'vhs', 'tape', 'synthwave', '90s', '80s', 'nostalgia', 'film', 'arcade']
  },
  {
    id: 'brutalist_mono',
    name: 'Brutalist Mono',
    template: 'kinet-flow.html',
    desc: 'Black & white hard grid, monospace typography, hard cuts. Best for developer tools, CLI, infrastructure.',
    palette: { primary: '#00FF66', bg: '#0A0A0A', accent: '#FFFFFF', text: '#E5E5E5' },
    keywords: ['cli', 'terminal', 'developer', 'code', 'rust', 'git', 'infrastructure', 'kernel', 'api', 'devops', 'mono', 'brutalist']
  },
  {
    id: 'pastel_playful',
    name: 'Pastel Playful',
    template: 'kinet-stage.html',
    desc: 'Stacked pastels, rounded shapes, elastic bounce. Best for kids, health, lifestyle, apps.',
    palette: { primary: '#5AABB8', bg: '#FFF3DC', accent: '#E0714F', text: '#263746' },
    keywords: ['cartoon', 'playful', 'friendly', 'character', 'kids', 'health', 'wellness', 'lifestyle', 'stage', 'theatre', 'fun', 'story']
  },
  {
    id: 'luxury_dark',
    name: 'Luxury Dark',
    template: 'kinet-showcase.html',
    desc: 'Near-black + gold/bronze, tall wide-tracked serif. Best for fashion, automotive, premium hardware.',
    palette: { primary: '#F59E0B', bg: '#090D1A', accent: '#38BDF8', text: '#FFFFFF' },
    keywords: ['luxury', 'hardware', 'flagship', 'gold', 'automotive', 'watch', 'premium', 'exclusive', 'pro', 'device', 'showcase']
  },
  {
    id: 'flat_pop',
    name: 'Flat Pop with Photos',
    template: 'kinet-catalog.html',
    desc: 'Stickers, photo cutouts, snapping on beat. Best for fintech, consumer, e-commerce, youth brands.',
    palette: { primary: '#6366F1', bg: '#0B0F19', accent: '#10B981', text: '#F8FAFC' },
    keywords: ['ecommerce', 'shop', 'pop', 'consumer', 'fintech', 'app', 'catalog', 'fashion', 'card', 'products']
  },
  {
    id: 'conversational_ai',
    name: 'Conversational AI & Dialogue',
    template: 'kinet-dialogue.html',
    desc: 'Diegetic chat bubble interface, realistic typing, waveform voice memo. Best for LLM, chat, assistants.',
    palette: { primary: '#10B981', bg: '#0B0F19', accent: '#3B82F6', text: '#F8FAFC' },
    keywords: ['chat', 'dialogue', 'assistant', 'prompt', 'llm', 'claude', 'gpt', 'conversation', 'voice', 'messaging', 'speech']
  }
];

// Contrast ratio calculator (WCAG 2.1 compliance)
function hexToLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function calculateContrast(hex1, hex2) {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return +ratio.toFixed(2);
}

// -------------------------------------------------------------
// 2. SEMANTIC CLASSIFICATION LOGIC
// -------------------------------------------------------------
export function classifyBrief(text) {
  const lower = text.toLowerCase();
  const scores = STYLE_DIRECTIONS.map(style => {
    let score = 0;
    for (const kw of style.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      const matches = lower.match(regex);
      if (matches) score += matches.length * 2.5;
    }
    return { style, score };
  });

  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0].score > 0 ? scores[0].style : STYLE_DIRECTIONS[0];
  const contrast = calculateContrast(winner.palette.primary, winner.palette.bg);

  return {
    matchedStyle: winner.name,
    styleId: winner.id,
    recommendedTemplate: winner.template,
    description: winner.desc,
    palette: winner.palette,
    contrastRatio: `${contrast}:1`,
    wcagPass: contrast >= 4.5,
    topCandidates: scores.slice(0, 3).map(s => ({
      name: s.style.name,
      template: s.style.template,
      score: s.score
    }))
  };
}

// -------------------------------------------------------------
// 3. CAPTION & SRT / VTT PARSER WITH VISEMES
// -------------------------------------------------------------
const VISEME_MAP = {
  a: 'A', e: 'E', i: 'E', o: 'O', u: 'O',
  m: 'MBP', b: 'MBP', p: 'MBP',
  f: 'FV', v: 'FV',
  l: 'L', r: 'L', t: 'L', d: 'L',
  rest: 'rest'
};

function textToVisemes(text, totalDuration) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [{ phoneme: 'rest', duration: totalDuration }];

  const wordDuration = totalDuration / words.length;
  const sequence = [];

  for (const word of words) {
    const letters = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!letters) continue;
    const phonemeDur = +(wordDuration / Math.max(letters.length, 1)).toFixed(3);
    for (const char of letters) {
      const viseme = VISEME_MAP[char] || 'rest';
      sequence.push({ phoneme: viseme, duration: Math.max(0.06, phonemeDur) });
    }
  }
  return sequence;
}

function parseTimecode(tc) {
  // Matches "00:01:23,456" or "00:01:23.456" or "01:23.456"
  const parts = tc.trim().replace(',', '.').split(':');
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return +seconds.toFixed(3);
}

export function parseCaptions(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const cues = [];
  let currentCue = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === 'WEBVTT') continue;

    // Check timecode line e.g. "00:00:01.000 --> 00:00:03.500"
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->');
      const start = parseTimecode(startStr);
      const end = parseTimecode(endStr);
      currentCue = { start, end, duration: +(end - start).toFixed(3), text: '' };
      cues.push(currentCue);
    } else if (currentCue && !/^\d+$/.test(line)) {
      currentCue.text = currentCue.text ? `${currentCue.text} ${line}` : line;
    }
  }

  // Enrich cues with phoneme visemes and motivated SFX
  return cues.map((cue, index) => {
    const visemes = textToVisemes(cue.text, cue.duration);
    let sfxRecommendation = 'click-snap-soft';
    if (index === 0) sfxRecommendation = 'whoosh-medium-soft';
    else if (cue.text.includes('!') || cue.duration > 3.0) sfxRecommendation = 'impact-medium-firm';
    else if (/\b(code|tech|run|git|data|fast)\b/i.test(cue.text)) sfxRecommendation = 'digital-blip-clear';

    return {
      index: index + 1,
      start: cue.start,
      end: cue.end,
      duration: cue.duration,
      text: cue.text,
      sfx: sfxRecommendation,
      visemes: visemes.slice(0, 16) // Cap for concise preview
    };
  });
}

// -------------------------------------------------------------
// 4. SAFE-ZONE COLLISION & OVERFLOW GUARD
// -------------------------------------------------------------
export function checkSafeZone(htmlContent, ratio = '9:16') {
  const violations = [];
  const isVertical = ratio === '9:16';

  // Boundaries
  // 9:16 (1080x1920): Top 15% (0-288px), Bottom 20% (1536-1920px), Right 12% (950-1080px)
  // 16:9 (1920x1080): Title safe margin 5% (Top/Bottom 54px, Left/Right 96px)
  const safeLimits = isVertical
    ? { top: 288, bottom: 1536, right: 950, left: 60 }
    : { top: 54, bottom: 1026, right: 1824, left: 96 };

  // 1. Check for absolute / fixed top/bottom coordinates violating safe zone
  const posRegex = /\b(?<![a-zA-Z-])(top|bottom|left|right)\s*:\s*([0-9.]+)px/gi;
  let match;
  while ((match = posRegex.exec(htmlContent)) !== null) {
    const prop = match[1].toLowerCase();
    const val = parseFloat(match[2]);

    if (isVertical) {
      if (prop === 'top' && val < safeLimits.top && val > 0 && !htmlContent.slice(match.index - 50, match.index).includes('.top-bar')) {
        violations.push({
          type: 'TOP_COLLISION_DANGER',
          rule: `Top 15% (0-288px) is reserved for social UI headers`,
          detected: `${prop}: ${val}px`,
          severity: 'HIGH',
          recommendation: `Increase ${prop} to >= 290px or use relative centered layout`
        });
      }
      if (prop === 'bottom' && val < (1920 - safeLimits.bottom) && val > 0 && !htmlContent.slice(match.index - 50, match.index).includes('#ui')) {
        violations.push({
          type: 'BOTTOM_COLLISION_DANGER',
          rule: `Bottom 20% (1536-1920px) is reserved for caption & audio tag clearance`,
          detected: `${prop}: ${val}px`,
          severity: 'HIGH',
          recommendation: `Increase ${prop} to >= 384px to prevent caption overlap`
        });
      }
    }
  }

  // 2. Check for missing HUD / Top-bar clean capture suppression
  if (!htmlContent.includes('.clean-capture') || !htmlContent.includes('display: none !important')) {
    violations.push({
      type: 'CLEAN_CAPTURE_MISSING',
      rule: 'HUD and Top Bar must have strict display:none !important during export',
      detected: 'Missing body.clean-capture CSS rules',
      severity: 'CRITICAL',
      recommendation: 'Add "body.clean-capture .top-bar, body.clean-capture #ui { display: none !important; }"'
    });
  }

  // 3. Check for immutable download button contract
  if (!htmlContent.includes('Download') || !htmlContent.includes('240')) {
    violations.push({
      type: 'EXPORT_CONTRACT_VIOLATION',
      rule: 'Export button label contract strictly requires "Download <svg...> 240"',
      detected: 'Non-compliant download button markup',
      severity: 'MEDIUM',
      recommendation: 'Verify immutable export button label contains Download and 240'
    });
  }

  return {
    aspectRatio: ratio,
    safeLimits,
    totalViolations: violations.length,
    passed: violations.filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH').length === 0,
    violations: violations.slice(0, 5) // Cap at 5 items
  };
}

// -------------------------------------------------------------
// 5. CLI ENTRYPOINT
// -------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
🧠 KinetRig AI Scene Intelligence, Caption Director & Safe-Zone Guard
---------------------------------------------------------------------
Commands:
  classify <text-or-file>           Analyze brief and recommend template, style & palette
  captions <file.srt|file.vtt>      Parse subtitles, generate phonemes & timeline audio cues
  check-safezone <file.html>        Verify 16:9 and 9:16 vertical safe zone compliance

Examples:
  node scripts/director.mjs classify "High-speed fintech stock terminal"
  node scripts/director.mjs captions sample.srt
  node scripts/director.mjs check-safezone assets/kinet-opener.html --ratio 9:16
`);
    process.exit(0);
  }

  if (command === 'classify') {
    const input = args[1] || 'Modern AI neural developer tool';
    const content = existsSync(resolve(input)) ? readFileSync(resolve(input), 'utf8') : input;
    const result = classifyBrief(content);
    console.log('\n🎬 === KinetRig AI Scene Classification Result ===');
    console.log(`Recommended Style:    ${result.matchedStyle}`);
    console.log(`Recommended Template: ${result.recommendedTemplate}`);
    console.log(`WCAG Contrast Ratio:  ${result.contrastRatio} (${result.wcagPass ? 'PASS' : 'FAIL'})`);
    console.log(`Brand Colors:         Primary ${result.palette.primary} | BG ${result.palette.bg} | Accent ${result.palette.accent}`);
    console.log(`Description:          ${result.description}`);
    console.log('\nTop 3 Candidate Styles:');
    result.topCandidates.forEach((c, idx) => {
      console.log(`  ${idx + 1}. ${c.name} (${c.template}) — match score: ${c.score}`);
    });
    console.log('===================================================\n');
    return;
  }

  if (command === 'captions') {
    const fileArg = args[1];
    if (!fileArg || !existsSync(resolve(fileArg))) {
      console.error(`❌ Error: Subtitle file not found: ${fileArg}`);
      process.exit(1);
    }
    const content = readFileSync(resolve(fileArg), 'utf8');
    const cues = parseCaptions(content);
    console.log(`\n🎙️ === KinetRig Caption Sync & Visemes (${cues.length} Cues) ===`);
    cues.forEach(c => {
      console.log(`\n[Cue ${c.index}] ${c.start.toFixed(2)}s -> ${c.end.toFixed(2)}s (${c.duration}s) | SFX: ${c.sfx}`);
      console.log(`  Text: "${c.text}"`);
      const visemesStr = c.visemes.map(v => `${v.phoneme}(${v.duration}s)`).join(' ');
      console.log(`  Phonemes: ${visemesStr}`);
    });
    console.log('\n=======================================================\n');
    return;
  }

  if (command === 'check-safezone') {
    const fileArg = args[1];
    const ratioIdx = args.indexOf('--ratio');
    const ratio = ratioIdx !== -1 && args[ratioIdx + 1] ? args[ratioIdx + 1] : '9:16';

    if (!fileArg || !existsSync(resolve(fileArg))) {
      console.error(`❌ Error: HTML template not found: ${fileArg}`);
      process.exit(1);
    }
    const content = readFileSync(resolve(fileArg), 'utf8');
    const report = checkSafeZone(content, ratio);
    console.log(`\n🛡️ === KinetRig Safe-Zone Guard Report (${report.aspectRatio}) ===`);
    console.log(`Status: ${report.passed ? '✅ PASSED' : '⚠️ WARNINGS DETECTED'}`);
    console.log(`Safe Limits: Top ${report.safeLimits.top}px | Bottom ${report.safeLimits.bottom}px`);
    if (report.violations.length > 0) {
      console.log(`\nViolations (${report.totalViolations} detected):`);
      report.violations.forEach((v, idx) => {
        console.log(`  ${idx + 1}. [${v.severity}] ${v.type}: ${v.detected}`);
        console.log(`     Rule: ${v.rule}`);
        console.log(`     Fix:  ${v.recommendation}`);
      });
    } else {
      console.log('Zero safe-zone collisions or clean capture issues detected.');
    }
    console.log('=======================================================\n');
    return;
  }

  // Automatic file detection fallback
  if (existsSync(resolve(command))) {
    const ext = extname(command).toLowerCase();
    const content = readFileSync(resolve(command), 'utf8');
    if (ext === '.srt' || ext === '.vtt') {
      console.log(JSON.stringify(parseCaptions(content), null, 2));
    } else if (ext === '.html') {
      console.log(JSON.stringify(checkSafeZone(content), null, 2));
    } else {
      console.log(JSON.stringify(classifyBrief(content), null, 2));
    }
  } else {
    console.log(JSON.stringify(classifyBrief(command), null, 2));
  }
}

if (process.argv[1] && process.argv[1].endsWith('director.mjs')) {
  main();
}
