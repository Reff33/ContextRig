---
name: kinet-rig
description: AI-powered motion graphics and cinematic video production engine using Remotion (React). Converts prompts, scene concepts, and parameters into high-quality Remotion compositions with automatic MP4 rendering and instant media player preview.
license: MIT
metadata:
  author: Reff33
  homepage: https://github.com/Reff33/KinetRig
  version: "2.0.0"
---

# KinetRig — AI Remotion Video Production Engine

Intelligent motion graphics and video composition built for AI coding agents. Uses **Remotion (React)** as the primary video rendering engine while KinetRig acts as the creative brain, director, and motion choreography system.

---

## 1. Core Principles

1. **Remotion React Core:** Compositions are authored as pure, deterministic React components (`remotion`). All timing derives from `useCurrentFrame()` and `interpolate()`.
2. **Deterministic Timeline:** Never use `Math.random()` or `Date.now()`. Use seeded pseudo-randomness or pure frame interpolation to guarantee 100% reproducible frame rendering.
3. **Zero OS Emojis (Strict Vector Quality):** NEVER use system emojis (`🤖`, `⚡`, `🐙`, `🧠`, `🎥`). Use clean inline SVG vectors with glowing filters, high-resolution typography, or brand assets.
4. **Anti-PowerPoint Motion:** No static slide deck fades. Scenes transition through continuous camera moves (push-through, whip-pan, 3D orbit) or motivated motion wipes.
5. **3-Layer Acoustic Sandwich:**
   - **Layer 1 (Bed):** Low ambient texture / room drone (-24dB).
   - **Layer 2 (Foley):** Micro-tactile clicks, typing, and paper sliders (-10dB).
   - **Layer 3 (Impact):** Hero risers and sub-bass drops on impact/transition points (0dB).
6. **Automatic Player Launch:** Every render workflow finishes by automatically opening the exported MP4 in the OS default media player.

---

## 2. Shared Motion & Directing Laws

When planning scene choreographies or authoring Remotion components, strictly enforce:
- **One statement per shot:** Text under 5 words per beat.
- **Maximum 2 text levels per scene:** Primary title + secondary support only.
- **Dolly Zoom (Vertigo):** Counter-scale foreground when camera dollies on Z-axis (`S_hero * Z_cam = const`).
- **Smooth Chromatic Transitions:** Color / background changes interpolate over 0.4s–0.8s (`power2.inOut`). No instant 0s cuts.
- **9:16 Vertical Safe-Zone (Shorts / TikTok):** Keep primary action in the center 80% box (width 864px). Top 15% (288px) and bottom 20% (384px) stay clear of key captions.

---

## 3. Production Workflow (Prompt to Auto-Video)

When instructed to create a video:

### Step 1: Creative Concept & Parameter Planning
Determine from the user prompt:
- **Title & Messaging:** Hook statement, core value proposition, CTA.
- **Style Archetype:** (Cinematic Dark, Minimal Studio, Cyber Terminal, Bento Grid, etc.)
- **Color Palette:** Primary, accent, and background hex colors.
- **Aspect Ratio & FPS:** `16:9` (1920x1080) or `9:16` (1080x1920) at 60 FPS.

### Step 2: Remotion Composition Authoring
Select or adapt a template from `templates/remotion/` (e.g. `CinematicTitle.tsx`) or register a new composition in `remotion/Root.tsx`:
```tsx
import { Composition } from 'remotion';
import CinematicTitle from '../templates/remotion/CinematicTitle';

<Composition
  id="MyVideo"
  component={CinematicTitle}
  durationInFrames={180} // 3.0 seconds at 60fps
  fps={60}
  width={1920}
  height={1080}
  defaultProps={{
    title: "YOUR HEADLINE",
    subtitle: "MOTION SUBTITLE",
    primaryColor: "#FFFFFF",
    accentColor: "#00F0FF",
    backgroundColor: "#08090D",
    fontSize: 120,
    letterSpacing: 8,
    zoomIntensity: 1.15
  }}
/>
```

### Step 3: Render & Auto-Launch
Execute the render command to produce the MP4 and immediately pop up the video player:

```bash
node scripts/render-remotion.mjs MyVideo '{"title":"PRODUK BARU","subtitle":"KINETRIG REMOTION"}'
```

---

## 4. Templates Library

- `templates/remotion/CinematicTitle.tsx`: Full-bleed kinetic headline with character-by-character reveal, slow cinematic push-in, glowing accent beam, and vignette.
