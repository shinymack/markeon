import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeKatex)
  .use(rehypeStringify)

export async function renderMarkdown(markdown) {
  const result = await processor.process(markdown)
  return String(result)
}

// Insert page break markers
export function insertPageBreak(content, position) {
  const before = content.slice(0, position)
  const after = content.slice(position)
  return before + '\n<!-- pagebreak -->\n' + after
}

// Convert <!-- pagebreak --> to a div with a class for CSS
export function processPageBreaks(html) {
  return html.replace(
    /<!--\s*pagebreak\s*-->/gi,
    '<div class="page-break" aria-hidden="true"></div>'
  )
}
