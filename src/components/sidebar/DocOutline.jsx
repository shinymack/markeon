export default function DocOutline({ headings, onSelect, variant = 'stacked' }) {
  const isPanel = variant === 'panel'

  return (
    <div
      className={`flex flex-col flex-1 min-h-0 overflow-hidden ${isPanel ? '' : 'border-t'}`}
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div
        className="px-4 py-2 flex-shrink-0 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Outline
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {headings.length === 0 ? (
          <p className="text-xs text-center px-2 pt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Headings appear here as you write.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5 list-none m-0 p-0">
            {headings.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => onSelect(h.id)}
                  className="w-full text-left text-[12px] py-1 px-2 rounded border-none bg-transparent cursor-pointer truncate transition-colors duration-100"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    color: 'var(--text-secondary)',
                    paddingLeft: `${8 + (h.level - 1) * 12}px`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-raised)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }}
                  title={h.text}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
