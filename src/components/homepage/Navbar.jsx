import { useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'

export default function Navbar() {
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeStore()

  return (
    <nav className="relative z-10 flex items-center justify-between px-8 h-[60px]">
      <button
        onClick={() => navigate('/')}
        className="font-display font-bold text-xl tracking-tight cursor-pointer border-none bg-transparent"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--accent)',
          textShadow: '0 0 24px rgba(232,184,75,0.45)',
        }}
      >
        Markeon
      </button>

      <button
        onClick={toggleMode}
        aria-label="Toggle theme"
        className="flex items-center justify-content-center w-9 h-9 rounded-lg cursor-pointer border transition-colors duration-150"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          borderColor: 'var(--glass-border)',
          color: 'var(--text-muted)',
        }}
      >
        <span className="flex items-center justify-center w-full h-full">
          {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </span>
      </button>
    </nav>
  )
}
