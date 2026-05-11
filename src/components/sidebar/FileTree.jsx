import { useState } from 'react'
import { FilePlus, MoreHorizontal, Trash2, FileText } from 'lucide-react'
import { useFileStore } from '../../store/useFileStore'
import styles from './FileTree.module.css'

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

  function handleKeyDown(e, id) {
    if (e.key === 'Enter') commitRename(id)
    if (e.key === 'Escape') setRenamingId(null)
  }

  return (
    <div className={styles.tree}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Files</span>
        <button
          className={styles.newBtn}
          onClick={() => createFile()}
          title="New file"
        >
          <FilePlus size={14} />
        </button>
      </div>

      <div className={styles.list}>
        {files.map((file) => (
          <div
            key={file.id}
            className={[styles.item, file.id === activeFileId && styles.active].filter(Boolean).join(' ')}
            onClick={() => setActiveFile(file.id)}
          >
            <FileText size={13} className={styles.fileIcon} />
            {renamingId === file.id ? (
              <input
                className={styles.renameInput}
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(file.id)}
                onKeyDown={(e) => handleKeyDown(e, file.id)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={styles.name} onDoubleClick={(e) => startRename(file, e)}>
                {file.name}
              </span>
            )}
            <button
              className={styles.deleteBtn}
              onClick={(e) => { e.stopPropagation(); deleteFile(file.id) }}
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        {files.length === 0 && (
          <p className={styles.empty}>No files yet. Click + to create one.</p>
        )}
      </div>
    </div>
  )
}
