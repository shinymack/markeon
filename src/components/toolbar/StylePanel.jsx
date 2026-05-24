import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { RotateCcw, ChevronDown } from 'lucide-react'
import { useFileStore, DEFAULT_STYLE } from '../../store/useFileStore'
import { getThemeById, BUILT_IN_THEMES } from '../../lib/themes'
import { ensureFont } from '../../lib/fontLoader'

const BODY_FONTS = [
  { label: 'Theme default', value: null },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Source Serif 4', value: "'Source Serif 4', serif" },
  { label: 'Merriweather', value: "'Merriweather', serif" },
  { label: 'Lora', value: "'Lora', serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Fraunces', value: "'Fraunces', serif" },
  { label: 'Crimson Text', value: "'Crimson Text', serif", load: 'Crimson Text' },
  { label: 'DM Sans', value: "'DM Sans', sans-serif", load: 'DM Sans' },
  { label: 'Nunito', value: "'Nunito', sans-serif", load: 'Nunito' },
]

const HEADING_FONTS = [
  { label: 'Theme default', value: null },
  { label: 'Bricolage Grotesque', value: "'Bricolage Grotesque', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Fraunces', value: "'Fraunces', serif" },
  { label: 'Inter', value: "'Inter', sans-serif" },
  { label: 'Merriweather', value: "'Merriweather', serif" },
  { label: 'Lora', value: "'Lora', serif" },
  { label: 'Source Serif 4', value: "'Source Serif 4', serif" },
]

const MONO_FONTS = [
  { label: 'Theme default', value: null },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Fira Code', value: "'Fira Code', monospace", load: 'Fira Code' },
  { label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace", load: 'IBM Plex Mono' },
]

function Sep() {
  return <div className="self-stretch mx-2" style={{ width: 1, background: 'var(--border)' }} />
}

function FieldLabel({ children }) {
  return (
    <span style={{ fontSize: 12, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>
      {children}
    </span>
  )
}

function ResetBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Reset to theme default"
      className="flex items-center justify-center rounded border-none cursor-pointer hover:opacity-80 flex-shrink-0"
      style={{ width: 20, height: 20, background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
    >
      <RotateCcw size={10} />
    </button>
  )
}

function FontDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef(null)
  const btnRef = useRef(null)
  const current = options.find((o) => o.value === value) || options[0]

  function openDropdown() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setDropPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 160) })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function select(opt) {
    if (opt.load) ensureFont(opt.load)
    onChange(opt.value ?? null)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex-shrink-0" style={{ minWidth: 155 }}>
      <button
        ref={btnRef}
        onClick={() => open ? setOpen(false) : openDropdown()}
        className="flex items-center justify-between gap-2 w-full rounded cursor-pointer border transition-colors duration-100"
        style={{
          padding: '4px 8px',
          height: 30,
          fontSize: 12.5,
          fontFamily: current.value || 'var(--font-ui)',
          background: 'var(--surface-raised)',
          borderColor: open ? 'var(--accent)' : 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown size={11} style={{ flexShrink: 0, color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>

      {open && createPortal(
        <div
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            maxHeight: 260,
            overflowY: 'auto',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 9999,
          }}
        >
          {options.map((opt) => {
            const isActive = opt.value === value
            return (
              <div
                key={String(opt.value)}
                onMouseDown={() => select(opt)}
                className="flex items-center px-3 cursor-pointer transition-colors duration-75"
                style={{
                  height: 36,
                  fontSize: opt.value ? 13 : 12,
                  fontFamily: opt.value || 'var(--font-ui)',
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  fontStyle: opt.value ? 'normal' : 'italic',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.label}
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}

function ColorField({ label, value, themeDefault, onChange, onReset }) {
  const displayVal = value || themeDefault || '#000000'

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="color"
        value={displayVal}
        onChange={(e) => onChange(e.target.value)}
        title={`${label}: ${displayVal}`}
        style={{
          width: 30,
          height: 30,
          padding: 3,
          borderRadius: 5,
          border: '1px solid var(--border)',
          background: 'var(--surface-raised)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      />
      {value && <ResetBtn onClick={onReset} />}
    </div>
  )
}

export default function StylePanel() {
  const { files, activeFileId, setFileStyle } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)

  if (!activeFile) return null

  const overrides = { ...DEFAULT_STYLE, ...activeFile.styleOverrides }
  const themeId = activeFile.themeId || 'academic-serif'
  const theme = getThemeById(themeId) || BUILT_IN_THEMES[0]
  const tok = theme.tokens

  function patch(updates) {
    setFileStyle(activeFile.id, updates)
  }

  return (
    <div
      className="flex items-center gap-1 px-4 overflow-x-auto"
      style={{ height: 51 }}
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel>Body Font</FieldLabel>
        <FontDropdown value={overrides.bodyFont} options={BODY_FONTS} onChange={(v) => patch({ bodyFont: v })} />
        {overrides.bodyFont && <ResetBtn onClick={() => patch({ bodyFont: null })} />}
      </div>

      <Sep />

      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel>Heading Font</FieldLabel>
        <FontDropdown value={overrides.headingFont} options={HEADING_FONTS} onChange={(v) => patch({ headingFont: v })} />
        {overrides.headingFont && <ResetBtn onClick={() => patch({ headingFont: null })} />}
      </div>

      <Sep />

      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel>Code Font</FieldLabel>
        <FontDropdown value={overrides.monoFont} options={MONO_FONTS} onChange={(v) => patch({ monoFont: v })} />
        {overrides.monoFont && <ResetBtn onClick={() => patch({ monoFont: null })} />}
      </div>

      <Sep />

      <ColorField
        label="Heading"
        value={overrides.headingColor}
        themeDefault={tok['--color-heading']}
        onChange={(v) => patch({ headingColor: v })}
        onReset={() => patch({ headingColor: null })}
      />

      <ColorField
        label="Accent"
        value={overrides.accentColor}
        themeDefault={tok['--color-accent']}
        onChange={(v) => patch({ accentColor: v })}
        onReset={() => patch({ accentColor: null })}
      />

      <ColorField
        label="Body text"
        value={overrides.bodyColor}
        themeDefault={tok['--color-text']}
        onChange={(v) => patch({ bodyColor: v })}
        onReset={() => patch({ bodyColor: null })}
      />

      <Sep />

      <ColorField
        label="Page bg"
        value={overrides.pageBg}
        themeDefault={tok['--page-bg']}
        onChange={(v) => patch({ pageBg: v })}
        onReset={() => patch({ pageBg: null })}
      />
    </div>
  )
}
