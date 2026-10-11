import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFileStore } from '../../store/useFileStore'
import { useMediaStore } from '../../store/useMediaStore'
import { editorViewRef } from '../../lib/editorRef'
import { DEFAULT_MERMAID_SETTINGS, normalizeMermaidSettings, updateImageSource, updateMermaidSource } from '../../lib/media'

const DIRECTIONS = ['TB', 'TD', 'BT', 'RL', 'LR']
const CURVES = ['basis', 'linear', 'cardinal', 'catmullRom', 'monotoneX', 'step', 'stepBefore', 'stepAfter']
const THEMES = [['auto', 'Document theme'], ['default', 'Default'], ['dark', 'Dark'], ['forest', 'Forest'], ['neutral', 'Neutral'], ['base', 'Custom / Base']]
const FONTS = [['', 'Document font'], ['Arial, Helvetica, sans-serif', 'Arial'], ['Verdana, sans-serif', 'Verdana'], ['Georgia, serif', 'Georgia'], ['"Times New Roman", Times, serif', 'Times New Roman'], ['monospace', 'Monospace']]

function Field({ label, children, disabled = false }) {
  return <label className={`flex items-center gap-2 text-[12px] whitespace-nowrap flex-shrink-0 text-[var(--text-secondary)] ${disabled ? 'opacity-60' : ''}`}>{label}{children}</label>
}

function Select({ value, onChange, children, ariaLabel, disabled = false }) {
  return <select aria-label={ariaLabel} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-2 h-[30px] text-[12.5px] text-[var(--text-primary)]">{children}</select>
}

function NumberInput({ label, value, min = 0, max = Infinity, onCommit, disabled = false }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  function commit() {
    if (!draft.trim() || !Number.isFinite(Number(draft))) { setDraft(String(value)); return }
    const next = Math.min(max, Math.max(min, Math.round(Number(draft))))
    setDraft(String(next))
    onCommit(next)
  }
  return <input aria-label={label} disabled={disabled} type="number" min={min} max={Number.isFinite(max) ? max : undefined} step="1" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') setDraft(String(value)) }} className="w-16 rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-2 h-[30px] text-[12.5px] text-[var(--text-primary)]" />
}

function WidthAlign({ settings, apply, diagram = false }) {
  const sizeLabel = diagram ? 'Diagram size (%)' : 'Image width (%)'
  return <>
    <Field label={sizeLabel}><NumberInput label={sizeLabel} min={10} max={100} value={settings.width} onCommit={(width) => apply({ width })} /></Field>
    <Field label="Alignment"><Select ariaLabel="Alignment" value={settings.align} onChange={(align) => apply({ align })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></Select></Field>
  </>
}

export default function MediaFormatPanel() {
  const selection = useMediaStore((state) => state.selection)
  const selectMedia = useMediaStore((state) => state.selectMedia)
  const activeFileId = useFileStore((state) => state.activeFileId)
  const imageSettings = useMemo(() => ({ width: 100, align: 'center', ...(selection?.settings || {}) }), [selection])
  const mermaidSettings = useMemo(() => normalizeMermaidSettings(selection?.settings), [selection])
  const [formatError, setFormatError] = useState('')
  useEffect(() => setFormatError(''), [selection?.fileId, selection?.from, selection?.type])

  const apply = useCallback((patch) => {
    const view = editorViewRef.current
    if (!view || !selection || selection.fileId !== activeFileId) return
    try {
      const content = view.state.doc.toString()
      const result = selection.type === 'mermaid' ? updateMermaidSource(content, selection, patch) : updateImageSource(content, selection, patch)
      setFormatError('')
      if (result.content === content) return
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: result.content } })
      selectMedia(result.selection)
    } catch (error) { setFormatError(error.message || 'Formatting could not be applied.') }
  }, [activeFileId, selectMedia, selection])

  if (!selection) return <div className="flex items-center px-4 h-full text-sm text-[var(--text-muted)]">Select an image or diagram to format it.</div>
  if (selection.fileId && selection.fileId !== activeFileId) return <div className="flex items-center px-4 h-full text-sm text-[var(--text-muted)]">Select media in the active document to format it.</div>

  if (selection.type === 'image') {
    const disabled = Boolean(selection.settings?.rawHtml)
    return <section className="flex items-center gap-3 px-4 h-full overflow-x-auto" aria-label="Picture Format">
      <h2 className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--text-primary)] flex-shrink-0">Picture Format</h2>
      {disabled ? <p className="text-sm text-[var(--text-muted)]">Raw HTML image — edit the HTML source directly; formatting is disabled.</p> : <WidthAlign settings={imageSettings} apply={apply} />}
      {formatError && <p role="alert" className="text-xs flex-shrink-0" style={{ color: 'var(--destructive)' }}>Format not applied: {formatError}</p>}
    </section>
  }

  const flowchart = selection.settings?.flowchart !== false
  return <section className="diagram-format-panel" aria-label="Diagram Format">
    <WidthAlign settings={mermaidSettings} apply={apply} diagram />
    <Field label="Theme"><Select ariaLabel="Diagram theme" value={mermaidSettings.theme} onChange={(theme) => apply({ theme, color: '' })}>{THEMES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
    <Field label="Custom color">
      <input type="color" aria-label="Diagram node color" title="Choose a custom node color; this switches to the Custom / Base theme." value={mermaidSettings.color || '#ececff'} onChange={(event) => apply({ theme: 'base', color: event.target.value })} className="w-9 h-[30px] rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)] cursor-pointer" />
      {mermaidSettings.color && <button type="button" onClick={() => apply({ color: '' })} className="h-[30px] px-2 text-xs text-[var(--text-muted)] cursor-pointer" aria-label="Reset diagram node color">Reset</button>}
    </Field>
    <Field label="Font"><Select ariaLabel="Diagram font" value={mermaidSettings.fontFamily} onChange={(fontFamily) => apply({ fontFamily })}>{!FONTS.some(([value]) => value === mermaidSettings.fontFamily) && <option value={mermaidSettings.fontFamily}>{mermaidSettings.fontFamily}</option>}{FONTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
    <Field label="Text size (px)"><NumberInput label="Diagram text size" min={8} max={48} value={mermaidSettings.fontSize} onCommit={(fontSize) => apply({ fontSize })} /></Field>
    <Field label="Flow direction" disabled={!flowchart}><Select ariaLabel="Flow direction" disabled={!flowchart} value={mermaidSettings.direction} onChange={(direction) => apply({ direction })}>{DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}</Select></Field>
    <Field label="Node spacing" disabled={!flowchart}><NumberInput label="Node spacing" disabled={!flowchart} value={mermaidSettings.nodeSpacing} onCommit={(nodeSpacing) => apply({ nodeSpacing })} /></Field>
    <Field label="Rank spacing" disabled={!flowchart}><NumberInput label="Rank spacing" disabled={!flowchart} value={mermaidSettings.rankSpacing} onCommit={(rankSpacing) => apply({ rankSpacing })} /></Field>
    <Field label="Curve" disabled={!flowchart}><Select ariaLabel="Curve" disabled={!flowchart} value={mermaidSettings.curve} onChange={(curve) => apply({ curve })}>{CURVES.map((curve) => <option key={curve} value={curve}>{curve}</option>)}</Select></Field>
    <button type="button" onClick={() => apply(DEFAULT_MERMAID_SETTINGS)} title="Reset diagram" aria-label="Reset diagram" className="h-[30px] rounded border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-2.5 text-[12.5px] text-[var(--text-primary)] cursor-pointer flex-shrink-0">Reset</button>
    {formatError && <p role="alert" className="text-xs min-w-0 basis-full break-words" style={{ color: 'var(--destructive)' }}>Format not applied: {formatError}</p>}
  </section>
}
