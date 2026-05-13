# Markeon - Project Context

> Markdown authoring and PDF publishing suite.
> Personal project. No shipping deadline. Build it right.

---

## What it is

A fully client-side web app for writing Markdown and exporting polished PDFs.
Think Notion's editing UX + Canva's style controls + Word's layout precision.

Named after Eevee's -eon evolution family. Umbreon is the aesthetic reference:
dark body, glowing amber-gold rings. The name reflects transformation - Markdown into a polished document.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Build | Vite | Fast dev server, SPA |
| Framework | React (JSX only, no TypeScript) | Plain `.jsx` files throughout |
| Package manager | Bun | All installs via `bun add` |
| Editor | CodeMirror 6 | Best-in-class, extensible |
| MD parsing | remark + rehype (unified) | Plugin-friendly pipeline |
| LaTeX | KaTeX | Fast, self-contained |
| Diagrams | Mermaid.js | Industry standard |
| Code highlighting | Shiki | VS Code-quality, 200+ languages |
| PDF export | `window.print()` + print CSS | No canvas artifacts, pixel-accurate |
| State | Zustand | Lightweight, no boilerplate |
| Styling | CSS custom properties | Theme tokens = live-swappable CSS vars |
| Storage | localStorage + IndexedDB | See storage section below |
| Animated bg | react-bits Aurora (copy-paste) | Not an npm package - CLI/manual copy |

---

## Storage Architecture

No File System Access API. Too many browser compatibility issues (Chrome-only, no Firefox/Safari).

Instead: a virtual file system living entirely in the browser.

| Layer | What lives here |
|---|---|
| **localStorage** | UI preferences, active file id, last theme, keybinding profile |
| **IndexedDB** | All file content (as plain text), project metadata, theme configs, font registry |

### Virtual File System Model

Files are stored as plain text blobs in IndexedDB. The sidebar file tree is a UI illusion - it reads from IndexedDB, not the OS filesystem.

Each "file" record:
```
{
  id: "uuid",
  name: "chapter-1.md",
  content: "# Hello\n...",
  createdAt: timestamp,
  updatedAt: timestamp,
  order: 0
}
```

Project-level config (theme ref, export settings, file order) also lives in IndexedDB.

No `.markflow/` folder. No FSAPI. No OS file writes. Fully self-contained in the browser.

---

## Color System

Umbreon-inspired. Near-blacks and warm amber-gold. Not plain black/white.

### Dark Mode (default)

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0C0C0C` | Page background |
| `--surface` | `#111111` | Cards, panels |
| `--surface-raised` | `#191919` | Dropdowns, hover states |
| `--border` | `#242424` | Dividers, outlines |
| `--text-primary` | `#F0EDED` | Main text |
| `--text-muted` | `#888888` | Labels, hints |
| `--accent` | `#E8B84B` | Buttons, highlights |
| `--accent-hover` | `#F5CB6A` | Hover state |
| `--accent-dim` | `#E8B84B22` | Subtle accent backgrounds |

### Light Mode

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#F9F7F4` | Warm off-white |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--surface-raised` | `#F0EDE8` | Hover states |
| `--border` | `#E2DDD7` | Dividers |
| `--text-primary` | `#111111` | Main text |
| `--text-muted` | `#777777` | Labels, hints |
| `--accent` | `#B8860B` | Darker gold (readable on light bg) |
| `--accent-hover` | `#9A7209` | Hover state |
| `--accent-dim` | `#B8860B18` | Subtle accent backgrounds |

---

## Typography

### UI Shell Fonts (not document fonts)

- **Bricolage Grotesque** - hero heading "Markeon" and slogan
- **Geist** - all other UI chrome: nav, buttons, labels, body

Both on Google Fonts.

### Document Fonts (inside the editor/preview)

Built-in curated set:

| Font | Category | Best for |
|---|---|---|
| Inter | Sans-serif | Default, body copy |
| Merriweather | Serif | Long-form, academic |
| Playfair Display | Display Serif | H1/H2 headings, editorial |
| Source Serif 4 | Serif | Body for print-optimized docs |
| Lora | Serif | Warm, journal style |
| JetBrains Mono | Monospace | Code blocks |
| Geist + Geist Mono | Sans + Mono | Modern, Vercel aesthetic |
| Fraunces | Variable Serif | Display headings |
| Bricolage Grotesque | Display Sans | Bold headings, editorial |

Custom font upload: `.ttf`, `.woff`, `.woff2` stored in IndexedDB as ArrayBuffer, registered via `FontFace` API.

---

## App Layout

3-pane workspace:

```
+----------------------------------------------------------+
|  Ribbon Toolbar (tabbed: File / Format / Style / Layout / Export) |
+----------+-------------------------+---------------------+
| File     |  Editor (CodeMirror 6) |  Style Inspector    |
| Tree     |                        |  (context panel)    |
|          +------------------------+                     |
| TOC /    |  Live Preview          |  Click element in   |
| Outline  |  (with page borders)   |  preview to edit    |
|          |                        |  its tokens         |
+----------+------------------------+---------------------+
```

- Left sidebar: virtual file tree + document TOC/outline
- Center: split editor (left) + live preview (right) with page boundary overlays
- Right panel: context-sensitive style inspector
- Top: ribbon toolbar with grouped tabs

---

## Rendering Engine

- **remark + rehype** - Markdown to HTML pipeline
- **KaTeX** - LaTeX inline `$x^2$` and block `$$...$$`
- **Mermaid.js** - flowcharts, sequence, gantt, ER diagrams
- **Shiki** - syntax highlighting (VS Code-quality)
- **GFM** - GitHub Flavored Markdown (tables, task lists, strikethrough)
- Footnotes, emoji shortcodes

---

## Theme System

A theme is a JSON blob of CSS custom property values. Nothing structural - purely visual tokens.

```json
{
  "name": "Academic Serif",
  "id": "academic-serif",
  "tags": ["academic", "serif", "minimal", "print"],
  "tokens": {
    "--font-heading": "EB Garamond",
    "--font-body": "Source Serif 4",
    "--font-mono": "JetBrains Mono",
    "--color-text": "#1a1a1a",
    "--color-accent": "#8b3a3a",
    "--type-scale": "1.333",
    "--base-size": "12pt",
    "--line-height": "1.7"
  }
}
```

### Built-in Themes (v1)

| Theme | Vibe | Best for |
|---|---|---|
| GitHub Docs | Clean, familiar | OSS README-style docs |
| Notion Light | Soft, spacious | General notes |
| Academic Serif | Formal, print-ready | Research papers |
| Dark Tech | Dark bg, colored headings | Dev docs, study notes |
| Legal Mono | Justified, numbered | Contracts, formal docs |
| Resume Pro | Compact, scannable | CV / Resume |
| Minimal Ink | Ultra-clean, ink-saving | Print efficiency |
| Warm Journal | Earthy tones, serif | Personal writing |

---

## PDF Export (v1)

**Single file only.** No batch, no merge, no zip.

Mechanism: `window.print()` with print CSS.
- `pdf.js:triggerPrint()` clones `#markeon-all-pages` into a `#markeon-print-root` div injected at the body root
- `print.css` hides all `body > *`, reveals only `#markeon-print-root` as a natural-flow block
- Browser paginates the block across as many pages as needed - no fixed/absolute positioning
- `<!-- pagebreak -->` in markdown = `break-before: page` in print CSS
- `document.title` is temporarily set to the active filename (minus `.md`) so the browser Save As dialog pre-fills the name

Export settings per document:
- Paper size: A4, Letter, Legal (via `@page { size: ... }` override)
- Orientation: portrait / landscape
- Margins: Top, Right, Bottom, Left
- Watermark overlay (optional)

Batch export and merged project PDF are v2.

---

## Image Support

**Deferred.** Removed from v1. The base64-embed approach (paste/drag/file-picker inserting `data:image/...` URIs into the markdown) bloated IndexedDB records and was not ergonomic.

Will be re-implemented in a future milestone with a cleaner approach - likely a dedicated attachment panel or modal rather than inline cursor insertion.

---



- [x] Project scaffold (Vite + React + JSX, Bun, git init)
- [x] Design system: CSS custom properties, dark/light mode, font imports
- [x] Homepage: navbar, hero, Aurora animated bg, CTA
- [x] App shell: 3-pane layout, ribbon toolbar, resizable editor/preview splitter
- [x] Virtual file system: IndexedDB CRUD, sidebar file tree, no-duplicate bootstrap
- [x] Editor: CodeMirror 6, Markdown syntax, basic shortcuts
- [x] Live preview: remark + rehype pipeline, A4 page cards, zoom-to-fit scaling
- [x] Rendering: KaTeX, Mermaid.js (lazy)
- [x] Shiki syntax highlighting: one-dark-pro, 20 languages, singleton via @shikijs/rehype
- [x] Theme system: 8 built-in themes, per-file themeId, live token injection, ThemePicker popover
- [x] Page layout controls: per-file font scale, margins, line height, paper size via Layout tab
- [x] PDF export: multi-page, window.print(), natural-flow print CSS, filename in Save As
- [x] Format tab: Bold, Italic, Strike, Inline Code, Link, H1/H2/H3, Blockquote, Lists, Code Block, Table, Divider
- [x] File tab: New, Duplicate, Import .md, Export .md, Delete
- [ ] Style tab: per-file font overrides, heading/body color tokens
- [ ] Image support (deferred - needs better UX design)
- [ ] Style inspector panel (on hold - low priority)
- [ ] Offline support: Service Worker + Cache API (low priority / skip for v1)

---


## v2 Scope (deferred, do not build)

- Template gallery
- Merged project PDF (all files with auto TOC)
- Batch export (zip of PDFs)
- Real-time collaboration
- Annotation layer
- Community theme sharing

---

## Key Decisions Log

| Decision | Why |
|---|---|
| JSX only, no TypeScript | Personal project, faster iteration |
| No FSAPI | Browser compat (Chrome-only). Virtual FS in IndexedDB is simpler and universal |
| window.print() for PDF | No canvas artifacts, pixel-accurate, no extra dependencies |
| Print: clone to body root | `position:fixed` on `#preview-content` broke multi-page export. Cloning to a top-level div lets browser paginate naturally |
| Preview = A4 page cards | Discrete pages match the print output. CSS scale transform handles zoom-to-fit when pane is narrow |
| Image support deferred | base64 inline embeds bloated IndexedDB. Will re-implement with a proper attachment model |
| Resizable splitter = % widths | Simpler than flex-basis manipulation. MouseMove sets splitPct clamped 20-80% |
| Theme = per-file | Resumes and journals need different visual treatments. themeId stored on each IndexedDB file record |
| Dark PDF via --page-bg | Each theme has `--page-bg` token. Injected to `:root` + print CSS reads it. `print-color-adjust: exact` forces browser to render backgrounds in PDF |
| Shiki singleton | Highlighter initialized once (WASM load). Processor cached after first build. Prevents re-init on every keystroke |
| react-bits Aurora = copy-paste | Not an npm package. Copy component code directly into project |
| Bun for everything | Faster installs, consistent with user tooling |

---

## File Structure (current)

```
markeon/
├── public/
│   └── favicon.svg                 (Umbreon-style SVG icon)
├── src/
│   ├── components/
│   │   ├── homepage/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   └── Aurora.jsx          (copy-pasted from react-bits, uses ogl)
│   │   ├── editor/
│   │   │   ├── EditorPane.jsx      (CodeMirror 6, no image handling)
│   │   │   └── PreviewPane.jsx     (A4 page cards, zoom-to-fit, #markeon-all-pages)
│   │   ├── sidebar/
│   │   │   └── FileTree.jsx
│   │   ├── toolbar/
│   │   │   └── RibbonToolbar.jsx   (Export PDF button passes filename to triggerPrint)
│   │   └── inspector/
│   │       └── StyleInspector.jsx  (placeholder)
│   ├── store/
│   │   ├── useEditorStore.js
│   │   ├── useThemeStore.js
│   │   └── useFileStore.js         (_bootstrapping guard prevents duplicate welcome.md)
│   ├── lib/
│   │   ├── db.js                   (IndexedDB wrapper via idb)
│   │   ├── markdown.js             (unified: remark + rehype + KaTeX)
│   │   ├── nanoid.js
│   │   ├── themes.js               (8 built-in theme token objects)
│   │   └── pdf.js                  (buildPrintStyle + triggerPrint with filename)
│   ├── styles/
│   │   ├── global.css              (Tailwind v4 + Umbreon tokens)
│   │   ├── document.css            (.markeon-document typography)
│   │   └── print.css               (multi-page natural-flow print CSS)
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   └── AppPage.jsx             (resizable splitter, 20-80% clamped)
│   ├── App.jsx
│   └── main.jsx
├── IDEA.md
├── PROJECT.md
├── PROGRESS.md
├── index.html
├── vite.config.js
├── package.json
└── .gitignore
```

---

## Homepage Design

Classic centered hero. Clean, typographic, confident. Background does the heavy lifting.

- Navbar: logo wordmark left, dark/light toggle right
- Hero: logo placeholder + "Markeon" in Bricolage Grotesque + slogan + CTA button
- Background: Aurora component (amber/gold color hints in dark mode, dialed back in light mode)
- CTA: "Open App" routes to `/app`

### CTA Button

```css
background: var(--accent);
color: #0C0C0C;
font-family: 'Geist', sans-serif;
font-weight: 600;
border-radius: 8px;
padding: 12px 28px;
/* hover: scale(1.02) + brightness(1.1) */
```

### Slogan

"Write in markdown. Publish like a designer."

---

## Aurora Background

react-bits does not have an npm package. Copy the component source from reactbits.dev/backgrounds/aurora directly into `src/components/homepage/Aurora.jsx`.

Check what peer dependencies the Aurora component needs (likely `three`, `@react-three/fiber`, `@react-three/drei`) and install only those via `bun add`.

Dark mode color stops: `["#E8B84B", "#C47A15", "#0C0C0C"]`
Light mode: same stops at low opacity (~0.3).

---

## Git Commit Conventions

This project keeps a clean, readable git history. Always provide a commit message after completing a feature or fix.

### Format

```
<type>(<scope>): <short summary>
```

- `feat` - new feature or capability
- `fix` - bug fix
- `refactor` - code change with no behavior change
- `style` - CSS / visual only changes
- `docs` - PROJECT.md, PROGRESS.md, README changes
- `chore` - config, tooling, dependency changes

Scope is optional but use it when the change is clearly isolated: `editor`, `preview`, `pdf`, `toolbar`, `store`, `print`, `homepage`.

### Examples

```
feat(preview): A4 page cards with zoom-to-fit scaling
fix(store): prevent duplicate welcome.md on StrictMode double-invoke
refactor(pdf): clone to body root for natural-flow multi-page print
style(toolbar): always-visible accent splitter handle with grip dots
docs: update PROJECT.md to reflect current implementation state
```

**After every completed feature or fix, always provide the commit message.**
