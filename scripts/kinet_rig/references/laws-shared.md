# Shared Creative & Audio Laws (format-agnostic)

These rules apply to every KinetRig output: HTML/GSAP templates and Remotion (KVS) compositions.
They describe intent, not implementation. Each renderer maps them to its own code.

Do NOT put bridge, export UI, HUD, or runtime rules here. Those are HTML-only and live in `SKILL.md`.

---

## 1. Anti-PowerPoint Motion

- **Persistent subject:** keep one subject or shared world across scene transitions.
- **1 shot = 1 statement:** maximum 5 words per beat.
- **Max 2 text levels per scene.** Minimum 30px on a 1080p canvas.
- **No static slide fades.** Scenes move through continuous camera travel (push-through, whip pan, 3D yaw) or motivated object wipes.

## 2. Motion-to-Sound Lock

- **Law A, 3-layer sandwich:** never leave an SFX naked. Ambient bed at -22 to -26 dB, tactile micro-foley at -8 to -12 dB, hero impact at 0 dB.
- **Law B, material match:** audio follows the visual material (paper friction, felt landing, mechanical switch). No generic arcade beeps.
- **Law C, J-cut anticipation:** whooshes and slides start 0.04 s before the velocity apex: `t_audio = t_apex - 0.04s`.
- **Law D, contact frame:** landings fire on contact: `t_contact = t_start + duration`.
- **Cue density:** at most 1 primary cue per 2-3 s (4-6 hero cues per 15-20 s). Secondary watermarks, ghost dates and hairlines stay silent.
- **Voice cap:** at most 3 simultaneous audio voices (1 room drone, 1 rhythmic pulse, 1 hero impact).
- **Keystroke and tap cues:** every typed character, token or state change locks to a click or blip (mechanical click for typing, digital blip for tokens, soft thud on landing, chime on resolve).

## 3. Locomotion Cadence

- Walking or running never plays one static block. Split duration `T` into foot plants every `0.39 s`: `T_k = T_start + k * 0.39s`.
- Alternate pitch per foot: left x0.97, right x1.03.
- Ground texture follows the scene: grass (lowpass noise ~420 Hz + body ~28 Hz), wood floor (bandpass ~680 Hz + body ~140 Hz), stone (~190 Hz body).

## 4. Camera

- **Dolly zoom (vertigo):** when the camera moves on Z, counter-scale the foreground hero so `S_hero * Z_cam = const`. The subject stays the same size while the background compresses or expands.
- **Exclusivity:** never run a 3D orbit and a whip pan in the same 0.5 s window. If both fire, drop the whip pan and use an accelerated orbit.
- **Vertical safe zone (9:16, 1080x1920):** keep titles and callouts inside the centre box (864 px wide). Keep the top 288 px clear (account header, search, sound icon), the bottom 384 px clear (caption, sound title, nav), and the right 130 px clear (like, comment, share buttons).

## 5. Colour & Mood

- Any dramatic change in background, light or accent hue runs as a smooth tween over 0.4-0.8 s with `power2.inOut` or `power3.out`.
- Use a motivated vehicle for the change: radial bloom, chromatic split decay, or light sweep.
- **Prohibited:** 0-duration colour cuts. They look like unmotivated glitches.

## 6. Glitch / Chromatic Split

- Use deterministic channel shifts only: R and B separate by 6-14 px for 2-4 frames (0.05-0.10 s), with exponential decay.
- **Prohibited:** random noise shaders and unbounded screen shake. They break timeline reproducibility.

## 7. Determinism

- Output depends only on the frame or time index. No `Math.random()`, no `Date.now()`.
- Randomness comes from a seeded PRNG.

## 8. Layer Stacking (blueprint and catalog looks)

- Background grids sit lowest, at opacity 0.08-0.16.
- Specimen cards and photo cutouts sit above them with a fully opaque fill.
- Evidence, stamps and date blocks sit on top, with a deep cast shadow, so they are never hidden under cards.
