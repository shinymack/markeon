import { Download } from 'lucide-react'
import { useFileStore, DEFAULT_LAYOUT } from '../../store/useFileStore'
import { buildPrintStyle, triggerPrint } from '../../lib/pdf'

export default function ExportPanel() {
  const { files, activeFileId, setFileLayout } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)
  const layout = { ...DEFAULT_LAYOUT, ...activeFile?.layoutSettings }

  function handleExport() {
    triggerPrint(buildPrintStyle(layout), activeFile?.name)
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2" style={{ fontFamily: 'var(--font-ui)' }}>

      <div className="flex flex-col gap-1 min-w-[200px]">
        <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Watermark
        </label>
        <input
          type="text"
          placeholder="e.g. DRAFT or CONFIDENTIAL"
          value={layout.watermark || ''}
          onChange={(e) => activeFile && setFileLayout(activeFile.id, { watermark: e.target.value })}
          className="px-2 py-1 rounded text-[12px] outline-none border"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--surface-raised)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Leave empty for no watermark
        </p>
      </div>

      <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

      <button
        onClick={handleExport}
        disabled={!activeFile}
        className="flex items-center gap-2 px-4 py-2 rounded text-[13px] font-semibold cursor-pointer border-none transition-all duration-100 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--accent)', color: '#0c0c0c' }}
      >
        <Download size={14} />
        Export PDF
      </button>

    </div>
  )
}
