import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Download, Home, Check, X } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'
import { useFileStore } from '../../store/useFileStore'
import { buildPrintStyle, triggerPrint } from '../../lib/pdf'
import ThemePicker from './ThemePicker'
import LayoutPanel from './LayoutPanel'
import ExportPanel from './ExportPanel'

const TABS = ['File', 'Format', 'Style', 'Layout', 'Export']

export default function RibbonToolbar({ activeTab, onTabChange }) {
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState('')
  const nameInputRef = useRef(null)
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeStore()
  const { files, activeFileId, renameFile } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)

  function handleExport() {
    const layout = activeFile?.layoutSettings || {}
    triggerPrint(buildPrintStyle(layout), activeFile?.name)
  }

  function startEditing() {
    if (!activeFile) return
    setNameVal(activeFile.name)
    setEditingName(true)
  }

  function commitRename() {
    const trimmed = nameVal.trim()
    if (trimmed && activeFile && trimmed !== activeFile.name) {
      const withExt = trimmed.endsWith('.md') ? trimmed : trimmed + '.md'
      renameFile(activeFile.id, withExt)
    }
    setEditingName(false)
  }

  function cancelRename() {
    setEditingName(false)
  }

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [editingName])

  return (
    <div className="flex items-center h-full px-3 gap-2">

      {/* Left */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          title="Home"
          className="flex items-center justify-center w-[30px] h-[30px] rounded cursor-pointer border-none bg-transparent transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Home size={15} />
        </button>

        <div className="w-px h-5" style={{ background: 'var(--border)' }} />

        <nav className="flex items-center gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange?.(tab)}
              className="px-2.5 py-1 rounded text-[12.5px] font-medium cursor-pointer border-none transition-colors duration-100"
              style={{
                fontFamily: 'var(--font-ui)',
                background: activeTab === tab ? 'var(--accent-dim)' : 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Center - editable filename */}
      <div className="flex-1 flex justify-center">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              ref={nameInputRef}
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              onBlur={commitRename}
              className="text-[12.5px] font-medium px-2 py-1 rounded outline-none"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                background: 'var(--surface-raised)',
                border: '1px solid var(--accent)',
                minWidth: 120,
                maxWidth: 260,
                width: `${Math.max(nameVal.length * 8, 120)}px`,
              }}
            />
            <div className="flex items-center gap-1">
              <button
                onMouseDown={(e) => { e.preventDefault(); commitRename() }}
                title="Confirm (Enter)"
                className="flex items-center justify-center rounded border-none cursor-pointer transition-opacity duration-100 hover:opacity-80"
                style={{ width: 22, height: 22, background: 'var(--accent)', color: '#0c0c0c', borderRadius: 5 }}
              >
                <Check size={12} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); cancelRename() }}
                title="Cancel (Esc)"
                className="flex items-center justify-center rounded cursor-pointer transition-opacity duration-100 hover:opacity-80"
                style={{ width: 22, height: 22, background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 5 }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={startEditing}
            title="Click to rename"
            className="text-[12.5px] font-medium px-2 py-0.5 rounded border-none bg-transparent cursor-text transition-colors duration-100"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            {activeFile?.name || 'No file open'}
          </button>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ThemePicker />

        <div className="w-px h-4" style={{ background: 'var(--border)' }} />

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-[5px] rounded text-[12.5px] font-semibold cursor-pointer border-none transition-all duration-100 hover:brightness-110"
          style={{
            background: 'var(--accent)',
            color: '#0c0c0c',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <Download size={13} />
          Export PDF
        </button>

        <button
          onClick={toggleMode}
          title="Toggle theme"
          className="flex items-center justify-center w-[30px] h-[30px] rounded cursor-pointer border transition-colors duration-100"
          style={{
            background: 'transparent',
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          {mode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </div>
  )
}
