# Strict Vector Asset Guide (Zero Emojis)

## The Law
**NEVER use system/OS copy-paste emojis (🤖, ⚡, 🐙, 💬, 🧠, 🕷) in video scenes.**

### Why Emojis Fail
- OS-dependent: Looks different on macOS, Windows, and Linux.
- Pixelation: Emojis are pre-rendered bitmap fonts that blur/pixelate on 1080p and 4K displays.
- Visual Discord: Glossy cartoon emojis clash with high-tech, cinematic, or minimalist dark palettes.

### The Professional Fix: Inline SVG Vectors
Every icon must be an inline SVG:
```html
<svg viewBox="0 0 24 24" fill="currentColor">
  <!-- path data -->
</svg>
```

### Free Sources for Instant Inline SVGs (No NPM Packages Needed)
1. **Simple Icons (simpleicons.org):** Official brand SVGs for Anthropic/Claude, OpenAI, Cursor, GitHub, Google, Meta, Linux, Docker, etc.
2. **Lucide Icons (lucide.dev):** Studio UI icons for code, databases, charts, networks, tools, security, analytics.
3. **SVG Repo (svgrepo.com):** Royalty-free vector paths.

### Adding Neon Glow to Inline SVGs
```css
.brand-icon svg {
  filter: drop-shadow(0 0 10px var(--accent));
  transition: transform 0.3s ease;
}
```
