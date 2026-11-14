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
   - **Modular Features / Architecture / Product Capabilities:** $\to$ Recommend `BentoGrid`
   - **Conversational UI / AI Chatbot / Messaging App:** $\to$ Recommend `ChatDialogue`
   - **Financial Volume / KPI Cards / Growth Metrics:** $\to$ Recommend `DataMetrics`
   - **Viral Short-Form / High-Retention Hook (Shorts/TikTok):** $\to$ Recommend `ReelHook`
   - **E-Commerce / Hardware / Physical Product Drops:** $\to$ Recommend `ProductShowcase`
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
   - Exact 6.0s cybernetic terminal with memory hex dump stream, live memory bar, decrypting text scramble with RGB split glitch chromatic aberration, and status telemetry.
3. **`templates/remotion/SaasMacro.tsx`** (*SaaS Macro Tour*):
   - Exact 7.0s 3D browser mockup perspective with dynamic SVG metric chart, animated metric drawing line, sidebar rack focus blur swap, and live pipeline status.
4. **`templates/remotion/BentoGrid.tsx`** (*Modular Bento Grid*):
   - Exact 6.5s 3x2 modern glassmorphism Bento Grid layout, staggered spring pop entries, animated progress fill line, and glowing accent telemetry.
5. **`templates/remotion/ChatDialogue.tsx`** (*Diegetic AI Chat*):
   - 3D tilted chat device, human keystroke simulation in input bar, pulsing typing dots, spring message popups, and verified reaction badges.
6. **`templates/remotion/DataMetrics.tsx`** (*KPI & Area Chart Metrics*):
   - Exact 8.0s financial metrics dashboard with 3 KPI card popups, animated live number counters, and 6 elastic animated SVG bar charts with area glow.
7. **`templates/remotion/ReelHook.tsx`** (*Viral Short-Form Hook*):
   - Exact 6.0s high-retention social media hook with chromatic mood shift, radial bloom pulse wave, kinetic word slams, and floating sticker tags.
8. **`templates/remotion/ProductShowcase.tsx`** (*3D E-Commerce Showcase*):
   - Exact 7.0s hardware showcase with 3D rotating card, specular shine sweep, animated spec grid, and bouncing CTA button.
