import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Download, Home, Check, X, BookOpen } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'
import { useFileStore } from '../../store/useFileStore'
import { useEditorStore } from '../../store/useEditorStore'
import { useMediaStore } from '../../store/useMediaStore'
import { triggerPrint } from '../../lib/pdf'
import ThemePicker from './ThemePicker'

const EDITING_TABS = ['Format', 'Style', 'Layout']
const BASE_TABS = ['File', ...EDITING_TABS, 'Export']


export default function RibbonToolbar({ activeTab, onTabChange }) {
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const nameInputRef = useRef(null)
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeStore()
  const { readingMode, toggleReadingMode } = useEditorStore()
  const { files, activeFileId, renameFile, saveStatus, saveError } = useFileStore()
  const mediaSelection = useMediaStore((state) => state.selection)
  const activeFile = files.find((f) => f.id === activeFileId)
  const tabs = readingMode
    ? [{ id: 'File', label: 'File' }, { id: 'Export', label: 'Export' }]
    : [...BASE_TABS.map((tab) => ({ id: tab, label: tab })), ...(mediaSelection
      ? [{ id: 'Media', label: mediaSelection.type === 'image' ? 'Picture Format' : 'Diagram Format' }]
      : [])]

  async function handleExport() {
    if (!activeFile || exporting) return
    setExporting(true)
    setExportError('')
    try {
      await triggerPrint()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setExporting(false)
    }
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
    <div className="markeon-ribbon-content relative flex items-center min-w-0 h-full w-full px-3 gap-2">

      {/* Left */}
      <div className="markeon-ribbon-nav flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={() => navigate('/')}
          title="Home"
          className="inline-flex items-center justify-center w-[30px] h-[30px] rounded cursor-pointer border-none bg-transparent transition-colors duration-100 flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Home size={15} />
        </button>

        <div className="w-px h-5 self-center flex-shrink-0" style={{ background: 'var(--border)' }} />

        <nav aria-label="Toolbar tabs" className="markeon-toolbar-tabs flex items-center gap-1 min-w-0 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                aria-pressed={isActive}
                className="px-3 h-[30px] inline-flex items-center justify-center rounded-md text-[12px] font-semibold cursor-pointer border transition-all duration-150 flex-shrink-0"
                style={{
                  fontFamily: 'var(--font-ui)',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  borderColor: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface-raised)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Center - editable filename */}
      <div className="markeon-ribbon-file min-w-0 flex-1 flex items-center justify-center gap-2">
        {editingName ? (
          <div className="flex items-center gap-1.5 h-[30px]">
            <input
              ref={nameInputRef}
              aria-label="Document filename"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              onBlur={commitRename}
              className="text-[12.5px] font-medium px-2.5 h-[30px] rounded outline-none inline-flex items-center"
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
                style={{ width: 26, height: 26, background: 'var(--accent)', color: '#0c0c0c', borderRadius: 5 }}
              >
                <Check size={12} />
              </button>
              <button
                onMouseDown={(e) => { e.preventDefault(); cancelRename() }}
                title="Cancel (Esc)"
                className="flex items-center justify-center rounded cursor-pointer transition-opacity duration-100 hover:opacity-80"
                style={{ width: 26, height: 26, background: 'var(--surface-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 5 }}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={startEditing}
            title="Click to rename"
            className="text-[12.5px] font-medium px-2.5 h-[30px] inline-flex items-center justify-center rounded border border-transparent hover:border-[var(--border)] bg-transparent cursor-text transition-colors duration-100"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            {activeFile?.name || 'No file open'}
          </button>
        )}
        {saveStatus && saveStatus !== 'saved' && (
          <span
            role={saveStatus === 'error' ? 'alert' : undefined}
            aria-live="polite"
            title={saveStatus === 'error' && saveError ? String(saveError) : undefined}
            className="text-[10px] whitespace-nowrap"
            style={{ color: saveStatus === 'error' ? 'var(--danger, #c44)' : 'var(--text-muted)' }}
          >
            {saveStatus === 'error' ? 'Save failed' : saveStatus === 'saving' ? 'Saving…' : 'Unsaved'}
          </span>
        )}

      </div>

      {/* Right */}
      <div className="markeon-ribbon-actions flex items-center gap-2 flex-shrink-0">
        {!readingMode && <ThemePicker />}

        <button
          onClick={toggleReadingMode}
          title={readingMode ? 'Exit reading mode' : 'Enter reading mode'}
          aria-label={readingMode ? 'Exit Reading' : 'Reading Mode'}
          className="h-[30px] inline-flex items-center gap-1.5 px-3 rounded-md text-[12px] font-semibold cursor-pointer border transition-all duration-150 shadow-xs"
          style={{
            background: readingMode ? 'var(--accent)' : 'var(--surface-raised)',
            borderColor: 'var(--accent)',
            color: readingMode ? '#0c0c0c' : 'var(--accent)',
            fontFamily: 'var(--font-ui)',
          }}
          onMouseEnter={(e) => {
            if (!readingMode) {
              e.currentTarget.style.background = 'var(--accent-dim)'
            }
          }}
          onMouseLeave={(e) => {
            if (!readingMode) {
              e.currentTarget.style.background = 'var(--surface-raised)'
            }
          }}
        >
          <BookOpen size={14} />
          <span>{readingMode ? 'Exit Reading' : 'Reading Mode'}</span>
        </button>

        <div className="w-px h-5 self-center flex-shrink-0" style={{ background: 'var(--border)' }} />

        <button
          type="button"
          onClick={handleExport}
          disabled={!activeFile || exporting}
          aria-busy={exporting}
          aria-label={exporting ? 'Exporting PDF' : 'Export PDF'}
          className="h-[30px] inline-flex items-center gap-1.5 px-3 rounded text-[12px] font-semibold cursor-pointer border-none transition-all duration-100 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--accent)',
            color: '#0c0c0c',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <Download size={13} />
          <span>{exporting ? 'Exporting…' : 'Export PDF'}</span>
        </button>

        <button
          onClick={toggleMode}
          title="Toggle theme"
          className="inline-flex items-center justify-center w-[30px] h-[30px] rounded cursor-pointer border transition-colors duration-100"
          style={{
            background: 'transparent',
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          {mode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
      {exportError && <div role="alert" className="ribbon-error">Export failed: {exportError}</div>}
    </div>
  )
}
