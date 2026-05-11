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
import styles from './EditorPane.module.css'

const DEBOUNCE_MS = 400

export default function EditorPane() {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const saveTimer = useRef(null)

  const { getActiveFile, activeFileId, updateContent } = useFileStore()
  const { fontSize, wordWrap } = useEditorStore()
  const { mode } = useThemeStore()

  const debouncedSave = useCallback((id, content) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => updateContent(id, content), DEBOUNCE_MS)
  }, [updateContent])

  useEffect(() => {
    if (!editorRef.current) return

    const file = getActiveFile()
    const doc = file?.content || ''

    const lightTheme = EditorView.theme({
      '&': { background: 'var(--editor-bg)', color: 'var(--text-primary)', height: '100%' },
      '.cm-content': { fontFamily: "'JetBrains Mono', monospace", fontSize: `${fontSize}px`, lineHeight: '1.7', padding: '16px' },
      '.cm-line': { padding: '0 2px' },
      '.cm-gutters': { background: 'var(--editor-bg)', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-muted)' },
      '.cm-activeLineGutter': { background: 'var(--surface-raised)' },
      '.cm-activeLine': { background: 'var(--surface-raised)' },
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
      EditorView.updateListener.of((update) => {
        if (update.docChanged && activeFileId) {
          debouncedSave(activeFileId, update.state.doc.toString())
        }
      }),
      mode === 'dark' ? oneDark : lightTheme,
    ]

    const state = EditorState.create({ doc, extensions })
    const view = new EditorView({ state, parent: editorRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [activeFileId, mode])

  return (
    <div className={styles.pane}>
      <div ref={editorRef} className={styles.editor} />
    </div>
  )
}
