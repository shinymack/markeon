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
