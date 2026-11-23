# Kinetic Typography & Anti-AI-Slop Motion Standard in EffectCraft

Reference for authoring studio-grade, broadcast-quality typographic animations and motion sequences inside EffectCraft (`.ecproj`). Grounded in the anti-AI-slop design engineering guidelines, Awwwards typography standards, and Saul Bass / Kyle Cooper kinetic grammar.

---

## 1. The Anti-AI-Slop Motion Laws

Standard AI models frequently generate amateur "PowerPoint slide" animations because they default to naive linear fades and whole-block translations. When animating typography in EffectCraft, enforce these strict motion laws:

| ❌ Generic AI Slop Anti-Pattern | ✔️ Studio-Grade EffectCraft Standard |
|---|---|
| **Raw Block Fade-Up:** Entire headline fades in with generic `opacity: 0 -> 1` and `y: +50 -> 0`. | **Masked Horizon Reveal:** Each line or word is clipped by a track matte / mask; glyphs wipe up sharply from a clean baseline. |
| **Mechanical / Linear Easing:** Constant speed or basic symmetric `ease-in-out` feeling sluggish. | **Snap-and-Drift Velocity:** Explosive acceleration (0.2s–0.3s) with 80% keyframe influence, transitioning into a slow, elegant camera/layer drift. |
| **All Elements Moving Simultaneously:** Chaos with zero visual hierarchy. | **Choreographed Staggers:** 2–3 frame (30–50ms) offset between words, 4–6 frames between lines. |
| **Small Animated Text:** Animating 14px–18px paragraphs or dense body copy. | **Focal Typographic Restraint:** Only animate large hero titles (≥64px display); secondary kickers remain anchored or follow subtly. |
| **Static Void Background:** Text floating on flat, lifeless black canvas. | **Spatial Lighting & Parallax:** Subtle optical lens glow, light volumetric dust, or 3D camera travel through depth layers. |

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

## 4. Visual Hierarchy & Composition Rules

- **Maximum 2 to 5 words per shot.** Never overload a single kinetic scene.
- **Extreme Font Contrast:** Pair a massive ultra-bold display font (weight 800–900) with a diminutive technical kicker in monospace uppercase (weight 400, 12px–14px, e.g. `01 // ARCHITECTURE`).
- **No decorative emojis or clip-art icons.** Use pure vector shapes, geometric markers, or let the typography act as the sole visual protagonist.
