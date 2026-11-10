/* =========================================================
   KinetRig Enterprise AI Motion Telemetry & SFX Intelligence Director
   Inspects GSAP animation keyframes, velocity curves (v = dx/dt),
   DOM semantics, and material physics to generate production manifests.
   Zero runtime dependencies (pure Node.js stdlib).

   Usage:
     node scripts/parse-timeline.mjs assets/kinet-opener.html [output-manifest.json]
   ========================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const inputArg = process.argv[2] || 'assets/kinet-opener.html';
const outputArg = process.argv[3] || null;

console.log(`\n======================================================`);
console.log(`🧠 KinetRig Enterprise AI Motion-to-Audio Director`);
console.log(`   Source: ${inputArg}`);
console.log(`======================================================\n`);

const htmlContent = readFileSync(resolve(inputArg), 'utf8');

// 1. Duration Extraction
let duration = 10;
const durMatch = htmlContent.match(/\b(?:DURATION|DUR)\s*=\s*([0-9.]+)/i);
if (durMatch) duration = parseFloat(durMatch[1]);

// 2. Deterministic Hash Function for Organic Jitter (Seed -> [0, 1])
function hashDeterministic(seed) {
  const s = Math.sin(Number(seed) * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

// 3. Semantic Scene Classifier & Text Intelligence
const SEMANTIC_DICTIONARIES = {
  tech_cli: {
    weight: 0,
    keywords: ['cli', 'terminal', 'git', 'npx', 'install', 'build', 'deploy', 'token', 'latency', 'agent', 'compiler', 'engine', 'code', 'fast', 'benchmark', 'node', 'rust', 'binary'],
    ambientBed: { type: 'sub_drone', baseFreq: 60, filterCutoff: 320, gain: 0.045 }
  },
  metrics_data: {
    weight: 0,
    keywords: ['revenue', 'growth', 'mrr', 'churn', 'kpi', 'metrics', 'conversion', 'profit', 'scale', 'percent', '%', 'facilities', 'stats', 'numbers', 'q3', 'arr', 'chart'],
    ambientBed: { type: 'sub_drone', baseFreq: 58, filterCutoff: 280, gain: 0.045 }
  },
  editorial_paper: {
    weight: 0,
    keywords: ['archive', 'spec', 'catalog', 'edition', 'issue', 'curated', 'paper', 'print', 'stamp', 'verified', 'dossier', 'document', 'origin', 'minimalist', 'swiss', 'flagship'],
    ambientBed: { type: 'warm_room_tone', baseFreq: 52, filterCutoff: 240, gain: 0.05 }
  },
  showcase_glass: {
    weight: 0,
    keywords: ['product', 'hardware', 'specular', 'unibody', 'finish', 'chassis', 'luxury', 'sleek', 'craft', 'display', 'titanium', 'glass', 'chassis', 'aerospace', 'precision'],
    ambientBed: { type: 'crystal_drift', baseFreq: 110, filterCutoff: 460, gain: 0.04 }
  },
  chat_dialogue: {
    weight: 0,
    keywords: ['chat', 'dialogue', 'message', 'prompt', 'assistant', 'user', 'conversation', 'thread', 'reply', 'send', 'stream', 'voice', 'bubble', 'ai'],
    ambientBed: { type: 'warm_room_tone', baseFreq: 65, filterCutoff: 220, gain: 0.04 }
  },
  cinema_space: {
    weight: 0,
    keywords: ['cinema', 'dark', 'cosmos', 'orbit', 'future', 'explore', 'dimension', 'particle', 'depth', 'universe', 'stellar', 'motion', 'light', 'voyage'],
    ambientBed: { type: 'deep_sub_rumble', baseFreq: 42, filterCutoff: 180, gain: 0.06 }
  },
  vintage_engraving: {
    weight: 0,
    keywords: ['engraving', 'vintage', 'blueprint', 'patent', 'manuscript', 'etching', 'classic', 'retro', 'press', 'mechanical', 'gear', 'sketch'],
    ambientBed: { type: 'warm_room_tone', baseFreq: 48, filterCutoff: 210, gain: 0.05 }
  },
  stage_theatre: {
    weight: 0,
    keywords: ['stage', 'proscenium', 'theatre', 'curtain', 'scene', 'spotlight', 'character', 'performance', 'act', 'show'],
    ambientBed: { type: 'warm_room_tone', baseFreq: 55, filterCutoff: 250, gain: 0.05 }
  },
  collage_pop: {
    weight: 0,
    keywords: ['pop', 'collage', 'vibrant', 'sticker', 'snap', 'bold', 'color', 'fresh', 'energy', 'fun', 'paste'],
    ambientBed: { type: 'warm_room_tone', baseFreq: 60, filterCutoff: 280, gain: 0.045 }
  },
  flow_action: {
    weight: 0,
    keywords: ['flow', 'continuous', 'streamline', 'dynamic', 'seamless', 'glide', 'kinetic', 'speed', 'rush', 'transition'],
    ambientBed: { type: 'deep_sub_rumble', baseFreq: 50, filterCutoff: 260, gain: 0.05 }
  }
};

// Extract DOM text from relevant tags
const textSnippets = [];
const textTagRegex = /<(?:h[1-6]|p|span|code|div)(?:\s+[^>]*)?>([\s\S]*?)<\/(?:h[1-6]|p|span|code|div)>/gi;
let tMatch;
while ((tMatch = textTagRegex.exec(htmlContent)) !== null) {
  const rawText = tMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (rawText && rawText.length > 2 && rawText.length < 150) {
    textSnippets.push(rawText.toLowerCase());
  }
}

const joinedText = textSnippets.join(' ');
const matchedKeywords = [];

for (const [archetype, data] of Object.entries(SEMANTIC_DICTIONARIES)) {
  for (const kw of data.keywords) {
    const kwRegex = new RegExp(`\\b${kw.replace(/[%]/g, '\\%')}\\b`, 'i');
    if (kwRegex.test(joinedText) || kwRegex.test(inputArg)) {
      data.weight += 1;
      matchedKeywords.push(kw);
    }
  }
}

// Find winning semantic archetype
let detectedArchetype = 'editorial_paper';
let maxWeight = -1;
for (const [archetype, data] of Object.entries(SEMANTIC_DICTIONARIES)) {
  if (data.weight > maxWeight) {
    maxWeight = data.weight;
    detectedArchetype = archetype;
  }
}

// Fallback detection from file name if DOM text is sparse
if (maxWeight === 0) {
  if (inputArg.includes('dialogue')) detectedArchetype = 'chat_dialogue';
  else if (inputArg.includes('metrics')) detectedArchetype = 'metrics_data';
  else if (inputArg.includes('showcase')) detectedArchetype = 'showcase_glass';
  else if (inputArg.includes('opener')) detectedArchetype = 'cinema_space';
  else if (inputArg.includes('engraving')) detectedArchetype = 'vintage_engraving';
  else if (inputArg.includes('stage')) detectedArchetype = 'stage_theatre';
  else if (inputArg.includes('collage')) detectedArchetype = 'collage_pop';
  else if (inputArg.includes('flow')) detectedArchetype = 'flow_action';
  else detectedArchetype = 'editorial_paper';
}

const activeBed = SEMANTIC_DICTIONARIES[detectedArchetype].ambientBed;

// 4. Material-to-Sound Ontology Mapping
function getMaterialClass(targetStr) {
  const t = (targetStr || '').toLowerCase();
  if (t.includes('doc') || t.includes('paper') || t.includes('stamp') || t.includes('cut') || t.includes('page')) return 'paper';
  if (t.includes('code') || t.includes('cli') || t.includes('term') || t.includes('cursor') || t.includes('prompt')) return 'tactile_switch';
  if (t.includes('bar') || t.includes('stat') || t.includes('chart') || t.includes('metric') || t.includes('counter')) return 'crystal_step';
  if (t.includes('bubble') || t.includes('msg') || t.includes('chat') || t.includes('avatar')) return 'soft_bubble';
  if (t.includes('glass') || t.includes('spec') || t.includes('card') || t.includes('modal') || t.includes('glow')) return 'acrylic_glass';
  if (t.includes('ring') || t.includes('cam') || t.includes('world') || t.includes('orbit')) return 'air_displacement';
  return 'physical_neutral';
}

const rawEvents = [];

// 5. Parse Explicit audioManifest if Present
const manifestMatch = htmlContent.match(/const\s+audioManifest\s*=\s*(\{[\s\S]*?\n\};)/);
if (manifestMatch) {
  try {
    const rawObj = manifestMatch[1].replace(/;\s*$/, '');
    const fn = new Function('DURATION', 'DUR', `"use strict"; return (${rawObj});`);
    const manifestObj = fn(duration, duration);
    if (manifestObj && Array.isArray(manifestObj.events)) {
      for (const ev of manifestObj.events) {
        rawEvents.push({
          ...ev,
          layer: ev.layer || (ev.type === 'impact' || ev.type === 'exit_sweep' ? 3 : 2),
          material: ev.material || getMaterialClass(ev.target || ev.type),
          source: 'audio_manifest'
        });
      }
    }
  } catch (e) {}
}

// 6. Dynamic Motion Telemetry Extraction: Timeline Function Calls
const callRegex = /tl\.call\(\s*(?:\(\)\s*=>\s*)?([a-zA-Z0-9_]+)(?:\(([^)]*)\))?,\s*null,\s*([0-9.]+)\s*\)/g;
let match;
while ((match = callRegex.exec(htmlContent)) !== null) {
  const fnName = match[1] || '';
  const fnArg = match[2] || '';
  const timestamp = parseFloat(match[3]);

  // Skip if already declared in audioManifest
  if (rawEvents.some(e => Math.abs(e.time - timestamp) < 0.1)) continue;

  let type = 'impact';
  let layer = 3;
  let pitch = null;
  let material = 'physical_neutral';

  if (fnName.includes('CardPop') || fnName.includes('Blip') || fnName.includes('CardTouch') || fnName.includes('Bubble')) {
    type = 'card_pop';
    layer = 2;
    material = 'paper';
    if (fnArg) pitch = parseInt(fnArg, 10);
  } else if (fnName.includes('PaperSlide') || fnName.includes('CardSlide')) {
    type = 'paper_slide';
    layer = 2;
    material = 'paper';
  } else if (fnName.includes('SoftTap') || fnName.includes('PaperTouch')) {
    type = 'soft_tap';
    layer = 2;
    material = 'paper';
  } else if (fnName.includes('StampSlam') || fnName.includes('Impact')) {
    type = 'impact';
    layer = 3;
    material = 'paper';
  } else if (fnName.includes('SubReveal') || fnName.includes('Glide')) {
    type = 'sub_reveal';
    layer = 2;
    material = 'crystal_step';
  } else if (fnName.includes('Whoosh')) {
    type = 'whoosh';
    layer = 2;
    material = 'air_displacement';
  } else if (fnName.includes('Exit') || fnName.includes('Sweep')) {
    type = 'exit_sweep';
    layer = 3;
    material = 'air_displacement';
  } else if (fnName.includes('Terminal') || fnName.includes('Chirp') || fnName.includes('Tick')) {
    type = 'terminal_chirp';
    layer = 2;
    material = 'tactile_switch';
  }

  const sfxIdMatch = htmlContent.slice(Math.max(0, match.index - 50), match.index + 120).match(/triggerSfx\(\s*['"]([^'"]+)['"]/);
  let sfx_id = sfxIdMatch ? sfxIdMatch[1] : null;

  rawEvents.push({
    time: timestamp,
    type,
    layer,
    gain: layer === 3 ? 0.8 : 0.45,
    pitch: pitch || undefined,
    sfx_id: sfx_id || undefined,
    material,
    source: 'tl.call'
  });
}

// 7. Motion Telemetry & Velocity Curve Extraction: GSAP Tweens (v = dx/dt)
const tweenRegex = /tl\.(?:fromTo|to)\(\s*['"]([^'"]+)['"]\s*,\s*(\{[\s\S]*?\})\s*,\s*(?:\{[\s\S]*?\}\s*,\s*)?([0-9.]+)\s*\)/g;
while ((match = tweenRegex.exec(htmlContent)) !== null) {
  const target = match[1];
  const props = match[2];
  const startTime = parseFloat(match[3]);

  const durMatchProp = props.match(/\bduration\s*:\s*([0-9.]+)/);
  const tweenDur = durMatchProp ? parseFloat(durMatchProp[1]) : 0.8;

  const xMatch = props.match(/\bx\s*:\s*(-?[0-9.]+)/);
  const yMatch = props.match(/\by\s*:\s*(-?[0-9.]+)/);
  const scaleMatch = props.match(/\bscale\s*:\s*([0-9.]+)/);
  const camZMatch = props.match(/\bcamZ\s*:\s*([0-9.]+)/);

  const dx = xMatch ? Math.abs(parseFloat(xMatch[1])) : 0;
  const dy = yMatch ? Math.abs(parseFloat(yMatch[1])) : 0;
  const spatialDist = Math.sqrt(dx * dx + dy * dy);
  const dScale = scaleMatch ? Math.abs(parseFloat(scaleMatch[1]) - 1.0) : 0;
  const dCamZ = camZMatch ? Math.abs(parseFloat(camZMatch[1])) : 0;

  const isDecel = props.includes('out') || props.includes('power') || props.includes('expo');
  const easeMultiplier = isDecel ? 2.0 : 1.4;
  const peakVelocity = Math.round((spatialDist / tweenDur) * easeMultiplier);

  // Check if an event already exists near this time window
  if (rawEvents.some(e => Math.abs(e.time - startTime) < 0.15)) continue;

  const material = getMaterialClass(target);

  if (dCamZ > 3 || spatialDist > 800 || props.includes('camZ')) {
    const jCutTime = Math.max(0, startTime - 0.04);
    rawEvents.push({
      time: parseFloat(jCutTime.toFixed(3)),
      type: 'whoosh',
      layer: 2,
      gain: Math.min(0.7, 0.4 + (peakVelocity / 4000) * 0.3),
      target,
      velocity: peakVelocity,
      material: 'air_displacement',
      jCutLead: 0.04,
      source: 'motion_velocity'
    });
  } else if (dScale > 0.4 || (dy > 40 && (target.includes('h1') || target.includes('title') || target.includes('doc')))) {
    const contactTime = parseFloat((startTime + tweenDur * 0.75).toFixed(3));
    rawEvents.push({
      time: contactTime,
      type: 'impact',
      layer: 3,
      gain: Math.min(0.9, 0.65 + dScale * 0.25),
      target,
      velocity: peakVelocity,
      material,
      source: 'physical_contact'
    });
  }
}

// 7b. Kinematic Locomotion & Footstep Cadence Detector
const walkRegex = /\bwalk\s*\(\s*([^,]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*(-?[0-9.]+)\s*\)/g;
let walkMatch;
while ((walkMatch = walkRegex.exec(htmlContent)) !== null) {
  const actor = walkMatch[1].trim();
  const startTime = parseFloat(walkMatch[2]);
  const dur = parseFloat(walkMatch[3]);
  const dx = parseFloat(walkMatch[4]);
  const stepPeriod = 0.39;
  const numSteps = Math.max(1, Math.round(dur / stepPeriod));

  // Determine surface from context keywords (grass, lawn, wood, floor, stone)
  let surface = 'grass';
  if (/wood|lantai|panggung|stage|parquet/i.test(htmlContent)) surface = 'wood';
  if (/concrete|stone|batu|aspal/i.test(htmlContent)) surface = 'stone';

  for (let s = 0; s < numSteps; s++) {
    const stepTime = parseFloat((startTime + s * stepPeriod).toFixed(3));
    if (rawEvents.some(e => Math.abs(e.time - stepTime) < 0.08 && e.type.startsWith('footstep'))) {
      continue;
    }
    const isRight = s % 2 === 0;
    const pFactor = isRight ? 1.03 : 0.97;
    const gain = isRight ? 0.35 : 0.32;

    rawEvents.push({
      time: stepTime,
      type: `footstep_${surface}`,
      layer: 2,
      gain,
      sfx_id: 'foley-card-touch',
      material: surface === 'grass' ? 'organic_grass' : surface === 'wood' ? 'acoustic_wood' : 'hard_stone',
      actor,
      stepIndex: s,
      surface,
      source: 'kinematic_locomotion'
    });
  }
}

// 8. Deduplicate and Sort
const sortedEvents = rawEvents.sort((a, b) => a.time - b.time);
const finalEvents = [];

for (let i = 0; i < sortedEvents.length; i++) {
  const ev = sortedEvents[i];
  if (finalEvents.some(prev => Math.abs(prev.time - ev.time) < 0.06 && prev.type === ev.type)) {
    continue;
  }

  // 9. Micro-Pitch & Timing Jitter Engine (Anti-Machine Gun Effect)
  const seed = ev.time * 1000 + i * 37;
  const hashPitch = hashDeterministic(seed);
  const hashTiming = hashDeterministic(seed + 19);
  const hashCutoff = hashDeterministic(seed + 41);

  const pitchFactor = parseFloat((1 + (hashPitch - 0.5) * 0.08).toFixed(4)); // ±4%
  const timingJitter = parseFloat(((hashTiming - 0.5) * 0.016).toFixed(4)); // ±8ms
  const cutoffJitter = Math.round((hashCutoff - 0.5) * 160); // ±80Hz

  finalEvents.push({
    ...ev,
    time: Math.max(0, parseFloat((ev.time + timingJitter).toFixed(3))),
    jitter: {
      pitchFactor,
      timingJitter,
      cutoffJitter
    }
  });
}

const manifest = {
  duration,
  sceneArchetype: detectedArchetype,
  semanticKeywords: matchedKeywords.slice(0, 8),
  ambientBed: activeBed,
  totalEvents: finalEvents.length,
  events: finalEvents
};

console.log(`✔ Scene Intelligence Classification:`);
console.log(`   Archetype : [${detectedArchetype.toUpperCase()}] (Confidence Weight: ${maxWeight})`);
console.log(`   Keywords  : ${matchedKeywords.slice(0, 6).join(', ') || 'N/A'}`);
console.log(`   Sound Bed : Layer 1 [${activeBed.type}] @ ${activeBed.baseFreq}Hz (-${Math.round(20 * Math.log10(1 / activeBed.gain))}dB)\n`);

console.log(`✔ Extracted ${finalEvents.length} motion-synchronized audio cues across ${duration}s:`);
finalEvents.forEach(ev => {
  const pitchInfo = ev.pitch ? ` (${ev.pitch}Hz)` : '';
  const targetInfo = ev.target ? ` [${ev.target}]` : '';
  const jitterInfo = `[Jitter: ×${ev.jitter.pitchFactor}, ${ev.jitter.timingJitter > 0 ? '+' : ''}${Math.round(ev.jitter.timingJitter * 1000)}ms]`;
  console.log(`   [${ev.time.toFixed(2)}s] L${ev.layer} ${ev.type.toUpperCase()}${pitchInfo} -> Gain: ${ev.gain.toFixed(2)} (${ev.material}) ${jitterInfo}${targetInfo}`);
});

if (outputArg) {
  writeFileSync(resolve(outputArg), JSON.stringify(manifest, null, 2));
  console.log(`\n💾 Saved Audio Manifest to: ${outputArg}`);
}
