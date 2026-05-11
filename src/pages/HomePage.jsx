import { useThemeStore } from '../store/useThemeStore'
import Navbar from '../components/homepage/Navbar'
import Hero from '../components/homepage/Hero'
import Aurora from '../components/homepage/Aurora'

const DARK_STOPS = ['#E8B84B', '#C47A15', '#8B4513']
const LIGHT_STOPS = ['#e8b84b', '#d4a017', '#c8a96e']

export default function HomePage() {
  const { mode } = useThemeStore()
  const isDark = mode === 'dark'

  return (
    <div
      className="relative flex flex-col h-dvh overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Aurora background */}
      <div
        className="fixed inset-0 z-0"
        style={{ opacity: isDark ? 1 : 0.4 }}
      >
        <Aurora
          colorStops={isDark ? DARK_STOPS : LIGHT_STOPS}
          blend={isDark ? 0.5 : 0.6}
          amplitude={1.1}
          speed={0.35}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        <Hero />
      </div>
    </div>
  )
}
