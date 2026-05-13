export const PAPER_SIZES = {
  A4: { width: '210mm', height: '297mm', label: 'A4' },
  Letter: { width: '8.5in', height: '11in', label: 'Letter' },
  Legal: { width: '8.5in', height: '14in', label: 'Legal' },
}

export function buildPrintStyle(layoutSettings = {}) {
  const {
    paperSize = 'A4',
    orientation = 'portrait',
    margins = {},
    watermark = '',
  } = layoutSettings

  const size = PAPER_SIZES[paperSize] || PAPER_SIZES.A4
  const sizeValue = orientation === 'landscape'
    ? `${size.height} ${size.width}`
    : `${size.width} ${size.height}`

  const marginStr = [
    margins.top ?? '20mm',
    margins.right ?? '20mm',
    margins.bottom ?? '20mm',
    margins.left ?? '20mm',
  ].join(' ')

  const watermarkCSS = watermark
    ? `
    #markeon-print-root::after {
      content: '${watermark}';
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 72pt;
      color: rgba(0,0,0,0.07);
      pointer-events: none;
      white-space: nowrap;
      z-index: 9999;
    }`
    : ''

  return `
    @media print {
      @page {
        size: ${sizeValue};
        margin: ${marginStr};
      }
      ${watermarkCSS}
    }
  `
}

export function triggerPrint(styleOverrides, filename) {
  const existing = document.getElementById('markeon-print-override')
  if (existing) existing.remove()

  if (styleOverrides) {
    const style = document.createElement('style')
    style.id = 'markeon-print-override'
    style.innerHTML = styleOverrides
    document.head.appendChild(style)
  }

  const sourceEl = document.getElementById('markeon-all-pages')
  if (!sourceEl) { window.print(); return }

  let printRoot = document.getElementById('markeon-print-root')
  if (!printRoot) {
    printRoot = document.createElement('div')
    printRoot.id = 'markeon-print-root'
    document.body.appendChild(printRoot)
  }

  printRoot.innerHTML = sourceEl.innerHTML

  const originalTitle = document.title
  if (filename) {
    document.title = filename.replace(/\.md$/i, '')
  }

  window.print()

  setTimeout(() => {
    printRoot.innerHTML = ''
    document.title = originalTitle
  }, 1000)
}

