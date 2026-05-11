export const PAPER_SIZES = {
  A4: { width: '210mm', height: '297mm', label: 'A4' },
  Letter: { width: '8.5in', height: '11in', label: 'Letter' },
  Legal: { width: '8.5in', height: '14in', label: 'Legal' },
}

export function buildPrintStyle({ pageSize, orientation, margins, watermark }) {
  const size = PAPER_SIZES[pageSize] || PAPER_SIZES.A4
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
    #preview-pane::after {
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
    @page {
      size: ${sizeValue};
      margin: ${marginStr};
    }
    ${watermarkCSS}
  `
}

export function triggerPrint(styleOverrides) {
  const existing = document.getElementById('markeon-print-override')
  if (existing) existing.remove()

  if (styleOverrides) {
    const style = document.createElement('style')
    style.id = 'markeon-print-override'
    style.innerHTML = styleOverrides
    document.head.appendChild(style)
  }

  window.print()
}
