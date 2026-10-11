import { flushActiveEditor } from './editorRef'
import { waitForPreview } from './previewRef'
import { useFileStore } from '../store/useFileStore'

export const PAPER_SIZES = {
  A4: { width: '210mm', height: '297mm', label: 'A4' },
  Letter: { width: '8.5in', height: '11in', label: 'Letter' },
  Legal: { width: '8.5in', height: '14in', label: 'Legal' },
}

export function buildPrintStyle({ paperSize = 'A4', orientation = 'portrait' } = {}) {
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4
  const size = orientation === 'landscape' ? `${paper.height} ${paper.width}` : `${paper.width} ${paper.height}`
  // Document margins are already applied to every measured page, including continuations.
  return `@media print { @page { size: ${size}; margin: 0; } }`
}

export async function triggerPrint() {
  const fileId = useFileStore.getState().activeFileId
  if (!fileId) throw new Error('Create or open a document before exporting.')
  await flushActiveEditor()
  await waitForPreview()
  const file = useFileStore.getState().getActiveFile()
  if (file?.id !== fileId) throw new Error('The active document changed. Export it again.')
  const source = document.getElementById('markeon-all-pages')
  if (!source || source.dataset.previewStatus !== 'ready') throw new Error('Wait for the document preview to finish before exporting.')

  document.getElementById('markeon-print-override')?.remove()
  const style = document.createElement('style')
  style.id = 'markeon-print-override'
  style.textContent = buildPrintStyle(file.layoutSettings)
  document.head.append(style)
  let root = document.getElementById('markeon-print-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'markeon-print-root'
    document.body.append(root)
  }
  root.replaceChildren(...[...source.children].map((page) => page.cloneNode(true)))
  root.querySelectorAll('[data-print-exclude]').forEach((element) => element.remove())
  root.querySelectorAll('[data-media-type]').forEach((element) => {
    delete element.dataset.selected
    element.removeAttribute('tabindex')
    element.removeAttribute('aria-pressed')
    element.setAttribute('role', 'figure')
  })
  root.querySelectorAll('[data-view-transform]').forEach((element) => {
    element.style.transform = ''
    delete element.dataset.viewTransform
  })
  await Promise.all([...root.querySelectorAll('img')].map((image) => image.decode().catch(() => {})))
  await document.fonts.ready
  const originalTitle = document.title
  document.title = (file.name || 'document').replace(/\.md$/i, '')
  function cleanup() {
    root.replaceChildren()
    document.title = originalTitle
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup, { once: true })
  try {
    window.print()
  } catch (error) {
    cleanup()
    throw error
  }
}
