import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import styles from './Hero.module.css'

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.badge}>Markdown to PDF, redesigned</div>

        <h1 className={styles.wordmark}>Markeon</h1>

        <p className={styles.slogan}>
          Write in markdown.<br />
          Publish like a designer.
        </p>

        <button
          className={styles.cta}
          onClick={() => navigate('/app')}
        >
          Open App
          <ArrowRight size={18} />
        </button>

        <p className={styles.sub}>
          No account. No server. Works offline. Your files stay in your browser.
        </p>
      </div>
    </section>
  )
}
