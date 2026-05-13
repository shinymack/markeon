import { editorViewRef } from './editorRef'

function getView() {
  return editorViewRef.current
}

// Wrap the current selection with before/after markers.
// If nothing selected, inserts markers and places cursor between them.
function wrapSelection(before, after = before) {
  const view = getView()
  if (!view) return
  const { state } = view
  const { from, to } = state.selection.main
  const selected = state.doc.sliceString(from, to)

  if (selected) {
    view.dispatch({
      changes: [
        { from, to, insert: `${before}${selected}${after}` },
      ],
      selection: { anchor: from, head: from + before.length + selected.length + after.length },
    })
  } else {
    view.dispatch({
      changes: { from, insert: `${before}${after}` },
      selection: { anchor: from + before.length },
    })
  }
  view.focus()
}

// Toggle a prefix on every selected line (or current line).
function toggleLinePrefix(prefix) {
  const view = getView()
  if (!view) return
  const { state } = view
  const { from, to } = state.selection.main

  const startLine = state.doc.lineAt(from)
  const endLine = state.doc.lineAt(to)

  const changes = []
  let allHavePrefix = true

  for (let ln = startLine.number; ln <= endLine.number; ln++) {
    const line = state.doc.line(ln)
    if (!line.text.startsWith(prefix)) allHavePrefix = false
  }

  for (let ln = startLine.number; ln <= endLine.number; ln++) {
    const line = state.doc.line(ln)
    if (allHavePrefix) {
      changes.push({ from: line.from, to: line.from + prefix.length, insert: '' })
    } else if (!line.text.startsWith(prefix)) {
      changes.push({ from: line.from, insert: prefix })
    }
  }

  view.dispatch({ changes })
  view.focus()
}

// Insert text at cursor (or replace selection).
function insertAtCursor(text) {
  const view = getView()
  if (!view) return
  const { from, to } = view.state.selection.main
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  })
  view.focus()
}

// Set heading level on current line (1-3). Removes any existing heading prefix first.
function setHeading(level) {
  const view = getView()
  if (!view) return
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.from)
  const stripped = line.text.replace(/^#{1,6}\s/, '')
  const prefix = '#'.repeat(level) + ' '
  const newText = line.text.startsWith(prefix) ? stripped : `${prefix}${stripped}`
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: newText },
    selection: { anchor: line.from + newText.length },
  })
  view.focus()
}

export const bold = () => wrapSelection('**')
export const italic = () => wrapSelection('*')
export const strikethrough = () => wrapSelection('~~')
export const inlineCode = () => wrapSelection('`')
export const codeBlock = () => wrapSelection('```\n', '\n```')
export const h1 = () => setHeading(1)
export const h2 = () => setHeading(2)
export const h3 = () => setHeading(3)
export const blockquote = () => toggleLinePrefix('> ')
export const bulletList = () => toggleLinePrefix('- ')
export const orderedList = () => toggleLinePrefix('1. ')

export function link() {
  const view = getView()
  if (!view) return
  const { state } = view
  const { from, to } = state.selection.main
  const selected = state.doc.sliceString(from, to)
  const text = selected || 'link text'
  const inserted = `[${text}](url)`
  const urlStart = from + text.length + 3
  view.dispatch({
    changes: { from, to, insert: inserted },
    selection: { anchor: urlStart, head: urlStart + 3 },
  })
  view.focus()
}

export function horizontalRule() {
  const view = getView()
  if (!view) return
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.from)
  const insert = line.text.trim() === '' ? '---\n' : '\n\n---\n'
  view.dispatch({
    changes: { from: line.to, insert },
    selection: { anchor: line.to + insert.length },
  })
  view.focus()
}

export function table() {
  const tpl = `\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell     | Cell     | Cell     |\n`
  insertAtCursor(tpl)
}
