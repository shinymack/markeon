import { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, dropCursor } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { useFileStore } from '../../store/useFileStore'
import { useEditorStore } from '../../store/useEditorStore'
import { useThemeStore } from '../../store/useThemeStore'
import { editorViewRef } from '../../lib/editorRef'
import { handleImagePaste } from '../../lib/images'

const DEBOUNCE_MS = 400

export default function EditorPane() {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const saveTimer = useRef(null)
  const activeFileIdRef = useRef(null)

  const { activeFileId, files, updateContent } = useFileStore()
  const { fontSize } = useEditorStore()
  const { mode } = useThemeStore()
  const activeFile = files.find((f) => f.id === activeFileId)

  activeFileIdRef.current = activeFileId

  const debouncedSave = useCallback((id, content) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => updateContent(id, content), DEBOUNCE_MS)
  }, [updateContent])

  useEffect(() => {
    if (!editorRef.current) return
    const doc = activeFile?.content || ''

    const lightTheme = EditorView.theme({
      '&': { background: 'var(--editor-bg)', color: 'var(--text-primary)', height: '100%' },
      '.cm-content': { fontFamily: "'JetBrains Mono', monospace", fontSize: `${fontSize}px`, lineHeight: '1.7', padding: '16px' },
      '.cm-gutters': { background: 'var(--editor-bg)', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-muted)' },
      '.cm-activeLineGutter, .cm-activeLine': { background: 'var(--surface-raised)' },
      '.cm-cursor': { borderLeftColor: 'var(--accent)' },
      '.cm-selectionBackground': { background: 'var(--accent-dim) !important' },
      '.cm-scroller': { fontFamily: "'JetBrains Mono', monospace" },
    })

    const extensions = [
      history(),
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      markdown({ base: markdownLanguage }),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.lineWrapping,
      EditorView.domEventHandlers({
        paste: (event, view) => {
          const items = event.clipboardData?.items
          if (!items) return false
          for (const item of items) {
            if (!item.type.startsWith('image/')) continue
            const file = item.getAsFile()
            if (!file) continue
            event.preventDefault()
            const fileId = activeFileIdRef.current
            handleImagePaste(view, file, fileId).then((handled) => {
              if (handled && fileId) {
                debouncedSave(fileId, view.state.doc.toString())
              }
            })
            return true
          }
          return false
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && activeFileIdRef.current) {
          debouncedSave(activeFileIdRef.current, update.state.doc.toString())
        }
      }),
      mode === 'dark' ? oneDark : lightTheme,
    ]

    const state = EditorState.create({ doc, extensions })
    const view = new EditorView({ state, parent: editorRef.current })
    viewRef.current = view
    editorViewRef.current = view

    return () => { view.destroy(); viewRef.current = null; editorViewRef.current = null }
  }, [activeFileId, mode, !!activeFile, fontSize, debouncedSave])

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--editor-bg)' }}
    >
      <div
        ref={editorRef}
        className="flex-1 overflow-hidden [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:overflow-auto [&_.cm-scroller]:h-full"
      />
    </div>
  )
}
