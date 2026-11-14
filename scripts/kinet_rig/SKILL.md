---
name: kinet-rig
description: AI-powered motion graphics and cinematic video production engine using Remotion (React). Converts prompts into Remotion compositions, and automatically launches the interactive Remotion Studio in the browser for visual preview, custom editing, and manual rendering.
license: MIT
metadata:
  author: Reff33
  homepage: https://github.com/Reff33/KinetRig
  version: "2.0.0"
---

# KinetRig — AI Remotion Video Production Engine

Intelligent motion graphics and video composition built for AI coding agents. Uses **Remotion (React)** as the video rendering engine while KinetRig acts as the creative brain, director, and motion choreography system.

---

## 1. Core Principles & Strict Directives

1. **Mandatory Auto-Launch Remotion Studio:** Whenever the user asks to create or test a video, the AI agent **MUST NOT stop after writing code**. The agent MUST update `Root.tsx` with the requested props, and then execute:
   ```bash
   node scripts/preview-remotion.mjs
   ```
   This command starts the local Remotion server and **automatically opens the interactive Remotion Studio in the user's default browser** (http://localhost:3000) so the user can visually preview, scrub the timeline, customize animations, and render whenever ready.
2. **Remotion React Core:** Compositions are authored as pure, deterministic React components (`remotion`). All timing derives from `useCurrentFrame()` and `interpolate()`.
3. **Deterministic Timeline:** Never use `Math.random()` or `Date.now()`. Use seeded pseudo-randomness or pure frame interpolation.
4. **Zero OS Emojis (Strict Vector Quality):** NEVER use system emojis (`🤖`, `⚡`, `🐙`, `🧠`, `🎥`). Use clean inline SVG vectors with glowing filters, high-resolution typography, or brand assets.
5. **Anti-PowerPoint Motion:** No static slide deck fades. Scenes transition through continuous camera moves (push-through, whip-pan, 3D orbit) or motivated motion wipes.

---

## 2. Autonomous Execution Protocol (What AI Must Do Automatically)

Whenever a user requests a video (e.g. *"Tolong buatkan video tajuk 'NEXUS AI 2.0', subtitle 'AUTONOMOUS AGENT ORCHESTRATION', warna neon cyan"*):

1. **Select Best Template:**
   - Opener / Brand Launch $\to$ `CinematicTitle`
   - Terminal / Cybersecurity / Dev Tools / Hacker Decrypt $\to$ `GlitchTerminal`
   - SaaS / UI Tour / Analytics / Revenue Dashboard $\to$ `SaasMacro`
2. **Apply Directly to `Root.tsx`:** Edit `Root.tsx` (in `remotion/Root.tsx` or `rigtools/kinet_rig/remotion/Root.tsx`) to set `defaultProps` matching the user's brief.
3. **Launch Remotion Studio Automatically:** Run:
   ```bash
   node scripts/preview-remotion.mjs
   ```
   *(This launches the Remotion preview player in the user's browser immediately at `http://localhost:3000`)*.
4. **Inform the User:** Tell the user that Remotion Studio has been launched in their browser for live interactive preview and manual customization.

---

## 3. Templates Library

1. **`templates/remotion/CinematicTitle.tsx`** (*Opener*):
   - Full-bleed kinetic headline, character-by-character reveal with blur/slide, cinematic push-in, glowing accent beam, and dark vignette.
2. **`templates/remotion/GlitchTerminal.tsx`** (*Decrypt Glitch Terminal*):
   - Cybernetic terminal with memory hex dump stream, live memory bar, decrypting text scramble with RGB split glitch chromatic aberration, and status telemetry.
3. **`templates/remotion/SaasMacro.tsx`** (*SaaS Macro Tour*):
   - 3D browser mockup perspective with dynamic SVG metric chart, animated metric drawing line, sidebar navigation, and live pipeline status.
