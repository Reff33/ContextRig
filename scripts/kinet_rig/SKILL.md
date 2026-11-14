---
name: kinet-rig
description: AI-powered motion graphics and cinematic video production engine using Remotion (React). Converts prompts into modular Remotion compositions, and automatically launches the interactive Remotion Studio in the browser for visual editing, component toggling, and rendering.
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

1. **Dual-Mode Workflow (Proactive Recommendation & Launch):**
   - **Scenario A (Direct Request):** If the user clearly names a template or demands an instant build (e.g. *"Terus buatkan video..."*), AI applies props immediately and launches Studio.
   - **Scenario B (Creative Brief / Default):** If the user asks for a video topic without specifying a template, AI acts as Creative Director:
     1. Propose the **Recommended Template** based on the prompt context + 2 alternative ideas.
     2. Explain the creative rationale in 2 concise sentences.
     3. Apply the recommended setup to `remotion/Root.tsx` and launch Remotion Studio (`node scripts/preview-remotion.mjs`) so the user can immediately see and customize the live result while giving feedback.
2. **Modular Layer Decoupling Law (Atomic User Customizability):**
   - Every Remotion composition MUST separate its visual layers into independent, modular sub-components:
     - `Background / Grid Layer` (ambient gradient, lines, scanlines)
     - `Camera / Container Layer` (3D perspective, viewport movements)
     - `Card / Frame Layer` (card bodies, mockups, containers)
     - `Icon / SVG Layer` (vectors, badges, symbols)
     - `Text / Typography Layer` (headlines, subtitles, monospace telemetry)
   - **User Toggle & Re-positioning:** All text, cards, and icons must be controllable via boolean props or individual style offsets (e.g. `showIcon`, `showCard`, `titleOffset`, `cardX`, `cardY`) so the user can easily toggle off, move, or replace any element in Remotion Studio without breaking the animation timeline.
3. **Camera Fluidity Law (Never Start Extreme Close-up):**
   - Always establish the scene from a natural **Wide Framing (`z: 0.85 – 1.0`)**.
   - NEVER start clipped into a corner at an extreme zoom (`z >= 1.6`).
   - Camera motion must follow motivated cinematography: **Wide Establishing $\to$ Macro Dive In $\to$ Smooth Pan $\to$ Pull Back Wide**.
4. **Remotion React Core:** Compositions are authored as pure, deterministic React components (`remotion`). All timing derives from `useCurrentFrame()` and `interpolate()`.
5. **Deterministic Timeline:** Never use `Math.random()` or `Date.now()`. Use seeded pseudo-randomness or pure frame interpolation.
6. **Zero OS Emojis (Strict Vector Quality):** NEVER use system emojis (`🤖`, `⚡`, `🐙`, `🧠`, `🎥`). Use clean inline SVG vectors with glowing filters, high-resolution typography, or brand assets.
7. **Anti-PowerPoint Motion:** No static slide deck fades. Scenes transition through continuous camera moves (push-through, whip-pan, 3D orbit) or motivated motion wipes.

---

## 2. Creative Director Protocol (Prompt to Recommendation)

Whenever a user requests a video:

1. **Analyze & Recommend:**
   - **Opener / Brand Launch / Event:** $\to$ Recommend `KinetOpener`
   - **Cybersecurity / Terminal / Developer CLI / Hacker:** $\to$ Recommend `GlitchTerminal`
   - **SaaS / Analytics / Business Dashboard / UI Tour:** $\to$ Recommend `SaasMacro`
   - **Modular Features / Architecture / Product Capabilities:** $\to$ Recommend `BentoGrid`
   - **Conversational UI / AI Chatbot / Messaging App:** $\to$ Recommend `ChatDialogue`
   - **Financial Volume / KPI Cards / Growth Metrics:** $\to$ Recommend `DataMetrics`
   - **Viral Short-Form / High-Retention Hook (Shorts/TikTok):** $\to$ Recommend `ReelHook`
   - **E-Commerce / Hardware / Physical Product Drops:** $\to$ Recommend `ProductShowcase`
   - **Continuous Vector Flow / Explainer / System Movement:** $\to$ Recommend `ActionFlow`
   - **Investigative Journalism / Classified Dossier / Evidence:** $\to$ Recommend `EditorialDossier`
   - **Swiss Minimalist Catalog / Architecture / Spec Sheets:** $\to$ Recommend `StudioCatalog`
   - **Tactile Paper Scrapbook / Stop-Motion / Print Collage:** $\to$ Recommend `PaperCollage`
   - **Theatrical Puppet Stage / Narrative Character Walk:** $\to$ Recommend `ProsceniumStage`
   - **iOS Spatial VisionOS / Liquid Glass & Dynamic Island:** $\to$ Recommend `LiquidGlass`
2. **Setup Composition:** Update `Root.tsx` (in `remotion/Root.tsx` or `rigtools/kinet_rig/remotion/Root.tsx`) with the proposed concept.
3. **Launch Studio Automatically:** Run:
   ```bash
   node scripts/preview-remotion.mjs
   ```
4. **Present Recommendation to User:**
   Give a concise response explaining:
   - What template was picked and why.
   - That Remotion Studio is now open in their browser at `http://localhost:3000`.
   - Remind the user that every text, card, and icon is modular and can be moved or toggled off directly.

---

## 3. Templates Library

1. **`templates/remotion/KinetOpener.tsx`** (*Exact 100% Opener*):
   - Exact 10.0s 3D particle space opener, snappy headline slam with RGB split glitch transient, subtitle upward glide, 3 staggered vector cards, and camera push-through into Scene 2.
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
9. **`templates/remotion/ActionFlow.tsx`** (*Continuous Vector Flow*):
   - Exact 8.0s 3840px wide world with persistent hero orb, squash-and-stretch vertical launch, 3D horizon banking flight transition, and shockwave burst climax.
10. **`templates/remotion/EditorialDossier.tsx`** (*Classified Editorial Dossier*):
    - Exact 9.0s forensic investigative desk with topographic grain, satellite recon photo, cyan laser sweep, red stamp slam, red yarn connector, and classified black marker redaction bar wipe.
11. **`templates/remotion/StudioCatalog.tsx`** (*Swiss Minimalist Catalog*):
    - Exact 11.0s Swiss architectural catalog with Wide $\to$ Macro Zoom In $\to$ Pan $\to$ Pull Back Wide camera choreography, fan-out card stack, yellow felt highlighter, and rubber stamp slam.
12. **`templates/remotion/PaperCollage.tsx`** (*Stop-Motion Paper Scrapbook*):
    - Exact 7.5s tactile paper scrapbook with Polaroid photo card slap, Scotch masking tape snap, torn newspaper scrap, postage stamp, rubber stamp slam, and physical paper rip tear wipe into Scene 2.
13. **`templates/remotion/ProsceniumStage.tsx`** (*Theatrical Proscenium Puppet Stage*):
    - Exact 8.0s velvet proscenium curtains parting open, theatrical sky & hills depth planes, animated character puppet with organic $T_{step} = 0.39s$ locomotion walk cycle, and stage backdrop slide transition.
14. **`templates/remotion/LiquidGlass.tsx`** (*Apple iOS Spatial VisionOS Liquid Glass*):
    - Exact 6.0s VisionOS fluid spatial design with Dynamic Island expansion, rotating multi-color Siri fluid glow aura, central refractive glass orb with orbital concentric rings, and floating glass telemetry cards.
