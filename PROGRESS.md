# Markeon - Progress Log

Append-only. Each entry records what was built, decisions made during build, and what changed from the plan.

---

## [2026-05-12] Project setup and docs

**What was done:**
- Wrote `IDEA.md` - plain English description of the concept with no technical details. Serves as the human-readable pitch document.
- Wrote `PROJECT.md` - the full technical source of truth for the project. Contains: confirmed tech stack, storage architecture, color system (dark + light Umbreon theme), typography decisions, UI font choices (Bricolage Grotesque for hero, Geist for UI), app layout diagram, rendering engine choices, theme system spec, PDF export scope, v1 checklist, v2 deferred features, key decisions log, and planned file structure.

**Key decisions made in this session:**
- JSX only, no TypeScript. Personal project, speed over type safety.
- No File System Access API. Browser compatibility is too narrow (Chromium-only). Virtual file system instead: all files stored as plain text in IndexedDB. The sidebar file tree is a UI illusion backed by IndexedDB records.
- v1 PDF export = single file only via `window.print()`. Merged/batch export is v2.
- react-bits Aurora is not an npm package. It is copy-pasted from reactbits.dev into the project.

**Files created:**
- `IDEA.md` (rewritten - stripped all technical details, plain English only)
- `PROJECT.md` (new - complete technical spec and decisions log)
- `PROGRESS.md` (this file)

**Commit suggestion:** `docs: add project spec, idea doc, and progress log`

---

## [2026-05-12] Scaffold, design system, homepage, app shell

Full project skeleton built and running at localhost:5173.

Infrastructure: package.json, vite.config.js, index.html, .gitignore. All Google Fonts preloaded. KaTeX from CDN. bun install (318 packages) + bun add ogl lucide-react.

Design system: tokens.css (Umbreon palette dark/light, spacing, glass tokens), global.css (reset, scrollbar, focus), print.css (@media print - hides chrome, exposes preview, page breaks).

Lib layer: db.js (IndexedDB via idb - files/themes/fonts/meta stores), markdown.js (unified pipeline: remark-parse + gfm + math + rehype + katex + stringify), themes.js (8 built-in theme token objects), pdf.js (buildPrintStyle + triggerPrint), nanoid.js (crypto.getRandomValues).

State: useThemeStore (mode, activeThemeId, toggleMode writes data-theme attr), useFileStore (full CRUD against IndexedDB, bootstraps with welcome file), useEditorStore (editor prefs + full export settings).

Homepage: Aurora.jsx (WebGL via ogl, amber/gold stops, fixed full-bleed z-index 0), Navbar.jsx (logo glow + glass theme toggle), Hero.jsx (badge + wordmark in Bricolage Grotesque clamp(64px,10vw,96px) + slogan + CTA).

App shell: flexbox layout (glass toolbar + sidebar + work area + inspector). Work area = EditorPane (50%) + PreviewPane (50%). All panels: backdrop-filter blur(20px). RibbonToolbar (5 tabs + filename display + export button). FileTree (virtual file list, click/dblclick rename/hover delete). StyleInspector (placeholder).

Editor+Preview: CodeMirror 6 assembled from individual packages (no meta-package). Extensions: history, lineNumbers, markdown language, syntax highlighting, keymaps, lineWrapping. Debounced save 400ms. oneDark in dark mode. PreviewPane: markdown pipeline on file change, white page card with shadow, Mermaid lazy-imported.

Key decisions: ogl over three.js (lighter), CSS Modules throughout, Mermaid lazy import for bundle size.

**Commit suggestion:** feat: scaffold + design system + homepage + app shell

---

## [2026-05-12] Migrate to Tailwind CSS v4

**Reason:** User wanted Tailwind for the website UI, with light/dark theming defined in global CSS.

**What changed:**
- Installed `tailwindcss@4.3.0` + `@tailwindcss/vite@4.3.0` (no config file, CSS-first)
- Updated `vite.config.js` to add `tailwindcss()` Vite plugin
- Merged `tokens.css` into `global.css`. Global CSS now starts with `@import "tailwindcss"` followed by all CSS vars in `[data-theme='dark']` and `[data-theme='light']` blocks. Deleted `tokens.css`.
- Created `src/styles/document.css` - plain global CSS scoped to `.markeon-document` class. Applied to the preview pane's rendered HTML. This is the document typography layer (headings, code, tables, blockquotes, etc.) and works for both browser preview and `window.print()`. This replaces `PreviewPane.module.css` which couldn't work with `dangerouslySetInnerHTML`.
- Deleted all 9 `.module.css` files.
- Rewrote all JSX components with Tailwind utility classes. CSS vars referenced via inline `style` props for themed colors (`bg-[var(--bg)]` pattern where needed, inline `style` for dynamic vars).

**Homepage light mode fix:**
- Light mode Aurora now uses warmer gold color stops (`#e8b84b`, `#d4a017`, `#c8a96e`) and `blend: 0.6` at `opacity: 0.4` on the container. Previously was white/grey wash with the dark color stops at low opacity which looked muddy.
- Added `--hero-glow` CSS token (dark mode only) for the wordmark text-shadow effect.

**Approach for theming:**
- All color tokens stay as CSS custom properties in `global.css` - not Tailwind theme config.
- Tailwind handles: layout (flex, grid), spacing (p-4, gap-2), sizing (w-full, h-dvh), typography scale utilities, transitions, rounded, border, z-index.
- CSS vars handle: all colors, glassmorphism values, font families, document token system.
- This keeps the two systems cleanly separated.

**Commit suggestion:** `refactor: migrate UI to Tailwind CSS v4, fix light mode homepage`

---

## [2026-05-12] Image support

Three insertion methods, all convert to base64 data URIs embedded directly in the markdown content.

**`src/lib/images.js`** - utilities:
- `fileToBase64(file)` - wraps FileReader in a Promise, returns data URL
- `insertImageMarkdown(view, dataUrl, altText)` - inserts `![alt](dataUrl)` at the CM6 cursor
- `handleImageFile(view, file)` - combines both, returns true if handled
- `isOversized(file)` - true if file > 1MB

**`EditorPane.jsx` additions:**
- `pasteHandler` - CM6 `EditorView.domEventHandlers({ paste })`. Scans `clipboardData.items` for `image/*`. If found, prevents default (stops OS text paste), reads file, inserts. Text paste is unaffected.
- `onDragOver` / `onDragLeave` / `onDrop` - container-level drag events. Checks `dataTransfer.items` for images. On match, prevents browser from opening the image file.
- File picker - hidden `<input type="file" accept="image/*">` ref'd to a button in the editor header bar. Click opens OS file picker.
- `isDragging` state - shows full-editor overlay with dashed border and icon when dragging a valid image over the editor.
- `sizeWarning` state - amber toast at bottom center if image > 1MB. Auto-dismisses after 4s, also has an X button.
- `viewRef` - stores the CM6 view instance so drag/drop/picker handlers can access it outside the useEffect.

**Alt text logic:** File picker and drag-drop use the filename (minus extension) as alt text. Clipboard paste uses `"image"` as the alt.

**Commit suggestion:** `feat: image support - paste, drag-drop, file picker`

---

## [2026-05-12] Remove image feature, resizable splitter, A4 page preview, duplicate file fix

**What changed:**

- **Image insertion removed** (`EditorPane.jsx`): Stripped paste handler, drag-drop events, file picker button, size warning toast, `imagePreviewPlugin`, and all imports from `images.js` / `imageWidget.js`. Image support will be re-integrated later with a better approach (modal or sidebar panel, not inline base64 embeds).

- **Resizable splitter** (`AppPage.jsx`): Draggable 6px handle between editor and preview. Split is clamped 20%-80%. Handle shows a subtle pill indicator that brightens on hover.

- **A4 page preview** (`PreviewPane.jsx`): Preview now renders discrete A4 page cards (794x1123px). Content splits at `<!-- pagebreak -->` markers. Each card has shadow and a page number badge. Multiple pages stack vertically with gaps.

- **Duplicate welcome.md fix** (`useFileStore.js`): Module-level `_bootstrapping` flag prevents React StrictMode's double `useEffect` invocation from calling `loadFiles` twice and creating two welcome files.

- **Title bar**: `index.html` already has `<title>Markeon</title>` and correct SVG favicon. Stale browser tab from another project resolves with a hard refresh.


**Commit suggestion:** `feat: A4 page preview, resizable splitter, remove image feature, fix duplicate welcome`

---

## [2026-05-12] Visible splitter, page number removal, PDF filename

**What changed:**

- **Splitter** (`AppPage.jsx`): Replaced near-invisible gap with permanent 2px amber accent rail + three grip dots. Hovering tints with `--accent-dim`.
- **Page number badge removed** (`PreviewPane.jsx`): `i+1 / pages.length` badge removed from each page card.
- **PDF filename** (`pdf.js`, `RibbonToolbar.jsx`): `triggerPrint` now accepts `filename`. Sets `document.title = filename.replace('.md','')` before `window.print()`, restores after 1s.
- **PROJECT.md updated**: Entire document synced to current implementation state. Git commit conventions section added.

**Commit:** `style(toolbar): always-visible accent splitter, remove page badge, pdf filename in save dialog`

---

## [2026-05-13] Shiki syntax highlighting + per-file theme system

**What changed:**

- **`src/lib/shiki.js`** (new): Module-level singleton. Loads `one-dark-pro` + 20 languages. Returns cached Promise on repeated calls.
- **`src/lib/markdown.js`**: Integrated `@shikijs/rehype/core` into unified pipeline. Processor cached after first async build. `ignoreMissing: true` prevents crashes on unknown languages.
- **`src/store/useFileStore.js`**: `makeFile()` now includes `themeId: 'academic-serif'`. New `setFileTheme(id, themeId)` action persists to IndexedDB.
- **`src/styles/document.css`**: Rewrote to align all var names with `themes.js` token keys. Added `.shiki` rules. Removed all hardcoded sizes.
- **`src/components/toolbar/ThemePicker.jsx`** (new): 2-column popover grid of all 8 themes with accent swatch, name, tags, active checkmark. Closes on outside click.
- **`src/components/editor/PreviewPane.jsx`**: Reads `themeId` from active file, calls `injectThemeStyle()` which writes `<style id="markeon-doc-theme">` to `<head>`. Page cards use theme's `--page-bg` directly.
- **`vite.config.js`**: Added `@shikijs/rehype` to `optimizeDeps.exclude`.

**Commit:** `feat: Shiki syntax highlighting + per-file theme system with live token swap`

---

## [2026-05-13] Dark mode PDF for Dark Tech theme

**What changed:**

- **`src/lib/themes.js`**: Added `--page-bg` to all 8 themes. Dark Tech: `#0d1117`, Warm Journal: `#fdf6ec`, others: `#ffffff`.
- **`src/components/editor/PreviewPane.jsx`**: `injectThemeStyle()` now also sets `--page-bg` on `:root`. Page cards use `background: pageBg` from theme object.
- **`src/styles/print.css`**: Added `print-color-adjust: exact` + `-webkit-print-color-adjust: exact` to `#markeon-print-root`. All hardcoded colors replaced with theme CSS vars.

**Key insight:** `print-color-adjust: exact` is the critical property - without it Chromium strips backgrounds from the PDF regardless of what CSS you write.

**Commit:** `feat(themes): dark-page PDF for Dark Tech, per-theme --page-bg token, print-color-adjust`

---

## [2026-05-13] Per-file layout controls (Layout tab)

**What changed:**

- **`src/store/useFileStore.js`**: Added `DEFAULT_LAYOUT` constant and `layoutSettings` field to every file record. New `setFileLayout(id, patch)` action deep-merges the patch and persists to IndexedDB.
- **`src/lib/pdf.js`**: `buildPrintStyle()` now accepts `layoutSettings` directly (paperSize, orientation, margins, watermark).
- **`src/components/toolbar/LayoutPanel.jsx`** (new): Compact 46px horizontal strip. Font Size + Line Spacing number inputs (8-20pt, 1.0-2.5), linked/free margin control, Paper Size chip group (A4/Letter/Legal), Orientation chip group (Portrait/Landscape). All wired to `setFileLayout`.
- **`src/components/toolbar/ExportPanel.jsx`** (new): Per-file watermark text input + Export PDF button.
- **`src/components/editor/PreviewPane.jsx`**: Full rewrite. Paper dimensions derived from `layoutSettings` using 96dpi mm-to-px conversion. Page card padding reflects actual margin values live. ResizeObserver uses dynamic paper width for zoom-to-fit.
- **`src/pages/AppPage.jsx`**: Tab panel strip (46px) below toolbar header. Layout + Export tabs wired. Collapsible sidebar with 18px toggle rail. `activeTab` state lifted to AppPage.
- **`src/components/toolbar/RibbonToolbar.jsx`**: Accepts `activeTab`/`onTabChange` props. Inline filename rename: click center to edit, Enter commits, Escape cancels, auto-appends `.md`. Check/X buttons properly spaced.

**Commit:** `feat: layout controls, collapsible sidebar, inline filename rename, Export tab`

---

## [2026-05-13] Format tab + File tab

**What changed:**

- **`src/lib/editorRef.js`** (new): Module-level `{ current: null }` ref. Holds the active CodeMirror `EditorView` instance. Avoids prop drilling from EditorPane to any toolbar panel.
- **`src/lib/formatCommands.js`** (new): All markdown formatting operations as pure CM6 transactions:
  - `wrapSelection(before, after)` - handles empty vs selected text
  - `toggleLinePrefix(prefix)` - multi-line aware, toggles intelligently
  - `setHeading(level)` - strips existing heading before applying
  - Exports: `bold`, `italic`, `strikethrough`, `inlineCode`, `codeBlock`, `h1`, `h2`, `h3`, `blockquote`, `bulletList`, `orderedList`, `link`, `horizontalRule`, `table`
- **`src/components/editor/EditorPane.jsx`**: Sets `editorViewRef.current` on view create, clears on destroy.
- **`src/components/toolbar/FormatPanel.jsx`** (new): Three groups (Headings, Inline, Blocks) as 46px strip. Each button shows icon + label text, hover highlight, keyboard shortcut in title.
- **`src/components/toolbar/FilePanel.jsx`** (new): New File, Duplicate (copies content), Import .md (FileReader → createFile + updateContent), Export .md (Blob download), Delete (with confirm guard). Delete styled red.
- **`src/pages/AppPage.jsx`**: File + Format tabs registered in `TAB_PANELS`.

**Commit:** `feat(toolbar): Format tab + File tab - markdown formatting commands and file operations`

---

## [2026-05-21] features — reading mode, outline, images, preview fixes

**What changed:**

- **`NEXT.md`** (new): Feature prompt for reading mode, TOC, and image paste. **`vercel.json`** (new): SPA rewrite for deploy. **`.gitignore`**: `.vercel`, `graphify-out/`.
- **Reading mode**: `readingMode` + `toggleReadingMode` in `useEditorStore` (persisted). Book icon in `RibbonToolbar`. `data-reading-mode` on app shell; CSS hides editor, splitter, inspector, and file tree without unmounting CodeMirror.
- **Reading mode outline**: Sidebar shows `DocOutline` only (no `FileTree`). Same `DocOutline` component with `variant="panel"` for full-height layout. Outline auto-opens when entering reading mode; tab strip hidden in reading mode.
- **Reading zoom**: Separate `readingZoom` (50%–250%, persisted). `ReadingZoomBar` with slider and ±/reset. Pinch (two-finger) and Ctrl+scroll on preview. Effective scale = fit-to-width × reading zoom.
- **Table of contents**: `rehype-slug` in unified pipeline. **`DocOutline.jsx`** (new): indented heading list in sidebar. `PreviewPane` scrapes headings after render; click scrolls preview smoothly.
- **Image paste**: IndexedDB v2 `attachments` store in `db.js`. Ctrl+V in editor saves blob, inserts `![image](markeon://img/<id>)`. Rehype plugin resolves to data URIs in preview/PDF. Attachments deleted with parent file (`extractMarkeonImageIds` in `useFileStore`). **`src/lib/images.js`** (new).
- **Divider overflow fix**: Long `=====` / `-----` lines no longer bleed past page cards. `normalizeThematicLines()` preprocess + `rehypeThematicLineParagraphs()` convert decorative rules to `<hr>`. Setext headings (`Title` + short `=====` underline) preserved. `.markeon-document` overflow/word-break; page cards `overflow-x-hidden`.

**Key decisions:**

- Image storage uses attachment records + `markeon://` URLs, not inline base64 (replaces the May 2026 removal documented in PROJECT.md).
- Reading mode keeps outline for navigation; file tree hidden via conditional render + CSS.
- Decorative divider lines ≥10 chars (or not setext underlines) normalize to `---` before parse.

**Commit suggestion:** `feat: reading mode with outline zoom, document TOC, image attachments, and Vercel config`

---
