# Anti-PPT — Scene Motion Laws

This document is the core justification for KinetRig's existence: a video that is "technically functional" still fails completely if it feels like a PowerPoint slide deck.

---

## Why AI Models Default to Slide Decks

AI models are trained to organize textual information: Title → Subtitle → Bullet points.
That structure works for technical documentation, but it is fatal for cinematic motion graphics.
A high-converting promotional video does not explain like an article — it **declares**, delivering one tactile visual impact per shot, allowing camera velocity and sound design to carry emotional weight. If a scene feels "light on information", that is often proof that the scene rhythm is correct.

---

## Anti-Pattern Violation vs. Cinematic Fix

| Anti-Pattern Slide Violation | Cinematic KinetRig Fix |
|---|---|
| OS copy-paste emojis (`🤖`, `⚡`, `🐙`, `🧠`, `🕷`) in cards, titles, or buttons | **100% Inline SVG Vectors** (`<svg viewBox="0 0 24 24">`) with brand glow; emojis pixelate on 1080p/4K and look amateurish. |
| HUD buttons, scrubber sliders, or mouse cursors recorded in exports | **Clean Capture Mode** (`body.clean-capture` auto-hides UI/HUD and passes `cursor: 'never'` to capture streams). |
| Real-time 30/60 FPS screen recording dropping frames during heavy WebGL/CSS filters | **Deterministic Ultra-HFR Offline Stepping** (`tl.time(t)` up to 240 FPS via headless Puppeteer + FFmpeg CRF 14). |
| Kicker "02 — FEATURES" + 2-line title + paragraph body + 4 chips in two columns | One statement ≤ 5 words positioned center-top + one hero product subject ascending to center. |
| Three static text lines listing three "WITHOUT X" claims | Punchy 2-word headline + single motivated motion archetype (feature demoed, object transformation, card tumble). |
| Product B reusing Product A's skin (same nebula, blue glow, font) because it copied a starter | Style strictly derived from brand B: authentic palette from brand vectors, bespoke typography, distinctive signature motion. |
| All titles ALL-CAPS bold 800 weight with identical letter staggers | Varied typography weight, selective word emphasis, alternating entry vectors, natural sentence rhythm. |
| Every claim ending in an unnecessary period | Default to no trailing period; preserve punctuation only when semantically motivated (`?` for diegetic questions). |
| Static background while foreground elements fade in and out | **Unified 3D World:** Camera physically travels through depth planes; persistent subject anchors scene transitions. |

---

## The 5 Core Anti-PowerPoint Laws

1. **One Statement, One Subject Per Shot:** A shot has at most 5 words and one focal visual subject. If a second idea emerges, it belongs in the next shot.
2. **Continuous Camera Travel:** No cross-dissolving two static containers. Move the camera in 3D space (push-through, whip pan, yaw orbit).
3. **Persistent Subjects Across Transitions:** Carry an anchor element across scenes (e.g. 3D device frame, glowing sphere, focal card) to maintain spatial continuity.
4. **Scale Hierarchy:** Titles must be ≥ 48px, subtitles ≥ 30px. Never drop below 20px on 1080p canvas.
5. **Deterministic Clocks Only:** Never use `Date.now()`, `Math.random()`, or wall-clock timing in render loops. Everything is driven by `tl.time()`.
