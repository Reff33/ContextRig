# Ultra-HFR Rendering Guide (Up to 240 FPS)

## Why Ultra-HFR (Up to 240 FPS)?

Modern displays (gaming monitors, high-refresh OLEDs, Apple ProMotion, flagship mobile screens) operate at 120Hz, 144Hz, and up to 240Hz. Traditional 30 FPS and 60 FPS videos introduce visible motion judder and micro-stuttering on high-speed kinetic typography, horizontal whip-pans, and 3D camera push-throughs.

KinetRig is architected from the ground up for **Ultra-HFR: Up to 240 FPS** with mathematically deterministic timeline stepping (`tl.time(t)`).

---

## Framerate Target Presets

| Target FPS | Typical Destination | Step Interval (`dt`) | Motion Feel |
| --- | --- | --- | --- |
| **60 FPS** | Standard Web & Mobile Video | `1 / 60` (16.66ms) | Baseline fluid playback |
| **120 FPS** | Apple ProMotion / Flagship Smartphones | `1 / 120` (8.33ms) | Ultra-smooth responsive action |
| **144 FPS** | Motion Graphics Studio Standard | `1 / 144` (6.94ms) | Crisp motion without strobing |
| **240 FPS** | Esports, Ultra-HFR Gaming & OLED Displays | `1 / 240` (4.16ms) | Visual perfection, zero motion blur artifacts |

---

## How Deterministic Offline Stepping Works

Instead of recording a live screen (which drops frames when complex shaders or heavy CSS filters execute):

1. **Headless Chromium Execution:** Puppeteer launches Chromium with native GPU acceleration and WebGL flags enabled.

2. **Mathematical Time Stepping:** The script steps the timeline mathematically based on the target FPS:

   ```javascript
   const fps = 240; // Or 60, 120, 144
   const dt = 1 / fps;
   const t = i * dt;
   window.OPENER.seek(t);
   ```

3. **Double RAF Flush:** Awaits two `requestAnimationFrame` ticks so CSS styles, transforms, and WebGL buffer updates finish painting to the GPU buffer.

4. **Lossless Frame Capture:** Captures the pixel buffer via `page.screenshot()`.

5. **Lossless MP4 & Audio Compilation:** Assembles all frames and muxes audio into a pristine MP4 via FFmpeg:

   ```bash
   # All-in-one CLI command
   node scripts/render.mjs assets/kinet-opener.html output_240fps.mp4 240 --audio=assets/audio.mp3
   ```

Because each frame is rendered offline, even if a complex frame requires 500ms to calculate, the resulting video plays back with **0% frame drops**.
