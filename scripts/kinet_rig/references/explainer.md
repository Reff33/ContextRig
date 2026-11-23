# Explainer Video Guide — Visual Narrative, Not Promos

An opener sparks an emotional desire; an explainer **delivers an argument**. The Anti-PowerPoint laws apply strictly, with one allowance: an explainer scene may pair one core sentence with one supporting annotation, diagram, or data figure.

---

## The 6 Explainer Style Archetypes

| Archetype | Visual Texture & Palette | Typography | Signature Camera Motion | Best Use Case |
|---|---|---|---|---|
| **1. Continuous Action (`kinet-flow`)** | Unified vector landscape | Clean geometric sans | Unbroken continuous 3D camera tracking | Complex workflows, pipelines, lifecycle |
| **2. Cartoon Collage (`kinet-collage`)** | Cream paper, stamp textures | Hand-drawn script + display sans | Deep 3D push-through into cutout layers | Science, educational explainers, history |
| **3. Visual Journalism (`kinet-editorial`)** | Near-black, high-contrast photos | Bold condensed sans + mono kicker | Highlighter wipes, dashed callout lines | Current events, documentary, case studies |
| **4. White Catalog (`kinet-catalog`)** | Pure white, subtle grey grid | Editorial serif + hairline annotations | Calm lateral pan, gentle object rotations | Consumer goods, architecture, portfolio |
| **5. Vintage Sketch (`kinet-engraving`)** | Sepia parchment, cross-hatching | Classic roman serif + cursive captions | Slow macro pans over fine linework | Biography, literature, heritage brands |
| **6. Theatrical Stage (`kinet-stage`)** | Flat solid colors, no texture | Monospace labels, zero captions | Calibrated 96px snaps between prosceniums | Character education, children's content |

---

## Step Zero: Settle the Core Parameters

Before writing any HTML or motion code, establish:
1. **Style Selection:** Choose from the 6 Archetypes above.
2. **Aspect Ratio:** `16:9` (1920x1080 for Web/YouTube) or `9:16` (1080x1920 for Reels/Shorts/TikTok).
3. **Pacing & Duration:** Standard explainer duration is 30s to 90s.
4. **Voiceover (VO):** Precompute word timestamps to sync with `tl.time()`.
