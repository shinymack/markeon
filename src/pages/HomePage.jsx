import { useThemeStore } from '../store/useThemeStore'
import Navbar from '../components/homepage/Navbar'
import Hero from '../components/homepage/Hero'
import Aurora from '../components/homepage/Aurora'
import styles from './HomePage.module.css'

const DARK_STOPS = ['#E8B84B', '#C47A15', '#8B4513']
const LIGHT_STOPS = ['#f5d07a', '#e8b84b', '#f9f0d8']

export default function HomePage() {
  const { mode } = useThemeStore()

  return (
    <div className={styles.page}>
      <div className={styles.aurora}>
        <Aurora
          colorStops={mode === 'dark' ? DARK_STOPS : LIGHT_STOPS}
          blend={mode === 'dark' ? 0.5 : 0.3}
          amplitude={1.1}
          speed={0.35}
        />
      </div>
      <div className={styles.content}>
        <Navbar />
        <Hero />
      </div>
    </div>
  )
}
