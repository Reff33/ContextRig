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

## 1. Core Principles & Strict Directives

1. **Mandatory Auto-Render & Launch:** Whenever the user asks to generate, create, or test a video, the AI agent **MUST NOT stop after writing code**. The agent MUST automatically execute `node scripts/render-remotion.mjs <CompositionId> '[props]'` so the finished MP4 renders immediately and pops open automatically in the user's media player.
2. **Remotion React Core:** Compositions are authored as pure, deterministic React components (`remotion`). All timing derives from `useCurrentFrame()` and `interpolate()`.
3. **Deterministic Timeline:** Never use `Math.random()` or `Date.now()`. Use seeded pseudo-randomness or pure frame interpolation to guarantee 100% reproducible frame rendering.
4. **Zero OS Emojis (Strict Vector Quality):** NEVER use system emojis (`🤖`, `⚡`, `🐙`, `🧠`, `🎥`). Use clean inline SVG vectors with glowing filters, high-resolution typography, or brand assets.
5. **Anti-PowerPoint Motion:** No static slide deck fades. Scenes transition through continuous camera moves (push-through, whip-pan, 3D orbit) or motivated motion wipes.
6. **3-Layer Acoustic Sandwich:**
   - **Layer 1 (Bed):** Low ambient texture / room drone (-24dB).
   - **Layer 2 (Foley):** Micro-tactile clicks, typing, and paper sliders (-10dB).
   - **Layer 3 (Impact):** Hero risers and sub-bass drops on impact/transition points (0dB).

---

## 2. Shared Motion & Directing Laws

When planning scene choreographies or authoring Remotion components, strictly enforce:
- **One statement per shot:** Text under 5 words per beat.
- **Maximum 2 text levels per scene:** Primary title + secondary support only.
- **Dolly Zoom (Vertigo):** Counter-scale foreground when camera dollies on Z-axis (`S_hero * Z_cam = const`).
- **Smooth Chromatic Transitions:** Color / background changes interpolate over 0.4s–0.8s (`power2.inOut`). No instant 0s cuts.
- **9:16 Vertical Safe-Zone (Shorts / TikTok):** Keep primary action in the center 80% box (width 864px). Top 15% (288px) and bottom 20% (384px) stay clear of key captions.

---

## 3. Autonomous Execution Protocol (What AI Must Do Automatically)

Whenever a user requests a video (e.g. *"Buatkan video tentang pelancaran AI"*):

1. **Analyze & Formulate:** Extract Title, Subtitle, Archetype, Colors (Primary, Accent, Background), Aspect Ratio, and Duration.
2. **Setup Composition:** Ensure the target template or composition exists in `templates/remotion/` and is registered in `remotion/Root.tsx`.
3. **Execute Auto-Render Immediately:** Run the render CLI without asking the user for confirmation:
   ```bash
   node scripts/render-remotion.mjs <CompositionId> '{"title":"...","subtitle":"...","accentColor":"#00F0FF"}'
   ```
   *Note: This command automatically renders the video and immediately pops open the media player on the user's desktop.*
4. **Report Completion:** Inform the user that the video has been rendered and is currently playing on their screen.

---

## 4. Templates Library

- `templates/remotion/CinematicTitle.tsx`: Full-bleed kinetic headline with character-by-character reveal, slow cinematic push-in, glowing accent beam, and vignette.
