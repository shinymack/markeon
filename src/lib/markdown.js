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

const THEMATIC_LINE = /^[-=*_]{3,}$/

function paragraphPlainText(node) {
  if (!node.children?.length) return ''
  return node.children
    .filter((c) => c.type === 'text')
    .map((c) => c.value)
    .join('')
    .trim()
}

/** Lines of only =====, ---, etc. become <hr> instead of overflowing <p> text. */
function rehypeThematicLineParagraphs() {
  return function transformer(tree) {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'p' || parent == null || index == null) return
      const text = paragraphPlainText(node)
      if (!THEMATIC_LINE.test(text)) return
      parent.children[index] = {
        type: 'element',
        tagName: 'hr',
        properties: {},
        children: [],
      }
    })
  }
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
    .use(rehypeThematicLineParagraphs)
    .use(rehypeMarkeonImages)
    .use(rehypeShikiFromHighlighter, highlighter, {
      theme: 'one-dark-pro',
      ignoreMissing: true,
    })
    .use(rehypeStringify)
  return _processor
}

const THEMATIC_LINE_RE = /^[-=*_]{3,}$/

/**
 * Isolate divider lines so long ===== rows become <hr>, not overflow or merged setext.
 */
export function normalizeThematicLines(content) {
  const lines = content.split('\n')
  const out = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!THEMATIC_LINE_RE.test(trimmed)) {
      out.push(lines[i])
      continue
    }

    const prev = lines[i - 1]?.trim() ?? ''
    const next = lines[i + 1]?.trim() ?? ''
    const isSetextUnderline =
      prev &&
      !next &&
      (trimmed.length < 10) &&
      (/^=+$/.test(trimmed) || /^-+$/.test(trimmed))

    if (isSetextUnderline) {
      out.push(lines[i])
      continue
    }

    if (out.length && out[out.length - 1] !== '') out.push('')
    out.push('---')
    if (next) out.push('')
  }

  return out.join('\n')
}

export async function renderMarkdown(content) {
  const processor = await getProcessor()
  const normalized = normalizeThematicLines(content)
  const result = await processor.process(normalized)
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
