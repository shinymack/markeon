import { describe, expect, test } from 'bun:test'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import YAML from 'yaml'
import { parseMermaidSource, updateMermaidSource } from './media'

function codeNodes(content) {
  const nodes = []
  visit(unified().use(remarkParse).parse(content), 'code', (node) => { nodes.push(node) })
  return nodes
}

function selection(content, index = 0) {
  const node = codeNodes(content)[index]
  return { type: 'mermaid', from: node.position.start.offset, to: node.position.end.offset, settings: parseMermaidSource(node.value).settings }
}

function metadata(value) {
  return YAML.parse(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(value)[1])
}

describe('selected Mermaid source edits', () => {
  test('resizes a quoted tilde fence without changing its layout or neighboring diagram', () => {
    const content = '# Before\n\n> ~~~mermaid\n> flowchart LR\n> A --> B\n> ~~~\n\n# After\n\n```mermaid\ngraph TD\nX --> Y\n```'
    const selected = selection(content)
    const result = updateMermaidSource(content, selected, { width: 60, align: 'right' })
    const nodes = codeNodes(result.content)
    expect(nodes).toHaveLength(2)
    expect(metadata(nodes[0].value).markeon).toEqual({ width: 60, align: 'right' })
    expect(metadata(nodes[0].value).config).toBeUndefined()
    expect(nodes[0].value).toEndWith('flowchart LR\nA --> B')
    expect(result.content.slice(0, selected.from)).toBe(content.slice(0, selected.from))
    expect(result.content.slice(result.selection.to)).toBe(content.slice(selected.to))
    expect(nodes[1].value).toBe('graph TD\nX --> Y')
  })

  test('changes the declaration rather than YAML graph text inside indented Windows-source fences', () => {
    const content = '  ```mermaid\r\n  ---\r\n  title: |\r\n    graph LR\r\n  config:\r\n    theme: neutral\r\n  ---\r\n  flowchart LR\r\n    A --> B\r\n  ```'
    const result = updateMermaidSource(content, selection(content), { direction: 'TB' })
    const node = codeNodes(result.content)[0]
    expect(metadata(node.value).title).toBe('graph LR\n')
    expect(metadata(node.value).config.theme).toBe('neutral')
    expect(node.value.replace(/\r\n?/g, '\n')).toEndWith('flowchart TB\n  A --> B')
  })

  test('recognizes multiline init directives and preserves them during layout edits', () => {
    const init = '%%{init: {\n  "flowchart": {"nodeSpacing": 25, "rankSpacing": 30}\n}}%%'
    const content = '```mermaid\n' + init + '\nflowchart RL\nA --> B\n```'
    const parsed = parseMermaidSource(codeNodes(content)[0].value)
    expect(parsed.flowchart).toBe(true)
    expect(parsed.settings).toMatchObject({ direction: 'RL', nodeSpacing: 25, rankSpacing: 30 })
    const resized = updateMermaidSource(content, selection(content), { width: 60 })
    expect(codeNodes(resized.content)[0].value).toContain(init)
    const result = updateMermaidSource(resized.content, selection(resized.content), { rankSpacing: 110 })
    const value = codeNodes(result.content)[0].value
    const directive = YAML.parse(/%%\{([\s\S]*?)\}%%/.exec(value)[1])
    expect(directive.init.flowchart).toEqual({ nodeSpacing: 25, rankSpacing: 110 })
    expect(metadata(value).config).toBeUndefined()
    expect(value).toEndWith('flowchart RL\nA --> B')
  })

  test('resizes sequence diagrams without introducing a graph declaration or flowchart config', () => {
    const content = '```mermaid\n---\nconfig:\n  sequence:\n    actorMargin: 40\n---\nsequenceDiagram\nAlice->>Bob: Hello\n```'
    const result = updateMermaidSource(content, selection(content), { width: 55, align: 'left' })
    const value = codeNodes(result.content)[0].value
    expect(metadata(value).config).toEqual({ sequence: { actorMargin: 40 } })
    expect(metadata(value).markeon).toEqual({ width: 55, align: 'left' })
    expect(value).toEndWith('sequenceDiagram\nAlice->>Bob: Hello')
    expect(result.selection.settings.flowchart).toBe(false)
  })

  test('rejects malformed frontmatter instead of replacing user configuration', () => {
    const content = '```mermaid\n---\nconfig: [broken\n---\ngraph TD\nA --> B\n```'
    expect(() => updateMermaidSource(content, selection(content), { width: 60 })).toThrow(/Invalid Mermaid frontmatter:/)
  })
})
