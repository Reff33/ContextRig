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

---

## 4. Rule of Motivated Movement Audio (100% Movement-to-SFX Lock)

In high-end studio motion graphics, visual movement without sound feels lifeless, while generic background music without synchronized foley feels detached. **Every visual movement must have a motivated, tactile, non-harsh procedural audio cue.**

### The 4 Industry Laws of Cinematic Motion Sound (TikTok/Reels, Apple & Studio Showcases)

1. **Law 1: The 3-Layer Acoustic Sandwich (Never Leave SFX Naked):**
   In professional video commercials, isolated SFX without an ambient glue sound jarring like computer glitches. Build every scene with three acoustic layers:
   - **Layer 1 (Ambient Texture Bed):** Continuous warm tape room tone or low analog sub-drone playing quietly at $-22\text{dB}$ to $-26\text{dB}$ to fuse the scene together.
   - **Layer 2 (Tactile Micro-Foley):** Material-specific friction, felt landings, and soft taps at $-8\text{dB}$ to $-12\text{dB}$ that give weight to every card, paper, and UI transition.
   - **Layer 3 (Hero Accents & Impacts):** Maximum 2–3 monumental, full-scale impacts at $0\text{dB}$ per 15–20s video.

2. **Law 2: Material Consistency (Acoustic Universe Matching):**
   Audio must match the physical material of the visual world:
   - **White Catalog / Paper / Editorial:** Tactile paper friction (`foley-paper-slide`), felt card landings (`foley-card-touch`), soft mechanical clicks (`click-tap-soft`), and rubber stamp thuds (`impact-medium-firm`). Never use arcade lasers or digital sine pings.
   - **Dark Cyber / Dev CLI / Terminal:** Tactile mechanical switch clatter (`click-snap-soft`), clean crystal tone pings (`tone-ding-mid`), and low 60Hz sub-bass sweeps.

3. **Law 3: J-Cut Audio Anticipation (2–3 Frames / 30–50ms Pre-Roll):**
   Human hearing processes transient impulses slightly slower than immediate optical shifts, but anticipates motion before it finishes. Whooshes, slides, and camera accelerations MUST trigger **$30\text{ms}$–$50\text{ms}$ (2–3 frames) before** the visual velocity apex:
   $$t_{\text{audio\_trigger}} = t_{\text{motion\_apex}} - 0.04\text{s}$$
   This draws the viewer's ear forward, pulling their eyes smoothly into the movement.

4. **Law 4: Law of the Contact Frame & Negative Audio Space:**
   - **Contact Frame Lock:** Audio triggers for arrivals, drops, and stamp slams MUST land on the physical surface contact frame ($t_{\text{contact}} = t_{\text{start}} + t_{\text{duration}}$), NEVER at animation takeoff.
   - **Negative Audio Space (Auditory Breathing Room):** Over-sounding ruins elegance. Cap primary SFX density at **1 event per 2–3 seconds** (4–6 curated hero cues per 15–20s video). Secondary decorative artifacts (watermarks, hairline frames, ghost dates, sub-labels) MUST remain completely silent.

5. **Law 5: The Velocity-Envelope Lock Law (Acoustic-Motion Isochrony):**
   Visual tween duration and easing curve must mathematically mirror the audio ADSR envelope. A mismatch creates cognitive dissonance where the visual feels disconnected or sluggish:
   - **Snappy Tactile Pops & Clicks (80–150ms audio):** Motion tween duration MUST be snappy ($\Delta t = 0.35\text{s} - 0.45\text{s}$) with `back.out(1.8)` or `power4.out`. Never use slow floating fades (>0.8s) with instant tactile clicks.
   - **Hero Statement Slams (300–450ms sub-bass decay):** Text/card landing deceleration MUST lock within $\Delta t = 0.40\text{s} - 0.50\text{s}$ using `expo.out` or `power4.out`. Impact hits at the exact arrival frame.
   - **Whip-Pans & World Traveling (350–550ms whoosh):** Camera travel velocity apex must align with the whoosh transient peak. Travel duration MUST be snappy ($\Delta t = 0.9\text{s} - 1.2\text{s}$) with `power3.inOut` or `power4.inOut`—never a 2.0s sluggish crawl against a 0.4s whoosh.
   - **Risers & Exit Sweeps (600–1000ms):** Element exit acceleration must ramp exponentially (`power2.in` or `power3.in`) mirroring the frequency riser slope.

6. **Law 6: Kinematic Surface-Aware Footstep Cadence Protocol:**
   Character locomotion (walking/running) is never a static sound block. In studio production (Pixar, Disney, AAA game cinematic engines), character movement is synchronized to discrete foot-plants:
   - **Cadence Subdivision:** Divide duration by step period $T_{\text{step}} = 0.39\text{s}$:
     $$N_{\text{steps}} = \left\lfloor \frac{T_{\text{walk}}}{0.39} \right\rfloor, \quad T_k = T_{\text{start}} + k \times 0.39\text{s}$$
   - **Alternating Micro-Pitch Modulation:** Alternate foot pitches ($\pm 3\%$, Left foot $\times 0.97$, Right foot $\times 1.03$) to eliminate mechanical repetition.
   - **Surface Material Acoustics:**
     - **Grass / Lawn / Turf:** Damped ground body (85Hz ramping exponentially to 28Hz over 80ms) + 420Hz lowpass filtered fibrous noise.
     - **Wood / Parquet / Stage:** Resonant hollow impact (140Hz decaying to 40Hz) + 680Hz bandpass mechanical friction.
     - **Stone / Concrete:** High-density transient tap (190Hz body) + highpass grit tap (1200Hz).

### The 7 Motion Graphics Sound Archetypes

| Visual Movement | Sound Archetype | Acoustic Recipe |
| --- | --- | --- |
| **Hero Statement Slam** | `playImpact()` | Pure sine 220Hz -> 60Hz + 15ms soft attack + subtle 520Hz glass sheen |
| **Tactile Card Landing** | `playCardPop()` | Soft felt paper touch / tap (`foley-card-touch`, `click-tap-soft`) |
| **Paper / Card Slide** | `playPaperSlide()` | Velvety fibrous friction sweep (`foley-paper-slide`) |
| **Character Footstep** | `playFootstep(pitch, surface)` | Low damped body (85Hz/140Hz) + surface texture noise (420Hz/680Hz) |
| **Element Exit / Vanish** | `playExitSweep()` | Motivated upward sine lift 180Hz -> 480Hz |
| **3D Camera Traveling / Push** | `playWhoosh()` | J-cut velvet pink-noise bandpass filter sweep 350Hz -> 1100Hz |
| **CLI / Code Box Reveal** | `playTerminalChirp()` | Tactile dual-tone crystal chime 840Hz + 1120Hz |

```javascript
// Example: Pristine 6-Beat Physical Contact Mapping (18s Catalog Timeline)
tl.call(() => triggerSfx('foley-card-touch', playCardPop, 0.6), null, 0.75);      // Photo card A lands on stage (contact)
tl.call(() => triggerSfx('foley-paper-slide', playPaperSlide, 0.45), null, 2.45); // J-cut paper slide into Cutout B
tl.call(() => triggerSfx('impact-deep-soft', playImpact, 0.8), null, 5.50);       // Hero statement snap
tl.call(() => triggerSfx('impact-medium-firm', playStampSlam, 0.9), null, 9.36);  // Stamp slams into paper (contact)
tl.call(() => triggerSfx('whoosh-slow-soft', playWhoosh, 0.55), null, 11.35);     // J-cut camera push-through to Scene 2
tl.call(() => triggerSfx('impact-deep-soft', playImpact, 0.8), null, 14.50);      // Metric statement resolution
```

---

## 5. AI Audio Intelligence & Headless Synthesis Engine

To bridge browser Web Audio with headless video rendering, KinetRig uses a code-first Intermediate Representation (`AudioManifest`):

```json
{
  "duration": 10.0,
  "events": [
    { "time": 0.20, "type": "impact", "gain": 0.8 },
    { "time": 0.80, "type": "sub_reveal", "gain": 0.5 },
    { "time": 1.40, "type": "card_pop", "pitch": 520, "gain": 0.5 },
    { "time": 4.80, "type": "whoosh", "gain": 0.6 }
  ]
}
```

### Automation Toolchain

1. **Extract Motion Telemetry to Audio Manifest:**

   ```bash
   node scripts/parse-timeline.mjs assets/kinet-opener.html sfx-manifest.json
   ```

2. **Synthesize Lossless PCM WAV Audio:**

   ```bash
   node scripts/audio-synth.mjs sfx-manifest.json output_audio.wav
   ```

3. **All-in-One Studio Render with Automatic Audio Muxing:**

   ```bash
   node scripts/render.mjs assets/kinet-opener.html output_240fps.mp4 240
   ```

   If no external `--audio` file is provided, `render.mjs` automatically reads `window.OPENER.audioManifest`, synthesizes the WAV via `audio-synth.mjs`, and muxes high-fidelity audio into the MP4 with `-c:a aac -b:a 320k`.

---

## 6. wyzowl/sfx-kit Integration & Transient Alignment

For studio deliverables, KinetRig bridges the open CC0 `wyzowl/sfx-kit` library (320 synthesized 48kHz 24-bit sound effects) with mathematical transient placement:

1. **Download Studio Pack:**

   ```bash
   node scripts/fetch-sfx.mjs --archetypes
   ```

2. **Transient Peak Alignment (`sync.at`):**
   `sounds.json` defines `sync.at` (the exact millisecond when the transient peak occurs). `audio-synth.mjs` automatically shifts the audio start time:

   $$\text{Start Sample} = (\text{Keyframe Time} - \text{sync.at}) \times \text{Sample Rate}$$

   This ensures the physical apex of whooshes, impacts, and chimes hits the exact frame of visual contact.

3. **Zero-Dependency Fallback:**
   If `sfx/` is not present, `audio-synth.mjs` seamlessly falls back to pure mathematical procedural Web Audio synthesis with 0 dropped frames.

---

## 7. Enterprise AI Audio Intelligence Architecture (The 5-Layer Engine)

To match the audio production quality of enterprise motion engines (Runway, Remotion, Apple product films), KinetRig incorporates an automated 5-layer intelligence pipeline:

1. **Layer 1: Semantic Scene Classifier:**
   Parses on-screen DOM text, headings, and tags (`<h1>`, `<p>`, `<code>`, `.pill`) using semantic keyword dictionaries to classify the video into one of 10 archetype universes (`tech_cli`, `metrics_data`, `editorial_paper`, `showcase_glass`, `chat_dialogue`, `cinema_space`, `vintage_engraving`, `stage_theatre`, `collage_pop`, `flow_action`).

2. **Layer 2: Dynamic Motion Telemetry ($v = \frac{dx}{dt}$):**
   Calculates tween velocity from spatial displacement ($\Delta x, \Delta y$), camera depth ($\Delta z$), and easing curves. High-velocity transitions automatically apply J-Cut anticipation ($t - 0.04\text{s}$), while decelerating landings trigger on physical surface contact.

3. **Layer 3: Material-to-Sound Ontology:**
   Maps visual DOM selectors to tactile physical materials:
   - Paper / Cards / Vellum $\to$ Velvet paper slides, fibrous drops.
   - Glass / Lens / Mirrors $\to$ Crystalline tintinnabulation, high-frequency pings.
   - Heavy Metal / Chassis $\to$ Dense sub-bass thuds, mechanical clatters.
   - Digital / Pixels / Terminal $\to$ Dual-tone chimes, snappy square blips.

4. **Layer 4: Organic Micro-Jitter Engine (Anti-Machine-Gun):**
   Repeated triggers apply deterministic pseudo-random modulation ($\pm 4\%$ pitch, $\pm 80\text{Hz}$ filter cutoff, $\pm 8\text{ms}$ timing jitter) to completely eradicate mechanical artificiality.

5. **Layer 5: Continuous Acoustic Sandwich:**
   Eliminates digital dead silence by laying a subtle continuous room tone / sub-drone bed at $-26\text{dB}$ beneath Layer 2 tactile micro-foley ($-10\text{dB}$) and Layer 3 hero impacts ($0\text{dB}$).
