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
5. **Motivated Sound Design (100% Movement-to-SFX Lock):** Every primary keyframe event (Hero statement entrance, subtitle reveal, card stagger pop, camera whip/push-through, element exit) MUST have a mathematically synchronized procedural Web Audio SFX cue. Motion without audio feels dead; unmotivated audio feels noisy. Each sound uses non-harsh, velvety acoustic profiles (pure sine, 15ms soft attack, bandpass pink-noise air whoosh).
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

### Phase 6: Clean Ultra-HFR Export & AI Audio Intelligence
- Autoplay, loop, and `?debug=1` timeline scrubber.
- One-Click In-Browser Capture: floating 'Download Video' button with inline camera SVG vector (`<svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`) recording at up to 240 FPS, 40 Mbps bitrate with `body.clean-capture` and combined Web Audio stream. Zero OS emojis in HUD or buttons.
- AI Audio Intelligence Toolchain:
  ```bash
  # 1. Extract motion telemetry to Audio Manifest
  node scripts/parse-timeline.mjs assets/kinet-opener.html manifest.json

  # 2. Synthesize lossless PCM WAV SFX track
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


