import { useState } from 'react'
import { RotateCcw, Lock, Unlock } from 'lucide-react'
import { useFileStore, DEFAULT_LAYOUT } from '../../store/useFileStore'
import { PAPER_SIZES } from '../../lib/pdf'

const PAPER_KEYS = Object.keys(PAPER_SIZES)

function NumInput({ value, min, max, step = 1, onChange, w = 58 }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = parseFloat(e.target.value)
        if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
      }}
      className="text-right outline-none rounded"
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
      onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
    />
  )
}

function FieldLabel({ children }) {
  return (
    <span
      style={{
        fontSize: 11.5,
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  )
}

function Unit({ children }) {
  return (
    <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function Sep() {
  return <div className="self-stretch mx-2" style={{ width: 1, background: 'var(--border)' }} />
}

function ResetBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Reset to theme default"
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
          key={opt.value}
          onClick={() => onChange(opt.value)}
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

  const [linked, setLinked] = useState(layout.marginLinked ?? true)

  if (!activeFile) return null

  function patch(updates) {
    setFileLayout(activeFile.id, updates)
  }

  const fontSizePt = layout.fontSize ? parseFloat(layout.fontSize) : 12
  const lineHeight = layout.lineHeight ?? 1.7
  const hasCustomFont = !!layout.fontSize
  const hasCustomLH = !!layout.lineHeight
  const marginVal = parseInt(layout.margins.top) || 20

  function setLinkedMargin(mm) {
    patch({ margins: { top: `${mm}mm`, right: `${mm}mm`, bottom: `${mm}mm`, left: `${mm}mm` } })
  }

  function setSideMargin(side, mm) {
    patch({ margins: { [side]: `${mm}mm` } })
  }

  return (
    <div
      className="flex items-center gap-1 px-4 overflow-x-auto"
      style={{ height: 46, fontFamily: 'var(--font-ui)' }}
    >

      {/* Font size */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel>Font Size</FieldLabel>
        <NumInput value={fontSizePt} min={8} max={20} step={0.5} onChange={(v) => patch({ fontSize: `${v}pt` })} />
        <Unit>pt</Unit>
        {hasCustomFont && <ResetBtn onClick={() => patch({ fontSize: null })} />}
      </div>

      <Sep />

      {/* Line spacing */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel>Line Spacing</FieldLabel>
        <NumInput
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
          onClick={() => {
            const next = !linked
            setLinked(next)
            patch({ marginLinked: next })
          }}
          title={linked ? 'Unlock independent margins' : 'Link all margins'}
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
            <NumInput value={marginVal} min={5} max={40} w={52} onChange={setLinkedMargin} />
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
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>{label}</span>
                <NumInput
                  value={parseInt(layout.margins[side]) || 20}
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
