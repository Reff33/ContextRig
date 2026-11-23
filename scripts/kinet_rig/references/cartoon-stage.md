# Proscenium Theatre Stage (`references/cartoon-stage.md`)

The sixth explainer style: flat educational cartoon storytelling where each scene operates as an independent stage proscenium.

---

## 1. Architectural Definition

Each scene is an isolated theatrical **stage** scaled to the viewport (1920x1080 with safe overscan), drawn in clean vector art, and animated with lively secondary motion (≥ 10 active animated elements).
The camera moves strictly **within** the bounds of the stage (zooming 1.08x to 1.95x, never extreme wide). Between stages, scenes transition via hard cuts or calibrated lateral 96px snaps with micro-blur.
Voiceover drives the narrative; visuals supply semantic meaning; **zero caption text clutter**.

---

## 2. Style Comparison: Collage vs. Proscenium Stage

| Attribute | Paper & Print Collage (`kinet-collage`) | Proscenium Stage (`kinet-stage`) |
|---|---|---|
| **World Geometry** | Single expansive paper canvas with cutout assets | Distinct stage prosceniums; one stage per scene |
| **Primary Motion** | Camera travels across static paper assets | Characters act within stage; camera tracks focus |
| **Scene Transition** | Deep 3D camera push-through | Hard cut or snappy 96px lateral push |
| **Canvas Background** | Cream paper, grain texture, tactile stamp blemishes | Vibrant flat color fields without skeuomorphic noise |
| **Text & Copy** | Narrative phrases with pill highlighter annotations | Zero captions; strictly diegetic labels only |
| **Asset Pipeline** | Paper cutouts with layered drop shadows | Clean vector characters with jointed limb hierarchy |

---

## 3. Core Theatrical Laws

1. **One Stage Per Scene:** Camera never pulls back to expose artificial stage boundaries.
2. **Jointed Vector Anatomy:** Character limbs pivot from natural joint anchors (`transform-origin: top center` for legs, `center left` for arms).
3. **Diegetic Sound Locking:** Footsteps, door opens, and coin clinks trigger deterministically on frame contact.
