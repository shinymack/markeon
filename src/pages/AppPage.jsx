import { useCallback, useEffect, useRef, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, Code2, FileText } from 'lucide-react'
import { useFileStore } from '../store/useFileStore'
import { useEditorStore } from '../store/useEditorStore'
import { useMediaStore } from '../store/useMediaStore'
import RibbonToolbar from '../components/toolbar/RibbonToolbar'
import LayoutPanel from '../components/toolbar/LayoutPanel'
import ExportPanel from '../components/toolbar/ExportPanel'
import FormatPanel from '../components/toolbar/FormatPanel'
import FilePanel from '../components/toolbar/FilePanel'
import StylePanel from '../components/toolbar/StylePanel'
import MediaFormatPanel from '../components/toolbar/MediaFormatPanel'
import FileTree from '../components/sidebar/FileTree'
import DocOutline from '../components/sidebar/DocOutline'
import EditorPane from '../components/editor/EditorPane'
import PreviewPane from '../components/editor/PreviewPane'

const TAB_PANELS = { File: FilePanel, Format: FormatPanel, Style: StylePanel, Layout: LayoutPanel, Export: ExportPanel, Media: MediaFormatPanel }

export default function AppPage() {
  const loadFiles = useFileStore((s) => s.loadFiles)
  const activeFileId = useFileStore((s) => s.activeFileId)
  const readingMode = useEditorStore((s) => s.readingMode)
  const selection = useMediaStore((s) => s.selection)
  const clearSelection = useMediaStore((s) => s.clearSelection)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 900px)').matches)
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 900px)').matches)
  const [view, setView] = useState('editor')
  const [splitPct, setSplitPct] = useState(50)
  const [activeTab, setActiveTab] = useState('Layout')
  const [headings, setHeadings] = useState([])
  const workAreaRef = useRef(null)
  const previewScrollRef = useRef(null)
  const dragging = useRef(false)
  const previousTab = useRef('Layout')

  useEffect(() => { loadFiles().catch((error) => useFileStore.getState().reportStorageError(error)) }, [loadFiles])
  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    const change = () => { setCompact(query.matches); setSidebarOpen(!query.matches) }
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  useEffect(() => { clearSelection() }, [activeFileId, clearSelection])
  useEffect(() => {
    if (selection && !readingMode) {
      setActiveTab((tab) => { if (tab !== 'Media') previousTab.current = tab; return 'Media' })
      if (compact) setView('preview')
    } else {
      setActiveTab((tab) => tab === 'Media' ? previousTab.current : tab)
    }
  }, [selection?.type, selection?.fileId, selection?.from, readingMode, compact])
  useEffect(() => {
    if (readingMode) {
      clearSelection()
      setActiveTab((tab) => ['File', 'Export'].includes(tab) ? tab : 'File')
    }
  }, [readingMode, clearSelection])

  const scrollToHeading = useCallback((id) => {
    const root = document.getElementById('markeon-all-pages')
    const element = root?.querySelector(`#${CSS.escape(id)}`)
    const scroller = previewScrollRef.current
    if (!element || !scroller) return
    if (compact) { setView('preview'); setSidebarOpen(false) }
    requestAnimationFrame(() => scroller.scrollTo({ top: scroller.scrollTop + element.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 24, behavior: 'smooth' }))
  }, [compact])

  const onPointerDown = (event) => {
    if (readingMode || compact || event.button !== 0) return
    event.preventDefault()
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event) => {
    if (!dragging.current || !workAreaRef.current) return
    const rect = workAreaRef.current.getBoundingClientRect()
    setSplitPct(Math.min(80, Math.max(20, (event.clientX - rect.left) / rect.width * 100)))
  }
  const ActivePanel = TAB_PANELS[activeTab] || FilePanel

  return (
    <div className="app-workspace" data-reading-mode={readingMode ? 'true' : 'false'} data-compact={compact ? 'true' : 'false'} data-view={view} data-sidebar-open={sidebarOpen ? 'true' : 'false'}>
      <a className="skip-link" href="#workspace-main">Skip to document</a>
      <header id="toolbar" className="workspace-toolbar">
        <div className="ribbon-row"><RibbonToolbar activeTab={activeTab} onTabChange={setActiveTab} /></div>
        <div key={`${activeTab}-${selection?.type || ''}`} className={`workspace-panel${activeTab === 'Media' && selection?.type === 'mermaid' ? ' workspace-panel--diagram' : ''}`} role="region" aria-label={activeTab === 'Media' ? `${selection?.type === 'image' ? 'Picture' : 'Diagram'} formatting` : `${activeTab} controls`}>
          <ActivePanel />
        </div>
      </header>
      <div className="workspace-viewbar">
        <button type="button" onClick={() => setSidebarOpen((open) => !open)} aria-controls="sidebar" aria-expanded={sidebarOpen}>
          {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          {readingMode ? 'Outline' : 'Files & outline'}
        </button>
        {compact && !readingMode && <div className="view-switch" role="group" aria-label="Document view">
          <button type="button" aria-pressed={view === 'editor'} onClick={() => { setView('editor'); clearSelection() }}><Code2 size={14} />Editor</button>
          <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}><FileText size={14} />Preview</button>
        </div>}
      </div>
      <div className="workspace-body">
        {compact && sidebarOpen && <button className="sidebar-backdrop" aria-label="Close files and outline" onClick={() => setSidebarOpen(false)} />}
        <aside id="sidebar" className="workspace-sidebar" aria-label={readingMode ? 'Document outline' : 'Files and document outline'} hidden={!sidebarOpen}>
          {!readingMode && <FileTree onSelect={() => { if (compact) setSidebarOpen(false) }} />}
          <DocOutline headings={headings} onSelect={scrollToHeading} variant={readingMode ? 'panel' : 'stacked'} />
        </aside>
        <main id="workspace-main" ref={workAreaRef} className="workspace-main" tabIndex={-1}>
          <div id="editor-pane" className="workspace-editor" style={{ width: `${splitPct}%` }}><EditorPane /></div>
          <div id="editor-splitter" className="workspace-splitter" role="separator" aria-label="Editor and preview split" aria-orientation="vertical" aria-valuemin={20} aria-valuemax={80} aria-valuenow={Math.round(splitPct)} tabIndex={readingMode || compact ? -1 : 0}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { dragging.current = false }} onPointerCancel={() => { dragging.current = false }}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
              event.preventDefault()
              setSplitPct((value) => event.key === 'Home' ? 20 : event.key === 'End' ? 80 : Math.min(80, Math.max(20, value + (event.key === 'ArrowLeft' ? -5 : 5))))
            }}><span /></div>
          <div className="workspace-preview"><PreviewPane onHeadingsChange={setHeadings} previewScrollRef={previewScrollRef} /></div>
        </main>
      </div>
    </div>
  )
}
