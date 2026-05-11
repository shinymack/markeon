import { useEffect } from 'react'
import { useFileStore } from '../store/useFileStore'
import RibbonToolbar from '../components/toolbar/RibbonToolbar'
import FileTree from '../components/sidebar/FileTree'
import EditorPane from '../components/editor/EditorPane'
import PreviewPane from '../components/editor/PreviewPane'
import StyleInspector from '../components/inspector/StyleInspector'

export default function AppPage() {
  const loadFiles = useFileStore((s) => s.loadFiles)
  useEffect(() => { loadFiles() }, [loadFiles])

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Toolbar */}
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

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
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

        {/* Work area */}
        <div className="flex flex-1 overflow-hidden min-w-0">
          <div className="flex-1 min-w-0 overflow-hidden border-r" style={{ borderColor: 'var(--border-subtle)' }}>
            <EditorPane />
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
