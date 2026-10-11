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

- Top ribbon: File, Format, Style, Layout, and Export, plus a contextual Picture/Diagram Format tab when media is selected.
- Left sidebar: keyboard-accessible virtual file tree and document outline.
- Desktop workspace: CodeMirror source beside a stack of measured paper pages; pointer and keyboard splitter clamped to 20–80%.
- Compact workspace: full-width source/preview switch and a dismissible files/outline drawer.
- Reading mode: preview, outline, zoom, and functional File/Export controls; CodeMirror stays mounted to retain editing history.
- Media formatting uses click/keyboard selection, not hover controls. Escape or clicking outside clears the selection.

---

## Rendering Engine

- **remark + rehype** - Markdown to HTML pipeline
- **KaTeX** - LaTeX inline `$x^2$` and block `$$...$$`
- **Mermaid.js** - flowcharts, sequence, gantt, ER diagrams
- **Shiki** - syntax highlighting (VS Code-quality)
- **GFM** - GitHub Flavored Markdown (tables, task lists, strikethrough)
- Footnotes, emoji shortcodes
- Raw HTML is sanitized before generated KaTeX/Shiki markup is inserted.
- Setext headings and fenced examples retain normal Markdown semantics; no destructive thematic-line preprocessing.
- Images and Mermaid fences retain source positions for selected-element formatting. Mermaid layout remains automatic: flow direction, node/rank spacing, and connection curves are editable; free-form node dragging is not supported.
- Preview pagination measures the rendered document after fonts and diagrams are ready. Tables repeat headers and split rows/cells; paragraphs, lists, and code continue onto subsequent pages within the configured margins.

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
- `PreviewPane` renders and measures the document at the selected paper dimensions and margins, then displays physical page cards separated by visible gaps.
- `pdf.js:triggerPrint()` flushes the current editor and durable saves, waits for current fonts/images and measured pages, then clones those same unscaled pages into `#markeon-print-root`.
- `print.css` hides application chrome and gives each cloned card a physical page break. `@page` has zero margins; card padding is the single source of document margins.
- Preview and print share document typography, colors, watermark, image sizing, and table continuations. Reading-only diagram transforms and selection controls are removed from the print clone.
- `<!-- pagebreak -->` creates a real preview and printed page, including an intentional trailing blank page. The Format ribbon includes an insertion action.
- Slow images show a provisional-layout notice in preview; export waits for image completion and remeasures before printing.
- The active filename temporarily supplies `document.title`; title and print-root cleanup happen on `afterprint`.
- For matching browser PDF output, use 100% scale and disable browser headers/footers.

Export settings per document:
- Paper size: A4, Letter, Legal (via `@page { size: ... }` override)
- Orientation: portrait / landscape
- Margins: Top, Right, Bottom, Left
- Watermark overlay (optional)

Batch export and merged project PDF are v2.

---

## Image Support

Paste, drop, or choose an image to store its blob in IndexedDB `attachments`; Markdown references it with `markeon://img/<uuid>`. Preview and PDF resolve references to data URIs. Insertion is bound to the file and cursor position captured before asynchronous storage.

Selecting an image exposes width/alignment controls in Picture Format. Selecting a Mermaid block exposes Diagram Format with overall size (10–100%), alignment, automatic/default/dark/forest/neutral/base themes, a custom node color, font family, and text size (8–48 SVG px), plus flowchart-only layout controls. Diagram size scales relative to the largest aspect-preserving diagram that fits the print margins, so 50% halves the whole diagram even when it is tall. Selection outlines are inset on the image/SVG, keeping all four sides visible without affecting layout or print.

Custom node colors switch to Mermaid's configurable Base theme and choose contrasting label text. Picking a preset theme clears the custom palette; font choices persist. Document font/theme options follow the paper defaults. Settings are stored inside the selected fence and update both YAML configuration and effective legacy init directives, not document-wide frontmatter. Authored Mermaid class/style rules can override theme defaults.

Duplicated documents retain attachment references. File deletion atomically transfers still-referenced attachment ownership to surviving files and removes owned orphan blobs. Markdown export embeds attachment data URLs so the downloaded file is portable; missing attachments produce a visible error rather than a broken “successful” export.

## Persistence and editing

File state updates synchronously in memory; content saves are debounced per file and serialized durably in IndexedDB. Pending writes capture their file IDs, so switching documents does not redirect edits. Save failures remain visible even if another file saves successfully; pending or failed saves warn before unloading.

Import and duplication create a complete document in one operation, including theme, layout, and style settings. Theme/font changes reconfigure the existing CodeMirror view rather than replacing it, preserving undo history. Toolbar formatting and Ctrl/Cmd+B, I, and K share commands.

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
- [x] PDF export: measured preview pages reused by window.print(), current assets/layout, filename in Save As
- [x] Format tab: Bold, Italic, Strike, Inline Code, Link, H1/H2/H3, Blockquote, Lists, Code Block, Table, Divider, Page break
- [x] File tab: New, Duplicate, Import .md, Export .md, Delete
- [x] Style tab: per-file font overrides, heading/body color tokens
- [x] Image support: paste/drop/picker, attachment references, selection-based formatting, portable Markdown export
- [x] Reading mode: preview-only chrome, outline sidebar, pinch/slider zoom
- [x] Document outline: `rehype-slug`, sidebar TOC, smooth scroll to heading
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
| Print: clone measured pages to body root | The exact preview fragments supply print layout; zero browser margins prevent double padding |
| Preview = physical paper cards | A4/Letter/Legal and both orientations use shared geometry; CSS scaling affects viewing only |
| Image attachments | `markeon://img/` refs + IndexedDB blobs; rehype inlines for preview/PDF; no base64 in file content |
| Reading mode | CSS hides editor chrome; CodeMirror stays mounted; outline-only sidebar |
| Document TOC | `rehype-slug` + `DocOutline`; headings scraped from preview DOM |
| Resizable splitter = % widths | Pointer capture and keyboard controls clamp splitPct to 20–80%; compact screens switch panes |
| Theme = per-file | Resumes and journals need different visual treatments. themeId stored on each IndexedDB file record |
| Document theme stays scoped | Paper/background tokens apply to document surfaces, not app chrome; exact print colors preserve dark themes |
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
│   │   │   ├── EditorPane.jsx      (CodeMirror, captured-file autosave, paste/drop)
│   │   │   └── PreviewPane.jsx     (measured paper pages, selection, zoom-to-fit)
│   │   ├── sidebar/
│   │   │   └── FileTree.jsx
│   │   ├── toolbar/
│   │   │   ├── RibbonToolbar.jsx   (editing/reading tabs, current-document export)
│   │   │   └── MediaFormatPanel.jsx (selection-based image/diagram controls)
│   ├── store/
│   │   ├── useEditorStore.js
│   │   ├── useThemeStore.js
│   │   ├── useMediaStore.js        (selected source media)
│   │   └── useFileStore.js         (immediate state, serialized per-file durable saves)
│   ├── lib/
│   │   ├── db.js                   (IndexedDB wrapper via idb)
│   │   ├── markdown.js             (unified: remark + rehype + KaTeX)
│   │   ├── nanoid.js
│   │   ├── themes.js               (8 built-in theme token objects)
│   │   ├── pagination.js          (measured block/table/rich-text continuations)
│   │   ├── media.js               (selected-source formatting and Mermaid metadata)
│   │   ├── previewRef.js          (current preview readiness for export)
│   │   └── pdf.js                 (current-document measured-page print lifecycle)
│   ├── styles/
│   │   ├── global.css              (Tailwind v4 + Umbreon tokens)
│   │   ├── document.css            (.markeon-document typography)
│   │   └── print.css               (physical cards, shared screen/print styling)
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

Verification: `bun run test` covers Mermaid source boundaries, quoted/Windows-source fences, legacy init precedence, non-flowchart handling, and malformed YAML. `bun run build` checks the production bundle. Browser/PDF smoke scenarios are recorded in `PROGRESS.md`.

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
