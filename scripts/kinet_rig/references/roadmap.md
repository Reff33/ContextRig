# KinetRig Engine Development Roadmap

Maintained so developers and AI agents understand architectural origins, battle-tested laws, and future engineering vectors.

---

## Proven Architectural Pillars (Never Regress From Here)

- **One Statement, One Hero Subject Per Scene:** Maximum 5 words per beat.
- **Unified 3D Camera Rig (`#world` / `#camera`):** Backgrounds scale naturally in 3D perspective; push-through transitions only when motivated.
- **Zero OS Emojis Everywhere:** 100% resolution-independent inline SVG vectors (`<svg viewBox="0 0 24 24">`).
- **Directional SVG Motion Blur:** `feGaussianBlur` filtering to prevent high-velocity strobing.
- **Deterministic 144–240 FPS Stepping:** All animations tied strictly to `tl.time()`, enabling zero dropped frames in offline exports.
- **Pre-Delivery Visual Keyframe Verification:** Automated snapshot inspection (`scripts/snap.mjs`) before delivering code.
- **Clean Recording Protocol:** `body.clean-capture` auto-hiding all HUD and cursor layers during capture.

---

## Active & Future Engineering Vectors

1. **Ultra-HFR Frame Rate Expansion:** Formalize support up to 240 FPS for next-generation esports and OLED displays.
2. **Procedural Web Audio Engine:** In-browser synthesis of sub-bass drops, risers, and whooshes with zero external MP3 dependencies.
3. **Automated Studio Encoding Pipeline:** All-in-one CLI command (`scripts/render.mjs`) bundling Puppeteer frame capture and FFmpeg CRF 14 H.264 rendering.
4. **Interactive Showroom (`preview.html`):** Rapid local visual previewing across all 10 presets with real-time 3D device frame toggles.
5. **Multi-Platform Export Presets:** Automatic resolution switching between 16:9 (1920x1080) desktop and 9:16 (1080x1920) mobile formats.
