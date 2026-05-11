import { useNavigate } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'
import styles from './Navbar.module.css'

export default function Navbar() {
  const navigate = useNavigate()
  const { mode, toggleMode } = useThemeStore()

  return (
    <nav className={styles.navbar}>
      <button className={styles.logo} onClick={() => navigate('/')}>
        Markeon
      </button>
      <div className={styles.right}>
        <button
          className={styles.themeToggle}
          onClick={toggleMode}
          aria-label="Toggle theme"
        >
          {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  )
}
