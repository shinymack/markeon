import { RotateCcw } from 'lucide-react'
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
  return <div className="h-5 self-center mx-1.5 flex-shrink-0" style={{ width: 1, background: 'var(--border)' }} />
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ fontSize: 12, fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>
      {children}
    </label>
  )
}

function ResetBtn({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Reset to theme default"
      title="Reset to theme default"
      className="flex items-center justify-center rounded border-none cursor-pointer hover:opacity-80 flex-shrink-0"
      style={{ width: 20, height: 20, background: 'var(--surface-raised)', color: 'var(--text-muted)' }}
    >
      <RotateCcw size={10} />
    </button>
  )
}

function FontDropdown({ id, label, value, options, onChange }) {
  return (
    <select
      id={id}
      aria-label={label}
      value={value ?? ''}
      onChange={(e) => {
        const option = options.find((item) => (item.value ?? '') === e.target.value)
        if (option?.load) ensureFont(option.load)
        onChange(option?.value ?? null)
      }}
      className="rounded flex-shrink-0"
      style={{
        minWidth: 155,
        height: 30,
        padding: '4px 8px',
        fontSize: 12.5,
        fontFamily: value || 'var(--font-ui)',
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
      }}
    >
      {options.map((option) => (
        <option key={option.label} value={option.value ?? ''}>{option.label}</option>
      ))}
    </select>
  )
}

function ColorField({ id, label, value, themeDefault, onChange, onReset }) {
  const displayVal = value || themeDefault || '#000000'

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="color"
        aria-label={`${label} color`}
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
      className="flex items-center gap-1 px-4 h-full overflow-x-auto"
    >
      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel htmlFor="style-body-font">Body Font</FieldLabel>
        <FontDropdown id="style-body-font" label="Body font" value={overrides.bodyFont} options={BODY_FONTS} onChange={(v) => patch({ bodyFont: v })} />
        {overrides.bodyFont && <ResetBtn onClick={() => patch({ bodyFont: null })} />}
      </div>

      <Sep />

      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel htmlFor="style-heading-font">Heading Font</FieldLabel>
        <FontDropdown id="style-heading-font" label="Heading font" value={overrides.headingFont} options={HEADING_FONTS} onChange={(v) => patch({ headingFont: v })} />
        {overrides.headingFont && <ResetBtn onClick={() => patch({ headingFont: null })} />}
      </div>

      <Sep />

      <div className="flex items-center gap-2 flex-shrink-0">
        <FieldLabel htmlFor="style-mono-font">Code Font</FieldLabel>
        <FontDropdown id="style-mono-font" label="Code font" value={overrides.monoFont} options={MONO_FONTS} onChange={(v) => patch({ monoFont: v })} />
        {overrides.monoFont && <ResetBtn onClick={() => patch({ monoFont: null })} />}
      </div>

      <Sep />

      <ColorField
        id="style-heading-color"
        label="Heading"
        value={overrides.headingColor}
        themeDefault={tok['--color-heading']}
        onChange={(v) => patch({ headingColor: v })}
        onReset={() => patch({ headingColor: null })}
      />

      <ColorField
        id="style-accent-color"
        label="Accent"
        value={overrides.accentColor}
        themeDefault={tok['--color-accent']}
        onChange={(v) => patch({ accentColor: v })}
        onReset={() => patch({ accentColor: null })}
      />

      <ColorField
        id="style-body-color"
        label="Body text"
        value={overrides.bodyColor}
        themeDefault={tok['--color-text']}
        onChange={(v) => patch({ bodyColor: v })}
        onReset={() => patch({ bodyColor: null })}
      />

      <Sep />

      <ColorField
        id="style-page-bg"
        label="Page bg"
        value={overrides.pageBg}
        themeDefault={tok['--page-bg']}
        onChange={(v) => patch({ pageBg: v })}
        onReset={() => patch({ pageBg: null })}
      />
    </div>
  )
}
