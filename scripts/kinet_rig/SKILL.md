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

1. **Dual-Mode Workflow (Proactive Recommendation & Launch):**
   - **Scenario A (Direct Request):** If the user clearly names a template or demands an instant build (e.g. *"Terus buatkan video..."*), AI applies props immediately and launches Studio.
   - **Scenario B (Creative Brief / Default):** If the user asks for a video topic without specifying a template, AI acts as Creative Director:
     1. Propose the **Recommended Template** based on the prompt context + 2 alternative ideas.
     2. Explain the creative rationale in 2 concise sentences.
     3. Apply the recommended setup to `remotion/Root.tsx` and launch Remotion Studio (`node scripts/preview-remotion.mjs`) so the user can immediately see and customize the live result while giving feedback.
2. **Remotion React Core:** Compositions are authored as pure, deterministic React components (`remotion`). All timing derives from `useCurrentFrame()` and `interpolate()`.
3. **Deterministic Timeline:** Never use `Math.random()` or `Date.now()`. Use seeded pseudo-randomness or pure frame interpolation.
4. **Zero OS Emojis (Strict Vector Quality):** NEVER use system emojis (`🤖`, `⚡`, `🐙`, `🧠`, `🎥`). Use clean inline SVG vectors with glowing filters, high-resolution typography, or brand assets.
5. **Anti-PowerPoint Motion:** No static slide deck fades. Scenes transition through continuous camera moves (push-through, whip-pan, 3D orbit) or motivated motion wipes.

---

## 2. Creative Director Protocol (Prompt to Recommendation)

Whenever a user requests a video (e.g. *"Tolong buatkan video tentang pelancaran AI"*):

1. **Analyze & Recommend:**
   - **Opener / Brand Launch / Event:** $\to$ Recommend `CinematicTitle`
   - **Cybersecurity / Terminal / Developer CLI / Hacker:** $\to$ Recommend `GlitchTerminal`
   - **SaaS / Analytics / Business Dashboard / UI Tour:** $\to$ Recommend `SaasMacro`
2. **Setup Composition:** Update `Root.tsx` (in `remotion/Root.tsx` or `rigtools/kinet_rig/remotion/Root.tsx`) with the proposed concept.
3. **Launch Studio Automatically:** Run:
   ```bash
   node scripts/preview-remotion.mjs
   ```
4. **Present Recommendation to User:**
   Give a concise response explaining:
   - What template was picked and why.
   - That Remotion Studio is now open in their browser at `http://localhost:3000`.
   - Ask if they wish to adjust colors, text, or switch to an alternative template.

---

## 3. Templates Library

1. **`templates/remotion/CinematicTitle.tsx`** (*Opener*):
   - Full-bleed kinetic headline, character-by-character reveal with blur/slide, cinematic push-in, glowing accent beam, and dark vignette.
2. **`templates/remotion/GlitchTerminal.tsx`** (*Decrypt Glitch Terminal*):
   - Cybernetic terminal with memory hex dump stream, live memory bar, decrypting text scramble with RGB split glitch chromatic aberration, and status telemetry.
3. **`templates/remotion/SaasMacro.tsx`** (*SaaS Macro Tour*):
   - 3D browser mockup perspective with dynamic SVG metric chart, animated metric drawing line, sidebar navigation, and live pipeline status.
