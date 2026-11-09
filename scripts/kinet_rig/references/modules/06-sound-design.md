# 06 — Sound Design & Audio Engineering (KinetRig Engine)

Pergerakan visual yang menakjubkan menjadi hambar jika audio tidak mempunyai berat dan sinkronisasi tepat.

---

## 1. Zero-Dependency HTML5 Audio Trigger System

KinetRig menggunakan penanda masa deterministik pada timeline GSAP untuk memicu audio SFX dan muzik latar secara serentak:

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

  // Sintesis bunyi impak bass tanpa fail audio luaran (Zero Asset Bloat!)
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

  // Sintesis whoosh pantas
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

Kunci sinkronisasi adalah mengunci potongan adegan (scene cut) terus kepada kiraan BPM (Beats Per Minute) lagu:

$$ \text{Seconds Per Beat} = \frac{60}{\text{BPM}} $$
$$ \text{Bar Duration (4 beats)} = \frac{240}{\text{BPM}} $$

### Jadual Sinkronisasi Popular:
- **120 BPM (House / Tech):** 1 Beat = 0.500s | 1 Bar = 2.000s
- **128 BPM (EDM / High Energy):** 1 Beat = 0.468s | 1 Bar = 1.875s
- **140 BPM (Dubstep / Trap):** 1 Beat = 0.428s | 1 Bar = 1.714s

```javascript
const BPM = 124;
const BEAT = 60 / BPM; // 0.4838s
const BAR = BEAT * 4;  // 1.935s

// Potong bab tepat pada Beat ke-4 bar pertama
tl.to('#scene-1', { opacity: 0, duration: 0.1 }, BAR - 0.1)
  .from('#scene-2', { scale: 1.15, opacity: 0, duration: BEAT }, BAR);
```

---

## 3. Audio Ducking Protocol

Apabila suara latar (Voice-Over) muncul:
1. Turunkan kelantangan muzik latar sebanyak -12dB hingga -16dB dalam masa 0.3s.
2. Kekalkan kelantangan SFX mikro (UI click, typewriter).
3. Naikkan semula kelantangan muzik selepas voice-over selesai (fade-up 0.6s).
