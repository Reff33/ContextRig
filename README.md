<div align="center">

<img src="assets/image/ContextRig%20Icon.png" alt="ContextRig Icon" width="128" />

# ContextRig

**Project-scoped context, tool & skill provisioner for AI coding agents.**<br>
Rig any repository with tailored AI rules, executable scripts, dependencies, `.gitignore` rules, and cloud-synced updates across Claude Code, Cursor, OpenCode, GitHub Copilot, and ChatGPT — without context bloat or overwriting your custom rules.

[![Version](https://img.shields.io/badge/version-1.0.0-2f6fd6?style=flat-square)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-3fa34d?style=flat-square)](README.md)
[![Agents](https://img.shields.io/badge/agents-5%20AI%20Profiles-8a2be2?style=flat-square)](#supported-ai-agent-profiles)
[![Cloud Sync](https://img.shields.io/badge/sync-ETag%20304%20%2B%20SHA--256-00c853?style=flat-square)](#cloud-sync--project-registry)
[![Works with](https://img.shields.io/badge/works%20with-Claude%20Code%20%C2%B7%20Cursor%20%C2%B7%20OpenCode%20%C2%B7%20Copilot-7a5af5?style=flat-square)](#quick-start)

[Why](#why) · [Supported agents](#supported-ai-agent-profiles) · [Skills library](#curated-skills-library) · [Workflow](#recommended-workflow) · [Quick start](#quick-start) · [Cloud sync](#cloud-sync--project-registry) · [Layout](#repository-layout) · [FAQ](#faq)

</div>

---

## Why

Global AI skill folders dump every tool into every repository, bloating context windows and confusing models with irrelevant instructions. Manual per-repo setup, on the other hand, leaves scripts stale and rules inconsistent across projects.

**ContextRig** keeps skills **strictly project-scoped** while making cross-project management effortless via a global project registry (`~/.contextrig/projects.json`), Smart Merge, and conditional GitHub sync.

| Manual or Global Setup | ContextRig CLI |
|---|---|
| Global skill dumps bloat every project's prompt | **Project-Scoped Injection** — equip only what each repo needs |
| Copy-pasting `CLAUDE.md` / `.cursorrules` by hand | **5 Native Agent Templates** + Claude `.claude/commands/*.md` |
| Updates wipe hand-written project rules | **Smart Merge** (`mergeMode: 'merge'`) updates skill blocks in-place |
| Retyping folder paths to update every repo | **Global Registry + Sync All / By Skill** (`rig sync --all`) |
| Hitting GitHub API rate limits on every check | **ETag `304` + SHA-256 Hash Guard** + 1-hour TTL cache |

---

## Supported AI Agent Profiles

<details open>
<summary><b>5 agent profiles</b> — generated from modular Handlebars templates</summary>

| Profile | Output File | Template | Extras |
|---|---|---|---|
| **Claude Code** | `CLAUDE.md` | `templates/claude.md.hbs` | Generates `.claude/commands/<name>.md` slash commands |
| **Cursor** | `.cursorrules` | `templates/cursorrules.hbs` | Project-scoped Composer & AI rules |
| **OpenCode** | `AGENTS.md` | `templates/opencode.md.hbs` | Multi-agent specification |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `templates/copilot.md.hbs` | Repository Copilot instructions |
| **ChatGPT** | `CHATGPT.md` | `templates/chatgpt.md.hbs` | Context & guidelines for ChatGPT Projects |

</details>

---

## Curated Skills Library

<details open>
<summary><b>7 built-in skills</b> — scripts, instructions, dependencies & auto-gitignore</summary>

| Skill ID | Name | Slash Command | Injected Assets | Purpose |
|---|---|---|---|---|
| `kinet_rig` | **KinetRig (144–240 FPS)** | `/kinet-rig` | `rigtools/kinet_rig/` | Zero-dependency Ultra-HFR HTML5/GSAP/Three.js motion & video engine with live Web Audio capture |
| `archify` | **Archify** | `/archify` | *(Agent skill & rules)* | Interactive HTML architecture diagrams, ERD, sequence, and workflow visualizers |
| `graphify` | **Graphify** | `/graphify` | `rigtools/graphify.py` | Codebase dependency graph (`graphify-out/graph.html`), God Nodes & architectural report |
| `web_scraper` | **Web Scraper** | `/scrape` | `rigtools/scraper.py` | Clean webpage text extraction from URLs or docs straight in terminal |
| `playwright` | **Playwright** | `/playwright` | `rigtools/playwright_runner.js` | Headless Chromium runner for E2E checks, screenshots, and console error inspection |
| `db_inspector` | **DB Schema Inspector** | — | `rigtools/db_inspector.js` | Inspects SQLite databases & `.env` profiles into `docs/db_schema.md` |
| `git_workflow` | **Git Workflow** | `/commit` | *(System rules & command)* | Enforces Conventional Commits, diff metrics, secret guards & commit confirmation |

</details>

---

## Recommended Workflow

```mermaid
flowchart LR
  A[Inject<br>Select project, agent & skills] --> B[Smart Merge<br>Preserve hand-written rules]
  B --> C[Auto-Register<br>Save to ~/.contextrig/projects.json]
  C --> D{Update later}
  D --> E[Sync All<br>rig sync --all]
  D --> F[Update by Skill<br>rig sync --skill kinet_rig]
  D --> G[Clean Remove<br>Prune scripts, commands & empty dirs]
```

1. **Inject once per project (`[1] Inject Skills`):** ContextRig detects existing agent files & installed skills, preserves custom rules via Smart Merge, installs `npm`/`pip` dependencies, updates `.gitignore`, and registers the project in `~/.contextrig/projects.json`.
2. **Sync without typing paths (`[2] Sync & Update`):** Run `Sync All Registered Projects`, `Update by Skill` (push to projects or refresh ContextRig's master `scripts/`), or target the current working folder.
3. **Clean uninstall (`[3] Remove Skills`):** Deletes only the removed skill's files, slash commands, optional generated artifacts, and empty subdirectories without touching sibling skills.

---

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Reff33/ContextRig.git
cd ContextRig

# Install dependencies & link global CLI ('rig' / 'contextrig')
npm install
npm link
```

### Interactive & Direct CLI Commands

```bash
# Launch interactive menu
rig

# Open Sync Hub (Sync All / Update by Skill / Current Folder / Registered Projects)
rig sync

# Check & update all registered projects in one command
rig sync --all
rig sync --all --yes

# Skill-first update across all projects using a specific skill
rig sync --skill kinet_rig

# Sync a specific folder directly
rig sync ./my-project
```

---

## Cloud Sync & Project Registry

1. **ETag Conditional Requests (`If-None-Match`):** Remote files are checked with ETags so unchanged files return `304 Not Modified` with zero GitHub rate-limit cost.
2. **Local Integrity Guard:** ContextRig tracks SHA-256 hashes in `.contextrig_cache.json`. If a target file was deleted or edited locally, `304` caching is bypassed and the file is cleanly restored.
3. **Remote Preservation + Smart Merge:** Sync writes staged remote files first, then updates `CLAUDE.md` / `.cursorrules` in `merge` mode without copying stale local `scripts/` over fetched updates.
4. **Global Project Registry (`~/.contextrig/projects.json`):** Automatically remembers injected projects, configured agents, and skills, pruning deleted directories automatically during `Sync All`.
5. **GitHub Token Support:** Reads `GITHUB_TOKEN` from your environment or project `.env` to raise GitHub API limits from 60/hr to 5,000/hr.

---

## Repository Layout

```text
ContextRig/
├── assets/
│   └── image/
│       └── ContextRig Icon.png      Project icon
├── src/
│   ├── index.js                     CLI entry point, interactive menu & subcommands
│   ├── config.js                    Paths & supported AI agent profiles
│   ├── core/
│   │   ├── projectSetup.js          Path sanitization & target directory validation
│   │   ├── projectRegistry.js       Global ~/.contextrig/projects.json registry
│   │   ├── agentSelector.js         Agent profile picker with existing detection
│   │   ├── fileInjector.js          Handlebars compiler, Smart Merge & asset copier
│   │   ├── skillManager.js          Skill schema loader & creator
│   │   ├── skillUpdater.js          Installed skill detection, sync & safe removal
│   │   ├── syncEngine.js            ETag/SHA-256 remote sync, Sync All & Skill-First
│   │   ├── dependencyInstaller.js   Automated npm/pip & custom install_command runner
│   │   └── gitIgnoreManager.js      Automated .gitignore pattern management
│   └── utils/
│       ├── logger.js                Formatted console output & banners
│       └── table.js                 Boxed CLI skill table renderer
├── templates/                       Handlebars templates for 5 AI agent profiles
├── skills_library/                  JSON definitions & remote_url manifests
├── scripts/                         Local master scripts & skill toolkits
└── test_runner.js                   Automated integration test suite
```

---

## Testing

```bash
npm test
```

---

## FAQ

<details>
<summary><b>Will syncing overwrite my custom rules in CLAUDE.md or .cursorrules?</b></summary>

No. ContextRig uses Smart Merge (`mergeMode: 'merge'`) during sync so only the matching `### Skill Name` block under `## Available AI Skills & Tools` is updated, while your custom sections and hand-written rules remain untouched.
</details>

<details>
<summary><b>Do I have to type the project folder path every time I update a skill?</b></summary>

No. Projects are auto-registered in `~/.contextrig/projects.json` when you inject or sync once. Afterward you can use **Sync All Registered Projects**, **Update by Skill**, **Sync Current Folder**, or `rig sync --all` from any terminal.
</details>

<details>
<summary><b>How does ContextRig update ContextRig's own local scripts/ library?</b></summary>

Choose **Update by Skill → ContextRig Master Library** (under `[2] Sync` or `[4] Manage Skills Library`) to pull updated skill JSON manifests (`manifest_remote_url`) and remote files straight into `skills_library/` and `scripts/`.
</details>

---

## License

MIT © Reff
