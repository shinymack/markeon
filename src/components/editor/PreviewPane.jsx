import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useFileStore, DEFAULT_LAYOUT } from '../../store/useFileStore'
import { useEditorStore } from '../../store/useEditorStore'
import { useMediaStore } from '../../store/useMediaStore'
import { renderMarkdown, extractHeadingsFromPreview } from '../../lib/markdown'
import { getThemeById, BUILT_IN_THEMES } from '../../lib/themes'
import { pageGeometry, paginateDocument } from '../../lib/pagination'
import { previewRef } from '../../lib/previewRef'
import { ensureFont } from '../../lib/fontLoader'
import { parseMermaidSource, mermaidPalette } from '../../lib/media'
import ReadingZoomBar from './ReadingZoomBar'

let diagramQueue = Promise.resolve()
let diagramId = 0

function documentStyle(theme, layout, overrides) {
  const tokens = { ...theme.tokens }
  const fields = {
    bodyFont: '--font-body', headingFont: '--font-heading', monoFont: '--font-mono',
    headingColor: '--color-heading', accentColor: '--color-accent', bodyColor: '--color-text', pageBg: '--page-bg',
  }
  for (const [field, token] of Object.entries(fields)) if (overrides[field]) tokens[token] = overrides[field]
  if (layout.fontSize) tokens['--base-size'] = layout.fontSize
  if (layout.lineHeight) tokens['--line-height'] = layout.lineHeight
  let element = document.getElementById('markeon-doc-theme')
  if (!element) {
    element = document.createElement('style')
    element.id = 'markeon-doc-theme'
    document.head.append(element)
  }
  element.textContent = `.markeon-document {${Object.entries(tokens).map(([key, value]) => `${key}:${value};`).join('')}}`
  return tokens['--page-bg'] || '#ffffff'
}

function isDark(color) {
  const match = /^#([a-f\d]{6})$/i.exec(color)
  if (!match) return false
  const rgb = [0, 2, 4].map((i) => Number.parseInt(match[1].slice(i, i + 2), 16))
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 < 128
}

function documentKey(file) {
  return JSON.stringify([file?.id, file?.content, file?.themeId, file?.layoutSettings, file?.styleOverrides])
}

async function renderDiagrams(source, dark, geometry) {
  const codes = [...source.querySelectorAll('code.language-mermaid')]
  if (!codes.length) return
  const run = async () => {
    const { default: mermaid } = await import('mermaid')
    for (const code of codes) {
      const wrapper = code.closest('[data-media-type="mermaid"]') || code.parentElement
      const settings = parseMermaidSource(code.textContent).settings
      const theme = settings.theme === 'auto' ? (dark ? 'dark' : 'neutral') : settings.theme
      const fontFamily = settings.fontFamily || getComputedStyle(wrapper).fontFamily
      mermaid.initialize({
        startOnLoad: false, securityLevel: 'strict', theme, fontFamily, fontSize: settings.fontSize,
        themeVariables: { darkMode: theme === 'dark' || (theme === 'base' && dark), fontFamily, fontSize: `${settings.fontSize}px`, ...mermaidPalette(settings.color) },
        flowchart: { useMaxWidth: false },
      })
      const diagram = document.createElement('div')
      diagram.className = 'mermaid'
      const width = Math.min(100, Math.max(10, Number(wrapper.dataset.width) || 100))
      diagram.style.width = `${width}%`
      try {
        const { svg } = await mermaid.render(`markeon-diagram-${++diagramId}`, code.textContent)
        diagram.innerHTML = svg
        const image = diagram.querySelector('svg')
        const viewBox = image?.viewBox?.baseVal
        if (image && viewBox?.width) {
          let verticalSpace = 0
          for (let ancestor = wrapper; ancestor && ancestor !== source; ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor)
            for (const field of ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth']) verticalSpace += Number.parseFloat(style[field]) || 0
          }
          // Size is relative to the largest aspect-preserving diagram that fits the page.
          const fit = Math.min(wrapper.getBoundingClientRect().width / viewBox.width, Math.max(1, geometry.contentHeight - verticalSpace) / viewBox.height)
          const renderedWidth = viewBox.width * fit * width / 100
          image.style.width = `${renderedWidth}px`
          image.style.height = `${renderedWidth * viewBox.height / viewBox.width}px`
          image.style.maxWidth = '100%'
          image.removeAttribute('height')
        }
      } catch (error) {
        diagram.classList.add('diagram-error')
        const title = document.createElement('strong')
        title.textContent = 'Diagram could not be rendered'
        const message = document.createElement('pre')
        message.textContent = error.message || String(error)
        diagram.append(title, message)
        // Mermaid may insert a temporary error SVG into the body on a parse error.
        document.getElementById(`dmarkeon-diagram-${diagramId}`)?.remove()
      }
      code.parentElement.replaceWith(diagram)
    }
  }
  const pending = diagramQueue.then(run, run)
  diagramQueue = pending.catch(() => {})
  await pending
}

async function waitForImages(source, waitForAssets) {
  await Promise.all([...source.querySelectorAll('img')].map((image) => {
    if (image.complete) return Promise.resolve()
    return new Promise((resolve) => {
      let timer
      const done = () => { clearTimeout(timer); image.removeEventListener('load', done); image.removeEventListener('error', done); resolve() }
      if (!waitForAssets) timer = setTimeout(() => { image.dataset.imagePending = 'true'; done() }, 8000)
      image.addEventListener('load', done, { once: true })
      image.addEventListener('error', done, { once: true })
    })
  }))
}

export default function PreviewPane({ onHeadingsChange, previewScrollRef }) {
  const activeFile = useFileStore((s) => s.files.find((file) => file.id === s.activeFileId))
  const readingMode = useEditorStore((s) => s.readingMode)
  const readingZoom = useEditorStore((s) => s.readingZoom)
  const setReadingZoom = useEditorStore((s) => s.setReadingZoom)
  const resetReadingZoom = useEditorStore((s) => s.resetReadingZoom)
  const selection = useMediaStore((s) => s.selection)
  const selectMedia = useMediaStore((s) => s.selectMedia)
  const clearSelection = useMediaStore((s) => s.clearSelection)
  const layout = { ...DEFAULT_LAYOUT, ...activeFile?.layoutSettings, margins: { ...DEFAULT_LAYOUT.margins, ...activeFile?.layoutSettings?.margins } }
  const geometry = pageGeometry(layout)
  const [pages, setPages] = useState([''])
  const [pageBg, setPageBg] = useState('#ffffff')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [assetsPending, setAssetsPending] = useState(false)
  const [fitScale, setFitScale] = useState(1)
  const scrollRef = useRef(null)
  const pagesRef = useRef(null)
  const mounted = useRef(true)
  const generation = useRef(0)
  const renderedKey = useRef(null)
  const work = useRef(null)
  const zoomRef = useRef(readingZoom)
  zoomRef.current = readingZoom
  const scale = fitScale * (readingMode ? readingZoom : 1)
  const signature = documentKey(activeFile)

  const renderCurrent = useCallback(async (waitForAssets = false) => {
    const file = useFileStore.getState().getActiveFile()
    const key = documentKey(file)
    if (work.current?.key === key && (!waitForAssets || work.current.waitForAssets)) return work.current.promise
    if (renderedKey.current === key && (!waitForAssets || !pagesRef.current?.querySelector('img[data-image-pending]'))) return true
    const ticket = ++generation.current
    const promise = (async () => {
      let source
      if (mounted.current) { setStatus('loading'); setError('') }
      try {
        const currentLayout = { ...DEFAULT_LAYOUT, ...file?.layoutSettings, margins: { ...DEFAULT_LAYOUT.margins, ...file?.layoutSettings?.margins } }
        const dimensions = pageGeometry(currentLayout)
        const theme = getThemeById(file?.themeId) || BUILT_IN_THEMES[0]
        const background = documentStyle(theme, currentLayout, file?.styleOverrides || {})
        await Promise.all(Object.entries({ bodyFont: '--font-body', headingFont: '--font-heading', monoFont: '--font-mono' }).map(([field, token]) => {
          const family = (file?.styleOverrides?.[field] || theme.tokens[token] || '').split(',')[0].replace(/['"]/g, '').trim()
          return ensureFont(family)
        }))
        const html = await renderMarkdown(file?.content || '', { dark: isDark(background) })
        if (!mounted.current || ticket !== generation.current) return false
        source = document.createElement('div')
        source.className = 'markeon-document pagination-source'
        source.setAttribute('aria-hidden', 'true')
        source.inert = true
        source.style.width = `${dimensions.contentWidth}px`
        source.innerHTML = html
        document.body.append(source)
        await document.fonts.ready
        await renderDiagrams(source, isDark(background), dimensions)
        await waitForImages(source, waitForAssets)
        if (!mounted.current || ticket !== generation.current || key !== documentKey(useFileStore.getState().getActiveFile())) return false
        const fragments = paginateDocument(source, dimensions)
        // Any image completing after the bounded wait requests a fresh measured layout.
        const pendingImages = [...source.querySelectorAll('[data-image-pending]')]
        setAssetsPending(pendingImages.length > 0)
        for (const image of pendingImages) {
          const refresh = () => { if (key !== documentKey(useFileStore.getState().getActiveFile())) return; renderedKey.current = null; renderCurrent().catch(() => {}) }
          image.addEventListener('load', refresh, { once: true })
        }
        setPageBg(background)
        setPages(fragments)
        setStatus('ready')
        renderedKey.current = key
        // Export needs React's committed page DOM, not only the completed measurement.
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        return mounted.current && ticket === generation.current && key === documentKey(useFileStore.getState().getActiveFile())
      } catch (failure) {
        if (!mounted.current || ticket !== generation.current || key !== documentKey(useFileStore.getState().getActiveFile())) return false
        setError(failure.message || 'Could not render this document.')
        setStatus('error')
        throw failure
      } finally {
        source?.remove()
        if (work.current?.ticket === ticket) work.current = null
      }
    })()
    work.current = { key, ticket, promise, waitForAssets }
    return promise
  }, [])

  useEffect(() => {
    mounted.current = true
    previewRef.current = renderCurrent
    return () => { mounted.current = false; generation.current++; if (previewRef.current === renderCurrent) previewRef.current = null }
  }, [renderCurrent])

  useEffect(() => {
    const timer = setTimeout(() => renderCurrent().catch(() => {}), 100)
    return () => clearTimeout(timer)
  }, [signature, renderCurrent])

  useEffect(() => {
    const refresh = () => { renderedKey.current = null; renderCurrent().catch(() => {}) }
    document.fonts.addEventListener('loadingdone', refresh)
    return () => document.fonts.removeEventListener('loadingdone', refresh)
  }, [renderCurrent])

  useEffect(() => {
    if (status !== 'ready') return
    onHeadingsChange?.(extractHeadingsFromPreview(pagesRef.current))
    const current = useMediaStore.getState().selection
    if (current && (current.fileId !== activeFile?.id || !pagesRef.current?.querySelector(`[data-media-type="${current.type}"][data-source-from="${current.from}"]`))) clearSelection()
  }, [pages, status, activeFile?.id, onHeadingsChange, clearSelection])

  useLayoutEffect(() => { scrollRef.current?.scrollTo({ top: 0, left: 0 }) }, [activeFile?.id])

  useLayoutEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const observer = new ResizeObserver(([entry]) => setFitScale(Math.min(1, Math.max(0.05, (entry.contentRect.width - 40) / geometry.width))))
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [geometry.width])

  useEffect(() => {
    const roots = pagesRef.current?.querySelectorAll('[data-media-type]') || []
    roots.forEach((element) => {
      const selected = !readingMode && selection?.fileId === activeFile?.id && selection?.from === Number(element.dataset.sourceFrom) && selection?.type === element.dataset.mediaType
      element.dataset.selected = selected ? 'true' : 'false'
      element.tabIndex = readingMode ? -1 : 0
      element.setAttribute('role', readingMode ? 'figure' : 'button')
      element.setAttribute('aria-label', `${element.dataset.mediaType === 'image' ? 'Picture' : 'Diagram'}: ${element.querySelector('img')?.alt || 'select to format'}`)
      if (!readingMode) element.setAttribute('aria-pressed', String(selected))
      else element.removeAttribute('aria-pressed')
    })
  }, [pages, selection, activeFile?.id, readingMode])

  useEffect(() => {
    function onDown(event) {
      if (!event.target.closest('#toolbar, [data-media-type]')) clearSelection()
    }
    function onKey(event) { if (event.key === 'Escape') clearSelection() }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [clearSelection])

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller || !readingMode) return
    let pinch = null
    const distance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
    const onWheel = (event) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      setReadingZoom(zoomRef.current + (event.deltaY > 0 ? -0.08 : 0.08))
    }
    const onStart = (event) => { if (event.touches.length === 2) pinch = { distance: distance(event.touches), zoom: zoomRef.current } }
    const onMove = (event) => {
      if (!pinch || event.touches.length !== 2) return
      event.preventDefault()
      setReadingZoom(pinch.zoom * distance(event.touches) / pinch.distance)
    }
    const onEnd = () => { pinch = null }
    scroller.addEventListener('wheel', onWheel, { passive: false })
    scroller.addEventListener('touchstart', onStart, { passive: true })
    scroller.addEventListener('touchmove', onMove, { passive: false })
    scroller.addEventListener('touchend', onEnd)
    scroller.addEventListener('touchcancel', onEnd)
    return () => {
      scroller.removeEventListener('wheel', onWheel)
      scroller.removeEventListener('touchstart', onStart)
      scroller.removeEventListener('touchmove', onMove)
      scroller.removeEventListener('touchend', onEnd)
      scroller.removeEventListener('touchcancel', onEnd)
    }
  }, [readingMode, setReadingZoom])

  useEffect(() => {
    if (!readingMode) return
    const cleanups = []
    pagesRef.current?.querySelectorAll('.mermaid:not(.diagram-error)').forEach((container) => {
      const svg = container.querySelector('svg')
      if (!svg) return
      let zoom = 1
      let x = 0
      let y = 0
      let drag = null
      const apply = () => { svg.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`; svg.dataset.viewTransform = 'true' }
      const down = (event) => {
        if (event.button !== 0) return
        event.preventDefault()
        drag = { x: event.clientX, y: event.clientY, startX: x, startY: y }
        container.setPointerCapture(event.pointerId)
        container.style.cursor = 'grabbing'
      }
      const move = (event) => {
        if (!drag) return
        x = drag.startX + (event.clientX - drag.x) / scale
        y = drag.startY + (event.clientY - drag.y) / scale
        apply()
      }
      const up = () => { drag = null; container.style.cursor = 'grab' }
      const wheel = (event) => {
        if (event.ctrlKey || event.metaKey) return
        event.preventDefault()
        event.stopPropagation()
        zoom = Math.min(3, Math.max(0.4, zoom + (event.deltaY > 0 ? -0.08 : 0.08)))
        apply()
      }
      const reset = () => { zoom = 1; x = 0; y = 0; apply() }
      container.style.cursor = 'grab'
      container.title = 'Drag to pan, scroll to zoom, double-click to reset'
      container.addEventListener('pointerdown', down)
      container.addEventListener('pointermove', move)
      container.addEventListener('pointerup', up)
      container.addEventListener('pointercancel', up)
      container.addEventListener('wheel', wheel, { passive: false })
      container.addEventListener('dblclick', reset)
      cleanups.push(() => {
        container.removeEventListener('pointerdown', down)
        container.removeEventListener('pointermove', move)
        container.removeEventListener('pointerup', up)
        container.removeEventListener('pointercancel', up)
        container.removeEventListener('wheel', wheel)
        container.removeEventListener('dblclick', reset)
        container.style.cursor = ''
        container.removeAttribute('title')
        svg.style.transform = ''
        delete svg.dataset.viewTransform
      })
    })
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [pages, readingMode, scale])

  function selectElement(event) {
    const element = event.target.closest('figure.media-mermaid') || event.target.closest('[data-media-type="image"]')
    if (!element || readingMode) return
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return
    if (event.type === 'keydown') event.preventDefault()
    const settings = JSON.parse(element.dataset.mediaSettings)
    selectMedia({ type: element.dataset.mediaType, fileId: activeFile?.id, from: Number(element.dataset.sourceFrom), to: Number(element.dataset.sourceTo), settings })
  }

  const scaledHeight = pages.length * geometry.height * scale + Math.max(0, pages.length - 1) * 36
  return (
    <section id="preview-pane" className="preview-pane" aria-label="Printable document preview">
      <div className="preview-status" role="status" aria-live="polite">
        <span>{status === 'loading' ? 'Updating preview…' : assetsPending ? 'Images still loading — page layout may change' : `${pages.length} ${pages.length === 1 ? 'page' : 'pages'} · ${layout.paperSize} ${layout.orientation}`}</span>
        {!readingMode && <span>Click a picture or diagram to format it</span>}
      </div>
      {error && <div className="preview-error" role="alert">{error} <button onClick={() => renderCurrent().catch(() => {})}>Try again</button></div>}
      <div ref={(element) => { scrollRef.current = element; if (previewScrollRef) previewScrollRef.current = element }} className="preview-scroller" style={{ touchAction: readingMode ? 'pan-x pan-y' : 'auto' }}>
        <div className="preview-size" style={{ width: geometry.width * scale, height: scaledHeight }}>
          <div id="markeon-all-pages" ref={pagesRef} data-preview-status={status} style={{ width: geometry.width, transform: `scale(${scale})`, transformOrigin: 'top left' }} onClick={selectElement} onKeyDown={selectElement}>
            {pages.map((html, index) => (
              <article key={index} className="markeon-page" aria-label={`Page ${index + 1}`} style={{ width: geometry.width, height: geometry.height, padding: `${geometry.margins.top}px ${geometry.margins.right}px ${geometry.margins.bottom}px ${geometry.margins.left}px`, background: pageBg, marginBottom: index < pages.length - 1 ? 36 / scale : 0 }}>
                {layout.watermark && <div className="page-watermark" aria-hidden="true">{layout.watermark}</div>}
                <div className="markeon-document" dangerouslySetInnerHTML={{ __html: html }} />
                <span className="preview-page-number" data-print-exclude="true">{index + 1} / {pages.length}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
      {readingMode && <ReadingZoomBar zoom={readingZoom} onChange={setReadingZoom} onReset={resetReadingZoom} />}
    </section>
  )
}
