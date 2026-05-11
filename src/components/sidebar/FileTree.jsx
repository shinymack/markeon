import { useState } from 'react'
import { FilePlus, Trash2, FileText } from 'lucide-react'
import { useFileStore } from '../../store/useFileStore'

export default function FileTree() {
  const { files, activeFileId, setActiveFile, createFile, deleteFile, renameFile } = useFileStore()
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  function startRename(file, e) {
    e.stopPropagation()
    setRenamingId(file.id)
    setRenameValue(file.name)
  }

  function commitRename(id) {
    if (renameValue.trim()) renameFile(id, renameValue.trim())
    setRenamingId(null)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Files
        </span>
        <button
          onClick={() => createFile()}
          title="New file"
          className="flex items-center justify-center w-[22px] h-[22px] rounded cursor-pointer border-none bg-transparent transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
        >
          <FilePlus size={13} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        {files.map((file) => {
          const isActive = file.id === activeFileId
          return (
            <div
              key={file.id}
              onClick={() => setActiveFile(file.id)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer min-w-0 transition-colors duration-100"
              style={{ background: isActive ? 'var(--accent-dim)' : 'transparent' }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-raised)' }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <FileText size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

              {renamingId === file.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(file.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitRename(file.id); if (e.key === 'Escape') setRenamingId(null) }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 text-[13px] px-1.5 py-0.5 rounded border outline-none"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    background: 'var(--surface)',
                    borderColor: 'var(--accent)',
                    color: 'var(--text-primary)',
                  }}
                />
              ) : (
                <span
                  className="flex-1 min-w-0 text-[13px] truncate"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                  onDoubleClick={(e) => startRename(file, e)}
                >
                  {file.name}
                </span>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); deleteFile(file.id) }}
                title="Delete"
                className="flex items-center justify-center w-[18px] h-[18px] rounded cursor-pointer border-none bg-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--destructive)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          )
        })}

        {files.length === 0 && (
          <p className="text-xs text-center px-4 pt-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            No files yet. Click + to create one.
          </p>
        )}
      </div>
    </div>
  )
}
