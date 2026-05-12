import { useEffect, useRef, useState, useCallback } from 'react'
import { useFileStore } from '../store/useFileStore'
import RibbonToolbar from '../components/toolbar/RibbonToolbar'
import FileTree from '../components/sidebar/FileTree'
import EditorPane from '../components/editor/EditorPane'
import PreviewPane from '../components/editor/PreviewPane'
import StyleInspector from '../components/inspector/StyleInspector'

const SPLIT_MIN = 20
const SPLIT_MAX = 80

export default function AppPage() {
  const loadFiles = useFileStore((s) => s.loadFiles)
  useEffect(() => { loadFiles() }, [loadFiles])

  const [splitPct, setSplitPct] = useState(50)
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

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--bg)' }}>

      <header
        id="toolbar"
        className="flex-shrink-0 z-50 border-b"
        style={{
          height: 'var(--toolbar-height)',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <RibbonToolbar />
      </header>

      <div className="flex flex-1 overflow-hidden">

        <aside
          id="sidebar"
          className="flex-shrink-0 flex flex-col overflow-hidden border-r"
          style={{
            width: 'var(--sidebar-width)',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <FileTree />
        </aside>

        <div ref={workAreaRef} className="flex flex-1 overflow-hidden min-w-0 relative">
          <div
            className="overflow-hidden"
            style={{ width: `${splitPct}%`, flexShrink: 0, borderRight: '1px solid var(--border-subtle)' }}
          >
            <EditorPane />
          </div>

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
              {[0,1,2].map((k) => (
                <div key={k} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }} />
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0 overflow-hidden" style={{ background: 'var(--surface)' }}>
            <PreviewPane />
          </div>
        </div>

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
