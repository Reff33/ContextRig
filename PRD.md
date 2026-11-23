# Product Requirements Document (PRD)

**Project Name:** ContextRig CLI (AI Agent Context & Environment Provisioner)  
**Platform:** Command Line Interface (CLI)  
**Version:** 1.0 (Minimum Viable Product - MVP)  
**Package Name:** `contextrig`  
**Command:** `npx contextrig` / `rig`  

---

## 1. Executive Summary

ContextRig CLI ialah perkakasan pembangun (developer tooling) berasaskan terminal yang mengautomasikan penyediaan persekitaran (environment provisioning) dan suntikan konteks untuk Ejen Pengekodan AI (seperti Claude Code, Cursor, ChatGPT, OpenCode, dan GitHub Copilot) di dalam mana-mana projek tempatan.

Ia menyelesaikan masalah konfigurasi berulang dengan menyediakan satu hab setempat untuk menyuntik fail peraturan (`CLAUDE.md`, `.cursorrules`), skrip alatan tempatan (`rigtools/`), serta menguruskan pemasangan kebergantungan pakej (`npm` & `pip`) secara automatik.

---

## 2. Project Objectives

- **Meningkatkan Kecekapan (Eliminate Friction):** Menghapuskan keperluan menyalin dan menampal (copy-paste) arahan sistem AI dan skrip alatan secara manual bagi setiap repositori baharu.
- **Pemusatan Keupayaan AI (Capability Registry):** Mewujudkan pangkalan data tempatan berasaskan JSON yang modular untuk menyimpan skrip alatan dan arahan ejen supaya boleh diguna semula merentas projek.
- **Penyediaan Konteks Tepat (Context Rigging):** Memastikan ejen AI memahami struktur projek, alatan yang tersedia, cara menjalankannya dari terminal, serta dependencies yang diperlukan dengan serta-merta.

---

## 3. Target Audience

- **Pembangun Perisian:** Pengguna AI code editors (Cursor, VS Code) atau coding agents (Claude Code, ChatGPT, OpenCode) yang memerlukan fail konfigurasi spesifik projek.
- **Jurutera AI & DevOps:** Pasukan yang mahu menyeragamkan amalan pengekodan (conventional commits, linting, testing tools) yang dipatuhi oleh pembantu AI.

---

## 4. Core Features & Scope (MVP)

| Modul Utama | Penerangan Ciri | Kriteria Penerimaan (Acceptance Criteria) |
| :--- | :--- | :--- |
| **Interactive CLI Menu** | Antaramuka terminal interaktif untuk navigasi sistem. | Menyokong navigasi anak panah (arrow keys) melalui `inquirer`. Menu bersih: `[1] Inject to Project`, `[2] Manage Library`, `[3] Exit`. |
| **Target Project Scaffolder** | Pengesahan & inisialisasi direktori projek sasaran. | Mengesahkan laluan folder (path), mencipta folder jika belum wujud, dan mengekstrak nama projek secara automatik. |
| **AI Profile Selector** | Pemilihan profil AI sasaran (Claude, Cursor, dsb.). | Mengenal pasti format fail output yang betul (`CLAUDE.md` untuk Claude, `.cursorrules` untuk Cursor). |
| **Modular Capability Library** | Pengurusan alatan & arahan daripada fail JSON. | Membaca fail JSON dalam `skills_library/`. Mengabaikan fail rosak secara automatik dengan amaran mesra. Membenarkan penambahan skil baharu secara interaktif. |
| **Template Injector** | Menjana fail konfigurasi AI menggunakan Handlebars. | Menyuntik variabel `projectName`, `agentName`, dan `skillsInstructions` dengan mod teks mentah (`noEscape: true`). Menyalin fail aset fizikal (cth: `scripts/` $\rightarrow$ `rigtools/`). |
| **Dependency Automation** | Automasi pemasangan kebergantungan (`npm` / `pip`). | Mengumpul kebergantungan secara unik dan menawarkan pilihan pengesahan (Y/N) untuk menjalankan `npm install` atau `pip install` dalam direktori sasaran. |
| **GitIgnore Manager** | Pengurusan pintar fail `.gitignore`. | Menambah laluan artifak janaan skil (cth: `graphify-out/`, `.contextrig_cache.json`) ke dalam `.gitignore` secara automatik tanpa prompts lewah. |
| **Cloud Sync & ETag Engine** | Pengesanan versi awan & optimum had permintaan. | Menggunakan Conditional Requests (`If-None-Match: ETag`), had masa TTL (1 jam), sokongan `GITHUB_TOKEN`, dan perbandingan SHA-256 hash untuk mengemas kini alatan skil tanpa terkena sekatan rate limit. |

---

## 5. Technical Architecture

- **Runtime:** Node.js (ES Modules - `"type": "module"`)
- **CLI Framework:** `@inquirer/prompts` / `inquirer` (navigasi interaktif) & `chalk` (penggayaan warna/banner).
- **Templating Engine:** `handlebars` (penjanaan teks dinamik tanpa HTML escaping).
- **File System:** Modul natif `node:fs/promises` & `node:path`.
- **Process Execution:** `node:child_process` (`execAsync`) untuk automasi pakej.

---

## 6. Directory Structure

```text
contextrig/
├── src/
│   ├── index.js                     # CLI Entry point & Main interactive menu
│   ├── config.js                    # Global paths and AI profiles
│   ├── core/
│   │   ├── projectSetup.js          # Validates & initializes target projects
│   │   ├── agentSelector.js         # Interactive selection of AI profiles
│   │   ├── fileInjector.js          # Handlebars compiler & asset copier
│   │   ├── skillManager.js          # Skill schema validator & library manager
│   │   ├── skillUpdater.js          # Automatic update detector & sync engine
│   │   ├── syncEngine.js            # Cloud-based ETag & TTL remote sync engine
│   │   ├── dependencyInstaller.js   # Automated npm/pip dependency installer
│   │   └── gitIgnoreManager.js      # Automated .gitignore updater
│   └── utils/
│       └── logger.js                # Styled console output & banners
├── templates/                       # Dynamic Handlebars templates
│   ├── claude.md.hbs                # Context template for Claude (CLAUDE.md)
│   ├── cursorrules.hbs              # Rules template for Cursor (.cursorrules)
│   ├── chatgpt.md.hbs               # Rules template for ChatGPT (CHATGPT.md)
│   ├── copilot.md.hbs               # Rules template for Copilot (.github/copilot-instructions.md)
│   └── opencode.md.hbs              # Rules template for OpenCode (AGENTS.md)
├── skills_library/                  # Curated library of JSON capabilities
│   ├── kinet_rig.json               # Zero-dependency 144 FPS kinetic motion & video engine
│   ├── archify.json                 # Interactive HTML diagrams & ERD skill
│   ├── web_scraper.json             # Web scraping tool & dependencies
│   ├── playwright.json              # Playwright browser & E2E testing skill
│   ├── graphify.json                # Graphify visual dependency & report skill
│   ├── db_inspector.json            # Database schema inspection skill
│   └── git_workflow.json            # Conventional commit & git conventions
├── scripts/                         # Reusable tools & scripts
│   ├── scraper.py                   # Python scraping tool asset
│   ├── playwright_runner.js         # Playwright browser runner asset
│   ├── graphify.py                  # Codebase visualizer & Graphify asset
│   └── db_inspector.js              # Database inspector utility asset
├── test_runner.js                   # Automated integration test suite
├── package.json
└── README.md
```

---

## 7. Standard Capability Schema (JSON)

Setiap fail di dalam `skills_library/` mematuhi skema standard berikut:

```json
{
  "id": "web_scraper",
  "name": "Web Scraper",
  "description": "Allows the AI to fetch and read web pages.",
  "ai_instructions": "To use the web scraper, run 'python rigtools/scraper.py <url>'. Read the output from the terminal.",
  "dependencies": {
    "npm": ["axios", "cheerio"],
    "pip": ["requests", "beautifulsoup4"]
  },
  "files_to_copy": [
    {
      "source": "scripts/scraper.py",
      "destination": "rigtools/scraper.py"
    }
  ]
}
```
