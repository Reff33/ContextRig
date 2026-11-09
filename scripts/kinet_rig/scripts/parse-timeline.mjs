/* =========================================================
   KinetRig Timeline Motion Telemetry Extractor
   Inspects GSAP animation keyframes to extract motivated
   motion events without heavy computer vision inference.
   Zero runtime dependencies (pure Node.js stdlib).

   Usage:
     node scripts/parse-timeline.mjs assets/kinet-opener.html [output-manifest.json]
   ========================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const inputArg = process.argv[2] || 'assets/kinet-opener.html';
const outputArg = process.argv[3] || null;

console.log(`\n======================================================`);
console.log(`🔍 KinetRig Motion Telemetry & SFX Director`);
console.log(`   Source: ${inputArg}`);
console.log(`======================================================\n`);

const htmlContent = readFileSync(resolve(inputArg), 'utf8');

let duration = 10;
const durMatch = htmlContent.match(/\b(?:DURATION|DUR)\s*=\s*([0-9.]+)/i);
if (durMatch) duration = parseFloat(durMatch[1]);

const events = [];

// 1. Check for explicit audioManifest in source code
const manifestMatch = htmlContent.match(/const\s+audioManifest\s*=\s*(\{[\s\S]*?\n\};)/);
if (manifestMatch) {
  try {
    const rawObj = manifestMatch[1].replace(/;\s*$/, '');
    const fn = new Function('DURATION', 'DUR', `"use strict"; return (${rawObj});`);
    const manifestObj = fn(duration, duration);
    if (manifestObj && Array.isArray(manifestObj.events)) {
      events.push(...manifestObj.events);
    }
  } catch (e) {
    // Fallback to regex extraction
  }
}

// 2. If no manifest found, parse timeline calls and tweens statically
if (events.length === 0) {
  // Match tl.call(playFunction, null, timestamp) or tl.call(() => playFunction(arg), null, timestamp)
  const callRegex = /tl\.call\(\s*(?:\(\)\s*=>\s*)?([a-zA-Z0-9_]+)(?:\(([^)]*)\))?,\s*null,\s*([0-9.]+)\s*\)/g;
  let match;
  while ((match = callRegex.exec(htmlContent)) !== null) {
    const fnName = match[1] || '';
    const fnArg = match[2] || '';
    const timestamp = parseFloat(match[3]);

    let type = 'impact';
    let pitch = null;

    if (fnName.includes('CardPop') || fnName.includes('Blip') || fnName.includes('CardTouch')) {
      type = 'card_pop';
      if (fnArg) pitch = parseInt(fnArg, 10);
    } else if (fnName.includes('PaperSlide') || fnName.includes('CardSlide')) {
      type = 'paper_slide';
    } else if (fnName.includes('SoftTap') || fnName.includes('PaperTouch')) {
      type = 'soft_tap';
    } else if (fnName.includes('StampSlam')) {
      type = 'impact';
    } else if (fnName.includes('SubReveal') || fnName.includes('Glide')) {
      type = 'sub_reveal';
    } else if (fnName.includes('Whoosh')) {
      type = 'whoosh';
    } else if (fnName.includes('Exit') || fnName.includes('Sweep')) {
      type = 'exit_sweep';
    } else if (fnName.includes('Terminal') || fnName.includes('Chirp')) {
      type = 'terminal_chirp';
    }

    // Extract triggerSfx('sfx-id', fallback, gain) if present
    const sfxIdMatch = htmlContent.slice(Math.max(0, match.index - 50), match.index + 120).match(/triggerSfx\(\s*['"]([^'"]+)['"]/);
    let sfx_id = sfxIdMatch ? sfxIdMatch[1] : null;

    const ev = { time: timestamp, type, gain: 0.6 };
    if (pitch) ev.pitch = pitch;
    if (sfx_id) ev.sfx_id = sfx_id;
    events.push(ev);
  }

  // Match major motion tweens to suggest motivated SFX
  const tweenRegex = /tl\.(?:fromTo|to)\(\s*['"]([^'"]+)['"]\s*,\s*(\{[\s\S]*?\})\s*,\s*(?:\{[\s\S]*?\}\s*,\s*)?([0-9.]+)\s*\)/g;
  while ((match = tweenRegex.exec(htmlContent)) !== null) {
    const target = match[1];
    const props = match[2];
    const timestamp = parseFloat(match[3]);

    if (events.some(e => Math.abs(e.time - timestamp) < 0.1)) continue;

    if (props.includes('scale') || (props.includes('y') && target.includes('h1'))) {
      events.push({ time: timestamp, type: 'impact', gain: 0.8, target });
    } else if (props.includes('camZ')) {
      events.push({ time: timestamp, type: 'whoosh', gain: 0.6, target });
    }
  }
}

// Sort by timestamp
events.sort((a, b) => a.time - b.time);

const result = {
  duration,
  totalEvents: events.length,
  events
};

console.log(`✔ Extracted ${events.length} motion-synchronized audio cues across ${duration}s:\n`);
events.forEach(ev => {
  const pitchInfo = ev.pitch ? ` (${ev.pitch}Hz)` : '';
  const targetInfo = ev.target ? ` [${ev.target}]` : '';
  console.log(`   [${ev.time.toFixed(2)}s] ${ev.type.toUpperCase()}${pitchInfo} -> Gain: ${ev.gain}${targetInfo}`);
});

if (outputArg) {
  writeFileSync(resolve(outputArg), JSON.stringify(result, null, 2));
  console.log(`\n💾 Saved Audio Manifest to: ${outputArg}`);
}
