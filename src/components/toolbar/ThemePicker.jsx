import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Palette } from 'lucide-react'
import { BUILT_IN_THEMES, getThemeById } from '../../lib/themes'
import { useFileStore } from '../../store/useFileStore'

export default function ThemePicker() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const { files, activeFileId, setFileTheme } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)
  const activeThemeId = activeFile?.themeId || 'academic-serif'
  const currentTheme = getThemeById(activeThemeId) || BUILT_IN_THEMES[0]

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Document theme"
        className="flex items-center gap-1.5 px-2.5 py-[5px] rounded text-[12px] font-medium cursor-pointer border transition-colors duration-100"
        style={{
          fontFamily: 'var(--font-ui)',
          background: open ? 'var(--surface-raised)' : 'transparent',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: currentTheme.tokens['--color-accent'],
            flexShrink: 0,
          }}
        />
        <span style={{ color: 'var(--text-muted)', maxWidth: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentTheme.name}
        </span>
        <ChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          className="absolute z-50"
          style={{
            top: 'calc(100% + 6px)',
            right: 0,
            width: 300,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-lg)',
            padding: 8,
          }}
        >
          <p
            className="text-[10.5px] font-semibold uppercase tracking-widest px-2 pb-2"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}
          >
            Document Theme
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {BUILT_IN_THEMES.map((theme) => {
              const isActive = theme.id === activeThemeId
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    if (activeFileId) setFileTheme(activeFileId, theme.id)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md text-left cursor-pointer border transition-colors duration-100"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                    borderColor: isActive ? 'var(--accent)' : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--surface-raised)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: theme.tokens['--color-accent'],
                      flexShrink: 0,
                      border: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      outline: `1px solid ${theme.tokens['--color-accent']}44`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11.5px] font-medium truncate">{theme.name}</div>
                    <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {theme.tags.slice(0, 2).join(' · ')}
                    </div>
                  </div>
                  {isActive && (
                    <Check size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
