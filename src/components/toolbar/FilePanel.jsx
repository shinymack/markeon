import { useRef } from 'react'
import { FilePlus, FileDown, FileUp, Copy, Trash2, Image } from 'lucide-react'
import { useFileStore } from '../../store/useFileStore'
import { toPortableMarkdown, pickAndInsertImage } from '../../lib/images'
import { editorViewRef, editorFileIdRef } from '../../lib/editorRef'

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
  return <div className="h-5 self-center mx-1.5 flex-shrink-0" style={{ width: 1, background: 'var(--border)' }} />
}

export default function FilePanel() {
  const { files, activeFileId, createFile, duplicateFile, deleteFile, saveStatus, saveError, reportStorageError } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)
  const importRef = useRef(null)

  async function handleDuplicate() {
    if (!activeFile) return
    await duplicateFile(activeFile.id)
  }
  async function handleInsertImage() {
    const view = editorViewRef.current
    if (!activeFile || !view || editorFileIdRef.current !== activeFile.id) return
    try {
      await pickAndInsertImage(view, activeFile.id)
    } catch (error) {
      reportStorageError(error)
    }
  }

  async function handleExportMd() {
    if (!activeFile) return
    try {
      const view = editorViewRef.current
      const content = view && editorFileIdRef.current === activeFile.id ? view.state.doc.toString() : activeFile.content
      const markdown = await toPortableMarkdown(content)
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = activeFile.name.endsWith('.md') ? activeFile.name : `${activeFile.name}.md`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (error) {
      reportStorageError(error)
    }
  }

  function handleImportMd(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const text = String(ev.target.result || '')
      await createFile(file.name, { content: text })
    }
    reader.readAsText(file)
    e.target.value = ''
  }


  async function handleDelete() {
    if (!activeFile) return
    if (!window.confirm(`Delete "${activeFile.name}"? This cannot be undone.`)) return
    try {
      await deleteFile(activeFile.id)
    } catch (error) {
      reportStorageError(error)
    }
  }

  return (
    <div
      className="flex items-center gap-0.5 px-3 h-full w-full overflow-x-auto"
      aria-label="File actions"
    >
      <ActionButton icon={FilePlus} label="New File" onClick={() => createFile()} />
      <ActionButton icon={Copy} label="Duplicate" disabled={!activeFile} onClick={handleDuplicate} />
      <ActionButton icon={Image} label="Insert Image" disabled={!activeFile} onClick={handleInsertImage} />

      <Sep />

      <ActionButton icon={FileUp} label="Import .md" onClick={() => importRef.current?.click()} />
      <ActionButton icon={FileDown} label="Export .md" disabled={!activeFile} onClick={handleExportMd} />

      <Sep />

      <ActionButton icon={Trash2} label="Delete File" danger disabled={!activeFile} onClick={handleDelete} />
      <span
        role="status"
        className="ml-auto flex-shrink-0 text-[11px] whitespace-nowrap"
        style={{ color: saveStatus === 'error' ? 'var(--destructive, #e05555)' : 'var(--text-muted)' }}
        title={saveStatus === 'error' && saveError ? String(saveError.message || saveError) : undefined}
      >
        {saveStatus === 'error' ? 'Save error' : saveStatus === 'saving' ? 'Saving…' : saveStatus === 'pending' ? 'Unsaved changes' : 'Saved'}
      </span>

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
