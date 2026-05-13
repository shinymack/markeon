import { useRef } from 'react'
import { FilePlus, FileDown, FileUp, Copy, Trash2 } from 'lucide-react'
import { useFileStore } from '../../store/useFileStore'

function ActionButton({ icon: Icon, label, danger, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="flex items-center gap-1.5 px-3 rounded cursor-pointer border-none transition-colors duration-100 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        height: 30,
        fontSize: 12,
        fontFamily: 'var(--font-ui)',
        background: 'transparent',
        color: danger ? 'var(--destructive, #e05555)' : 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        e.currentTarget.style.background = danger ? 'rgba(224,85,85,0.1)' : 'var(--surface-raised)'
        e.currentTarget.style.color = danger ? 'var(--destructive, #e05555)' : 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = danger ? 'var(--destructive, #e05555)' : 'var(--text-muted)'
      }}
    >
      <Icon size={14} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  )
}

function Sep() {
  return <div className="self-stretch mx-2" style={{ width: 1, background: 'var(--border)' }} />
}

export default function FilePanel() {
  const { files, activeFileId, createFile, deleteFile, updateContent } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)
  const importRef = useRef(null)

  async function handleDuplicate() {
    if (!activeFile) return
    const copy = await createFile(activeFile.name.replace('.md', '') + ' copy.md')
    await updateContent(copy.id, activeFile.content)
  }

  function handleExportMd() {
    if (!activeFile) return
    const blob = new Blob([activeFile.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = activeFile.name
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportMd(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = ev.target.result
      const newFile = await createFile(file.name)
      await updateContent(newFile.id, text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleDelete() {
    if (!activeFile) return
    if (!window.confirm(`Delete "${activeFile.name}"? This cannot be undone.`)) return
    await deleteFile(activeFile.id)
  }

  return (
    <div
      className="flex items-center gap-0.5 px-3 overflow-x-auto"
      style={{ height: 46 }}
    >
      <ActionButton icon={FilePlus} label="New File" onClick={() => createFile()} />
      <ActionButton icon={Copy} label="Duplicate" disabled={!activeFile} onClick={handleDuplicate} />

      <Sep />

      <ActionButton icon={FileUp} label="Import .md" onClick={() => importRef.current?.click()} />
      <ActionButton icon={FileDown} label="Export .md" disabled={!activeFile} onClick={handleExportMd} />

      <Sep />

      <ActionButton icon={Trash2} label="Delete File" danger disabled={!activeFile} onClick={handleDelete} />

      <input
        ref={importRef}
        type="file"
        accept=".md,text/markdown"
        className="hidden"
        onChange={handleImportMd}
      />
    </div>
  )
}
