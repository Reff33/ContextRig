# Visual QA Scorecard (`references/aesthetic-qa.md`)

A rigorous aesthetic and technical audit protocol for AI coding agents before declaring a KinetRig motion deliverable complete.

---

## 1. The 10-Point Visual Quality Audit

| # | Inspection Criterion | Requirement | Failure Symptom |
|---|---|---|---|
| 1 | **Strict Zero-Emoji Law** | 100% Inline SVG vectors (`<svg viewBox="0 0 24 24">`) | Any OS emoji (`🤖`, `⚡`, `🐙`, `🚀`) in UI, cards, or titles |
| 2 | **Typography Legibility Scale** | Titles ≥ 48px, subtitles ≥ 30px, metadata ≥ 20px | Tiny, unreadable text (< 20px on 1080p canvas) |
| 3 | **Two-Level Hierarchy Law** | Maximum 2 distinct text levels per scene | Dense editorial paragraphs cluttering motion frames |
| 4 | **Focal Point Continuity** | Eye position must carry seamlessly across cuts | Viewer forced to dart eyes from top-left to bottom-right |
| 5 | **Continuous World Travel** | Camera physically travels between scenes | Opacity fades where background stays static like slides |
| 6 | **Easing Physics Authenticity** | Use `power3.out`, `expo.out`, or `back.out` | Stiff `linear` motion or mechanical `power1.in` deceleration |
| 7 | **Safe Margins & Viewport Bounds** | Minimum 120px padding from canvas perimeter | Text or buttons cropped against monitor/phone bezels |
| 8 | **60-30-10 Color Discipline** | 60% base (dark/light), 30% structural, 10% accent | Rainbow visual chaos lacking brand coherence |
| 9 | **Deterministic Timeline Seeking** | All elements strictly follow `tl.time(t)` | Animations desyncing during scrubber or frame export |
| 10 | **Clean Recording Protocol** | `body.clean-capture` hides HUD and cursor | Exported video contains scrubber slider or mouse pointer |

---

## 2. Focal Point Continuity & Eye-Tracking

Human eyes cannot refocus across wide distances in 0.3s. When designing transitions:

1. **Center-Weighted Anchor:** If Scene A's climactic element is in the horizontal center, Scene B's initial focal element must begin in the horizontal center.
2. **Directional Flow:** If Scene A exits toward the right (`x: 1920`), Scene B's focal point must enter from the left (`x: -1920`) to preserve directional momentum.

---

## 3. Typographic Density Laws

- **1 Shot = 1 Idea:** A single scene must communicate one takeaway statement in 5 words or fewer.
- **Negative Space Rule:** At least 40% of the canvas area must remain empty negative space to allow the subject room to breathe.
- **Contrast Ratio:** Text must maintain a minimum 4.5:1 luminance contrast ratio against spatial backgrounds.

---

## 4. Headless Frame Verification Script

Run the snapshot tool across critical keyframe timestamps:

```bash
node rigtools/kinet_rig/scripts/snap.mjs shots 1.0 4.0 8.5 15.0 22.0
```

Inspect the generated images in `shots/`:
- Are any text elements colliding?
- Does the background lighting overpower foreground typography?
- Are border-radius corners clipping interior text?
