import { useEffect, useRef, useState, useCallback } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useFileStore } from '../store/useFileStore'
import RibbonToolbar from '../components/toolbar/RibbonToolbar'
import LayoutPanel from '../components/toolbar/LayoutPanel'
import ExportPanel from '../components/toolbar/ExportPanel'
import FormatPanel from '../components/toolbar/FormatPanel'
import FilePanel from '../components/toolbar/FilePanel'
import FileTree from '../components/sidebar/FileTree'
import EditorPane from '../components/editor/EditorPane'
import PreviewPane from '../components/editor/PreviewPane'
import StyleInspector from '../components/inspector/StyleInspector'

const SPLIT_MIN = 20
const SPLIT_MAX = 80

const TAB_PANELS = {
  File: FilePanel,
  Format: FormatPanel,
  Layout: LayoutPanel,
  Export: ExportPanel,
}

export default function AppPage() {
  const loadFiles = useFileStore((s) => s.loadFiles)
  useEffect(() => { loadFiles() }, [loadFiles])

  const [splitPct, setSplitPct] = useState(50)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('Layout')
  const dragging = useRef(false)
  const workAreaRef = useRef(null)

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging.current || !workAreaRef.current) return
      const rect = workAreaRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPct(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, pct)))
    }
    function onMouseUp() {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const ActivePanel = TAB_PANELS[activeTab] || null

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Toolbar */}
      <header
        id="toolbar"
        className="flex-shrink-0 z-50 border-b"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <div style={{ height: 'var(--toolbar-height)' }}>
          <RibbonToolbar onTabChange={setActiveTab} activeTab={activeTab} />
        </div>

        {/* Tab panel strip */}
        {ActivePanel && (
          <div
            className="border-t overflow-x-auto"
            style={{
              borderColor: 'var(--glass-border)',
              background: 'var(--surface)',
              minHeight: 46,
            }}
          >
            <ActivePanel />
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside
          id="sidebar"
          className="flex-shrink-0 flex flex-col overflow-hidden border-r"
          style={{
            width: sidebarOpen ? 'var(--sidebar-width)' : '0px',
            minWidth: 0,
            transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            borderColor: sidebarOpen ? 'var(--glass-border)' : 'transparent',
            overflow: 'hidden',
          }}
        >
          <FileTree />
        </aside>

        {/* Sidebar toggle button */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="flex-shrink-0 flex items-center justify-center cursor-pointer border-none border-r z-10 transition-colors duration-150"
          style={{
            width: 18,
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            borderRight: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-dim)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          {sidebarOpen
            ? <PanelLeftClose size={11} />
            : <PanelLeftOpen size={11} />
          }
        </button>

        {/* Work area */}
        <div ref={workAreaRef} className="flex flex-1 overflow-hidden min-w-0 relative">
          <div
            className="overflow-hidden"
            style={{ width: `${splitPct}%`, flexShrink: 0, borderRight: '1px solid var(--border-subtle)' }}
          >
            <EditorPane />
          </div>

          {/* Splitter */}
          <div
            className="flex-shrink-0 flex items-center justify-center cursor-col-resize z-10 select-none group"
            style={{
              width: '10px',
              position: 'relative',
              background: 'transparent',
              transition: 'background 150ms',
            }}
            onMouseDown={onMouseDown}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-dim)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '2px',
                background: 'var(--accent)',
                opacity: 0.55,
                transition: 'opacity 150ms',
              }}
            />
            <div
              className="group-hover:opacity-100"
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                opacity: 0.7,
              }}
            >
              {[0, 1, 2].map((k) => (
                <div key={k} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }} />
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0 overflow-hidden" style={{ background: 'var(--surface)' }}>
            <PreviewPane />
          </div>
        </div>

        {/* Inspector */}
        <aside
          id="inspector"
          className="flex-shrink-0 flex flex-col overflow-hidden border-l"
          style={{
            width: 'var(--inspector-width)',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <StyleInspector />
        </aside>
      </div>
    </div>
  )
}
