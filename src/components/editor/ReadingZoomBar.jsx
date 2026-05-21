import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { READING_ZOOM_MIN, READING_ZOOM_MAX } from '../../store/useEditorStore'

export default function ReadingZoomBar({ zoom, onChange, onReset }) {
  const pct = Math.round(zoom * 100)
  const minPct = Math.round(READING_ZOOM_MIN * 100)
  const maxPct = Math.round(READING_ZOOM_MAX * 100)

  function step(delta) {
    onChange(zoom + delta)
  }

  return (
    <div
      id="reading-zoom-bar"
      className="flex-shrink-0 flex items-center gap-3 px-4 py-2 border-t"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderColor: 'var(--glass-border)',
      }}
    >
      <button
        type="button"
        onClick={() => step(-0.1)}
        disabled={zoom <= READING_ZOOM_MIN}
        title="Zoom out"
        className="flex items-center justify-center w-7 h-7 rounded border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
        style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
      >
        <ZoomOut size={14} />
      </button>

      <input
        type="range"
        min={minPct}
        max={maxPct}
        step={5}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-label="Reading zoom"
        className="flex-1 min-w-0 h-1 accent-[var(--accent)] cursor-pointer"
      />

      <span
        className="text-[12px] font-medium tabular-nums w-10 text-right flex-shrink-0"
        style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-secondary)' }}
      >
        {pct}%
      </span>

      <button
        type="button"
        onClick={() => step(0.1)}
        disabled={zoom >= READING_ZOOM_MAX}
        title="Zoom in"
        className="flex items-center justify-center w-7 h-7 rounded border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-100"
        style={{ background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
      >
        <ZoomIn size={14} />
      </button>

      <button
        type="button"
        onClick={onReset}
        title="Reset zoom to 100%"
        className="flex items-center justify-center w-7 h-7 rounded border-none cursor-pointer transition-colors duration-100"
        style={{ background: 'transparent', color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        <RotateCcw size={13} />
      </button>
    </div>
  )
}
