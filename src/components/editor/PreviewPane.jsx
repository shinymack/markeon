import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react'
import { useFileStore, DEFAULT_LAYOUT } from '../../store/useFileStore'
import { useEditorStore } from '../../store/useEditorStore'
import { renderMarkdown, processPageBreaks, extractHeadingsFromPreview } from '../../lib/markdown'
import { getThemeById, BUILT_IN_THEMES } from '../../lib/themes'
import ReadingZoomBar from './ReadingZoomBar'

// Paper dimensions in mm
const PAPER_MM = {
  A4:     { w: 210,   h: 297   },
  Letter: { w: 215.9, h: 279.4 },
  Legal:  { w: 215.9, h: 355.6 },
}

// 96dpi: 1 inch = 96px, 1mm = 96/25.4 px
const MM_TO_PX = 96 / 25.4

function getPaperPx(paperSize = 'A4', orientation = 'portrait') {
  const paper = PAPER_MM[paperSize] || PAPER_MM.A4
  const wMm = orientation === 'landscape' ? paper.h : paper.w
  const hMm = orientation === 'landscape' ? paper.w : paper.h
  return { w: Math.round(wMm * MM_TO_PX), h: Math.round(hMm * MM_TO_PX) }
}

function mmToPx(mmStr) {
  return Math.round((parseInt(mmStr) || 20) * MM_TO_PX)
}

function splitIntoPages(html) {
  const sep = '<div class="page-break" aria-hidden="true"></div>'
  return html.split(sep).map((s) => s.trim()).filter(Boolean)
}

function injectThemeStyle(theme, layoutSettings = {}, styleOverrides = {}) {
  let styleEl = document.getElementById('markeon-doc-theme')
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'markeon-doc-theme'
    document.head.appendChild(styleEl)
  }
  const pageBg = theme.tokens['--page-bg'] || '#ffffff'
  const docVars = Object.entries(theme.tokens)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')

  const overrides = []
  if (layoutSettings.fontSize) overrides.push(`  --base-size: ${layoutSettings.fontSize};`)
  if (layoutSettings.lineHeight) overrides.push(`  --line-height: ${layoutSettings.lineHeight};`)
  if (styleOverrides.bodyFont) overrides.push(`  --font-body: ${styleOverrides.bodyFont};`)
  if (styleOverrides.headingFont) overrides.push(`  --font-heading: ${styleOverrides.headingFont};`)
  if (styleOverrides.monoFont) overrides.push(`  --font-mono: ${styleOverrides.monoFont};`)
  if (styleOverrides.headingColor) overrides.push(`  --color-heading: ${styleOverrides.headingColor};`)
  if (styleOverrides.accentColor) overrides.push(`  --color-accent: ${styleOverrides.accentColor};`)
  if (styleOverrides.bodyColor) overrides.push(`  --color-text: ${styleOverrides.bodyColor};`)

  styleEl.textContent = `:root { --page-bg: ${pageBg}; }\n.markeon-document {\n${docVars}\n${overrides.join('\n')}\n}`
}

export default function PreviewPane({ onHeadingsChange, previewScrollRef }) {
  const { files, activeFileId } = useFileStore()
  const activeFile = files.find((f) => f.id === activeFileId)
  const content = activeFile?.content ?? ''
  const themeId = activeFile?.themeId || 'academic-serif'
  const activeTheme = getThemeById(themeId) || BUILT_IN_THEMES[0]
  const pageBg = activeTheme.tokens['--page-bg'] || '#ffffff'
  const layout = { ...DEFAULT_LAYOUT, ...activeFile?.layoutSettings, margins: { ...DEFAULT_LAYOUT.margins, ...activeFile?.layoutSettings?.margins } }
  const styleOverrides = { ...activeFile?.styleOverrides }

  // Dynamic paper dimensions
  const dims = getPaperPx(layout.paperSize, layout.orientation)
  const padTop    = mmToPx(layout.margins.top)
  const padRight  = mmToPx(layout.margins.right)
  const padBottom = mmToPx(layout.margins.bottom)
  const padLeft   = mmToPx(layout.margins.left)

  const readingMode = useEditorStore((s) => s.readingMode)
  const readingZoom = useEditorStore((s) => s.readingZoom)
  const setReadingZoom = useEditorStore((s) => s.setReadingZoom)
  const resetReadingZoom = useEditorStore((s) => s.resetReadingZoom)

  const [pages, setPages] = useState([''])
  const wrapperRef = useRef(null)
  const allPagesRef = useRef(null)
  const [fitScale, setFitScale] = useState(1)
  const readingZoomRef = useRef(readingZoom)
  const pinchRef = useRef({ dist: 0, zoom: 1 })

  readingZoomRef.current = readingZoom

  const displayScale = readingMode ? fitScale * readingZoom : fitScale

  useEffect(() => {
    injectThemeStyle(activeTheme, layout, styleOverrides)
  }, [
    themeId, activeFileId,
    layout.fontSize, layout.lineHeight,
    styleOverrides.bodyFont, styleOverrides.headingFont, styleOverrides.monoFont,
    styleOverrides.headingColor, styleOverrides.accentColor, styleOverrides.bodyColor,
  ])

  useEffect(() => {
    if (!content) { setPages([]); return }
    renderMarkdown(content).then((result) => {
      setPages(splitIntoPages(processPageBreaks(result)))
    })
  }, [content])

  useEffect(() => {
    if (!allPagesRef.current) return
    const mermaidEls = allPagesRef.current.querySelectorAll('code.language-mermaid')
    if (mermaidEls.length === 0) return
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' })
      mermaidEls.forEach((el) => {
        const div = document.createElement('div')
        div.className = 'mermaid'
        div.textContent = el.textContent
        el.parentElement?.replaceWith(div)
      })
      mermaid.run({ nodes: allPagesRef.current.querySelectorAll('.mermaid') })
    }).finally(() => {
      if (onHeadingsChange && allPagesRef.current) {
        onHeadingsChange(extractHeadingsFromPreview(allPagesRef.current))
      }
    })
  }, [pages, onHeadingsChange])

  useEffect(() => {
    if (!onHeadingsChange || !allPagesRef.current) return
    if (pages.length === 0) {
      onHeadingsChange([])
      return
    }
    const mermaidPending = allPagesRef.current.querySelectorAll('code.language-mermaid').length > 0
    if (!mermaidPending) {
      onHeadingsChange(extractHeadingsFromPreview(allPagesRef.current))
    }
  }, [pages, onHeadingsChange])

  useLayoutEffect(() => {
    if (!wrapperRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      const availableW = entry.contentRect.width - 32
      if (availableW < dims.w) {
        setFitScale(Math.max(0.35, availableW / dims.w))
      } else {
        setFitScale(1)
      }
    })
    ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [dims.w])

  const applyPinchZoom = useCallback((ratio) => {
    setReadingZoom(pinchRef.current.zoom * ratio)
  }, [setReadingZoom])

  useEffect(() => {
    const el = wrapperRef.current
    if (!el || !readingMode) return

    function touchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.hypot(dx, dy)
    }

    function onWheel(e) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.08 : 0.08
      setReadingZoom(readingZoomRef.current + delta)
    }

    function onTouchStart(e) {
      if (e.touches.length !== 2) return
      pinchRef.current = { dist: touchDistance(e.touches), zoom: readingZoomRef.current }
    }

    function onTouchMove(e) {
      if (e.touches.length !== 2 || pinchRef.current.dist <= 0) return
      e.preventDefault()
      applyPinchZoom(touchDistance(e.touches) / pinchRef.current.dist)
    }

    function onTouchEnd(e) {
      if (e.touches.length < 2) pinchRef.current.dist = 0
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [readingMode, setReadingZoom, applyPinchZoom])

  return (
    <div
      id="preview-pane"
      className="h-full overflow-hidden flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      <div
        ref={(el) => {
          wrapperRef.current = el
          if (previewScrollRef) previewScrollRef.current = el
        }}
        className="flex-1 overflow-y-auto py-8 flex flex-col items-center"
        style={{ touchAction: readingMode ? 'pan-y' : 'auto' }}
      >
        <div
          id="markeon-all-pages"
          ref={allPagesRef}
          className="flex flex-col gap-6"
          style={{
            width: `${dims.w}px`,
            transform: `scale(${displayScale})`,
            transformOrigin: 'top center',
            marginBottom: displayScale !== 1 ? `${(pages.length * (dims.h + 24)) * (displayScale - 1)}px` : 0,
          }}
        >
          {pages.length === 0 ? (
            <div
              className="flex items-center justify-center text-sm"
              style={{
                width: `${dims.w}px`,
                minHeight: `${dims.h}px`,
                background: pageBg,
                boxShadow: 'var(--page-shadow)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-ui)',
              }}
            >
              Start writing to see the preview
            </div>
          ) : (
            pages.map((pageHtml, i) => (
              <div
                key={i}
                className="relative flex-shrink-0 overflow-x-hidden"
                style={{
                  width: `${dims.w}px`,
                  minHeight: `${dims.h}px`,
                  background: pageBg,
                  boxShadow: 'var(--page-shadow)',
                  paddingTop: padTop,
                  paddingRight: padRight,
                  paddingBottom: padBottom,
                  paddingLeft: padLeft,
                }}
              >
                <div
                  className="markeon-document"
                  dangerouslySetInnerHTML={{ __html: pageHtml }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {readingMode && (
        <ReadingZoomBar
          zoom={readingZoom}
          onChange={setReadingZoom}
          onReset={resetReadingZoom}
        />
      )}
    </div>
  )
}
