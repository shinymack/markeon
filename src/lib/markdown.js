import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import { visit } from 'unist-util-visit'
import { getHighlighter } from './shiki'
import { getAttachment } from './db'

let _processor = null

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function rehypeMarkeonImages() {
  return async function transformer(tree) {
    const tasks = []
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'img' || !node.properties?.src) return
      const src = String(node.properties.src)
      if (!src.startsWith('markeon://img/')) return
      const id = src.slice('markeon://img/'.length)
      tasks.push(
        getAttachment(id).then((att) => {
          if (!att?.data) return
          node.properties.src = `data:${att.mimeType};base64,${arrayBufferToBase64(att.data)}`
        })
      )
    })
    await Promise.all(tasks)
  }
}

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
    .use(rehypeSlug)
    .use(rehypeMarkeonImages)
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

export function extractHeadingsFromPreview(root) {
  if (!root) return []
  const els = root.querySelectorAll('.markeon-document h1, .markeon-document h2, .markeon-document h3, .markeon-document h4, .markeon-document h5, .markeon-document h6')
  return [...els]
    .filter((el) => el.id)
    .map((el) => ({
      id: el.id,
      level: parseInt(el.tagName[1], 10),
      text: el.textContent?.trim() || '',
    }))
}
