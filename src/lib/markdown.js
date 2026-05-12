import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import { getHighlighter } from './shiki'

let _processor = null

async function getProcessor() {
  if (_processor) return _processor
  const highlighter = await getHighlighter()
  _processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeShikiFromHighlighter, highlighter, {
      theme: 'one-dark-pro',
      ignoreMissing: true,
    })
    .use(rehypeStringify)
  return _processor
}

export async function renderMarkdown(content) {
  const processor = await getProcessor()
  const result = await processor.process(content)
  return String(result)
}

export function insertPageBreak(content, position) {
  const before = content.slice(0, position)
  const after = content.slice(position)
  return before + '\n<!-- pagebreak -->\n' + after
}

export function processPageBreaks(html) {
  return html.replace(
    /<!--\s*pagebreak\s*-->/gi,
    '<div class="page-break" aria-hidden="true"></div>'
  )
}
