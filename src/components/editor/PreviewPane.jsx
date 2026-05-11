import { useEffect, useRef, useState } from 'react'
import { useFileStore } from '../../store/useFileStore'
import { renderMarkdown, processPageBreaks } from '../../lib/markdown'

export default function PreviewPane() {
  const content = useFileStore((s) => {
    const file = s.files.find((f) => f.id === s.activeFileId)
    return file?.content ?? ''
  })
  const [html, setHtml] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    if (!content) { setHtml(''); return }
    renderMarkdown(content).then((result) => setHtml(processPageBreaks(result)))
  }, [content])

  useEffect(() => {
    if (!containerRef.current) return
    const mermaidEls = containerRef.current.querySelectorAll('code.language-mermaid')
    if (mermaidEls.length === 0) return
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
      mermaidEls.forEach((el) => {
        const div = document.createElement('div')
        div.className = 'mermaid'
        div.textContent = el.textContent
        el.parentElement?.replaceWith(div)
      })
      mermaid.run({ nodes: containerRef.current.querySelectorAll('.mermaid') })
    })
  }, [html])

  return (
    <div
      id="preview-pane"
      className="h-full overflow-hidden flex flex-col"
      style={{ background: 'var(--surface)' }}
    >
      <div className="flex-1 overflow-y-auto px-6 py-8 flex justify-center">
        <div
          className="w-full rounded-sm"
          style={{
            maxWidth: '794px',
            minHeight: '1123px',
            background: 'var(--preview-bg)',
            boxShadow: 'var(--page-shadow)',
            padding: '60px 72px',
          }}
        >
          <div
            ref={containerRef}
            id="preview-content"
            className="markeon-document"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}
