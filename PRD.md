# Product Requirements Document (PRD)

**Project Name:** ContextRig CLI (AI Agent Context & Environment Provisioner)  
**Platform:** Command Line Interface (CLI)  
**Version:** 1.0 (Minimum Viable Product - MVP)  
**Package Name:** `contextrig`  
**Command:** `npx contextrig` / `rig`  

---

## 1. Executive Summary

ContextRig CLI ialah perkakasan pembangun (developer tooling) berasaskan terminal yang mengautomasikan penyediaan persekitaran (environment provisioning) dan suntikan konteks untuk Ejen Pengekodan AI (seperti Claude Code, Cursor, Aider, dan Windsurf) di dalam mana-mana projek tempatan. 

Ia menyelesaikan masalah konfigurasi berulang dengan menyediakan satu hab setempat untuk menyuntik fail peraturan (`CLAUDE.md`, `.cursorrules`), skrip alatan tempatan (`tools/`), serta menguruskan pemasangan kebergantungan pakej (`npm` & `pip`) secara automatik.

---

## 2. Project Objectives

- **Meningkatkan Kecekapan (Eliminate Friction):** Menghapuskan keperluan menyalin dan menampal (copy-paste) arahan sistem AI dan skrip alatan secara manual bagi setiap repositori baharu.
- **Pemusatan Keupayaan AI (Capability Registry):** Mewujudkan pangkalan data tempatan berasaskan JSON yang modular untuk menyimpan skrip alatan dan arahan ejen supaya boleh diguna semula merentas projek.
- **Penyediaan Konteks Tepat (Context Rigging):** Memastikan ejen AI memahami struktur projek, alatan yang tersedia, cara menjalankannya dari terminal, serta dependencies yang diperlukan dengan serta-merta.

---

## 3. Target Audience

- **Pembangun Perisian:** Pengguna AI code editors (Cursor, Windsurf) atau terminal agents (Claude Code, Aider) yang memerlukan fail konfigurasi spesifik projek.
- **Jurutera AI & DevOps:** Pasukan yang mahu menyeragamkan amalan pengekodan (conventional commits, linting, testing tools) yang dipatuhi oleh pembantu AI.

---

## 4. Core Features & Scope (MVP)

| Modul Utama | Penerangan Ciri | Kriteria Penerimaan (Acceptance Criteria) |
| :--- | :--- | :--- |
| **Interactive CLI Menu** | Antaramuka terminal interaktif untuk navigasi sistem. | Menyokong navigasi anak panah (arrow keys) melalui `inquirer`. Menu bersih: `[1] Inject to Project`, `[2] Manage Library`, `[3] Exit`. |
| **Target Project Scaffolder** | Pengesahan & inisialisasi direktori projek sasaran. | Mengesahkan laluan folder (path), mencipta folder jika belum wujud, dan mengekstrak nama projek secara automatik. |
| **AI Profile Selector** | Pemilihan profil AI sasaran (Claude, Cursor, dsb.). | Mengenal pasti format fail output yang betul (`CLAUDE.md` untuk Claude, `.cursorrules` untuk Cursor). |
| **Modular Capability Library** | Pengurusan alatan & arahan daripada fail JSON. | Membaca fail JSON dalam `skills_library/`. Mengabaikan fail rosak secara automatik dengan amaran mesra. Membenarkan penambahan skil baharu secara interaktif. |
| **Template Injector** | Menjana fail konfigurasi AI menggunakan Handlebars. | Menyuntik variabel `projectName`, `agentName`, dan `skillsInstructions` dengan mod teks mentah (`noEscape: true`). Menyalin fail aset fizikal (cth: `scripts/` $\rightarrow$ `tools/`). |
| **Dependency Automation** | Automasi pemasangan kebergantungan (`npm` / `pip`). | Mengumpul kebergantungan secara unik dan menawarkan pilihan pengesahan (Y/N) untuk menjalankan `npm install` atau `pip install` dalam direktori sasaran. |
| **GitIgnore Manager** | Pengurusan pintar fail `.gitignore`. | Menambah laluan artifak janaan skil (cth: `graphify-out/`) ke dalam `.gitignore` secara automatik tanpa prompts lewah. |
| **Skill Updater & Sync** | Pengesanan versi dan kemas kini pintar skil. | Mengesan skil terpasang dalam projek sasaran menggunakan hash content perbandingan, memaparkan status `[UPDATE AVAILABLE]` atau `[UP TO DATE]`, dan mengemas kini fail tools serta rules dengan sekali klik. |

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
│   │   ├── dependencyInstaller.js   # Automated npm/pip dependency installer
│   │   └── gitIgnoreManager.js      # Automated .gitignore updater
│   └── utils/
│       └── logger.js                # Styled console output & banners
├── templates/                       # Dynamic Handlebars templates
│   ├── claude.md.hbs                # Context template for Claude (CLAUDE.md)
│   └── cursorrules.hbs              # Rules template for Cursor (.cursorrules)
├── skills_library/                  # Curated library of JSON capabilities
│   ├── web_scraper.json             # Web scraping tool & dependencies
│   ├── api_tester.json              # REST API tester & mock runner
│   ├── graphify.json                # Graphify visual dependency & report skill
│   └── git_workflow.json            # Conventional commit & git conventions
├── scripts/                         # Reusable tools & scripts
│   ├── scraper.py                   # Python scraping tool asset
│   ├── api_tester.js                # API testing tool asset
│   └── graphify.py                  # Codebase visualizer & Graphify asset
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
  "ai_instructions": "To use the web scraper, run 'python tools/scraper.py <url>'. Read the output from the terminal.",
  "dependencies": {
    "npm": ["axios", "cheerio"],
    "pip": ["requests", "beautifulsoup4"]
  },
  "files_to_copy": [
    {
      "source": "scripts/scraper.py",
      "destination": "tools/scraper.py"
    }
  ]
}
```
