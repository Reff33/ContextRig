# 06 — Sound Design & Audio Engineering (KinetRig Engine)

Visual motion becomes dull when audio lacks mechanical weight and precise mathematical synchronization.

---

## 1. Zero-Dependency HTML5 Audio Trigger System

KinetRig pairs deterministic timeline triggers with the Web Audio API to synthesize SFX and sync soundtrack cues without external asset bloat:

```javascript
class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.sfxPool = new Map();
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Synthesize a punchy sub-bass impact without external audio files
  playImpact(time = 0) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.35);

    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.45);
  }

  // Synthesize directional high-velocity whoosh
  playWhoosh() {
    if (!this.audioCtx) return;
    const node = this.audioCtx.createBufferSource();
    const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.25, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / buffer.length) * Math.PI);
    }
    node.buffer = buffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1800, this.audioCtx.currentTime + 0.2);

    node.connect(filter);
    filter.connect(this.audioCtx.destination);
    node.start();
  }
}
```

---

## 2. Beat-Sync Math & Time Alignment

Lock scene cuts and major visual impacts directly to BPM (Beats Per Minute):

$$ \text{Seconds Per Beat} = \frac{60}{\text{BPM}} $$
$$ \text{Bar Duration (4 beats)} = \frac{240}{\text{BPM}} $$

### Common BPM Reference Table

- **120 BPM (Tech / House):** 1 Beat = 0.500s | 1 Bar = 2.000s
- **128 BPM (EDM / High Velocity):** 1 Beat = 0.468s | 1 Bar = 1.875s
- **140 BPM (Trap / Dubstep):** 1 Beat = 0.428s | 1 Bar = 1.714s

```javascript
const BPM = 124;
const BEAT = 60 / BPM; // 0.4838s
const BAR = BEAT * 4;  // 1.935s

// Cut scenes exactly on beat 4 of the first bar
tl.to('#scene-1', { opacity: 0, duration: 0.1 }, BAR - 0.1)
  .from('#scene-2', { scale: 1.15, opacity: 0, duration: BEAT }, BAR);
```

---

## 3. Audio Ducking Protocol

When voiceover narration enters the timeline:

1. Reduce background music volume by -12dB to -16dB over 0.3s.
2. Retain full presence for micro-SFX (UI clicks, impacts, tactile ticks).
3. Smoothly restore music level once voiceover finishes (0.6s release curve).
