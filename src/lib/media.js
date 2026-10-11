import YAML from 'yaml'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'

export const DEFAULT_MERMAID_SETTINGS = {
  direction: 'TD',
  nodeSpacing: 50,
  rankSpacing: 50,
  curve: 'basis',
  width: 100,
  align: 'center',
  theme: 'auto',
  color: '',
  fontFamily: '',
  fontSize: 16,
}

const DIRECTIONS = new Set(['TB', 'TD', 'BT', 'RL', 'LR'])
const CURVES = new Set(['basis', 'linear', 'cardinal', 'catmullRom', 'monotoneX', 'step', 'stepBefore', 'stepAfter'])
const THEMES = new Set(['auto', 'default', 'dark', 'forest', 'neutral', 'base'])
const PALETTE_FIELDS = ['primaryColor', 'mainBkg', 'primaryTextColor', 'actorBkg', 'actorTextColor']

function numberInRange(value, fallback, min = 0, max = Infinity) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback
}

export function normalizeMermaidSettings(settings = {}) {
  const direction = String(settings.direction || DEFAULT_MERMAID_SETTINGS.direction).toUpperCase()
  const curve = String(settings.curve || DEFAULT_MERMAID_SETTINGS.curve)
  return {
    direction: DIRECTIONS.has(direction) ? direction : DEFAULT_MERMAID_SETTINGS.direction,
    nodeSpacing: numberInRange(settings.nodeSpacing, DEFAULT_MERMAID_SETTINGS.nodeSpacing),
    rankSpacing: numberInRange(settings.rankSpacing, DEFAULT_MERMAID_SETTINGS.rankSpacing),
    curve: CURVES.has(curve) ? curve : DEFAULT_MERMAID_SETTINGS.curve,
    width: numberInRange(settings.width, DEFAULT_MERMAID_SETTINGS.width, 10, 100),
    align: ['left', 'center', 'right'].includes(settings.align) ? settings.align : DEFAULT_MERMAID_SETTINGS.align,
    theme: THEMES.has(settings.theme) ? settings.theme : DEFAULT_MERMAID_SETTINGS.theme,
    color: /^#[a-f\d]{6}$/i.test(settings.color || '') ? settings.color : '',
    fontFamily: typeof settings.fontFamily === 'string' ? settings.fontFamily.trim() : '',
    fontSize: numberInRange(Number.parseFloat(settings.fontSize), DEFAULT_MERMAID_SETTINGS.fontSize, 8, 48),
  }
}

export function mermaidPalette(color) {
  if (!color) return {}
  const rgb = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(color.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
  const text = luminance > 0.179 ? '#000000' : '#ffffff'
  return { primaryColor: color, mainBkg: color, primaryTextColor: text, actorBkg: color, actorTextColor: text }
}


const MERMAID_FRONTMATTER = /^(?:[ \t]*\r?\n)*([ \t]*)---[ \t]*\r?\n([\s\S]*?)\r?\n\1---[ \t]*(?:\r?\n|$)/

function mermaidBody(source = '') {
  const opening = /^[ \t]*(`{3,}|~{3,})[ \t]*mermaid(?:[ \t]+[^\r\n]*)?(?:\r?\n|$)/i.exec(source)
  if (!opening) return source
  const closing = new RegExp(`(?:\\r?\\n|^)[ \\t]*${opening[1][0]}{${opening[1].length},}[ \\t]*(?:\\r?\\n)?$`)
  return source.slice(opening[0].length).replace(closing, '')
}

export function parseMermaidSource(source = '') {
  const body = mermaidBody(source)
  const match = MERMAID_FRONTMATTER.exec(body)
  let frontmatter = {}
  let frontmatterError = null
  let bodyWithoutFrontmatter = body
  if (match) {
    try {
      const value = YAML.parse(match[2])
      if (value != null && (typeof value !== 'object' || Array.isArray(value))) throw new Error('Expected a YAML mapping.')
      frontmatter = value || {}
    } catch (error) { frontmatterError = error }
    bodyWithoutFrontmatter = body.slice(match[0].length)
  }
  let initConfig = {}
  const visible = bodyWithoutFrontmatter
    .replace(/%%\{([\s\S]*?)\}%%/g, (directive, value) => {
      try {
        const parsed = YAML.parse(value)
        initConfig = { ...initConfig, ...(parsed?.init || parsed?.initialize || {}) }
      } catch { /* Mermaid reports invalid directives when rendering the original source. */ }
      return directive.replace(/[^\r\n]/g, ' ')
    })
    .replace(/%%[^\r\n]*/g, (comment) => ' '.repeat(comment.length))
  const declaration = /^(?:[ \t]*\r?\n)*[ \t]*(?:graph|flowchart)[ \t]+(TB|TD|BT|RL|LR)\b/i.exec(visible)
  const flowchart = Boolean(declaration)
  const config = frontmatter.config && typeof frontmatter.config === 'object' ? frontmatter.config : {}
  const flowConfig = config.flowchart && typeof config.flowchart === 'object' ? config.flowchart : {}
  const variables = { ...config.themeVariables, ...initConfig.themeVariables }
  const settings = normalizeMermaidSettings({
    theme: initConfig.theme ?? config.theme,
    color: variables.primaryColor,
    fontFamily: variables.fontFamily ?? initConfig.fontFamily ?? config.fontFamily,
    fontSize: variables.fontSize ?? initConfig.fontSize ?? config.fontSize,
    ...flowConfig, ...initConfig.flowchart, ...frontmatter.markeon,
    ...(declaration ? { direction: declaration[1] } : {}),
  })
  const directionOffset = declaration ? declaration[0].length - declaration[1].length : null
  return { frontmatter, frontmatterError, body, bodyWithoutFrontmatter, settings, flowchart, directionOffset }
}


function updateImageUrl(url, patch) {
  const hashIndex = url.indexOf('#')
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const current = hashIndex === -1 ? {} : Object.fromEntries(new URLSearchParams(url.slice(hashIndex + 1)))
  const next = { ...current }
  if (patch.width != null) next.w = String(numberInRange(patch.width, 100, 10, 100))
  if (patch.align && ['left', 'center', 'right'].includes(patch.align)) next.align = patch.align
  const suffix = new URLSearchParams(next).toString()
  return suffix ? `${base}#${suffix}` : base
}

function replaceInlineImage(source, patch) {
  const open = source.indexOf('](')
  if (!source.startsWith('![') || open < 3 || !source.endsWith(')')) return null
  const alt = source.slice(2, open)
  const inner = source.slice(open + 2, -1)
  let destination = ''
  let remainder = ''
  if (inner.startsWith('<')) {
    const close = inner.indexOf('>')
    if (close < 0) return null
    destination = inner.slice(1, close)
    remainder = inner.slice(close + 1)
  } else {
    let depth = 0
    let split = inner.length
    for (let i = 0; i < inner.length; i += 1) {
      const char = inner[i]
      if (char === '(') depth += 1
      else if (char === ')' && depth > 0) depth -= 1
      else if (/\s/.test(char) && depth === 0) { split = i; break }
    }
    destination = inner.slice(0, split)
    remainder = inner.slice(split)
  }
  if (!destination) return null
  return `![${alt}](${updateImageUrl(destination, patch)}${remainder})`
}

function referenceId(source) {
  const match = source.match(/^!\[[^\]]*\]\[(?<id>[^\]]*)\]$/)
  return match ? (match.groups.id || source.match(/^!\[([^\]]*)\]/)?.[1] || '') : null
}

function findReferenceDefinition(content, id) {
  if (!id) return null
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^[ \\t]*\\[${escaped}\\]:[ \\t]*(<[^>]*>|\\S+)(?:[ \\t]+(.*))?$`, 'i')
  const lines = content.split(/(\r?\n)/)
  let inFence = false
  for (let i = 0; i < lines.length; i += 2) {
    const line = lines[i]
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    const match = pattern.exec(line)
    if (match) return { destination: match[1].startsWith('<') ? match[1].slice(1, -1) : match[1], title: match[2] ? ` ${match[2]}` : '' }
  }
  return null
}

function formatMermaidBody(source, settings, patch) {
  const parsed = parseMermaidSource(source)
  if (parsed.frontmatterError) throw new Error(`Invalid Mermaid frontmatter: ${parsed.frontmatterError.message}`)
  const next = { ...parsed.frontmatter }
  let body = parsed.bodyWithoutFrontmatter
  if (parsed.flowchart && Object.hasOwn(patch, 'direction')) {
    const from = parsed.directionOffset
    body = body.slice(0, from) + settings.direction + body.slice(from + parsed.settings.direction.length)
  }
  const flowFields = parsed.flowchart ? ['nodeSpacing', 'rankSpacing', 'curve'].filter((field) => Object.hasOwn(patch, field)) : []
  const appearanceFields = ['theme', 'color', 'fontFamily', 'fontSize'].filter((field) => Object.hasOwn(patch, field))
  function updateConfig(current = {}) {
    const config = { ...current }
    if (flowFields.length) {
      config.flowchart = { ...config.flowchart }
      for (const field of flowFields) config.flowchart[field] = settings[field]
    }
    if (appearanceFields.length) {
      const variables = { ...config.themeVariables }
      if (appearanceFields.includes('theme')) {
        if (settings.theme === 'auto') delete config.theme
        else config.theme = settings.theme
      }
      if (appearanceFields.includes('color')) {
        for (const field of PALETTE_FIELDS) delete variables[field]
        Object.assign(variables, mermaidPalette(settings.color))
        if (settings.color) config.theme = 'base'
      }
      if (appearanceFields.includes('fontFamily')) {
        if (settings.fontFamily) config.fontFamily = variables.fontFamily = settings.fontFamily
        else { delete config.fontFamily; delete variables.fontFamily }
      }
      if (appearanceFields.includes('fontSize')) {
        config.fontSize = settings.fontSize
        variables.fontSize = `${settings.fontSize}px`
      }
      if (Object.keys(variables).length) config.themeVariables = variables
      else delete config.themeVariables
    }
    return config
  }
  let updatedInit = false
  if (flowFields.length || appearanceFields.length) {
    body = body.replace(/%%\{([\s\S]*?)\}%%/g, (directive, value) => {
      if (!/^\s*(?:init|initialize)\s*:/.test(value)) return directive
      try {
        const parsedDirective = YAML.parse(value)
        const name = Object.hasOwn(parsedDirective, 'init') ? 'init' : 'initialize'
        const config = parsedDirective[name]
        if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Expected an init configuration object.')
        updatedInit = true
        return `%%{${name}: ${JSON.stringify(updateConfig(config), null, 2)}}%%`
      } catch (error) { throw new Error(`Invalid Mermaid init directive: ${error.message}`) }
    })
    if (appearanceFields.length || !updatedInit || next.config?.flowchart) next.config = updateConfig(next.config)
  }
  next.markeon = { ...next.markeon, width: settings.width, align: settings.align }
  for (const field of appearanceFields) next.markeon[field] = settings[field]
  return `---\n${YAML.stringify(next).trimEnd()}\n---\n${body}`
}

function serializeMermaidBlock(content, from, to, node, body) {
  const block = content.slice(from, to)
  const lines = block.split(/\r\n|\n|\r/)
  const header = lines.shift()
  const marker = /(`{3,}|~{3,})/.exec(header)
  if (!marker) throw new Error('Only fenced Mermaid blocks can be formatted.')
  const closing = /^((?:[ \t]*>[ \t]*)*[ \t]*)(`{3,}|~{3,})[ \t]*$/.exec(lines.at(-1) || '')
  const closed = closing && closing[2][0] === marker[1][0] && closing[2].length >= marker[1].length
  const lineStart = content.lastIndexOf('\n', from - 1) + 1
  const headerPrefix = content.slice(lineStart, from) + header.slice(0, marker.index)
  const firstValue = node.value.split(/\r\n|\n|\r/)[0]
  const bodyPrefix = lines[0]?.endsWith(firstValue) ? lines[0].slice(0, lines[0].length - firstValue.length) : null
  const prefix = closed ? closing[1] : bodyPrefix ?? headerPrefix.replace(/[^\s>]/g, ' ')
  const eol = block.includes('\r\n') ? '\r\n' : '\n'
  return header + eol + body.split(/\r\n|\n|\r/).map((line) => prefix + line).join(eol) + (closed ? eol + lines.at(-1) : '')
}

export function updateMermaidSource(content, selection, patch = {}) {
  if (!selection || selection.type !== 'mermaid') return { content, selection }
  const from = Math.max(0, Number(selection.from) || 0)
  const to = Math.max(from, Number(selection.to) || from)
  let node
  visit(unified().use(remarkParse).parse(content), 'code', (candidate) => {
    if (candidate.lang?.toLowerCase() === 'mermaid' && candidate.position.start.offset === from && candidate.position.end.offset === to) node = candidate
  })
  if (!node) throw new Error('The selected diagram changed. Select it again before formatting.')
  const parsed = parseMermaidSource(node.value)
  const settings = { ...normalizeMermaidSettings({ ...parsed.settings, ...patch }), flowchart: parsed.flowchart }
  const body = formatMermaidBody(node.value, settings, patch)
  const nextBlock = serializeMermaidBlock(content, from, to, node, body)
  return {
    content: content.slice(0, from) + nextBlock + content.slice(to),
    selection: { ...selection, to: from + nextBlock.length, settings },
  }
}

export function updateImageSource(content, selection, patch = {}) {
  if (!selection || selection.type !== 'image' || selection.settings?.rawHtml) return { content, selection }
  const from = Math.max(0, Number(selection.from) || 0)
  const to = Math.max(from, Number(selection.to) || from)
  const source = content.slice(from, to)
  const replacement = replaceInlineImage(source, patch)
  if (replacement) {
    return {
      content: content.slice(0, from) + replacement + content.slice(to),
      selection: { ...selection, to: from + replacement.length, settings: { ...selection.settings, ...patch } },
    }
  }
  const id = referenceId(source)
  if (id) {
    const definition = findReferenceDefinition(content, id)
    const occurrence = source.match(/^!\[([^\]]*)\]/)
    if (definition && occurrence) {
      const destination = updateImageUrl(definition.destination, patch)
      const replacement = `![${occurrence[1]}](${destination}${definition.title})`
      return {
        content: content.slice(0, from) + replacement + content.slice(to),
        selection: { ...selection, to: from + replacement.length, settings: { ...selection.settings, ...patch } },
      }
    }
  }
  return { content, selection }
}

