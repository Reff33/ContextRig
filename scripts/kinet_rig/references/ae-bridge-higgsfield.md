# After Effects via Higgsfield Bridge — Direct Studio Compilation

Consult when the user has an active Adobe After Effects project with the Higgsfield MCP bridge (`ae_*`) connected and requests motion deliverables built **directly inside After Effects**.

---

## 1. Capabilities & Workarounds for the AE Bridge

| Bridge Capability | Current Limitation & Engineering Workaround |
|---|---|
| `ae_build_scene_from_lottie` generates comp + precomp + simple shape layers | Large Lotties (> ~60 KB) timeout. Use Lottie strictly for **skeletal structure**; populate contents via atomic ops. |
| `ae_batch` executes dozens of operations (`add_shape_layer`, `add_null_layer`, `import_image`, `modify_layer`, `set_keyframes`) | `apply_gradient` and `export_frame` inside a batch fail the entire payload. Run these as standalone tool calls. |
| `add_shape_layer` supports rectangle (with `roundness`) and ellipse with `{r,g,b}` (0–1) | Polygons/stars/gradients inside shapes: generate as external vector SVGs, render to PNG, and import. |
| `ae_import_image` imports PNG/JPG/WAV | Direct SVG import fails ("invalid file type"). Always stage image assets into a standard local path (e.g. `C:/ae-assets/`). |
| `ae_apply_gradient` applies 2-stop / 4-color ramps on static backgrounds | Keyframed gradients on animated layers fail. Use pre-rendered gradient textures. |
| `set_expression` drives Position, Scale, Rotation, Opacity, and Anchor points | Layer reordering (`ae_reorder_layers`) is unreliable. **Stack order = creation order**: build strictly from back to front. |
| `ae_export_contact_sheet` & `ae_export_frame` for visual verification | Remote URLs can occasionally timeout. Rerun frame export to capture a fresh frame ticket. |

---

## 2. Common AE Bridge Pitfalls

1. **Null Origin Offset:** Newly created null layers spawn at `(960, 540)`. Parenting an offset layer immediately causes spatial jumping. Always zero the child's relative transform after parenting.
2. **Project Saving:** The bridge cannot trigger a final project write to disk. Remind the user to press **Ctrl+S** in After Effects after generation.
