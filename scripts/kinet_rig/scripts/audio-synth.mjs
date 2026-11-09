/* =========================================================
   KinetRig Procedural Audio Synthesizer (Headless Node.js)
   Zero-dependency PCM WAV generator for KinetRig timelines.
   Synthesizes studio-calibrated SFX events into pristine audio.
   ========================================================= */

import { writeFileSync } from 'node:fs';

const SAMPLE_RATE = 48000;

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
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(2, 22);  // NumChannels (2 = Stereo)
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 4, 28); // ByteRate
  buffer.writeUInt16LE(4, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data Subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 4, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Clamp and convert -1.0..1.0 to 16-bit integer
    let sL = Math.max(-1, Math.min(1, left[i]));
    let sR = Math.max(-1, Math.min(1, right[i]));
    buffer.writeInt16LE(sL < 0 ? sL * 0x8000 : sL * 0x7FFF, offset);
    buffer.writeInt16LE(sR < 0 ? sR * 0x8000 : sR * 0x7FFF, offset + 2);
    offset += 4;
  }

  return buffer;
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

  for (const ev of events) {
    const startSample = Math.floor((ev.time || 0) * SAMPLE_RATE);
    const gain = Number(ev.gain) || 0.5;

    switch (ev.type) {
      case 'impact': {
        // Pure sine 220Hz -> 60Hz over 380ms + 520Hz glass sheen
        const len = Math.floor(0.4 * SAMPLE_RATE);
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;

          // Frequency sweep 220 -> 60
          const f = 220 * Math.pow(60 / 220, t / 0.35);
          const phase = 2 * Math.PI * f * t;
          let env = 0;
          if (t < 0.015) env = t / 0.015; // 15ms soft attack
          else env = Math.exp(-(t - 0.015) * 12);

          // Sheen 520 -> 320
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
        // Soft micro-glide 420Hz -> 560Hz over 140ms
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
        // Melodic resonant chime at specified frequency
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
        // Motivated upward sine lift 180Hz -> 480Hz
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
        // Velvet bandpass pink-noise sweep
        const len = Math.floor(0.3 * SAMPLE_RATE);
        let b0 = 0, b1 = 0;
        for (let i = 0; i < len; i++) {
          const idx = startSample + i;
          if (idx >= totalSamples) break;
          const t = i / SAMPLE_RATE;
          const white = Math.random() * 2 - 1;
          b0 = 0.95 * b0 + white * 0.05;
          b1 = 0.9 * b1 + white * 0.1;
          const env = Math.sin((i / len) * Math.PI);
          const sample = (b0 + b1) * env * gain * 0.6;
          left[idx] += sample;
          right[idx] += sample;
        }
        break;
      }

      case 'terminal_chirp': {
        // Dual tactile crystal ping (840Hz + 1120Hz)
        const tones = [840, 1120];
        tones.forEach((freq, tIdx) => {
          const offsetSamples = Math.floor(tIdx * 0.04 * SAMPLE_RATE);
          const len = Math.floor(0.09 * SAMPLE_RATE);
          for (let i = 0; i < len; i++) {
            const idx = startSample + offsetSamples + i;
            if (idx >= totalSamples) break;
            const t = i / SAMPLE_RATE;
            const f = freq * Math.pow(0.9, t / 0.08);
            const phase = 2 * Math.PI * f * t;
            const env = t < 0.005 ? t / 0.005 : Math.exp(-(t - 0.005) * 35);
            const sample = Math.sin(phase) * env * gain * 0.4;
            left[idx] += sample;
            right[idx] += sample;
          }
        });
        break;
      }
    }
  }

  // Soft peak limiter to prevent digital clipping
  let maxPeak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const pL = Math.abs(left[i]);
    const pR = Math.abs(right[i]);
    if (pL > maxPeak) maxPeak = pL;
    if (pR > maxPeak) maxPeak = pR;
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
  return wavBuffer;
}

// CLI Execution support
if (process.argv[1] && process.argv[1].endsWith('audio-synth.mjs')) {
  const jsonPath = process.argv[2];
  const outPath = process.argv[3] || 'output_audio.wav';
  if (!jsonPath) {
    console.log('Usage: node scripts/audio-synth.mjs <manifest.json> [output.wav]');
    process.exit(1);
  }
  import('node:fs').then(({ readFileSync }) => {
    const manifest = JSON.parse(readFileSync(jsonPath, 'utf8'));
    synthesizeManifest(manifest, outPath);
    console.log(`✔ Procedural audio rendered: ${outPath} (${manifest.duration}s)`);
  });
}
