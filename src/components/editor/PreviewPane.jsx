import { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { useFileStore } from '../../store/useFileStore'
import { renderMarkdown, processPageBreaks } from '../../lib/markdown'

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123
const A4_PAD_H = 72
const A4_PAD_V = 60

function splitIntoPages(html) {
  const sep = '<div class="page-break" aria-hidden="true"></div>'
  return html.split(sep).map((s) => s.trim()).filter(Boolean)
}

export default function PreviewPane() {
  const content = useFileStore((s) => {
    const file = s.files.find((f) => f.id === s.activeFileId)
    return file?.content ?? ''
  })
  const [pages, setPages] = useState([''])
  const wrapperRef = useRef(null)
  const allPagesRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!content) { setPages([]); return }
    renderMarkdown(content).then((result) => {
      setPages(splitIntoPages(processPageBreaks(result)))
    })
  }, [content])

  useEffect(() => {
    if (!allPagesRef.current) return
    const mermaidEls = allPagesRef.current.querySelectorAll('code.language-mermaid')
    if (mermaidEls.length === 0) return
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
      mermaidEls.forEach((el) => {
        const div = document.createElement('div')
        div.className = 'mermaid'
        div.textContent = el.textContent
        el.parentElement?.replaceWith(div)
      })
      mermaid.run({ nodes: allPagesRef.current.querySelectorAll('.mermaid') })
    })
  }, [pages])

  useLayoutEffect(() => {
    if (!wrapperRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      const availableW = entry.contentRect.width - 32
      if (availableW < A4_WIDTH_PX) {
        setScale(Math.max(0.35, availableW / A4_WIDTH_PX))
      } else {
        setScale(1)
      }
    })
    ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      id="preview-pane"
      className="h-full overflow-hidden flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      <div
        ref={wrapperRef}
        className="flex-1 overflow-y-auto py-8 flex flex-col items-center"
      >
        <div
          id="markeon-all-pages"
          ref={allPagesRef}
          className="flex flex-col gap-6"
          style={{
            width: `${A4_WIDTH_PX}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: scale < 1 ? `${(pages.length * (A4_HEIGHT_PX + 24)) * (scale - 1)}px` : 0,
          }}
        >
          {pages.length === 0 ? (
            <div
              className="flex items-center justify-center text-sm"
              style={{
                width: `${A4_WIDTH_PX}px`,
                minHeight: `${A4_HEIGHT_PX}px`,
                background: 'var(--preview-bg)',
                boxShadow: 'var(--page-shadow)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              Start writing to see the preview
            </div>
          ) : (
            pages.map((pageHtml, i) => (
              <div
                key={i}
                className="relative flex-shrink-0"
                style={{
                  width: `${A4_WIDTH_PX}px`,
                  minHeight: `${A4_HEIGHT_PX}px`,
                  background: 'var(--preview-bg)',
                  boxShadow: 'var(--page-shadow)',
                  padding: `${A4_PAD_V}px ${A4_PAD_H}px`,
                }}
              >
                <div
                  className="markeon-document"
                  dangerouslySetInnerHTML={{ __html: pageHtml }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
