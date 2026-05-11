export const BUILT_IN_THEMES = [
  {
    id: 'github-docs',
    name: 'GitHub Docs',
    tags: ['minimal', 'sans-serif', 'clean'],
    tokens: {
      '--font-heading': "'Inter', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--font-mono': "'JetBrains Mono', monospace",
      '--color-text': '#1f2328',
      '--color-heading': '#1f2328',
      '--color-accent': '#0969da',
      '--color-code-bg': '#f6f8fa',
      '--color-border': '#d1d9e0',
      '--base-size': '16px',
      '--line-height': '1.6',
      '--type-scale': '1.25',
    },
  },
  {
    id: 'notion-light',
    name: 'Notion Light',
    tags: ['minimal', 'sans-serif', 'soft'],
    tokens: {
      '--font-heading': "'Inter', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--font-mono': "'JetBrains Mono', monospace",
      '--color-text': '#37352f',
      '--color-heading': '#37352f',
      '--color-accent': '#eb5757',
      '--color-code-bg': '#f7f6f3',
      '--color-border': '#e9e9e7',
      '--base-size': '16px',
      '--line-height': '1.7',
      '--type-scale': '1.25',
    },
  },
  {
    id: 'academic-serif',
    name: 'Academic Serif',
    tags: ['academic', 'serif', 'print', 'formal'],
    tokens: {
      '--font-heading': "'Playfair Display', serif",
      '--font-body': "'Source Serif 4', serif",
      '--font-mono': "'JetBrains Mono', monospace",
      '--color-text': '#1a1a1a',
      '--color-heading': '#1a1a1a',
      '--color-accent': '#8b3a3a',
      '--color-code-bg': '#f5f5f0',
      '--color-border': '#d0cdc8',
      '--base-size': '12pt',
      '--line-height': '1.8',
      '--type-scale': '1.333',
    },
  },
  {
    id: 'dark-tech',
    name: 'Dark Tech',
    tags: ['dark', 'sans-serif', 'dev', 'study'],
    tokens: {
      '--font-heading': "'Bricolage Grotesque', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--font-mono': "'JetBrains Mono', monospace",
      '--color-text': '#e2e8f0',
      '--color-heading': '#e8b84b',
      '--color-accent': '#e8b84b',
      '--color-code-bg': '#0d1117',
      '--color-border': '#30363d',
      '--base-size': '14px',
      '--line-height': '1.7',
      '--type-scale': '1.25',
    },
  },
  {
    id: 'resume-pro',
    name: 'Resume Pro',
    tags: ['compact', 'sans-serif', 'print', 'professional'],
    tokens: {
      '--font-heading': "'Inter', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--font-mono': "'JetBrains Mono', monospace",
      '--color-text': '#1a1a2e',
      '--color-heading': '#16213e',
      '--color-accent': '#0f3460',
      '--color-code-bg': '#f0f0f0',
      '--color-border': '#ccc',
      '--base-size': '10.5pt',
      '--line-height': '1.4',
      '--type-scale': '1.2',
    },
  },
  {
    id: 'minimal-ink',
    name: 'Minimal Ink',
    tags: ['minimal', 'serif', 'print', 'ink-saving'],
    tokens: {
      '--font-heading': "'Fraunces', serif",
      '--font-body': "'Lora', serif",
      '--font-mono': "'JetBrains Mono', monospace",
      '--color-text': '#111',
      '--color-heading': '#000',
      '--color-accent': '#333',
      '--color-code-bg': '#f9f9f9',
      '--color-border': '#e0e0e0',
      '--base-size': '11pt',
      '--line-height': '1.65',
      '--type-scale': '1.2',
    },
  },
  {
    id: 'warm-journal',
    name: 'Warm Journal',
    tags: ['warm', 'serif', 'personal'],
    tokens: {
      '--font-heading': "'Playfair Display', serif",
      '--font-body': "'Lora', serif",
      '--font-mono': "'JetBrains Mono', monospace",
      '--color-text': '#3d2b1f',
      '--color-heading': '#2c1a0e',
      '--color-accent': '#a0522d',
      '--color-code-bg': '#fdf6ec',
      '--color-border': '#e8d8c4',
      '--base-size': '13pt',
      '--line-height': '1.8',
      '--type-scale': '1.25',
    },
  },
  {
    id: 'legal-mono',
    name: 'Legal Mono',
    tags: ['formal', 'serif', 'print', 'justified'],
    tokens: {
      '--font-heading': "'Merriweather', serif",
      '--font-body': "'Merriweather', serif",
      '--font-mono': "'JetBrains Mono', monospace",
      '--color-text': '#1a1a1a',
      '--color-heading': '#000',
      '--color-accent': '#000080',
      '--color-code-bg': '#f4f4f4',
      '--color-border': '#ccc',
      '--base-size': '12pt',
      '--line-height': '2',
      '--type-scale': '1.2',
    },
  },
]

export function getThemeById(id) {
  return BUILT_IN_THEMES.find((t) => t.id === id)
}

export function applyThemeTokens(tokens) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value)
  }
}

export function clearThemeTokens(tokens) {
  const root = document.documentElement
  for (const key of Object.keys(tokens)) {
    root.style.removeProperty(key)
  }
}
