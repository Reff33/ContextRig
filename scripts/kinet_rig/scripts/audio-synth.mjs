/* =========================================================
   KinetRig Audio Synthesizer & Studio SFX Mixer (Headless Node.js)
   Zero-dependency PCM WAV generator for KinetRig timelines.
   Enterprise AI Audio Intelligence Features:
     1. Universal 3-Layer Acoustic Sandwich (ambient room bed, micro-foley, hero impact)
     2. Studio WAV mixing from wyzowl/sfx-kit (with transient alignment & pitch resampling)
     3. Procedural synthesis fallback with micro-pitch & timing jitter
     4. Soft-knee peak limiting
   ========================================================= */

import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SFX_DIR = resolve(__dirname, '../sfx');
const SAMPLE_RATE = 48000;

export const ARCHETYPE_MAP = {
  impact: 'impact-deep-soft',
  sub_reveal: 'tone-step-2',
  card_pop: 'foley-card-touch',
  paper_slide: 'foley-paper-slide',
  card_slide: 'foley-card-slide',
  paper_touch: 'foley-paper-touch',
  soft_tap: 'click-tap-soft',
  whoosh: 'whoosh-medium-soft',
  exit_sweep: 'riser-1s-soft',
  terminal_chirp: 'digital-blip-clear'
};

/**
 * Decodes 16-bit or 24-bit PCM WAV buffers into normalized Float32 arrays.
 */
function decodeWavToFloat32(buffer) {
  let offset = 12;
  let fmt = null;
  let dataChunk = null;

  while (offset + 8 <= buffer.length) {
    const id = buffer.slice(offset, offset + 4).toString('ascii');
    const len = buffer.readUInt32LE(offset + 4);
    if (id === 'fmt ') {
      fmt = {
        format: buffer.readUInt16LE(offset + 8),
        channels: buffer.readUInt16LE(offset + 10),
        sampleRate: buffer.readUInt32LE(offset + 12),
        bitsPerSample: buffer.readUInt16LE(offset + 22)
      };
    } else if (id === 'data') {
      dataChunk = {
        offset: offset + 8,
        length: len
      };
      break;
    }
    offset += 8 + len + (len & 1);
  }

  if (!fmt || !dataChunk) return null;

  const { channels, bitsPerSample } = fmt;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(dataChunk.length / (channels * bytesPerSample));
  const left = new Float32Array(numSamples);
  const right = new Float32Array(numSamples);

  let byteOffset = dataChunk.offset;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < channels; c++) {
      let val = 0;
      if (bitsPerSample === 16) {
        val = buffer.readInt16LE(byteOffset) / 32768.0;
      } else if (bitsPerSample === 24) {
        const b0 = buffer[byteOffset];
        const b1 = buffer[byteOffset + 1];
        const b2 = buffer[byteOffset + 2];
        let raw = (b2 << 16) | (b1 << 8) | b0;
        if (raw & 0x800000) raw |= ~0xFFFFFF;
        val = raw / 8388608.0;
      }
      byteOffset += bytesPerSample;

      if (c === 0) left[i] = val;
      if (c === 1) right[i] = val;
      else if (channels === 1) right[i] = val;
    }
  }

  return { left, right, sampleRate: fmt.sampleRate };
}

/**
 * Encodes Float32Array stereo channels into standard 16-bit PCM WAV buffer.
 */
function encodeWAV(left, right) {
  const numSamples = left.length;
  const buffer = Buffer.alloc(44 + numSamples * 4);

  // RIFF Chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 4, 4);
  buffer.write('WAVE', 8);

  // fmt Subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);

  // data Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 4, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let sL = Math.max(-1, Math.min(1, left[i]));
    let sR = Math.max(-1, Math.min(1, right[i]));
    buffer.writeInt16LE(sL < 0 ? sL * 0x8000 : sL * 0x7FFF, offset);
    buffer.writeInt16LE(sR < 0 ? sR * 0x8000 : sR * 0x7FFF, offset + 2);
    offset += 4;
  }

  return buffer;
}

/**
 * Loads sfx-kit index metadata if available.
 */
function loadSfxIndex() {
  const indexPath = resolve(SFX_DIR, 'sounds.json');
  if (existsSync(indexPath)) {
    try {
      return JSON.parse(readFileSync(indexPath, 'utf8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Synthesizes sound events from an AudioManifest into a 16-bit stereo WAV file.
 */
export function synthesizeManifest(manifest, outputPath) {
  const duration = Math.max(1, Number(manifest.duration) || 10);
  const totalSamples = Math.ceil(duration * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  // 1. LAYER 1: Ambient Bed Synthesis (-26dB to -22dB room tone / sub-drone)
  const bedConfig = manifest.ambientBed || { type: 'warm_room_tone', baseFreq: 52, gain: 0.045 };
  const bedGain = Number(bedConfig.gain) || 0.045;
  const baseFreq = Number(bedConfig.baseFreq) || 52;
  let bedB0 = 0, bedB1 = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Sub harmonic resonance
    const sub = Math.sin(2 * Math.PI * baseFreq * t) * 0.35;
    // Pink/Brown acoustic room texture
    const white = (Math.sin(i * 12.9898 + 78.233) * 43758.5453 - Math.floor(Math.sin(i * 12.9898 + 78.233) * 43758.5453)) * 2 - 1;
    bedB0 = 0.992 * bedB0 + white * 0.008;
    bedB1 = 0.96 * bedB1 + white * 0.04;
    const noise = (bedB0 + bedB1) * 0.4;

    const sample = (sub + noise) * bedGain;
    left[i] += sample;
    right[i] += sample;
  }

  const events = manifest.events || [];
  const sfxIndex = loadSfxIndex();
  let studioSamplesMixed = 0;

  for (const ev of events) {
    const gain = Number(ev.gain) || 0.5;
    const pitchFactor = ev.jitter?.pitchFactor || 1.0;
    let mixedStudio = false;

    // Check for sfx-kit match (manifest direct file or sounds.json lookup)
    const targetSoundId = ev.sfx_id || ARCHETYPE_MAP[ev.type];
    let soundMeta = null;
    let relWavPath = ev.file || null;
    if (sfxIndex && targetSoundId && Array.isArray(sfxIndex.sounds)) {
      soundMeta = sfxIndex.sounds.find(s => s.id === targetSoundId) || null;
      if (soundMeta && soundMeta.file) relWavPath = soundMeta.file;
    }
    if (relWavPath) {
      const wavPath = resolve(SFX_DIR, relWavPath);
      if (existsSync(wavPath)) {
        try {
          const rawBuffer = readFileSync(wavPath);
          const decoded = decodeWavToFloat32(rawBuffer);
          if (decoded && decoded.left.length > 0) {
            const syncOffset = soundMeta?.sync?.at || 0;
            const actualStartTime = Math.max(0, (ev.time || 0) - syncOffset);
            const startSample = Math.floor(actualStartTime * SAMPLE_RATE);
            const rateRatio = (decoded.sampleRate || SAMPLE_RATE) / SAMPLE_RATE;
            const step = rateRatio * pitchFactor;

            const maxOutSamples = Math.floor(decoded.left.length / step);
            for (let i = 0; i < maxOutSamples; i++) {
              const targetIdx = startSample + i;
              if (targetIdx >= totalSamples) break;

              // Linear interpolation for sample-rate + pitch resampling
              const srcPos = i * step;
              const idx0 = Math.floor(srcPos);
              const idx1 = Math.min(decoded.left.length - 1, idx0 + 1);
              const frac = srcPos - idx0;

              const sL = decoded.left[idx0] * (1 - frac) + decoded.left[idx1] * frac;
              const sR = decoded.right[idx0] * (1 - frac) + decoded.right[idx1] * frac;

              left[targetIdx] += sL * gain;
              right[targetIdx] += sR * gain;
            }
            mixedStudio = true;
            studioSamplesMixed++;
          }
        } catch (err) {}
      }
    }

    if (mixedStudio) continue;

    // Procedural synthesis fallback with micro-pitch & jitter
    const startSample = Math.floor((ev.time || 0) * SAMPLE_RATE);
    switch (ev.type) {
      case 'impact': {
        const len = Math.floor(0.42 * SAMPLE_RATE);
        const baseF = 220 * pitchFactor;
        const lowF = 58 * pitchFactor;
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = baseF * Math.pow(lowF / baseF, t / 0.35);
          const phase = 2 * Math.PI * f * t;
          let env = t < 0.015 ? t / 0.015 : Math.exp(-(t - 0.015) * 12);

          const fSheen = 520 * pitchFactor * Math.pow(320 / 520, t / 0.12);
          const phaseSheen = 2 * Math.PI * fSheen * t;
          let envSheen = t < 0.008 ? t / 0.008 : Math.exp(-(t - 0.008) * 25);

          const sample = (Math.sin(phase) * 0.72 * env + Math.sin(phaseSheen) * 0.16 * envSheen) * gain;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'sub_reveal': {
        const len = Math.floor(0.16 * SAMPLE_RATE);
        const f0 = 420 * pitchFactor;
        const f1 = 560 * pitchFactor;
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = f0 + (f1 - f0) * (t / 0.12);
          const phase = 2 * Math.PI * f * t;
          const env = t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) * 20);
          const sample = Math.sin(phase) * env * gain * 0.42;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'card_pop': {
        const freq = (Number(ev.pitch) || 520) * pitchFactor;
        const len = Math.floor(0.13 * SAMPLE_RATE);
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = freq * Math.pow(0.7, t / 0.09);
          const phase = 2 * Math.PI * f * t;
          const env = t < 0.006 ? t / 0.006 : Math.exp(-(t - 0.006) * 35);
          const sample = Math.sin(phase) * env * gain * 0.48;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'exit_sweep':
      case 'exit_riser': {
        const len = Math.floor(0.26 * SAMPLE_RATE);
        const f0 = 180 * pitchFactor;
        const f1 = 490 * pitchFactor;
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = f0 + (f1 - f0) * (t / 0.22);
          const phase = 2 * Math.PI * f * t;
          const env = t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) * 16);
          const sample = Math.sin(phase) * env * gain * 0.38;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'whoosh':
      case 'stage_slide': {
        const len = Math.floor(0.32 * SAMPLE_RATE);
        let b0 = 0, b1 = 0;
        const cutoffAlpha = Math.min(0.15, 0.05 * pitchFactor);
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const white = (Math.sin(i * 17.13 + 43.19) * 43758.5453 - Math.floor(Math.sin(i * 17.13 + 43.19) * 43758.5453)) * 2 - 1;
          b0 = (1 - cutoffAlpha) * b0 + white * cutoffAlpha;
          b1 = 0.9 * b1 + white * 0.1;
          const t = i / len;
          const env = Math.sin(t * Math.PI);
          const sample = (b0 + b1) * env * gain * 0.52;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'paper_slide':
      case 'card_slide': {
        const len = Math.floor(0.24 * SAMPLE_RATE);
        let b0 = 0;
        const filterWeight = Math.min(0.2, 0.12 * pitchFactor);
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const white = (Math.sin(i * 9.17 + 82.31) * 43758.5453 - Math.floor(Math.sin(i * 9.17 + 82.31) * 43758.5453)) * 2 - 1;
          b0 = (1 - filterWeight) * b0 + white * filterWeight;
          const t = i / len;
          const env = Math.sin(t * Math.PI);
          const sample = b0 * env * gain * 0.36;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'paper_touch':
      case 'soft_tap':
      case 'gesture_point':
      case 'headlights_flash': {
        const len = Math.floor(0.08 * SAMPLE_RATE);
        const baseF = 160 * pitchFactor;
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = baseF * Math.exp(-t * 35);
          const phase = 2 * Math.PI * f * t;
          const env = Math.exp(-t * 50);
          const sample = Math.sin(phase) * env * gain * 0.42;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'terminal_chirp':
      case 'face_react':
      case 'neon_sign_on': {
        [840 * pitchFactor, 1120 * pitchFactor].forEach((freq, chordIdx) => {
          const chirpStart = startSample + Math.floor(chordIdx * 0.04 * SAMPLE_RATE);
          const len = Math.floor(0.1 * SAMPLE_RATE);
          for (let i = 0; i < len; i++) {
            const idx = chirpStart + i;
            if (idx >= totalSamples) break;
            const t = i / SAMPLE_RATE;
            const f = freq * Math.pow(0.9, t / 0.08);
            const phase = 2 * Math.PI * f * t;
            const env = t < 0.005 ? t / 0.005 : Math.exp(-(t - 0.005) * 40);
            const sample = Math.sin(phase) * env * gain * 0.35;
            left[idx] += sample;
            right[idx] += sample;
          }
        });
        break;
      }

      case 'footstep':
      case 'footstep_grass':
      case 'footstep_grass_R':
      case 'footstep_grass_L':
      case 'footstep_wood':
      case 'footstep_stone': {
        const isWood = ev.type.includes('wood') || ev.surface === 'wood';
        const isStone = ev.type.includes('stone') || ev.surface === 'stone';
        const len = Math.floor(0.10 * SAMPLE_RATE);
        const baseF = (isWood ? 140 : isStone ? 190 : 85) * pitchFactor;
        const lowF = 28 * pitchFactor;

        // 1. Damped ground body
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = baseF * Math.pow(lowF / baseF, t / 0.08);
          const phase = 2 * Math.PI * f * t;
          const env = Math.exp(-t * 30);
          const sample = Math.sin(phase) * env * gain * 0.45;
          left[idx] += sample;
          right[idx] += sample;
        }

        // 2. Fibrous surface texture layer (filtered noise)
        const noiseLen = Math.floor(0.07 * SAMPLE_RATE);
        let b0 = 0;
        const alpha = isWood ? 0.15 : 0.08;
        for (let i = 0; i < noiseLen; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const white = (Math.sin(i * 13.37 + 51.19) * 43758.5453 - Math.floor(Math.sin(i * 13.37 + 51.19) * 43758.5453)) * 2 - 1;
          b0 = (1 - alpha) * b0 + white * alpha;
          const envNoise = Math.exp(-(i / SAMPLE_RATE) * 45);
          const sampleNoise = b0 * envNoise * gain * 0.35;
          left[idx] += sampleNoise;
          right[idx] += sampleNoise;
        }
        break;
      }
    }
  }

  // Soft peak limiter (prevents digital clipping)
  let maxPeak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const peak = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    if (peak > maxPeak) maxPeak = peak;
  }
  if (maxPeak > 0.95) {
    const scale = 0.95 / maxPeak;
    for (let i = 0; i < totalSamples; i++) {
      left[i] *= scale;
      right[i] *= scale;
    }
  }

  const wavBuffer = encodeWAV(left, right);
  if (outputPath) {
    writeFileSync(outputPath, wavBuffer);
  }
  return { buffer: wavBuffer, studioSamplesMixed, totalEvents: events.length };
}

/**
 * JIT auto-downloads missing studio sound effects from wyzowl/sfx-kit on-demand.
 */
export async function prefetchManifestSounds(manifest) {
  if (!manifest || !manifest.events) return;
  const sfxIndex = loadSfxIndex();
  const RAW_BASE = 'https://raw.githubusercontent.com/wyzowl/sfx-kit/main';

  for (const ev of manifest.events) {
    const targetSoundId = ev.sfx_id || ARCHETYPE_MAP[ev.type];
    let relPath = null;
    if (sfxIndex && targetSoundId && sfxIndex.sounds) {
      const soundMeta = sfxIndex.sounds.find(s => s.id === targetSoundId);
      if (soundMeta) relPath = soundMeta.file;
    } else if (ev.file) {
      relPath = ev.file;
    }

    if (relPath) {
      const fullPath = resolve(SFX_DIR, relPath);
      if (!existsSync(fullPath)) {
        try {
          const res = await fetch(`${RAW_BASE}/${relPath}`);
          if (res.ok) {
            const ab = await res.arrayBuffer();
            mkdirSync(dirname(fullPath), { recursive: true });
            writeFileSync(fullPath, Buffer.from(ab));
            console.log(`[Audio Synth] JIT auto-downloaded sound: ${relPath}`);
          }
        } catch (e) {
          console.warn(`[Audio Synth] Could not prefetch ${relPath}: ${e.message}`);
        }
      }
    }
  }
}

// CLI direct run test
if (process.argv[2]) {
  const inputPath = process.argv[2];
  const outPath = process.argv[3] || 'audio.wav';
  let manifest;

  if (inputPath.endsWith('.html')) {
    const tmpJson = resolve(__dirname, `.tmp_${Date.now()}_manifest.json`);
    try {
      execSync(`node "${resolve(__dirname, 'parse-timeline.mjs')}" "${inputPath}" "${tmpJson}"`, { stdio: 'pipe', windowsHide: true });
      manifest = JSON.parse(readFileSync(tmpJson, 'utf8'));
    } finally {
      if (existsSync(tmpJson)) unlinkSync(tmpJson);
    }
  } else {
    const raw = readFileSync(inputPath, 'utf8');
    manifest = JSON.parse(raw);
  }

  const res = synthesizeManifest(manifest, outPath);
  console.log(`✔ Audio rendered: ${outPath} (${manifest.duration || 10}s) — [${res.studioSamplesMixed}/${res.totalEvents} studio WAVs mixed]`);
}
