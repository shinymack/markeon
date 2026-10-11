import { useEffect, useRef, useCallback } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, dropCursor } from '@codemirror/view'
import { EditorState, Compartment, Transaction } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { useFileStore } from '../../store/useFileStore'
import { useEditorStore } from '../../store/useEditorStore'
import { useThemeStore } from '../../store/useThemeStore'
import { useMediaStore } from '../../store/useMediaStore'
import { editorViewRef, editorFileIdRef, registerEditorFlush } from '../../lib/editorRef'
import { handleImagePaste, handleImageDrop } from '../../lib/images'
import { runFormatShortcut } from '../../lib/formatCommands'
function editorTheme(mode, fontSize) {
  const customTheme = EditorView.theme({
    '&': { background: 'var(--editor-bg)', color: 'var(--text-primary)', height: '100%' },
    '.cm-content': {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: `${fontSize || 14}px`,
      lineHeight: '1.7',
      padding: '16px',
    },
    '.cm-gutters': { background: 'var(--editor-bg)', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-muted)' },
    '.cm-activeLineGutter, .cm-activeLine': { background: 'var(--surface-raised)' },
    '.cm-cursor': { borderLeftColor: 'var(--accent)' },
    '.cm-selectionBackground': { background: 'var(--accent-dim) !important' },
    '.cm-scroller': { fontFamily: "'JetBrains Mono', monospace" },
  })
  return mode === 'dark' ? [oneDark, customTheme] : customTheme
}

export default function EditorPane() {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const themeCompartment = useRef(new Compartment())

  const { activeFileId, files, updateContent, flushSaves, reportStorageError } = useFileStore()
  const { fontSize } = useEditorStore()
  const { mode } = useThemeStore()
  const activeFile = files.find((file) => file.id === activeFileId)


  const flushEditor = useCallback(async () => {
    const id = editorFileIdRef.current
    const view = editorViewRef.current
    const file = useFileStore.getState().files.find((item) => item.id === id)
    if (file && view && file.content !== view.state.doc.toString()) updateContent(id, view.state.doc.toString())
    await flushSaves()
  }, [flushSaves, updateContent])

  useEffect(() => registerEditorFlush(flushEditor), [flushEditor])
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      const status = useFileStore.getState().saveStatus
      if (!['pending', 'saving', 'error'].includes(status)) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    if (!editorRef.current || !activeFile) return undefined
    const doc = activeFile.content || ''
    const fileId = activeFile.id
    const extensions = [
      EditorView.contentAttributes.of({ 'aria-label': 'Markdown source' }),
      history(),
      lineNumbers(),
      highlightActiveLine(),
      drawSelection(),
      dropCursor(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      markdown({ base: markdownLanguage }),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.lineWrapping,
      themeCompartment.current.of(editorTheme(mode, fontSize)),
      EditorView.domEventHandlers({
        keydown: (event) => runFormatShortcut(event),
        paste: (event, view) => {
          const items = event.clipboardData?.items
          if (!items) return false
          for (const item of items) {
            if (!item.type.startsWith('image/')) continue
            const file = item.getAsFile()
            event.preventDefault()
            handleImagePaste(view, file, fileId)
              .catch(reportStorageError)
            return true
          }
          return false
        },
        drop: (event, view) => {
          const files = event.dataTransfer?.files
          const image = [...(files || [])].find((file) => file.type.startsWith('image/'))
          if (!image) return false
          event.preventDefault()
          handleImageDrop(view, image, fileId, event)
            .catch(reportStorageError)
          return true
        },
      }),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return
        useMediaStore.getState().clearSelection()
        updateContent(fileId, update.state.doc.toString())
      }),
    ]

    const state = EditorState.create({ doc, extensions })
    const view = new EditorView({ state, parent: editorRef.current })
    viewRef.current = view
    editorViewRef.current = view
    editorFileIdRef.current = activeFileId

    return () => {
      view.destroy()
      viewRef.current = null
      if (editorViewRef.current === view) editorViewRef.current = null
      if (editorFileIdRef.current === activeFileId) editorFileIdRef.current = null
    }
  }, [activeFileId, activeFile?.id, reportStorageError, updateContent])
  useEffect(() => {
    const view = viewRef.current
    if (!view || !activeFile || editorFileIdRef.current !== activeFile.id) return
    const content = activeFile.content || ''
    if (view.state.doc.toString() === content) return
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
      annotations: Transaction.addToHistory.of(false),
    })
  }, [activeFile?.content, activeFile?.id])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: themeCompartment.current.reconfigure(editorTheme(mode, fontSize)) })
  }, [mode, fontSize])

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--editor-bg)' }}>
      <div
        ref={editorRef}
        className="flex-1 overflow-hidden [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:overflow-auto [&_.cm-scroller]:h-full"
      />
    </div>
  )
}
