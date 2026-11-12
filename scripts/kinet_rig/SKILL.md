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
   - **Law 5 (Kinematic Surface-Aware Locomotion Cadence):** Walking or running locomotion MUST NOT trigger a single static audio block. Subdivide duration $T_{\text{walk}}$ by step period $T_{\text{step}} = 0.39\text{s}$ into discrete foot-plant contact frames ($T_k = T_{\text{start}} + k \times 0.39\text{s}$). Modulate micro-pitch alternating left/right feet ($\pm 3\%$, Left $\times 0.97$, Right $\times 1.03$) to eradicate the machine-gun effect. Synthesize physical ground texture matched to visual scene: organic grass/turf (lowpass noise 420Hz + 85Hz body damped to 28Hz), interior wood floor (bandpass 680Hz + 140Hz body), or stone (190Hz body).
6. **Clean Video Export:** `body.clean-capture` auto-hides all UI, scrubber, and HUD buttons during recording. Passes `cursor: 'never'` to stream capture.

---

## 6-Phase Agent Workflow

### Phase 1: Brief
Identify:
- Topic / Product
- Duration (15-30s for opener/teaser, 30-60s for explainer/data)
- Aspect Ratio: `16:9` (Web, YouTube, Desktop) or `9:16` (TikTok, Reels, Shorts) — ALWAYS ask user to specify aspect ratio before code generation. All gallery starter templates standardize to `16:9` widescreen (`1920x1080`) by default.
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
  6. **Short-Form & TikTok High-Retention Hooks:** `kinet-reel-hook.html`
  7. **B2B SaaS Macro Product Tour:** `kinet-saas-macro.html`
  8. **Modern Bento Grid Architecture:** `kinet-bento-grid.html`
  9. **Velocity Tunnel — Warp Kinetic Type:** `kinet-hud-scifi.html`
  10. **Vertical Multi-Message Split:** `kinet-split-tiktok.html`
  11. **iOS Spatial Liquid Glass & Orb:** `kinet-ios-liquid-glass.html`
  12. **Radial Audio Visualizer:** `kinet-audio-visualizer.html`
  13. **Swiss Typographic Montage:** `kinet-typographic-montage.html`
  14. **3D Refractive Glass Orb:** `kinet-liquid-orb.html`
  15. **Decrypt Glitch Terminal:** `kinet-glitch-terminal.html`
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
- Link GSAP v3 & Three.js via CDN (jsdelivr / unpkg); use `<script type="importmap">` + `<script type="module">` with `three.module.js` instead of deprecated UMD `three.min.js`.
- Keep all styles and scripts inline for instant double-click viewing.
- **Mandatory Starter Control & Studio Bridge Preservation:** NEVER strip `.top-bar`, `#ui`, `#btn-hud`, `#btn-export`, `#fps-menu`, hoisted header variables (`Q`, `isRecording`, `isExporting`), `TARGET_BRIDGE_VERSION`, `resolveBridge()`, `setExportUiState()`, or `startExport()` when adapting a starter into a new folder or custom `index.html`. Only modify scene markup, CSS visual theme, timeline choreography, and `audioManifest`.
- **Cross-Folder Self-URL Export Contract (Anti-Fallback Bug):** Inside `startExport()`, NEVER hardcode a fallback path like `'assets/kinet-opener.html'` when `location.origin !== BRIDGE`. Always pass `location.href.split('#')[0].split('?')[0]` whenever the page is NOT served directly from `BRIDGE/assets/` so files generated in ANY external folder (whether opened via `file:///...` or `http://localhost/NewProject/`) render themselves and derive their MP4 filename from their page/parent folder rather than falling back to the starter template.
- Mount `window.OPENER = { tl, DURATION, seek, ready }` for offline renderers.

### Phase 5: Anti-PowerPoint & Anti-AI Slop Laws (Tier-1 Studio Motion Standards)
- Persistent subject or shared world across transitions.
- Max 2 text levels per scene (min 30px font on 1080p).
- 1 shot = 1 statement (≤ 5 words per beat).
- **The 6 Anti-AI Slop Motion Laws (Apple/Linear/Vercel Standards):**
  1. **Law 1: Diegetic Human Typing Cadence (Zero Static Block Pasting):**
     Never spawn user prompt inputs as instantaneous pre-filled blocks. Input fields must animate keystroke typing ($v = 18\text{–}32\text{ms/char}$ with randomized micro-jitter) accompanied by an active pulsing cursor caret (`#caret`). The send button must visually acknowledge the pending buffer (glow/color transition) and physical depression (`scale: 0.85`) upon dispatch.
  2. **Law 2: Realistic Chat Delivery Logic (Anti-Double Typing Slop):**
     In conversational UI, typing indicators (`typing-dots`) represent the message generation phase. Once typing dots conclude, the incoming message bubble MUST pop into the stream fully formed (`opacity: 0, scale: 0.9` -> `opacity: 1, scale: 1`). NEVER show typing dots and then slowly type out the message inside the bubble letter-by-letter. Double typing violates real chat UX and instantly registers as clumsy AI slop. Human typing simulation belongs strictly in the input box prior to dispatch.
  3. **Law 3: Organic Physical Layout Displacement (Dynamic Push-Up):**
     Incoming messages or UI items must physically displace previous conversation items upward with spring-damped momentum (`ease: 'back.out(1.4)'` or `'power3.out'`). Spawning new elements in empty dead space violates physical realism and instantly registers as low-effort AI slop.
  4. **Law 4: Diegetic Live System Feedback (Interactive State Machine):**
     Technical terminals, verification pills, and code cards must cycle through real intermediate execution states:
     - State 0: `CONNECTING` / `INITIALIZING` (subtle amber pulse, 400ms)
     - State 1: `STREAMING` / `EXECUTING` (live monospace token paint, 600ms)
     - State 2: `VERIFIED` / `SUCCESS` (luminous emerald glow, 0.00s state reset resilience).
  5. **Law 5: Responsive 3D Spatial Parallax & Focal Tracking:**
     The viewport/device card must exhibit micro-perspective spatial depth (`perspective: 1200px`). When interaction occurs at the bottom input bar, the chassis leans toward the user (`rotateX: +4°`, `y: +12px`); when the AI delivers an architectural or code artifact, the chassis elevates and centers (`rotateX: -1°`, `y: -8px`, `scale: 1.02`), while ambient lighting gradients dynamically track the visual center of gravity.
  6. **Law 6: Mechanical Switch Tactility (SFX Lock):**
     Every keystroke, token arrival, and state change MUST lock to bespoke audio cues (mechanical clicks for typing, high-frequency digital blips for tokens, soft acoustic card thuds on message landing, and crystal chimes on terminal resolution).
  7. **Law 7: Atomic Inline Caret Lock (Anti-Ghost Caret Drift):**
     If token streaming is ever used in terminal or code environments, the glowing lead caret MUST be an inline sibling (`<span class="stream-text"></span><span class="stream-caret"></span>`). NEVER pre-render invisible character spans with `opacity: 0` that wrap onto subsequent lines ahead of the text. Streaming must use dynamic character slice interpolation (`text.slice(0, Math.floor(len))`) so the cursor remains mechanically attached to the final visible glyph without empty line drift.
  8. **Law 8: Chat Viewport Containment & Header Collision Law (Anti-Z Overlap):**
     Messages inside conversational feeds must NEVER be translated upward into negative coordinates that escape their container or overlap `.chat-header`. All message items must reside inside a dedicated `.chat-viewport` with `overflow: hidden;` and an alpha gradient top mask (`mask-image: linear-gradient(to bottom, transparent 0%, black 20px, black 100%)`). Upward translation must be applied exclusively to the internal stream track (`#chatStream`), cleanly clipping overflowing items below the header capsule.
  9. **Law 9: Strict Nested Card & Terminal Box Fit Law (Anti-Overflow Protrusion):**
     Embedded UI cards, code blocks, or terminal containers inside message streams MUST use `width: 100%; box-sizing: border-box; min-width: 0;` and their wrapper bubble must remove restrictive padding and background constraints (`.msg.msg-terminal { max-width: 100%; width: 100%; padding: 0; background: transparent; border: none; }`). NEVER specify rigid hardcoded pixel `min-width` (e.g. `min-width: 580px`) on child elements that exceed the parent bubble width, as it causes ugly lateral overflow and edge protrusion.
  10. **Law 10: Dolly Zoom (Vertigo Effect) & Inverse FOV Compression:**
     When executing a Vertigo dolly zoom, the camera dolly movement along the Z-axis MUST be counter-balanced by an inverse scale/field-of-view tween on the foreground hero element ($S_{\text{hero}} \times Z_{\text{cam}} = \text{const}$). The foreground subject remains locked in perceived scale while the background plane compresses or expands, producing cinematic vertigo without perspective popping.
  11. **Law 11: WebGL/SVG Chromatic Aberration & RGB Split Distortion:**
     VFX glitch passes must use mathematical deterministic channel shifting. High-impact cuts separate Red and Blue channels laterally ($\Delta x = \pm 6\text{px}$ to $\pm 14\text{px}$) for exactly 2–4 frames (0.05s–0.10s) with exponential decay. Never use random noise shaders or unbounded screen shake that breaks timeline reproducibility.
  12. **Law 12: TikTok & Reel 9:16 Safe-Zone & Aspect-Ratio Isolation:**
     In vertical 9:16 layouts (`1080x1920`), all crucial interactive elements, titles, and callouts MUST stay strictly within the universal safe zone:
     - Top 15% (0–288px) clear for account header, search bar, and sound icon.
     - Bottom 20% (1536–1920px) clear for creator caption, sound title, and system nav.
     - Right 12% (950–1080px) clear for engagement action buttons (Like, Comment, Share).
     - Center 80% box is the primary stage area (`max-width: 864px`).
  13. **Law 13: Template Combination Intelligence & Conflict Resolution:**
     Enforce combination harmony:
     - *Punch Hook:* Kinetic Typography + Camera Punch-in + Bass Impact SFX (`power4.out`).
     - *Spatial Feature Tour:* Macro UI Card + Camera Pan/Dolly + Subtle Depth-of-Field Blur.
     - *Cyber Metric:* Infographic Counter + Line Drawing + Procedural FM Telemetry Beep.
     - *Rule of Exclusivity:* Never pair a 3D Camera Orbit with an active Whip Pan in the same 0.5s window. If both are triggered, suppress the Whip Pan and convert it into an accelerated Orbit pass.
     - *Audio Voice Cap:* Limit simultaneous audio trigger events to a maximum of 3 concurrent voices (1 room drone, 1 rhythmic pulse, 1 hero impact) to prevent clipping.
  14. **Law 14: Deterministic Fluid Mesh & Viscous Liquid Dynamics:**
     Liquid morphs must use SVG `feTurbulence` (`baseFrequency="0.04 0.02"`) paired with `feDisplacementMap` (`scale="28"`) where `baseFrequency` is driven as a pure function of `tl.time()`, ensuring 100% reproducible frame-by-frame rendering.
  15. **Law 15: Character Facial Rigging & Lip-Sync Anatomy Law (Anti-Slop Hollow/Spike Mouth):**
     - **Prohibition of Hollow Wireframe Mouths:** Animated character mouths must NEVER be rendered as empty stroke outlines (`fill: 'none'`) revealing background skin color during speech. Any open speaking viseme MUST contain a dark anatomical oral cavity fill (`#38131B` or `#3D1219`).
     - **Mandatory Anatomical Triad (Cavity + Teeth + Tongue):** All open vowel phonemes (`A`, `E`, `O`, `L`) must display upper pearly white teeth (`#FFFFFF`) anchored beneath the upper lip contour and a soft warm pink tongue (`#DE6476` / `#E26D7C`) resting along the lower jaw arc.
     - **Mandatory SVG `<clipPath>` Oral Cavity Containment (Anti-Protruding Tongue/Teeth):** Teeth (`rect`) and tongue (`ellipse` / `path`) entities inside the mouth group MUST ALWAYS be encapsulated inside a nested `<g clip-path="url(#mouth-clip-...)">` bound to a dedicated `<clipPath>` whose child `<path>` mirrors the oral cavity geometry (`d: VISEME_DEFS.rest.cavity`). When tweening visemes (`viseme()` or morphing), the clipPath's `<path>` MUST morph simultaneously with `mCavity` (`tl.to([m.cavity, m.clipPath], { attr: { d: def.cavity } ... })`). This renders it physically and mathematically impossible for the tongue ellipse or teeth rectangle to protrude outside the mouth boundary or spill onto the chin/jawline.
     - **SVG Path Topology Invariance (Anti-Spike Morph Glitch):** When animating phonemes with GSAP without MorphSVGPlugin, all viseme path strings (`cavity`) MUST share an identical cubic bezier command signature: `M x1 y1 C cp1x cp1y cp2x cp2y x2 y2 C cp3x cp3y cp4x cp4y x1 y1 Z` (exactly 14 numeric tokens across all phonemes). Morphing between mismatched point counts generates numeric index misalignments, creating hideous downward triangular spikes and distorted geometric beak artifacts.
     - **Smooth Rounded U-Bowl Jaw Curves (Zero V-Wedge Spikes):** The lower jaw control points of viseme `A` must curve smoothly horizontally (`C 14 -28 -14 -28 -15 -46`), retaining a natural rounded chin boundary with ≥24px clearance above the jawline. Never converge control points to a single acute vertex.
     - **Decoupled Closed Resting State:** When silent (`rest` or `MBP`), oral cavity, teeth, and tongue cleanly fade (`opacity: 0`), revealing a clean, expressive single-stroke lip line (`LN('M -14 -44 C -5 -36 5 -36 14 -44', C.ink, 3.5)`).
  16. **Law 16: Mandatory Smooth Chromatic & Mood Transition Law (Anti-Abrupt Color Snapping):**
     Any dramatic shift in background color, ambient lighting, accent hue, or emotional tone (e.g., from urgent alert crimson to deep cyberpunk violet/gold) MUST be executed through a continuous, smooth interpolation over $0.4\text{s} - 0.8\text{s}$ using GSAP color/gradient tweens (`ease: 'power2.inOut'` or `'power3.out'`), accompanied by motivated optical vehicles (expanding radial bloom waves, chromatic split decay, or directional light sweeps). Strictly prohibit 0-duration binary color cuts (`tl.set` or instant filter swapping), which register as jarring, unmotivated glitches and cheap slide deck artifacts.
  17. **Law 17: Architectural Layer Stacking & Specimen Evidence Isolation Law (Anti-Gridline Slicing & Anti-Underlayer Occlusion):**
     In blueprint, catalog, or technical layout archetypes featuring architectural gridlines, specimen cutouts, and archive evidence documents:
     - **Drafting Grid Tier (`z-index: 0 - 1`):** Background grid elements (`#swissGrid`, `#cadGrid`) MUST be isolated to the lowest visual tier with low opacity (`0.08 - 0.16`). Structural gridlines must cleanly run *behind* all content cards.
     - **Specimen Macro Tier (`z-index: 4 - 6`):** Foreground specimen cards, hero photo cutouts, and secondary macro viewports (`#cutA`, `#cutB`, `.ph`) sit in the intermediate stacking context and MUST feature a 100% opaque background fill (solid `#FFFFFF` or `#0D0E15`).
     - **Evidence & Callout Tier (`z-index: 10 - 15`):** Overlapping evidence artifacts, archive specification documents, rubber stamps, and date blocks (`.doc`, `#docA`, `#stA`, `#sbA`) MUST be elevated to the top stacking tier (`z-index: 10 - 15`) with deep cast shadows (`box-shadow: 0 30px 34px rgba(20,20,20,.16)`). Evidence sheets must land crisp and visible *on top* of specimen cutouts, never occluded, clipped, or trapped underneath secondary macro cards.
  18. **Law 18: Universal CORS-Free Protocol Guard & Dual-Tier Audio Law (Anti-Origin-Null Fetch Block):**
     - **Browser `file:///` CORS Security Restriction:** Modern browsers (Chrome, Edge, Firefox, Safari) enforce strict security boundaries where pages opened directly via double-click on disk (`file:///`) have an opaque origin (`origin: 'null'`). Any relative fetch (`fetch('../sfx/...')` or `fetch('sfx/...')`) resolves to a `file:///` URI and is unconditionally rejected by browser CORS policy, dumping red `net::ERR_FAILED` errors into the DevTools console.
     - **Protocol Detection Guard:** The audio prefetching pipeline in `fetchSfxArrayBuffer(rel)` MUST inspect `location.protocol`. If running under `file:` protocol:
       1. NEVER query relative local disk paths via `fetch()`.
       2. If offline (`navigator.onLine === false`), return `null` immediately without attempting network activity.
       3. If online, ONLY fetch from CORS-enabled HTTPS CDN (`https://raw.githubusercontent.com/wyzowl/sfx-kit/main/${rel}`). Do NOT use jsDelivr (`cdn.jsdelivr.net/gh/wyzowl/sfx-kit@main`) as it returns HTTP 403 Forbidden.
       4. Only probe relative disk paths (`../sfx/`, `sfx/`) when running under `http:` or `https:`.
     - **Mandatory SFX Path Architecture (`wyzowl/sfx-kit`):**
       The `wyzowl/sfx-kit` sound repository stores audio assets strictly under the `sounds/<category>/<file>.wav` structure.
       1. `SFX_CDN_BASE` MUST be `https://raw.githubusercontent.com/wyzowl/sfx-kit/main`. NEVER append `/sfx` to the base URL and NEVER use `cdn.jsdelivr.net/gh/wyzowl/sfx-kit@main` (403 Forbidden).
       2. Every relative path in `STUDIO_SFX` MUST start with `sounds/<category>/`. Category names:
          - Interface/clicks: `sounds/interface/click-tap-soft.wav`, `sounds/interface/click-snap-soft.wav` (NEVER `clicks/...`)
          - Risers/fallers: `sounds/risers-and-fallers/riser-1s-soft.wav` (NEVER `whooshes/riser...`)
          - Foley: `sounds/foley/foley-card-touch.wav`, `sounds/foley/foley-paper-slide.wav` (NEVER `foley/...`)
          - Impacts: `sounds/impacts/impact-deep-soft.wav`, `sounds/impacts/impact-medium-firm.wav` (NEVER `impacts/...`)
          - Digital: `sounds/digital/digital-blip-clear.wav` (NEVER `digital/...` without `sounds/`)
          - Tones: `sounds/tones/tone-step-2.wav` (NEVER `tones/...` without `sounds/`)
          - Whooshes: `sounds/whooshes/whoosh-medium-soft.wav` (NEVER `whooshes/...` without `sounds/`)
          - Pops: `sounds/pops/pop-small-in.wav`
       3. Omission of the `sounds/` top-level directory or invalid category aliases produces 404 Not Found errors on both local disk and CDN.
     - **Zero-Dependency Procedural Fallback Law:** Every audio event triggered via `triggerSfx(sfxId, fallbackFn, gain)` MUST carry a functional mathematical procedural synthesizer fallback (`fallbackFn`). When external WAV files are unreachable (offline `file://` usage, CDN down, or network drop), the procedural Web Audio oscillator/noise synthesizer immediately executes. The animation maintains 100% audio choreography with zero audible silence and zero console errors.
     - **JIT On-Demand Audio Auto-Download Law (Zero Manual Downloads):**
       AI agents and users do NOT need to manually download or pre-install the 67MB library. KinetRig features automatic Just-In-Time (JIT) audio downloading:
       1. **Studio Bridge Auto-Caching (`server.mjs`):** When templates request `/sfx/sounds/...`, if the WAV file is not yet cached on disk, the local bridge automatically streams the file from GitHub, caches it permanently to `sfx/sounds/...`, and serves it with HTTP 200.
       2. **Headless Render Auto-Prefetch (`audio-synth.mjs`):** Before offline MP4 muxing, `prefetchManifestSounds(audioManifest)` verifies required sounds and downloads missing WAVs directly into `sfx/sounds/`.
       3. **In-Browser CDN Fallback:** If standalone without bridge, `fetchSfxArrayBuffer()` directly streams the sound from the CORS-enabled GitHub/jsDelivr CDN.
       Result: The local `sfx/` library grows automatically based on whatever sounds each animation needs, with zero bloat and zero manual commands.
     - **Local Offline WAV Playback via Studio Bridge:** To load uncompressed local WAV sound effects without internet, always serve the project through the local studio bridge (`node scripts/server.mjs` on `http://127.0.0.1:4004`), which serves all static audio assets with `Access-Control-Allow-Origin: *` and proper `audio/wav` headers.
  19. **Law 19: Dual-Mode Zero-Refusal Export Architecture (Anti-`ERR_CONNECTION_REFUSED`):**
     - **Root Cause of Port 4004 Connection Refusal:** Blindly calling `fetch('http://127.0.0.1:4004/api/health')` when a template is opened standalone (e.g. `file:///` or standard dev servers without `server.mjs` running) causes the OS TCP stack to reject the handshake with RST, forcing Chromium to dump red `net::ERR_CONNECTION_REFUSED` errors into DevTools for every framerate selection.
     - **Host-Aware Environment Guard:** `startExport(targetFps)` and showroom exporters MUST check the host origin before attempting any bridge communication:
       ```javascript
       const isStudioServer = (typeof location !== 'undefined') && (
         location.port === '4004' ||
         location.host.includes('4004') ||
         (typeof Q !== 'undefined' && Q.has('studio'))
       );
       ```
     - **Zero-Refusal Branching Law:**
       1. **Studio Host Mode (`isStudioServer === true`):** When hosted directly on port 4004 or with explicit `?studio=1`, verify `/api/health` and dispatch deterministic Puppeteer + FFmpeg frame-stepping rendering via `/api/render` with live SSE progress.
       2. **Standalone Client Mode (`isStudioServer === false`):** When opened standalone via `file:///` or non-studio servers, route immediately to native in-tab browser capture (`getDisplayMedia` + `MediaRecorder`) at the selected target FPS (`60`, `120`, `144`, `240`). NEVER blind-probe port 4004, guaranteeing zero network exceptions and 0 console errors across all framerates.

### Phase 6: Clean Ultra-HFR Export, HUD Rules, Variable Hoisting & Runtime Verification
- **Mandatory Autoplay, Seamless Auto-Loop & `window.OPENER` Studio Contract:**
  - **The Frozen-at-0 Initialization Bug:** When `tl = gsap.timeline({ paused: true })` is declared, the timeline will sit permanently frozen at frame 0 (`0.00s`) unless an explicit startup routine executes. Checking `t >= DURATION` inside `frame()` never triggers because `t` starts at 0 and never advances while paused.
  - **Mandatory Startup Protocol (`startPlayback` & `window.OPENER`):** Every template MUST establish `window.OPENER` and fire `startPlayback` as soon as fonts are loaded:
    ```javascript
    const seek = t => {
      tl.pause();
      tl.time(t, false);
      if (window.gsap && gsap.ticker && gsap.ticker.tick) gsap.ticker.tick();
    };

    window.OPENER = {
      W: 1920, H: 1080, DURATION, tl, ready: false, seek,
      play() { tl.play(0); initAudio(); }
    };

    const startPlayback = () => {
      window.OPENER.ready = true;
      if (!location.search.includes('clean')) {
        tl.play(0);
        if (btnPlay) btnPlay.textContent = 'Pause';
        tl.eventCallback('onComplete', () => {
          if (!isRecording && !location.search.includes('clean')) {
            tl.pause(0);
            tl.play(0);
          }
        });
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(startPlayback).catch(startPlayback);
    } else {
      startPlayback();
    }
    ```
  - **Dual-Layer Auto-Loop Protection:** In `frame()`, loop seamlessly when timeline completes:
    ```javascript
    if (!isRecording && !location.search.includes('clean') && (t >= DURATION || tl.progress() >= 1)) {
      tl.pause(0);
      tl.play(0);
    }
    ```
  - **Showroom Audio Unlock Listener (User-Activation Guarded):** Listen for postMessage from preview shells, but NEVER create/resume `AudioContext` until `navigator.userActivation.hasBeenActive` is true inside the frame itself:
    ```javascript
    const hasBrowserGesture = () => (typeof navigator === 'undefined' || !navigator.userActivation || navigator.userActivation.hasBeenActive);
    window.addEventListener('message', e => {
      if (e.data === 'UNLOCK_AUDIO' || (e.data && e.data.type === 'UNLOCK_AUDIO')) markUserInteracted();
    });
    ```
- **Top-Level Variable Hoisting & Zero-TDZ Rule (Preventing Frozen UI):**
  - **Mandatory Script Header Pattern:** `const Q = new URLSearchParams(location.search);` and `let isRecording = false, isExporting = false;` MUST be declared at the very top of `<script>` immediately after DOM query helpers (`$` and `$$`).
  - **Temporal Dead Zone (TDZ) Prevention:** In ES6, `let` and `const` variables cannot be accessed prior to declaration. The timeline frame loop `(function frame() { ... })()` and saved-settings bootstrap (`syncDefaultFpsUi`) run synchronously on script load. Referencing `isRecording`, `isExporting`, or `Q` before their declaration throws an uncaught `ReferenceError: Cannot access '...' before initialization` (even inside `typeof` guards), halting all JavaScript execution and leaving the UI permanently frozen at `0.00s`.
  - **Automated Headless Runtime Smoke Testing:** Always run `node scripts/test-runtime.mjs` before submitting templates. Static AST checking (`new Function()`) fails to detect runtime TDZ exceptions; the Node.js VM smoke tester simulates real script initialization to guarantee zero unhandled runtime crashes.
- **Top-Bar Action Controls Spec (`.top-bar`):**
  - Top-Right Fixed Control Container: `position: fixed; top: 20px; right: 24px; display: flex; align-items: center; gap: 10px; z-index: 100;`. Must reside outside `#stage`.
  - **HUD Toggle Button (`#btn-hud`):** Glassmorphic cyber-pill button with inline SVG gear icon (`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`) and text `HUD (H)`. Clicking this button or pressing the `H` keyboard shortcut toggles timeline HUD `#ui` visibility.
  - **Unified Action-Dropdown Download Button (`#btn-export` + `#fps-menu`):** Single unified cyber-pill button wrapped inside `.export-dropdown` with mandatory label, vector arrow icon, and chevron: `Download <svg style="width:13px;height:13px;stroke:currentColor;stroke-width:2.5;fill:none;" viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> 240 ▾`. NEVER use two separate controls (such as a separate `<select>` dropdown alongside the export button). Clicking `#btn-export` toggles the overlay glassmorphic menu `#fps-menu` (`240 FPS (Studio)`, `144 FPS`, `120 FPS`, `60 FPS`). Clicking any framerate choice instantly closes the menu and dispatches automatic rendering and download (`startExport(fps)`). Document click listeners dismiss the menu when clicking outside.
  - **Immutable Export Label Contract:** The label and vector arrow icon of `#btn-export` are governed by `EXPORT_DEFAULT_HTML` and MUST NEVER revert to plain text or legacy strings like `Download Video (144 FPS)` in any `catch`, cancel, or `onstop` handler.
  - **Zero-Prompt Studio Bridge & Hardware Acceleration Architecture:**
    - **Persistent Auto-Wake Bridge Daemon & Cross-Folder Rendering:** The export handler (`resolveBridge()`) queries candidate endpoints (`http://127.0.0.1:4004`, `http://localhost:4004`, and local `api/bridge.php` Auto-Wake endpoints). When running from ANY external folder (`file:///...` or another local web root), `startExport()` sends the page's clean full URL (`location.href.split('#')[0].split('?')[0]`) to `/api/render`, where `server.mjs` and `render.mjs` accept `http(s)://` and `file://` `.html` targets directly instead of limiting renders to `assets/`. If an older bridge version is active, `resolveBridge()` automatically triggers `POST /api/restart`.
    - **Silent Background Execution (`windowsHide: true`):** All FFmpeg probing, hardware encoding (`spawn` / `spawnSync`), and `bridge.php` daemon spawns execute hidden (`windowsHide: true` / `-WindowStyle Hidden`) so no terminal window pops up during rendering.
    - **Standalone Machine Prerequisites:** Viewing and playing animations works with zero dependencies in any browser. For 1-click MP4 rendering on a fresh machine/environment without a running Studio Bridge on port `4004` (and without Laragon/PHP Auto-Wake), the host requires Node.js, `npm install` (`puppeteer-core`), `ffmpeg` on PATH, and `node scripts/server.mjs` running in the KinetRig directory.
    - **Headless WebGL Stability Law:** Chromium headless instances must launch with `--use-gl=swiftshader` and `--no-sandbox`. Using `--use-gl=angle` on Windows causes Three.js WebGL context initialization to freeze without a physical display handle, hanging the headless page. SwiftShader ensures 100% stable 3D shader and canvas initialization in < 500ms.
    - **Font Race Law:** Web font readiness (`document.fonts.ready`) must be raced against a 3000ms safety timeout (`Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 3000))])`) to prevent headless render hangs caused by tracking prevention or network font latency.
    - **Hardware-Accelerated Encoding (GPU & Platform Agnostic):** Multi-tier FFmpeg encoder auto-detection prioritizes hardware silicon:
      - NVIDIA GPUs (RTX/GTX): `h264_nvenc` with preset `p5`, constant quality `-cq 16`.
      - Apple Silicon (M1/M2/M3/M4): `h264_videotoolbox` with `-q:v 65`.
      - Intel QuickSync: `h264_qsv` with `-preset veryfast`.
      - AMD GPUs: `h264_amf` with `-quality speed`.
      - Fallback: `libx264 -preset ultrafast -crf 18`.
    - **Inline Real-Time Telemetry:** Button UI displays live deterministic progression (`Connecting Studio...` -> `Rendering 240 FPS (XX%)` -> `Saving MP4...` -> `Downloaded!`), automatically downloading the resulting MP4 blob to the user's browser with zero interruptions.
- **HUD & Scrubber Design Rules (Glassmorphic Cyber-Pill Spec):**
  - **Standard Minimalist 4-Element Layout:** Container `#ui` features a compact layout: `[ Play/Pause ] [ 🔊 Speaker Toggle (#btn-audio) ] [ ══════════●══════════ (#scrub) ] 0.00s (#clock)`.
  - **Redundant Controls Elimination:** Never place a restart button (`#btn-restart`) inside the HUD capsule to prevent visual clutter; restart functionality is mapped to the `R` key and scrubber.
  - **Audio Speaker Toggle Spec (`#btn-audio`):**
    - Default State: Audio unmuted with active inline SVG speaker (`#icon-audio-on`).
    - Muted State: Audio silenced with muted inline SVG speaker (`#icon-audio-off`).
    - Keyboard Shortcut: `M` key toggles audio mute/unmute state.
    - Unified Audio Routing: All Web Audio API oscillators, buffers, and SFX must route through the `mainMasterGain` node. Muting sets `mainMasterGain.gain.setValueAtTime(isAudioMuted ? 0 : 1, audioCtx.currentTime)`.
  - **Muted Video Export Pipeline & Deterministic Web Audio Capture:**
    - When `#btn-audio` is muted (`isAudioMuted === true`), `startExport()` forwards `&muted=1` to `/api/render` so the exported MP4 omits the audio track cleanly (and screen recording strips audio tracks).
    - When unmuted, `render.mjs` deterministically captures live browser Web Audio (`AudioContext` -> virtual-time `OfflineAudioContext` stereo WAV + any `<audio src>` voiceover) in sync with GSAP timeline frames (falling back to `audioManifest` / `parse-timeline.mjs` only if zero Web Audio nodes schedule).
    - During screen capture, capture combines `audioDest.stream` into the recorded MediaStream.
  - **Finite Timeline & Dual-Layer Auto-Loop Engine:**
    - **Prohibition of `repeat: -1`:** NEVER attach `repeat: -1` to any child animation inside the GSAP timeline, as it sets `tl.duration()` to infinity and prevents `onComplete`.
    - **RAF Continuity & Non-Terminating Loop Law (Preventing Frozen Scrubber at Max Duration):** In recursive animation loops `(function frame() { ... })()`, ALWAYS place `requestAnimationFrame(frame);` at the very top of `frame()`, and NEVER use an early `return;` when rewinding `t >= DURATION`. An early `return;` skips `requestAnimationFrame(frame)`, permanently terminating the RAF recursion while GSAP loops in the background, causing the scrubber thumb and clock text to freeze permanently at max duration (e.g., `9.00s`).
    - **Loop State Invariance Law (Zero Position & Camera Drift on Looping):**
      - **Prohibition of Relative Accumulators on Coordinates:** NEVER use relative string tweens (`x: '+=' + dx`, `y: '+=' + dy`) on character roots, cameras, or persistent elements. Relative tweens accumulate unbounded displacement across loop cycles and fail to rewind cleanly. ALWAYS use bounded `fromTo` (`tl.fromTo(node, { x: 0 }, { x: dx })`).
      - **Explicit Baseline State Registration at `0.00s`:** In multi-scene or camera-driven timelines, every scene container, camera coordinate (`cam.x`, `cam.y`, `cam.z`, `cam.ox`, `cam.oy`), and visual element MUST register its initial baseline state at `0.00s` on the timeline (`tl.set(P1.g, { display: 'block' }, 0); tl.set(P2.g, { display: 'none' }, 0); tl.set(P1.cam, { ox: 0, oy: 0 }, 0)`). This guarantees that rewinding, scrubbing backward, or looping (`tl.play(0)`) returns 100% cleanly to frame 0.00s with zero ghost scene visibility or half-way camera jump cuts.
    - **Dual-Layer Auto-Loop Implementation & Studio Bridge Preview Continuity Law:**
      - **Studio Bridge Preview Continuity:** During Studio Bridge exports (`/api/render`), headless Puppeteer renders on the server in a separate background instance. The user's active browser tab is NOT capturing screen canvas. Therefore, `isRecording` MUST remain `false` (only `isExporting = true` locks the button), allowing the preview timeline to loop continuously (`tl.pause(0); tl.play(0)`) without freezing at `DURATION` (e.g. `10.01s`). `isRecording` is ONLY set to `true` during client-side screen recording (`MediaRecorder`).
      1. GSAP Event Callback: `tl.eventCallback('onComplete', () => { if (!isRecording) { tl.pause(0); tl.play(0); } });`
      2. Non-Terminating RAF Frame Loop:
         ```javascript
         (function frame() {
           requestAnimationFrame(frame);
           const t = tl.time();
           const curDisplay = Math.min(t, DURATION);
           clock.textContent = curDisplay.toFixed(2) + 's';
           if (!scrubbing) scrub.value = String((curDisplay / DURATION) * 1000);
           if (!isRecording && !location.search.includes('clean') && (t >= DURATION || tl.progress() >= 1)) {
             tl.pause(0);
             tl.play(0);
           }
         })();
         ```
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
  - **Live Export Controls & Dropdown State Law (Mandatory for ALL Generated Templates):**
    EVERY generated template MUST embed the unified dual-state export dropdown in `.top-bar`:
    ```html
    <div class="export-dropdown" style="position: relative;">
      <button class="btn-action" id="btn-export" title="Select Framerate & Export Video">
        <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="19" x2="12" y2="5"/></svg>
        <span id="btn-export-text" style="display:inline-flex;align-items:center;gap:4px;">Download <svg style="width:13px;height:13px;stroke:currentColor;stroke-width:2.5;fill:none;" viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> 240</span>
        <svg style="width:11px;height:11px;stroke:currentColor;stroke-width:2.5;fill:none;margin-left:2px;" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="fps-menu" id="fps-menu">
        <div id="fps-options-group">
          <div style="font-size: 10px; color: #64748B; font-weight: 700; text-transform: uppercase; padding: 4px 10px 6px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 4px;">Choose Framerate</div>
          <button class="fps-item" data-fps="240"><span>240 FPS (Studio)</span><span style="font-size:10px;color:var(--primary);background:rgba(0,245,255,0.15);padding:2px 6px;border-radius:4px;">True HFR</span></button>
          <button class="fps-item" data-fps="144"><span>144 FPS</span></button>
          <button class="fps-item" data-fps="120"><span>120 FPS</span></button>
          <button class="fps-item" data-fps="60"><span>60 FPS (Fast)</span></button>
        </div>
        <div id="render-controls-group" style="display: none;">
          <div style="font-size: 10px; color: #64748B; font-weight: 700; text-transform: uppercase; padding: 4px 10px 6px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 4px;">Render Controls</div>
          <button class="fps-item" id="btn-render-pause">
            <svg id="icon-pause" viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2.5;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            <svg id="icon-resume" viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:currentColor;stroke-width:1;display:none;"><polygon points="6 4 20 12 6 20 6 4"/></svg>
            <span id="label-render-pause">Pause Render</span>
          </button>
          <button class="fps-item danger" id="btn-render-cancel" style="color: #f87171;">
            <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2.5;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <span>Cancel Render</span>
          </button>
        </div>
      </div>
    </div>
    ```
    - **Dual Dropdown State Logic:**
      - **Idle State:** Clicking `#btn-export` toggles `#fps-menu` showing `#fps-options-group` (`240`, `144`, `120`, `60 FPS`).
      - **Rendering State (`isExporting === true`):** Clicking `#btn-export` toggles `#fps-menu` showing `#render-controls-group`.
      - **Pause/Resume:** `#btn-render-pause` calls `/api/pause` or `/api/resume`, toggles icon and label.
      - **Cancel:** `#btn-render-cancel` calls `/api/cancel`, aborts fetch via `AbortController`, terminates Puppeteer, cleans up temp files, and restores button to `EXPORT_DEFAULT_HTML`.
    - **Required CSS Contract for Dropdown Overlay:**
      ```css
      .export-dropdown { position: relative; }
      .fps-menu {
        display: none; position: absolute; top: calc(100% + 8px); right: 0;
        background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(0, 245, 255, 0.35);
        border-radius: 12px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.7), 0 0 20px rgba(0,245,255,0.15);
        padding: 6px; min-width: 175px; z-index: 120; flex-direction: column; gap: 3px;
      }
      .fps-menu.open { display: flex; }
      .fps-item {
        background: transparent; border: none; color: #E2E8F0;
        font-family: inherit; font-size: 12px; font-weight: 600;
        padding: 8px 10px; border-radius: 8px; text-align: left; cursor: pointer;
        display: flex; align-items: center; justify-content: space-between;
        transition: all 0.15s ease; width: 100%; box-sizing: border-box;
      }
      .fps-item:hover {
        background: rgba(0, 245, 255, 0.2); color: #00F5FF; transform: translateX(2px);
      }
      .fps-item.danger:hover {
        background: rgba(239, 68, 68, 0.2); color: #F87171;
      }
      ```
    - **Required JavaScript Export & Dropdown Toggle Law:**
      ```javascript
      if (btnExport && fpsMenu) {
        btnExport.onclick = (e) => {
          e.stopPropagation();
          fpsMenu.classList.toggle('open');
        };
        document.addEventListener('click', (e) => {
          if (fpsMenu && !fpsMenu.contains(e.target) && e.target !== btnExport) {
            fpsMenu.classList.remove('open');
          }
        });
        if (fpsOptionsGroup) {
          fpsOptionsGroup.querySelectorAll('.fps-item').forEach(item => {
            item.onclick = (e) => {
              e.stopPropagation();
              fpsMenu.classList.remove('open');
              startExport(Number(item.dataset.fps) || 240);
            };
          });
        }
      }
      ```
  - **Multi-Platform Hardware Encoder Acceleration (Universal GPU & CPU Fallback):**
    - The rendering pipeline (`render.mjs`) auto-detects host hardware encoders in order of priority:
      1. **NVIDIA GPUs (RTX / GTX):** `-c:v h264_nvenc -preset p5 -cq 16 -pix_fmt yuv420p`
      2. **Apple Silicon / macOS:** `-c:v h264_videotoolbox -q:v 65 -pix_fmt yuv420p`
      3. **Intel Integrated Graphics (UHD / Iris / Arc):** `-c:v h264_qsv -preset veryfast -global_quality 20 -pix_fmt yuv420p`
      4. **AMD GPUs / APUs:** `-c:v h264_amf -quality speed -rc cqp -qp_i 18 -qp_p 20 -pix_fmt yuv420p`
      5. **CPU Fallback (Laptops / Cloud VPS):** `-c:v libx264 -preset ultrafast -crf 18 -pix_fmt yuv420p`
- **Ultra-HFR Video Exporter & Iframe Permissions Contract:**
  - **Iframe Delegation:** Any preview shell (e.g. `preview.html`) MUST attach `allow="display-capture *; autoplay *; camera *; microphone *; clipboard-write *"` to avoid browser permission denials for `navigator.mediaDevices.getDisplayMedia`.
  - **Resilient Fallback:** Screen capture attempts tab-audio first, gracefully falling back to video-only if audio is unavailable or declined. Always clean up active tracks (`stream.getTracks().forEach(t => t.stop())`).
- AI Audio Intelligence Toolchain:
  ```bash
  # 0. (Optional) Fetch curated studio SFX-Kit from wyzowl/sfx-kit (CC0)
  node scripts/fetch-sfx.mjs --archetypes

  # 1. Classify brief, recommend style & palette
  node scripts/director.mjs classify "Fast developer CLI build tool in Rust"

  # 2. Check 16:9 / 9:16 safe-zone & collision compliance
  node scripts/director.mjs check-safezone assets/kinet-opener.html --ratio 9:16

  # 3. Synchronize SRT captions to timeline with phoneme visemes
  node scripts/director.mjs captions captions.srt

  # 4. Extract motion telemetry to Audio Manifest
  node scripts/parse-timeline.mjs assets/kinet-opener.html manifest.json

  # 5. Synthesize lossless PCM WAV SFX track (hybrid studio WAV + procedural fallback)
  node scripts/audio-synth.mjs manifest.json audio.wav

  # 6. Zero-dependency Studio Local Bridge Server (for in-browser 1-click true 240 FPS export)
  node scripts/server.mjs
  # Or with custom port: node scripts/server.mjs 4004

  # 7. All-in-one studio render with auto audio muxing
  node scripts/render.mjs assets/kinet-opener.html output_240fps.mp4 240
  ```

---

## 11 Master Skill Modules (`references/modules/`)

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
11. `11-character-facial-rigging-lipsync.md`: 2D character facial rigging, anatomical oral cavity, teeth & tongue layering, SVG viseme topology invariance, anti-spike jaw smoothing.

---

## Production Workbenches (`references/`)

- `shots.md`: Ready-to-use GSAP recipe cards (FPV push-in, 2.5D horizon orbit, dutch whip, specular light sweep, neon flare).
- `sequences.md`: Complete storyboard blueprints (SaaS Launch 30s, Dev Tool CLI 30s, Product Manifesto 45s, Metric Milestone 20s).
- `aesthetic-qa.md`: 10-point visual quality scorecard and focal point eye-tracking rules.
- `mockups.md`: Zero-dependency CSS 3D mockups (unibody laptop, dynamic island smartphone, browser chrome window).


