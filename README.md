# ContextRig CLI 🛠️

> **Developer Tool & Environment Provisioner for AI Coding Agents**  
> Easily rig, scaffold, and inject contextual rules (`CLAUDE.md`, `.cursorrules`), tools, and dependencies into any project repository.

---

## 💡 Why ContextRig?
AI coding agents like Claude Code, Cursor, Aider, and Windsurf require project-specific knowledge, tools, and rules to operate effectively. Manually copying instructions, writing system rules, and installing tool dependencies across every new repository is repetitive and error-prone.

**ContextRig** solves this by providing a single, interactive CLI tool to:
1. **Target Any Project Directory** — Scaffolds local project folders smoothly.
2. **Select Your AI Profile** — Supports Claude (`CLAUDE.md`), Cursor (`.cursorrules`), and is easily extensible.
3. **Inject Curated Capabilities & Skills** — Choose from a modular library of tools (e.g. Web Scrapers, API Testers, Git Workflows).
4. **Automate Dependency Installation** — Automatically installs required `npm` or `pip` packages directly in your project.

---

## 🚀 Quick Start

### Installation & Run

```bash
# Clone the repository
git clone <your-repo-url>
cd ContextRig

# Install dependencies
npm install

# Start ContextRig CLI
npm start
# or run directly:
node src/index.js
```

---

## 📂 Architecture & Directory Structure

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

## 📋 Standard Skill JSON Schema

Every modular capability inside `skills_library/` adheres to this standard schema:

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

---

## 🧪 Testing

Run the automated integration test suite:

```bash
npm test
```

---

## 📄 License
MIT License
