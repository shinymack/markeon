import { createHighlighter } from 'shiki'

let _promise = null

export function getHighlighter() {
  if (!_promise) {
    _promise = createHighlighter({
      themes: ['one-dark-pro'],
      langs: [
        'javascript', 'typescript', 'jsx', 'tsx', 'python',
        'bash', 'sh', 'json', 'html', 'css', 'markdown',
        'yaml', 'toml', 'rust', 'go', 'java', 'c', 'cpp',
        'sql', 'dockerfile', 'text', 'plaintext',
      ],
    })
  }
  return _promise
}
