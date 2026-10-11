import { useEffect, useState } from 'react'
import { RotateCcw, Lock, Unlock } from 'lucide-react'
import { useFileStore, DEFAULT_LAYOUT } from '../../store/useFileStore'
import { PAPER_SIZES } from '../../lib/pdf'
import { getThemeById } from '../../lib/themes'

const PAPER_KEYS = Object.keys(PAPER_SIZES)

function NumInput({ id, label, value, min, max, step = 1, onChange, w = 58 }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  function commit() {
    const number = Number(draft)
    if (!draft.trim() || !Number.isFinite(number)) { setDraft(String(value)); return }
    const next = Math.min(max, Math.max(min, number))
    setDraft(String(next))
    onChange(next)
  }
  return (
    <input
      id={id}
      type="number"
      aria-label={label}
      value={draft}
      min={min}
      max={max}
      step={step}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setDraft(String(value)) }}
      className="text-right outline-none rounded h-[30px]"
      style={{
        width: w,
        padding: '4px 6px',
        fontSize: 12.5,
        fontFamily: 'var(--font-mono)',
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        lineHeight: 1.4,
        minWidth: w,
        flexShrink: 0,
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; commit() }}
    />
  )
}

function FieldLabel({ children, htmlFor }) {
  const style = {
    fontSize: 11.5,
    fontFamily: 'var(--font-ui)',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  }
  return htmlFor ? <label htmlFor={htmlFor} style={style}>{children}</label> : <span style={style}>{children}</span>
}

function Unit({ children }) {
  return (
    <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function Sep() {
  return <div className="h-5 self-center mx-1.5 flex-shrink-0" style={{ width: 1, background: 'var(--border)' }} />
}

function ResetBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Reset to theme default"
      aria-label="Reset to theme default"
      className="flex items-center justify-center rounded border-none cursor-pointer flex-shrink-0 hover:opacity-80"
      style={{ width: 20, height: 20, background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
    >
      <RotateCcw size={10} />
    </button>
  )
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex rounded overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
      {options.map((opt, i) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className="cursor-pointer border-none transition-colors duration-100"
          style={{
            padding: '4px 10px',
            fontSize: 12,
            fontFamily: 'var(--font-ui)',
            background: value === opt.value ? 'var(--accent-dim)' : 'var(--surface-raised)',
            color: value === opt.value ? 'var(--accent)' : 'var(--text-muted)',
            borderRight: i < options.length - 1 ? '1px solid var(--border)' : 'none',
            fontWeight: value === opt.value ? 600 : 400,
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function LayoutPanel() {
  const { files, activeFileId, setFileLayout } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)
  const layout = {
    ...DEFAULT_LAYOUT,
    ...activeFile?.layoutSettings,
    margins: { ...DEFAULT_LAYOUT.margins, ...activeFile?.layoutSettings?.margins },
  }

  const linked = activeFile?.layoutSettings?.marginLinked ?? true

  if (!activeFile) return null

  function patch(updates) {
    setFileLayout(activeFile.id, updates)
  }

  const themeTokens = getThemeById(activeFile.themeId)?.tokens || {}
  const fontSize = layout.fontSize || themeTokens['--base-size'] || '12pt'
  const fontSizePt = parseFloat(fontSize) * (fontSize.endsWith('px') ? 0.75 : 1)
  const lineHeight = layout.lineHeight ?? (Number(themeTokens['--line-height']) || 1.7)
  const hasCustomFont = !!layout.fontSize
  const hasCustomLH = !!layout.lineHeight
  const marginVal = parseFloat(layout.margins.top) || 20

  function setLinkedMargin(mm) {
    patch({ margins: { top: `${mm}mm`, right: `${mm}mm`, bottom: `${mm}mm`, left: `${mm}mm` } })
  }

  function setSideMargin(side, mm) {
    patch({ margins: { [side]: `${mm}mm` } })
  }

  return (
    <div
      className="flex items-center gap-1 px-4 h-full overflow-x-auto"
      style={{ fontFamily: 'var(--font-ui)' }}
    >

      {/* Font size */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel htmlFor="layout-font-size">Font Size</FieldLabel>
        <NumInput id="layout-font-size" label="Font size in points" value={fontSizePt} min={8} max={20} step={0.5} onChange={(v) => patch({ fontSize: `${v}pt` })} />
        <Unit>pt</Unit>
        {hasCustomFont && <ResetBtn onClick={() => patch({ fontSize: null })} />}
      </div>

      <Sep />

      {/* Line spacing */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel htmlFor="layout-line-height">Line Spacing</FieldLabel>
        <NumInput
          id="layout-line-height"
          label="Line spacing"
          value={typeof lineHeight === 'number' ? +lineHeight.toFixed(2) : 1.7}
          min={1.0} max={2.5} step={0.05} w={52}
          onChange={(v) => patch({ lineHeight: parseFloat(v.toFixed(2)) })}
        />
        {hasCustomLH && <ResetBtn onClick={() => patch({ lineHeight: null })} />}
      </div>

      <Sep />

      {/* Margins */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel>Margins</FieldLabel>
        <button
          type="button"
          onClick={() => {
            const next = !linked
            patch({
              marginLinked: next,
              ...(next ? { margins: { top: `${marginVal}mm`, right: `${marginVal}mm`, bottom: `${marginVal}mm`, left: `${marginVal}mm` } } : {}),
            })
          }}
          title={linked ? 'Unlock independent margins' : 'Link all margins'}
          aria-label={linked ? 'Unlock independent margins' : 'Link all margins'}
          aria-pressed={linked}
          className="flex items-center gap-1 px-2 rounded border-none cursor-pointer flex-shrink-0"
          style={{
            height: 28,
            fontSize: 11,
            background: 'var(--surface-raised)',
            color: linked ? 'var(--accent)' : 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          {linked ? <Lock size={10} /> : <Unlock size={10} />}
          <span style={{ fontFamily: 'var(--font-ui)' }}>{linked ? 'Linked' : 'Free'}</span>
        </button>

        {linked ? (
          <div className="flex items-center gap-2">
            <NumInput id="layout-margin-all" label="All margins in millimeters" value={marginVal} min={5} max={40} w={52} onChange={setLinkedMargin} />
            <Unit>mm</Unit>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {[
              { side: 'top', label: 'Top' },
              { side: 'right', label: 'Right' },
              { side: 'bottom', label: 'Bottom' },
              { side: 'left', label: 'Left' },
            ].map(({ side, label }) => (
              <div key={side} className="flex items-center gap-1">
                <label htmlFor={`layout-margin-${side}`} style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>{label}</label>
                <NumInput
                  id={`layout-margin-${side}`}
                  label={`${label} margin in millimeters`}
                  value={parseFloat(layout.margins[side]) || 20}
                  min={5} max={40} w={44}
                  onChange={(v) => setSideMargin(side, v)}
                />
              </div>
            ))}
            <Unit>mm</Unit>
          </div>
        )}
      </div>

      <Sep />

      {/* Paper size */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel>Paper Size</FieldLabel>
        <ChipGroup
          options={PAPER_KEYS.map((k) => ({ value: k, label: k }))}
          value={layout.paperSize}
          onChange={(v) => patch({ paperSize: v })}
        />
      </div>

      <Sep />

      {/* Orientation */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel>Orientation</FieldLabel>
        <ChipGroup
          options={[
            { value: 'portrait', label: 'Portrait' },
            { value: 'landscape', label: 'Landscape' },
          ]}
          value={layout.orientation}
          onChange={(v) => patch({ orientation: v })}
        />
      </div>

    </div>
  )
}
