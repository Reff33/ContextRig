---
name: figcraft-script
description: Plan a FigCraft screen as a JSON command script, run it headlessly in one undoable batch, then verify. Use when the user wants FigCraft UI/UX work done fast — "build this screen", "design a dashboard in FigCraft", "make a mockup quickly", "batch several frames", or asks why the agent is slow in FigCraft.
---

# FigCraft Script-First Workflow

FigCraft exposes a headless command engine. Clicking around the GUI is slow and
fragile; **writing one JSON script and running it in a single batch is the fast
path** — the whole screen lands in one undo step, and a failed step rolls back
with nothing written.

Use this whenever the task is a FigCraft design, and especially for more than
three layers.

## The loop (do this every time)

1. **Plan in text.** List the frames, then each child layer with type and
   coordinates. Do not open the app first.
2. **Write the spec**, not the commands — `rigtools/figcraft_script/build.mjs`
   expands it into valid `figcraft-cli run` commands and wires `$ref` so children
   attach to the right frame.
3. **Build the script.**
   `node rigtools/figcraft_script/build.mjs spec.json --out figcraft-script.json`
4. **Check the CLI is real.** `figcraft-cli --version`. If it is missing, stop and
   tell the user — do not silently emit an HTML preview instead.
5. **Run it.** `figcraft-cli run figcraft-script.json --out screen.figcraft`
   (add `--run --file screen.figcraft` to the builder to do steps 4–5 itself).
6. **Verify, always.** `figcraft-cli info screen.figcraft --json` (structure,
   missing fonts), then `figcraft-cli export screen.figcraft -o out/ --format png
   --scale 2` and look at the PNG. A script that exited 0 is not a design that
   looks right.

## Spec shape

```json
{
  "name": "Dashboard",
  "template": "desktop-app",
  "frames": [
    {
      "name": "Overview",
      "preset": "Desktop 1440",
      "children": [
        { "type": "rect", "x": 0, "y": 0, "width": 1440, "height": 64,
          "props": { "fill": "#0F172A", "cornerRadius": 0 } },
        { "type": "text", "x": 32, "y": 22, "text": "Acme Analytics",
          "props": { "fontSize": 18, "fontStyle": "Bold", "fill": "#F8FAFC" } }
      ]
    }
  ]
}
```

Rules the builder enforces:

- `frames` must be non-empty; every frame gets an `as` name (`frame0`, `frame1`, …).
- Children get `parent: {"$ref": "frameN"}` automatically — never hand-write ids.
- `preset` and explicit `width`/`height` are mutually exclusive in practice; prefer
  the preset so FigCraft applies the device size.
- `template` is optional; it must be a starter the app knows
  (`figcraft-cli commands --json` lists them).

## Attached mode (the user watches)

Headless writes a file; attached drives the running app. Start it with
`figcraft --control 7979`, then either:

- `figcraft-cli mcp --attach 7979` (MCP tools), or
- newline-JSON over the control channel:
  `{"id":1,"method":"engine.execute","params":{"command":"frame.create","params":{...}}}`

After a batch, `document.inspect` (or MCP `inspect_document`) is the check. Attached
calls are **never replayed** after a transport failure — inspect before retrying.

## Installing figcraft-cli (do this instead of stalling)

`figcraft-cli` is not on `PATH` after a normal install — the launcher installs the app, not the
CLI. On Windows the CLI ships **inside the portable zip** next to `figcraft.exe`
(`figcraft-cli.exe`, verified against release v0.18.1). So "command not found" means *install it*,
not *stop and ask*.

**Windows** (no admin, user-local):

```powershell
$VER = "0.18.1"
$REL = "https://github.com/storytold/figcraft/releases/download/v$VER"
$ZIP = "figcraft-$VER-windows-x64-portable.zip"
$DIR = "$env:LOCALAPPDATA\FigCraft"
New-Item -ItemType Directory -Force -Path $DIR | Out-Null
Invoke-WebRequest "$REL/$ZIP" -OutFile "$env:TEMP\$ZIP"
# Verify against the release checksum before unpacking
$sums = Invoke-WebRequest "$REL/SHA256SUMS.txt" | Select-Object -ExpandProperty Content
$expected = ($sums -split "`n" | Select-String $ZIP).ToString().Split(' ')[0]
if ((Get-FileHash "$env:TEMP\$ZIP" -Algorithm SHA256).Hash.ToLower() -ne $expected.ToLower()) {
  throw "checksum mismatch — stop"
}
Expand-Archive "$env:TEMP\$ZIP" -DestinationPath $DIR -Force
# The zip unpacks one folder; the exes live inside it
$bin = (Get-ChildItem $DIR -Recurse -Filter figcraft-cli.exe | Select-Object -First 1).DirectoryName
& "$bin\figcraft-cli.exe" --version
```

Add `$bin` to `PATH` (or call the exe by full path — `--cli <path>` on the builder does this).

**macOS / Linux**: follow *Getting the CLI (the launcher installs the app, not the CLI)* in
`rigtools/artcraft/figcraft/SKILL.md`; the released `figcraft-cli-<ver>-macos-universal.zip` and the
Linux `FigCraft.AppImage cli <args>` wrapper both work.

Rules: verify the checksum, never use admin/sudo to place the binary in a shared location, and never
replace a different `figcraft-cli` version without telling the user.

If install fails and the user declines, fall back to what this skill already allows — emit the
`.figcraft` scaffold, say plainly that it was not run, and offer the install again. Do not claim a
screen "works" without a `info` + PNG check.

## What this skill refuses to do

- **No GUI clicking.** `ui.pointer`/`ui.key` exist, but blind clicking is the slow
  path; commands are deterministic and undoable.
- **No silent fallback.** If `figcraft-cli` is missing, install it (see above) or offer the scaffold
  path. Never substitute an HTML mockup unless the user asks.
- **No unverified success.** Exit 0 means the batch ran, not that the design is
  correct. Export and inspect before reporting.

## Speed notes

- One `frame.create` per frame, then all its children in the same script — not one
  command per node round-trip.
- Batch related edits: `command.batch` with `onError: "abort"` is one undo step.
- Reuse a starter template (`file.newFromTemplate`) when the app ships one that
  matches the job instead of building chrome from scratch.
- `data.fill` + `text.fit` turn one frame into a set of copies from a JSON row list
  — use them for carousels / many post sizes instead of a per-copy loop.
