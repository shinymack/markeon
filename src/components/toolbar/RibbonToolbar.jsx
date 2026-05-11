import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, FileText, Type, Palette, Layout, Download, Home } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'
import { useEditorStore } from '../../store/useEditorStore'
import { useFileStore } from '../../store/useFileStore'
import { buildPrintStyle, triggerPrint } from '../../lib/pdf'
import styles from './RibbonToolbar.module.css'

const TABS = [
  { id: 'file', label: 'File', icon: FileText },
  { id: 'format', label: 'Format', icon: Type },
  { id: 'style', label: 'Style', icon: Palette },
  { id: 'layout', label: 'Layout', icon: Layout },
  { id: 'export', label: 'Export', icon: Download },
]

export default function RibbonToolbar() {
  const [activeTab, setActiveTab] = useState('file')
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeStore()
  const { exportSettings } = useEditorStore()
  const { getActiveFile } = useFileStore()

  function handleExport() {
    const printStyle = buildPrintStyle(exportSettings)
    triggerPrint(printStyle)
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <button className={styles.homeBtn} onClick={() => navigate('/')} title="Home">
          <Home size={16} />
        </button>
        <div className={styles.divider} />
        <nav className={styles.tabs}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              className={[styles.tab, activeTab === id && styles.active].filter(Boolean).join(' ')}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.center}>
        <span className={styles.filename}>
          {getActiveFile()?.name || 'No file open'}
        </span>
      </div>

      <div className={styles.right}>
        <button className={styles.iconBtn} onClick={handleExport} title="Export PDF">
          <Download size={15} />
          <span>Export PDF</span>
        </button>
        <button className={styles.themeBtn} onClick={toggleMode} title="Toggle theme">
          {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </div>
  )
}
