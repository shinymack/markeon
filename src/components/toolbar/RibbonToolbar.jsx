import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Download, Home } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'
import { useEditorStore } from '../../store/useEditorStore'
import { useFileStore } from '../../store/useFileStore'
import { buildPrintStyle, triggerPrint } from '../../lib/pdf'

const TABS = ['File', 'Format', 'Style', 'Layout', 'Export']

export default function RibbonToolbar() {
  const [activeTab, setActiveTab] = useState('File')
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeStore()
  const { exportSettings } = useEditorStore()
  const { files, activeFileId } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)

  function handleExport() {
    triggerPrint(buildPrintStyle(exportSettings))
  }

  return (
    <div className="flex items-center h-full px-3 gap-2">

      {/* Left */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate('/')}
          title="Home"
          className="flex items-center justify-center w-[30px] h-[30px] rounded cursor-pointer border-none bg-transparent transition-colors duration-100"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Home size={15} />
        </button>

        <div className="w-px h-5" style={{ background: 'var(--border)' }} />

        <nav className="flex items-center gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-2.5 py-1 rounded text-[12.5px] font-medium cursor-pointer border-none transition-colors duration-100"
              style={{
                fontFamily: 'var(--font-ui)',
                background: activeTab === tab ? 'var(--accent-dim)' : 'transparent',
                color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Center */}
      <div className="flex-1 flex justify-center">
        <span
          className="text-[12.5px] font-medium"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}
        >
          {activeFile?.name || 'No file open'}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-[5px] rounded text-[12.5px] font-semibold cursor-pointer border-none transition-all duration-100 hover:brightness-110"
          style={{
            background: 'var(--accent)',
            color: '#0c0c0c',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <Download size={13} />
          Export PDF
        </button>

        <button
          onClick={toggleMode}
          title="Toggle theme"
          className="flex items-center justify-center w-[30px] h-[30px] rounded cursor-pointer border transition-colors duration-100"
          style={{
            background: 'transparent',
            borderColor: 'var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          {mode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </div>
  )
}
