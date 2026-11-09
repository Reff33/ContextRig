# 144 FPS Offline Rendering Guide

## Why 144 FPS?

Modern displays (gaming monitors, high-refresh mobile screens, Apple ProMotion) run at 120Hz - 144Hz. Traditional 30fps and 60fps videos stutter on fast horizontal whips and 3D camera push-throughs. 144 FPS delivers cinema-grade buttery smoothness.

## How Deterministic Offline Stepping Works

Instead of recording a live screen (which drops frames when complex shaders lag):

1. Puppeteer launches headless Chromium with WebGL GPU flags enabled.
2. The script steps the timeline mathematically:
   ```javascript
   const t = i / 144; // Advance 1/144th of a second
   window.OPENER.seek(t);
   ```
3. Awaits two `requestAnimationFrame` ticks so CSS styles, transforms, and WebGL buffers finish painting.
4. Captures the pixel buffer via `page.screenshot()`.
5. Assembles all frames into a pristine MP4 via ffmpeg:
   ```bash
   ffmpeg -framerate 144 -i frames/f%05d.png -c:v libx264 -pix_fmt yuv420p -crf 14 output_144fps.mp4
   ```

Because each frame is rendered offline, even if a frame takes 400ms to calculate, the resulting video plays back with **zero frame drops**.
