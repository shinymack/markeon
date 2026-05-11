import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative z-10 flex flex-1 items-center justify-center px-8 py-24 text-center">
      <div className="flex flex-col items-center gap-6 max-w-[600px]">

        <span
          className="inline-flex px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border"
          style={{
            background: 'var(--accent-dim)',
            borderColor: 'var(--accent-dim)',
            color: 'var(--accent)',
          }}
        >
          Markdown to PDF, redesigned
        </span>

        <h1
          className="m-0 font-extrabold leading-none tracking-tighter"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(64px, 10vw, 96px)',
            color: 'var(--text-primary)',
            textShadow: 'var(--hero-glow, none)',
          }}
        >
          Markeon
        </h1>

        <p
          className="font-normal leading-relaxed"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'clamp(18px, 2.5vw, 22px)',
            color: 'var(--text-secondary)',
          }}
        >
          Write in markdown.<br />
          Publish like a designer.
        </p>

        <button
          onClick={() => navigate('/app')}
          className="mt-2 inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-base cursor-pointer border-none transition-all duration-150 hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'var(--accent)',
            color: '#0c0c0c',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Open App
          <ArrowRight size={17} />
        </button>

        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          No account. No server. Works offline. Your files stay in your browser.
        </p>
      </div>
    </section>
  )
}
