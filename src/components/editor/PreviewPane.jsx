import { useEffect, useRef, useState } from 'react'
import { useFileStore } from '../../store/useFileStore'
import { renderMarkdown, processPageBreaks } from '../../lib/markdown'
import styles from './PreviewPane.module.css'

export default function PreviewPane() {
  const content = useFileStore((s) => {
    const file = s.files.find((f) => f.id === s.activeFileId)
    return file?.content ?? ''
  })
  const [html, setHtml] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    if (!content) { setHtml(''); return }
    renderMarkdown(content).then((result) => {
      setHtml(processPageBreaks(result))
    })
  }, [content])


  useEffect(() => {
    if (!containerRef.current) return
    const mermaidDivs = containerRef.current.querySelectorAll('code.language-mermaid')
    if (mermaidDivs.length === 0) return

    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
      mermaidDivs.forEach((el) => {
        const parent = el.parentElement
        if (!parent) return
        const code = el.textContent
        const div = document.createElement('div')
        div.className = 'mermaid'
        div.textContent = code
        parent.replaceWith(div)
      })
      mermaid.run({ nodes: containerRef.current.querySelectorAll('.mermaid') })
    })
  }, [html])

  return (
    <div id="preview-pane" className={styles.pane}>
      <div className={styles.scroll}>
        <div className={styles.page}>
          <div
            ref={containerRef}
            id="preview-content"
            className={styles.document}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}
