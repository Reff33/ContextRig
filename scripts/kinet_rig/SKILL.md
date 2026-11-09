---
name: kinet-rig
description: Zero-dependency 144 FPS kinetic motion graphics & video engine for browser (openers, explainers, data animations, ecommerce showcase, chat simulation) using pure HTML, GSAP, and Three.js with clean studio render.
license: MIT
metadata:
  author: Reff33
  homepage: https://github.com/Reff33/KinetRig
  version: "1.0.0"
---

# KinetRig — Zero-Dependency 144 FPS Browser Motion Engine

Motion graphics that move like real studio cinema, not PowerPoint slides. Built natively for AI coding agents (Claude Code, Cursor, Copilot, ChatGPT, OpenCode).

## Core Principles

1. **Zero Runtime Dependencies:** Deliverable (`index.html`) requires ONLY a modern browser. No Node build step, no React/Remotion bloat, no Python Manim setup.
2. **Deterministic 144 FPS Timeline:** All animations driven strictly by `tl.time()`. No `Date.now()`, no `Math.random()`. Allows frame-accurate offline rendering with 0 dropped frames.
3. **Zero OS Emojis Everywhere (Strict Vector Quality):** NEVER use system/OS copy-paste emojis (🤖, ⚡, 🐙, 🧠, 🕷, 🎥, ⚙, 🔴) anywhere — neither in scene cards, titles, body text, nor in UI buttons (Download Video, HUD, scrubbers, controls). ALWAYS use resolution-independent Inline SVG vectors (`<svg viewBox="0 0 24 24">`) with `currentColor` or brand colors with neon glow. Emojis look amateurish and pixelate on 1080p/4K; inline SVGs guarantee crisp studio finish with zero external dependencies.
4. **Anti-PowerPoint Motion:** No static slide deck fades. Scenes transition through continuous camera traveling (push-through, whip pan, yaw 3D) or motivated object wipes.
5. **Motivated Sound Design (100% Movement-to-SFX Lock & 4 Industry Laws):**
   - **Law 1 (The 3-Layer Acoustic Sandwich):** Never leave SFX naked. Blend Layer 1 (ambient room texture bed at -22dB to -26dB), Layer 2 (tactile micro-foley at -8dB to -12dB), and Layer 3 (hero impact accents at 0dB).
   - **Law 2 (Material Consistency):** Match audio physics to visual world (Catalog/Paper uses paper friction, felt card landing, rubber stamp; Dev CLI uses tactile mechanical switches, crystal tone pings). Zero generic arcade beeps.
   - **Law 3 (J-Cut Audio Anticipation):** Camera whooshes and sliding elements trigger 30–50ms (2–3 frames) *before* velocity apex ($t_{\text{audio}} = t_{\text{motion\_apex}} - 0.04\text{s}$) to pull the ear forward.
   - **Law 4 (Contact Frame & Negative Audio Space):** Landings trigger on physical contact ($t_{\text{contact}} = t_{\text{start}} + \text{duration}$). Cap density at 1 primary cue per 2–3s (4–6 hero cues per 15–20s video). Secondary watermarks, ghost dates, and hairlines remain silent. All transient peaks aligned via `sync.at`.
6. **Clean Video Export:** `body.clean-capture` auto-hides all UI, scrubber, and HUD buttons during recording. Passes `cursor: 'never'` to stream capture.

---

## 6-Phase Agent Workflow

### Phase 1: Brief
Identify:
- Topic / Product
- Duration (15-30s for opener/teaser, 30-60s for explainer/data)
- Aspect Ratio: `16:9` (Web, YouTube, Desktop) or `9:16` (TikTok, Reels, Shorts)
- Audio / Voiceover (optional)

### Phase 2: Style Brief (Three Candidates, One Pick)
DO NOT write code yet. Inspect project context (README, package.json, tech stack, domain) and propose 3 concept candidates:
- **Concept:** Pick from:
  1. **Opener Concepts (19 Variants in `references/opener-concepts.md`):** One continuous shot, pure typography, problem -> gone, before/after, journey inside UI, product macro, object metaphor, living number, one feature demo, diegetic Q&A, rhythmic collage, logo as stage, object relay, brand showcase, claim -> how -> result, living UI ecosystem, flat pop, through gradient shapes, product tour. Starter: `kinet-opener.html`.
  2. **Explainer Styles (6 Starters in `references/explainer.md`):**
     - Continuous Action Flow: `kinet-flow.html`
     - Paper & Print Collage: `kinet-collage.html`
     - Visual Editorial Dossier: `kinet-editorial.html`
     - Minimalist Studio Catalog: `kinet-catalog.html`
     - Proscenium Theatre Stage: `kinet-stage.html`
     - Vintage Blueprint & Engraving: `kinet-engraving.html`
  3. **Data & Animated Charts:** `kinet-metrics.html`
  4. **Product & E-Commerce Showcase:** `kinet-showcase.html`
  5. **Diegetic Chat Simulation:** `kinet-dialogue.html`
- **Style Direction (10 Directions):**
  1. *Cinematic Dark* (near-black, neon bloom, bold grotesk | gaming, creative tools, dev)
  2. *Poster Color-Block* (solid color fields, giant cropped letters | consumer apps, events)
  3. *Editorial Light* (cream/white, luxury display serif, hairlines | SaaS, finance)
  4. *Paper & Print* (paper texture, collage, stamps, handwriting | education, food)
  5. *Retro / Analog* (faded color, grain, scanlines, geometric | nostalgia, media)
  6. *Brutalist Mono* (B&W hard grid, monospace, hard cuts | CLI, dev tools)
  7. *Pastel Playful* (stacked pastels, rounded shapes, elastic bounce | health, lifestyle)
  8. *Luxury Dark* (black + gold/bronze, tall wide-tracked serif | luxury, auto)
  9. *Flat Pop with Photos* (stickers, photo cutouts, snapping on beat | fintech, consumer)
  10. *Grainy Gradient* (deep base, glowing shapes, fine grain, camera depth | AI, tech)
- **Palette with Source:** 1 Primary Brand HEX, 1 Background HEX, 1 Accent HEX.
- **Rationale:** Why each candidate fits the product.

### Phase 3: User Approval
Wait for the user to confirm 1 candidate or adjust parameters before generating code.

### Phase 4: Build from Official Starter
Adapt the chosen starter template from `assets/` into a single self-contained `index.html`:
- Link GSAP v3 & Three.js via CDN (jsdelivr / unpkg).
- Keep all styles and scripts inline for instant double-click viewing.
- Mount `window.OPENER = { tl, DURATION, seek, ready }` for offline renderers.

### Phase 5: Anti-PowerPoint Rules
- Persistent subject or shared world across transitions.
- Max 2 text levels per scene (min 30px font on 1080p).
- 1 shot = 1 statement (≤ 5 words per beat).

### Phase 6: Clean Ultra-HFR Export, HUD Rules, Variable Hoisting & Runtime Verification
- Autoplay, loop, and interactive timeline controls.
- **Top-Level Variable Hoisting & Zero-TDZ Rule (Preventing Frozen UI):**
  - **Mandatory Script Header Pattern:** `const Q = new URLSearchParams(location.search);` and `let isRecording = false;` MUST be declared at the very top of `<script>` immediately after DOM query helpers (`$` and `$$`).
  - **Temporal Dead Zone (TDZ) Prevention:** In ES6, `let` and `const` variables cannot be accessed prior to declaration. The timeline frame loop `(function frame() { ... })()` is an IIFE that runs synchronously on script load. Referencing `isRecording` or `Q` in `frame()` or early callbacks before their declaration throws an uncaught `ReferenceError: Cannot access 'isRecording' before initialization`, halting all JavaScript execution and leaving the UI permanently frozen at `0.00s`.
  - **Automated Headless Runtime Smoke Testing:** Always run `node scripts/test-runtime.mjs` before submitting templates. Static AST checking (`new Function()`) fails to detect runtime TDZ exceptions; the Node.js VM smoke tester simulates real script initialization to guarantee zero unhandled runtime crashes.
- **Top-Bar Action Controls Spec (`.top-bar`):**
  - Top-Right Fixed Control Container: `position: fixed; top: 20px; right: 24px; display: flex; align-items: center; gap: 10px; z-index: 100;`. Must reside outside `#stage`.
  - **HUD Toggle Button (`#btn-hud`):** Glassmorphic cyber-pill button with inline SVG gear icon (`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`) and text `HUD (H)`. Clicking this button or pressing the `H` keyboard shortcut toggles timeline HUD `#ui` visibility.
  - **Download Button (`#btn-export`):** Video export trigger with mandatory label and arrow icon: `Download <svg style="width:13px;height:13px;stroke:currentColor;stroke-width:2.5;fill:none;" viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> 240`.
  - **Immutable Export Label Contract:** The label and vector arrow icon of `#btn-export` are governed by `EXPORT_DEFAULT_HTML` and MUST NEVER revert to plain text or legacy strings like `Download Video (144 FPS)` in any `catch`, cancel, or `onstop` handler.
- **HUD & Scrubber Design Rules (Glassmorphic Cyber-Pill Spec):**
  - **Standard Minimalist 4-Element Layout:** Container `#ui` features a compact layout: `[ Play/Pause ] [ 🔊 Speaker Toggle (#btn-audio) ] [ ══════════●══════════ (#scrub) ] 0.00s (#clock)`.
  - **Redundant Controls Elimination:** Never place a restart button (`#btn-restart`) inside the HUD capsule to prevent visual clutter; restart functionality is mapped to the `R` key and scrubber.
  - **Audio Speaker Toggle Spec (`#btn-audio`):**
    - Default State: Audio unmuted with active inline SVG speaker (`#icon-audio-on`).
    - Muted State: Audio silenced with muted inline SVG speaker (`#icon-audio-off`).
    - Keyboard Shortcut: `M` key toggles audio mute/unmute state.
    - Unified Audio Routing: All Web Audio API oscillators, buffers, and SFX must route through the `mainMasterGain` node. Muting sets `mainMasterGain.gain.setValueAtTime(isAudioMuted ? 0 : 1, audioCtx.currentTime)`.
  - **Muted Video Export Pipeline:**
    - When `#btn-audio` is muted, the `Download ↑ 240` button MUST export clean video without any audio track (recording video-only stream or stripping audio tracks programmatically).
    - When audio is active, capture combines `audioDest.stream` into the recorded MediaStream.
  - **Finite Timeline & Dual-Layer Auto-Loop Engine:**
    - **Prohibition of `repeat: -1`:** NEVER attach `repeat: -1` to any child animation inside the GSAP timeline, as it sets `tl.duration()` to infinity and prevents `onComplete`.
    - **Dual-Layer Auto-Loop Guarantee:** Auto-looping is simultaneously safeguarded by two layers:
      1. GSAP Event Callback: `tl.eventCallback('onComplete', () => { if (!isRecording) tl.play(0); })`.
      2. RAF Ticker Fallback: Inside `frame()`, evaluate `if (!isRecording && !location.search.includes('clean') && t >= DURATION) { tl.play(0); return; }`.
  - **Universal Keyboard Map:**
    - `Space`: Play / Pause toggle
    - `H`: Open / Close HUD overlay
    - `M`: Mute / Unmute audio toggle
    - `R`: Restart playback from 0.00s
  - **DOM Containment Hierarchy Rule:** `#ui` / `#dbg` and `.top-bar` MUST be placed as direct children of `<body>` outside the scaled `#stage` container. Never place fixed controls inside CSS `transform` scaled elements.
  - **Zero Unstyled Elements:** Form elements (`<button>`, `<input>`) must never use browser default unstyled chrome (sharp white/grey boxes).
  - **Capsule Pill Container (`#ui` / `#dbg`):** `position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; border-radius: 9999px; padding: 8px 18px; background: rgba(9, 9, 14, 0.90); backdrop-filter: blur(16px); border: 1px solid rgba(primary, 0.35); box-shadow: 0 10px 30px rgba(0,0,0,0.6); z-index: 90; transition: all 0.24s cubic-bezier(0.16, 1, 0.3, 1);`.
  - **Toggleable State:** When `#ui` has class `.hidden`: `opacity: 0; pointer-events: none; transform: translate(-50%, 14px);`. When active: `opacity: 1; pointer-events: auto; transform: translate(-50%, 0);`.
  - **Pill Buttons (`#ui button`):** Capsule rounded (`border-radius: 9999px; padding: 6px 14px;`), dark translucent glass (`background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.14);`), white text `font-weight: 600; font-size: 12px;`, brand neon hover glow (`var(--primary)`), and active click `transform: scale(0.96)`.
  - **Custom Range Track (`#scrub`):** Height 6px, rounded pill corners, and `accent-color: var(--primary)`.
  - **Tabular Numeric Clock (`#clock`):** `font-variant-numeric: tabular-nums; min-width: 52px; text-align: right; font-weight: 600;`.
  - **Clean Recording Guarantee:** `body.clean-capture .top-bar, body.clean-capture #ui, body.clean-mode .top-bar, body.clean-mode #ui { display: none !important; }` ensures 100% clean video export without HUD or button leakage.
- **Ultra-HFR Video Exporter & Iframe Permissions Contract:**
  - **Iframe Delegation:** Any preview shell (e.g. `preview.html`) MUST attach `allow="display-capture *; autoplay *; camera *; microphone *; clipboard-write *"` to avoid browser permission denials for `navigator.mediaDevices.getDisplayMedia`.
  - **Resilient Fallback:** Screen capture attempts tab-audio first, gracefully falling back to video-only if audio is unavailable or declined. Always clean up active tracks (`stream.getTracks().forEach(t => t.stop())`).
- AI Audio Intelligence Toolchain:
  ```bash
  # 0. (Optional) Fetch curated studio SFX-Kit from wyzowl/sfx-kit (CC0)
  node scripts/fetch-sfx.mjs --archetypes

  # 1. Extract motion telemetry to Audio Manifest
  node scripts/parse-timeline.mjs assets/kinet-opener.html manifest.json

  # 2. Synthesize lossless PCM WAV SFX track (hybrid studio WAV + procedural fallback)
  node scripts/audio-synth.mjs manifest.json audio.wav

  # 3. All-in-one studio render with auto audio muxing
  node scripts/render.mjs assets/kinet-opener.html output_240fps.mp4 240
  ```

---

## 10 Master Skill Modules (`references/modules/`)

Consult these technical guides during production:
1. `01-cinematography-camera.md`: 3D camera rig, angles (Dutch, low/high), push-through, whip-pan, rack focus blur swap.
2. `02-advanced-motion-graphics.md`: Word-split kinetic typography, logo stroke draw, UI click simulation, counter animations.
3. `03-animation-physics.md`: Easing hierarchy, anticipation, follow-through, squash & stretch, SVG directional motion blur.
4. `04-transitions-choreography.md`: 7 transition archetypes, clip-path mask wipes, match cuts, persistent subject world.
5. `05-vfx-particles.md`: Deterministic PRNG canvas particles, neon bloom pulses, glassmorphism, RGB chromatic glitch.
6. `06-sound-design.md`: Zero-dependency Web Audio API synthesizer (sub-bass impacts, whoosh), BPM beat-sync math, audio ducking.
7. `07-lighting-color.md`: 3-point studio CSS lighting, volumetric god rays, film vignette, SVG micro-noise grain.
8. `08-3d-spatial-design.md`: Zero-dependency 3D laptop/phone chassis, Three.js particle helix, 3D typography drop-shadows.
9. `09-editing-post-production.md`: Speed ramping, kinetic karaoke subtitles, 144 FPS CRF 14 studio render pipeline.
10. `10-ai-production-intelligence.md`: Visual QA scorecard, storyboard generation protocol, headless keyframe snapshot inspection.

---

## Production Workbenches (`references/`)

- `shots.md`: Ready-to-use GSAP recipe cards (FPV push-in, 2.5D horizon orbit, dutch whip, specular light sweep, neon flare).
- `sequences.md`: Complete storyboard blueprints (SaaS Launch 30s, Dev Tool CLI 30s, Product Manifesto 45s, Metric Milestone 20s).
- `aesthetic-qa.md`: 10-point visual quality scorecard and focal point eye-tracking rules.
- `mockups.md`: Zero-dependency CSS 3D mockups (unibody laptop, dynamic island smartphone, browser chrome window).

