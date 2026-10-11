import { useState } from 'react'
import { Download } from 'lucide-react'
import { useFileStore, DEFAULT_LAYOUT } from '../../store/useFileStore'
import { triggerPrint } from '../../lib/pdf'

export default function ExportPanel() {
  const { files, activeFileId, setFileLayout } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)
  const layout = {
    ...DEFAULT_LAYOUT,
    ...activeFile?.layoutSettings,
    margins: { ...DEFAULT_LAYOUT.margins, ...activeFile?.layoutSettings?.margins },
  }
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

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
  return (
    <div className="flex items-center gap-3 px-4 h-full overflow-x-auto" style={{ fontFamily: 'var(--font-ui)' }}>
      <div className="flex items-center gap-2 flex-shrink-0">
        <label htmlFor="export-watermark" className="text-[11.5px] font-medium whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          Watermark
        </label>
        <input
          id="export-watermark"
          type="text"
          placeholder="e.g. DRAFT or CONFIDENTIAL"
          value={layout.watermark || ''}
          onChange={(e) => activeFile && setFileLayout(activeFile.id, { watermark: e.target.value })}
          className="px-2.5 h-[30px] rounded text-[12.5px] outline-none border w-56 flex-shrink-0"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--surface-raised)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
      </div>

      <div className="h-5 self-center mx-1.5 flex-shrink-0" style={{ width: 1, background: 'var(--border)' }} />

      <button
        type="button"
        onClick={handleExport}
        disabled={!activeFile || exporting}
        aria-busy={exporting}
        className="h-[30px] inline-flex items-center gap-1.5 px-3.5 rounded text-[12px] font-semibold cursor-pointer border-none transition-all duration-100 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        style={{ background: 'var(--accent)', color: '#0c0c0c' }}
      >
        <Download size={13} />
        <span>{exporting ? 'Exporting…' : 'Export PDF'}</span>
      </button>

      {exportError && (
        <p role="alert" className="text-[11px] whitespace-nowrap flex-shrink-0" style={{ color: 'var(--danger, #c44)' }}>
          {exportError}
        </p>
      )}
    </div>
  )
}
