# Kinetic Typography & Anti-AI-Slop Motion Standard in EffectCraft

Reference for authoring studio-grade, broadcast-quality typographic animations and motion sequences inside EffectCraft (`.ecproj`). Grounded in anti-AI-slop design engineering guidelines, Awwwards typography standards, and Saul Bass / Kyle Cooper kinetic grammar.

---

## 1. The Anti-AI-Slop Motion Laws

Standard AI models frequently generate amateur "PowerPoint slide" animations because they default to naive linear fades, dead-center text, and whole-block translations. When animating typography in EffectCraft, enforce these strict motion laws:

| ❌ Generic AI Slop Anti-Pattern | ✔️ Studio-Grade EffectCraft Standard |
|---|---|
| **Raw Block Fade-Up:** Entire headline fades in with generic `opacity: 0 -> 1` and `y: +50 -> 0`. | **Masked Horizon Reveal:** Each line or word is clipped by a track matte / mask; glyphs wipe up sharply from a clean baseline. |
| **Mechanical / Linear Easing:** Constant speed or basic symmetric `ease-in-out` feeling sluggish. | **Snap-and-Drift Velocity:** Explosive acceleration (0.2s–0.3s) with 85% keyframe influence, transitioning into an organic, micro-drift hold. |
| **All Elements Moving Simultaneously:** Chaotic arrival with zero rhythm. | **Choreographed Staggers:** 2–3 frame (30–50ms) offset between words, 4–6 frames between lines. |
| **Dead-Center Placement Everywhere:** Text always pasted dead-center (`50%/50%`) on every single slide. | **Asymmetric Editorial Layout:** Bottom-left anchored type, split-screen tension, or typographic edge bleeds. |
| **Reversing the Entrance on Exit:** Text slowly fading out the same way it came in. | **Motivated Fast Exits:** Exits are 40% faster than entrances — upward flick, camera push-through, or kinetic iris wipe. |
| **Rainbow Gradients & Heavy Glow:** Random neon purple/blue drop shadows. | **Monochrome + 1 Surgical Accent:** Obsidian black, stark white/cream, and exactly one high-energy accent on < 5% of pixels. |
| **Small Animated Text:** Animating 14px–18px paragraphs or dense body copy. | **Focal Typographic Restraint:** Only animate large hero titles (≥64px display); secondary kickers remain anchored. |
| **Static Void Background:** Text floating on flat, lifeless black canvas. | **Spatial Depth & Ghost Layers:** Faint oversized ghost typography (4%–6% opacity) or ambient dust/lighting behind hero text. |

---

## 2. Velocity Curves (Snap-and-Drift)

In EffectCraft, configure keyframe spatial and temporal interpolation to achieve snappy deceleration:

- **Temporal Influence Graph:**
  - Keyframe 1 (Start, Frame 0): Speed 0 px/s, Influence 20%.
  - Keyframe 2 (Snap peak, Frame 6–10): Extreme velocity surge reaching target baseline.
  - Keyframe 3 (Settle, Frame 18–30): Speed 0 px/s, Influence 85%–90%.
- **Cubic Bezier Equivalent:** `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo / Apple keynote curve).
- **Secondary Drift:** Add an ongoing 1.5s–2.5s minute translation (`+10px` to `+15px` or `scale: 1.0 -> 1.02`) to keep the composition living after the snap.

---

## 3. Kinetic Micro-Accents

Combine at least two of these micro-properties on the text layer during the entrance:

1. **Optical Blur Snap:**
   - Add Gaussian Blur / Fast Blur effect: start at `12px – 16px`, keyframe down to `0px` simultaneously with the position snap.
2. **Kinetic Tracking (Letter-Spacing):**
   - Animate Character Tracking: start loose at `+120` to `+180`, compress down to `0` or slightly tight `-15` for modern editorial impact.
3. **Scale Cushioning:**
   - Animate Scale starting at `106% – 108%` down to `100%` on snap arrival to simulate optical lens settling.
4. **Masked Clip Boundary:**
   - Create a rectangular solid mask over the text container. Move the text layer from outside the mask bounds (`translateY(110%) -> translateY(0%)`).

---

## 4. Exit Choreography (The "Never Mirror" Rule)

Never animate text out by simply reversing the entrance. Exits must be swift and motivated:

- **Upward Flick (The Kinetic Cut):**
  - Keyframe position `Y` shooting upward (`translateY(-110%)`) within 6–10 frames.
  - Add vertical directional blur (`20px – 30px`, angle 0°) during the exit burst.
- **Camera Push-Through (Parallax Warp):**
  - Camera surges forward on the Z-axis, plunging past the letterforms into the next scene.
  - Text expands to `scale: 300% – 500%` as opacity drops rapidly from 100% to 0%.
- **Duration Ratio:** Exits must always be 30%–50% shorter in duration than entrances (e.g. 0.2s exit vs 0.5s entrance).

---

## 5. Spatial Layout & Editorial Placement

Avoid placing text dead-center on every frame. Use asymmetric tension:

1. **Bottom-Left Hero Anchor:**
   - Align text flush-left at the lower third of the canvas (X: 10%, Y: 68%).
   - Place a tiny uppercase monospace kicker badge at the top-left (X: 10%, Y: 12%, e.g., `[ 01 // CORE ARCHITECTURE ]`).
2. **Ghost Typography Layering (Depth Hack):**
   - Duplicate the hero text layer, place it behind the main text.
   - Scale it up to 400%–600%, set tracking to `-40`, and drop opacity to `4% – 7%`.
   - Animate it drifting slowly in the opposite direction of the hero text to create immediate 3D depth.
3. **Split Screen Contrast:**
   - Left half: Massive bold single-word impact (e.g., `VELOCITY`).
   - Right half: Technical metric stat (e.g., `0.02ms / 240 FPS`) with fine grid tick marks.

---

## 6. Color & Lighting Restraint (The Anti-Neon Law)

- **Palette Limit:** Strictly monochrome base (Deep Obsidian `#09090b` + Crisp Cream `#f4f4f5`).
- **Surgical Accent (< 5% screen area):** Exactly ONE intense accent hue (e.g., Electric Lime `#c6ff00`, International Klein Blue `#002fa7`, or Safety Orange `#ff5500`) applied strictly to a highlight keyword or index dot.
- **No Rainbow Shadows:** Never apply multi-color or high-radius purple/cyan drop shadows. Use subtle ambient occlusion or directional drop shadow at 20% opacity max.

---

## 7. Sound Design Sync Points (SFX Anchors)

Kinetic motion must provide clear keyframe anchors for audio:
- **Frame 0:** Sub-bass riser / low-frequency wind-up.
- **Frame 8 (The Snap Impact):** Heavy mechanical thud, sub-bass drop, or crisp transient click.
- **Drift Phase (Frame 10–40):** High-frequency shimmer, gentle tape hiss, or room-tone silence.
- **Exit Burst:** Swift whoosh or pneumatic release.
