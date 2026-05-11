# Markeon

> Write in markdown. Publish like a designer.

A browser-based markdown editor and PDF exporter. No account, no server, no internet required after first load. Your files live in your browser.

## Running locally

```bash
bun install
bun run dev
```

Then open `http://localhost:5173`.

## What it is

A 3-pane workspace: file tree on the left, CodeMirror editor in the center-left, live rendered preview in the center-right, style inspector on the right. Pick a theme, write markdown, export to PDF.

Fully client-side. No data leaves your machine.

## Tech

Vite + React (JSX). Zustand for state. IndexedDB for file storage. CodeMirror 6 for editing. remark/rehype for markdown rendering. KaTeX for math. Mermaid for diagrams. `window.print()` for PDF export.

## Docs

- [IDEA.md](./IDEA.md) - What Markeon is, in plain English
- [PROJECT.md](./PROJECT.md) - Full technical spec and decisions
- [PROGRESS.md](./PROGRESS.md) - Build log
