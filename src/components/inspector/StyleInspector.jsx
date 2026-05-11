export default function StyleInspector() {
  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center px-4 py-3 flex-shrink-0 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
        >
          Style Inspector
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-[12.5px] leading-relaxed text-center pt-8" style={{ color: 'var(--text-muted)' }}>
          Click any element in the preview to inspect and edit its styles.
        </p>
      </div>
    </div>
  )
}
