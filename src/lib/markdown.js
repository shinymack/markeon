import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import rehypeShikiFromHighlighter from '@shikijs/rehype/core'
import { visit } from 'unist-util-visit'
import { getHighlighter } from './shiki'
import { getAttachment } from './db'
import { parseMermaidSource } from './media'


function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function sourceOffsets(node) {
  const from = node.position?.start?.offset
  const to = node.position?.end?.offset
  return Number.isInteger(from) && Number.isInteger(to) ? { from, to } : null
}

function rehypePageBreaks() {
  return function transformer(tree) {
    visit(tree, 'comment', (node, index, parent) => {
      if (!parent || index == null || !/^\s*pagebreak\s*$/i.test(node.value || '')) return
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['page-break'], ariaHidden: 'true' },
        children: [],
      }
    })
  }
}

function remarkMarkeonSource() {
  return function transformer(tree) {
    visit(tree, 'html', (node) => {
      if (!/<img\b/i.test(node.value || '')) return
      node.value = node.value.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
        if (/\bdata-markeon-raw-image\s*=/.test(attrs)) return full
        return `<img${attrs} data-markeon-raw-image="true" data-formatting-hint="Edit the HTML image source to format">`
      })
    })
  }
}

function copyMediaSchema() {
  const attrs = { ...defaultSchema.attributes }
  attrs.img = [...(attrs.img || []), 'dataMarkeonRawImage', 'dataFormattingHint']
  attrs.div = [...(attrs.div || []), ['className', 'page-break'], 'ariaHidden']
  attrs.code = [...(attrs.code || []), 'className']
  return {
    ...defaultSchema,
    attributes: attrs,
    protocols: {
      ...defaultSchema.protocols,
      src: [...(defaultSchema.protocols?.src || []), 'data', 'markeon'],
    },
  }
}

function property(node, name) {
  return node.properties?.[name] ?? node.properties?.[name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]
}
function textContent(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value || ''
  return (node.children || []).map(textContent).join('')
}

function rehypeMarkeonMedia(settings) {
  return async function transformer(tree) {
    const tasks = []
    const replacements = []
    const standaloneFigures = []
    const mediaAttrs = (node, type, extra = {}) => {
      const offsets = sourceOffsets(node)
      return {
        'data-media-type': type,
        ...(offsets ? { 'data-source-from': offsets.from, 'data-source-to': offsets.to } : {}),
        ...extra,
      }
    }

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName === 'img' && property(node, 'src')) {
        const rawHtml = Boolean(property(node, 'data-markeon-raw-image'))
        const originalSrc = String(property(node, 'src'))
        let cleanSrc = originalSrc
        let align = 'center'
        let width = 100
        const hashIndex = originalSrc.indexOf('#')
        if (hashIndex >= 0) {
          cleanSrc = originalSrc.slice(0, hashIndex)
          const params = new URLSearchParams(originalSrc.slice(hashIndex + 1))
          if (['left', 'center', 'right'].includes(params.get('align'))) align = params.get('align')
          const requestedWidth = Number(params.get('w') || params.get('width'))
          if (Number.isFinite(requestedWidth)) width = Math.min(100, Math.max(10, Math.round(requestedWidth)))
        }
        if (cleanSrc.startsWith('markeon://img/')) {
          const id = cleanSrc.slice('markeon://img/'.length)
          tasks.push(getAttachment(id).then((attachment) => {
            if (attachment?.data) node.properties.src = `data:${attachment.mimeType};base64,${arrayBufferToBase64(attachment.data)}`
          }))
        } else {
          node.properties.src = cleanSrc
        }
        const offsets = mediaAttrs(node, 'image', {
          'data-width': width,
          'data-align': align,
          'data-media-settings': JSON.stringify({ width, align, ...(rawHtml ? { rawHtml: true } : {}) }),
        })
        Object.assign(node.properties, offsets)
        node.properties.style = `width: ${width}%; max-width: 100%; height: auto; border-radius: 4px; display: block;`
        if (rawHtml) {
          node.properties['data-formatting-hint'] = 'Edit the HTML image source to format'
          node.properties.title = node.properties.title || 'Raw HTML image: edit source to format'
        }

        if (parent?.tagName === 'p' && parent.children.length === 1 && typeof index === 'number') {
          const alt = property(node, 'alt')
          const children = [node]
          if (!rawHtml && alt && alt !== 'image' && alt !== 'img') children.push({ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: String(alt) }] })
          standaloneFigures.push({ parent, figure: {
            type: 'element',
            tagName: 'figure',
            properties: {
              className: ['media-image', 'markeon-image-wrapper', `align-${align}`],
              ...offsets,
              style: `display: flex; flex-direction: column; align-items: ${align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'}; width: 100%; margin: 1.5em 0; padding: 0; box-sizing: border-box;`,
            },
            children,
          } })
        }
      }

      if (node.tagName === 'pre') {
        const code = node.children?.find((child) => child.type === 'element' && child.tagName === 'code')
        const classes = property(code || {}, 'className') || []
        const isMermaid = Array.isArray(classes) ? classes.includes('language-mermaid') : String(classes).split(/\s+/).includes('language-mermaid')
        if (!isMermaid || !code || !parent) return
        const diagram = parseMermaidSource(textContent(code))
        const diagramSettings = { ...settings, ...diagram.settings }
        const offsets = mediaAttrs(node, 'mermaid', {
          'data-width': diagramSettings.width,
          'data-align': diagramSettings.align,
          'data-direction': diagramSettings.direction,
          'data-node-spacing': diagramSettings.nodeSpacing,
          'data-rank-spacing': diagramSettings.rankSpacing,
          'data-curve': diagramSettings.curve,
          'data-media-settings': JSON.stringify({ ...diagramSettings, flowchart: diagram.flowchart }),
        })
        const figure = {
          type: 'element',
          tagName: 'figure',
          properties: { className: ['media-mermaid', 'markeon-mermaid-wrapper'], ...offsets },
          children: [node],
        }
        replacements.push({ parent, index, figure })
      }
    })

    standaloneFigures.forEach(({ parent, figure }) => {
      visit(tree, 'element', (node, index, container) => {
        if (node === parent && container && index != null) container.children[index] = figure
      })
    })
    replacements.forEach(({ parent, index, figure }) => {
      if (typeof index === 'number') parent.children[index] = figure
    })
    await Promise.all(tasks)
  }
}


export async function renderMarkdown(content, { dark = false } = {}) {
  const highlighter = await getHighlighter()
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkMarkeonSource)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePageBreaks)
    .use(rehypeSanitize, copyMediaSchema())
    .use(rehypeKatex)
    .use(rehypeShikiFromHighlighter, highlighter, { theme: dark ? 'one-dark-pro' : 'github-light', ignoreMissing: true })
    .use(rehypeMarkeonMedia, {})
    .use(rehypeSlug)
    .use(rehypeStringify)
  const result = await processor.process(content)
  return String(result)
}

export function insertPageBreak(content, position) {
  return content.slice(0, position) + '\n<!-- pagebreak -->\n' + content.slice(position)
}

export function extractHeadingsFromPreview(root) {
  if (!root) return []
  const els = root.querySelectorAll('.markeon-document h1, .markeon-document h2, .markeon-document h3, .markeon-document h4, .markeon-document h5, .markeon-document h6')
  return [...els].filter((el) => el.id).map((el) => ({ id: el.id, level: parseInt(el.tagName[1], 10), text: el.textContent?.trim() || '' }))
}
