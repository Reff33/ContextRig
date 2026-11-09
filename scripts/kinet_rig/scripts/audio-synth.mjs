/* =========================================================
   KinetRig Audio Synthesizer & Studio SFX Mixer (Headless Node.js)
   Zero-dependency PCM WAV generator for KinetRig timelines.
   Supports hybrid rendering:
     1. Studio WAV mixing from wyzowl/sfx-kit (with sync.at transient alignment)
     2. Zero-dependency procedural synthesis fallback
   ========================================================= */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    offset += 8 + len;
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

  const events = manifest.events || [];
  const sfxIndex = loadSfxIndex();
  let studioSamplesMixed = 0;

  for (const ev of events) {
    const gain = Number(ev.gain) || 0.5;
    let mixedStudio = false;

    // Check for sfx-kit match
    const targetSoundId = ev.sfx_id || ARCHETYPE_MAP[ev.type];
    if (sfxIndex && targetSoundId) {
      const soundMeta = sfxIndex.sounds.find(s => s.id === targetSoundId);
      if (soundMeta) {
        const wavPath = resolve(SFX_DIR, soundMeta.file);
        if (existsSync(wavPath)) {
          try {
            const rawBuffer = readFileSync(wavPath);
            const decoded = decodeWavToFloat32(rawBuffer);
            if (decoded) {
              const syncOffset = soundMeta.sync?.at || 0;
              const actualStartTime = Math.max(0, (ev.time || 0) - syncOffset);
              const startSample = Math.floor(actualStartTime * SAMPLE_RATE);

              for (let i = 0; i < decoded.left.length; i++) {
                const targetIdx = startSample + i;
                if (targetIdx >= totalSamples) break;
                left[targetIdx] += decoded.left[i] * gain;
                right[targetIdx] += decoded.right[i] * gain;
              }
              mixedStudio = true;
              studioSamplesMixed++;
            }
          } catch (err) {}
        }
      }
    }

    if (mixedStudio) continue;

    // Procedural synthesis fallback
    const startSample = Math.floor((ev.time || 0) * SAMPLE_RATE);
    switch (ev.type) {
      case 'impact': {
        const len = Math.floor(0.4 * SAMPLE_RATE);
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = 220 * Math.pow(60 / 220, t / 0.35);
          const phase = 2 * Math.PI * f * t;
          let env = t < 0.015 ? t / 0.015 : Math.exp(-(t - 0.015) * 12);

          const fSheen = 520 * Math.pow(320 / 520, t / 0.12);
          const phaseSheen = 2 * Math.PI * fSheen * t;
          let envSheen = t < 0.008 ? t / 0.008 : Math.exp(-(t - 0.008) * 25);

          const sample = (Math.sin(phase) * 0.7 * env + Math.sin(phaseSheen) * 0.15 * envSheen) * gain;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'sub_reveal': {
        const len = Math.floor(0.15 * SAMPLE_RATE);
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = 420 + (560 - 420) * (t / 0.12);
          const phase = 2 * Math.PI * f * t;
          const env = t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) * 20);
          const sample = Math.sin(phase) * env * gain * 0.4;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'card_pop': {
        const freq = Number(ev.pitch) || 520;
        const len = Math.floor(0.12 * SAMPLE_RATE);
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = freq * Math.pow(0.7, t / 0.09);
          const phase = 2 * Math.PI * f * t;
          const env = t < 0.006 ? t / 0.006 : Math.exp(-(t - 0.006) * 35);
          const sample = Math.sin(phase) * env * gain * 0.45;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'exit_sweep': {
        const len = Math.floor(0.25 * SAMPLE_RATE);
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = 180 + (480 - 180) * (t / 0.22);
          const phase = 2 * Math.PI * f * t;
          const env = t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) * 16);
          const sample = Math.sin(phase) * env * gain * 0.35;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'whoosh': {
        const len = Math.floor(0.3 * SAMPLE_RATE);
        let b0 = 0, b1 = 0;
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const white = (Math.random() * 2 - 1);
          b0 = 0.95 * b0 + white * 0.05;
          b1 = 0.9 * b1 + white * 0.1;
          const t = i / len;
          const env = Math.sin(t * Math.PI);
          const sample = (b0 + b1) * env * gain * 0.5;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'paper_slide':
      case 'card_slide': {
        const len = Math.floor(0.24 * SAMPLE_RATE);
        let b0 = 0;
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const white = (Math.random() * 2 - 1);
          b0 = 0.88 * b0 + white * 0.12;
          const t = i / len;
          const env = Math.sin(t * Math.PI);
          const sample = b0 * env * gain * 0.35;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'paper_touch':
      case 'soft_tap': {
        const len = Math.floor(0.08 * SAMPLE_RATE);
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const f = 160 * Math.exp(-t * 35);
          const phase = 2 * Math.PI * f * t;
          const env = Math.exp(-t * 50);
          const sample = Math.sin(phase) * env * gain * 0.4;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'terminal_chirp': {
        [840, 1120].forEach((freq, chordIdx) => {
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
    }
  }

  // Soft peak limiter
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

// CLI direct run test
if (process.argv[2]) {
  const manifestPath = process.argv[2];
  const outPath = process.argv[3] || 'audio.wav';
  const raw = readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(raw);
  const res = synthesizeManifest(manifest, outPath);
  console.log(`✔ Audio rendered: ${outPath} (${manifest.duration || 10}s) — [${res.studioSamplesMixed}/${res.totalEvents} studio WAVs mixed]`);
}
