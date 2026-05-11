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
- Print styles inject page size, margins, font embedding via `@font-face`
- Page break overlays in preview show exact cut points
- `<!-- pagebreak -->` comment = forced page break

Export settings per document:
- Paper size: A4, Letter, Legal
- Orientation: portrait / landscape
- Margins: Top, Right, Bottom, Left (independent sliders)
- Header/footer template with `{{page}}`, `{{total}}`, `{{title}}`, `{{date}}`, `{{author}}`
- Watermark toggle

Batch export and merged project PDF are v2.

---

## Image Support (v1)

Images are embedded directly into the markdown content as base64 data URIs. No separate image store, no file references - the content is self-contained.

### Paste from clipboard (Ctrl+V)
- Intercept `paste` event in the editor
- Check `clipboardData.items` for `image/*` type
- Read as `ArrayBuffer`, convert to base64
- Insert at cursor: `![image](data:image/png;base64,...)`
- If paste contains both text and an image, text takes priority (default browser behavior)

### File picker upload
- Button in toolbar (Format tab or dedicated image button)
- `<input type="file" accept="image/*">` triggered programmatically
- Read file as base64 via `FileReader`
- Insert at cursor as markdown image syntax

### Drag and drop into editor
- Listen for `dragover` + `drop` events on the editor container
- Extract image from `dataTransfer.files`
- Same base64 conversion and insertion

### Tradeoffs
- Base64 embeds make file content larger but completely self-contained
- No external URLs, no broken image links, works offline
- Large images (>2MB) will bloat the IndexedDB record - show a warning at >1MB

---



- [ ] Project scaffold (Vite + React + JSX, Bun, git init)
- [ ] Design system: CSS custom properties, dark/light mode, font imports
- [ ] Homepage: navbar, hero, Aurora animated bg, CTA
- [ ] App shell: 3-pane layout, ribbon toolbar structure
- [ ] Virtual file system: IndexedDB CRUD, sidebar file tree
- [ ] Editor: CodeMirror 6, Markdown syntax, basic shortcuts
- [ ] Live preview: remark + rehype pipeline, scroll sync
- [ ] Rendering: KaTeX, Mermaid.js, Shiki integration
- [ ] Theme system: token structure, theme picker gallery, live swap
- [ ] Page layout controls: paper size, margins, orientation
- [ ] PDF export: single file, window.print(), print CSS
- [ ] Image support: paste from clipboard (Ctrl+V) and file picker upload
- [ ] Style inspector panel (right sidebar)
- [ ] Offline support: Service Worker + Cache API

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
| v1 = single PDF export | Ship the core loop first. Merge/batch are edge cases |
| react-bits Aurora = copy-paste | Not an npm package. Copy component code directly into project |
| Bun for everything | Faster installs, consistent with user tooling |

---

## File Structure (planned)

```
markeon/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── homepage/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Hero.jsx
│   │   │   └── Aurora.jsx          (copy-pasted from react-bits)
│   │   ├── editor/
│   │   │   ├── EditorPane.jsx
│   │   │   ├── PreviewPane.jsx
│   │   │   └── ScrollSync.jsx
│   │   ├── sidebar/
│   │   │   ├── FileTree.jsx
│   │   │   └── Outline.jsx
│   │   ├── toolbar/
│   │   │   └── RibbonToolbar.jsx
│   │   ├── inspector/
│   │   │   └── StyleInspector.jsx
│   │   └── shared/
│   │       ├── Button.jsx
│   │       └── Modal.jsx
│   ├── store/
│   │   ├── useEditorStore.js
│   │   ├── useThemeStore.js
│   │   └── useFileStore.js
│   ├── lib/
│   │   ├── db.js                   (IndexedDB wrapper)
│   │   ├── markdown.js             (remark + rehype pipeline)
│   │   ├── themes.js               (built-in theme definitions)
│   │   └── pdf.js                  (print CSS generation)
│   ├── styles/
│   │   ├── tokens.css              (CSS custom properties)
│   │   ├── global.css
│   │   └── print.css               (PDF print styles)
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   └── AppPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── IDEA.md                         (original concept doc, do not edit)
├── PROJECT.md                      (this file - source of truth)
├── README.md
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
