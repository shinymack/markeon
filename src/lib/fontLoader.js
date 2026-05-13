// Dynamically injects Google Fonts <link> tags on demand.
// Only loads each family once per page session.

const loaded = new Set()

const GOOGLE_FONT_URLS = {
  'Crimson Text': 'https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap',
  'Nunito': 'https://fonts.googleapis.com/css2?family=Nunito:wght@300..700&display=swap',
  'DM Sans': 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300..700&display=swap',
  'Fira Code': 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap',
  'IBM Plex Mono': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap',
}

export function ensureFont(family) {
  if (loaded.has(family)) return
  const url = GOOGLE_FONT_URLS[family]
  if (!url) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)
  loaded.add(family)
}
