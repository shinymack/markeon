const PX_PER_MM = 96 / 25.4

export const PAPER_MM = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
}

export function pageGeometry(layout) {
  const paper = PAPER_MM[layout.paperSize] || PAPER_MM.A4
  const landscape = layout.orientation === 'landscape'
  const width = (landscape ? paper.height : paper.width) * PX_PER_MM
  const height = (landscape ? paper.width : paper.height) * PX_PER_MM
  const margins = Object.fromEntries(['top', 'right', 'bottom', 'left'].map((side) => {
    const value = Number.parseFloat(layout.margins?.[side])
    return [side, (Number.isFinite(value) ? value : 20) * PX_PER_MM]
  }))
  return { width, height, margins, contentWidth: width - margins.left - margins.right, contentHeight: height - margins.top - margins.bottom }
}

function textNodes(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  return nodes
}

// Range preserves links, emphasis, syntax tokens and nested inline markup at page boundaries.
function splitText(element, count) {
  const text = element.textContent
  if (count > 0 && count < text.length && /[\uD800-\uDBFF]/.test(text[count - 1]) && /[\uDC00-\uDFFF]/.test(text[count])) count--
  const nodes = textNodes(element)
  let remaining = count
  let endNode = element
  let endOffset = element.childNodes.length
  for (const node of nodes) {
    if (remaining <= node.length) {
      endNode = node
      endOffset = remaining
      break
    }
    remaining -= node.length
  }
  const prefix = document.createRange()
  prefix.setStart(element, 0)
  prefix.setEnd(endNode, endOffset)
  const suffix = document.createRange()
  suffix.setStart(endNode, endOffset)
  suffix.setEnd(element, element.childNodes.length)
  const first = element.cloneNode(false)
  const rest = element.cloneNode(false)
  first.append(prefix.cloneContents())
  rest.append(suffix.cloneContents())
  rest.removeAttribute('id')
  rest.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'))
  rest.classList.add('page-continuation')
  return [first, rest]
}

function fitMedia(element, maxHeight, media = element.matches('img, svg') ? element : element.querySelector('img, svg')) {
  if (!media) return
  const current = element.getBoundingClientRect().height
  if (current <= maxHeight) return
  const rect = media.getBoundingClientRect()
  const nonMediaHeight = current - rect.height
  const available = Math.max(1, maxHeight - nonMediaHeight - 1)
  const ratio = Math.min(1, available / rect.height)
  media.style.width = `${rect.width * ratio}px`
  media.style.height = `${rect.height * ratio}px`
  media.style.maxHeight = `${available}px`
  media.style.objectFit = 'contain'
}

/**
 * Measure at print size, not at screen zoom. Each returned fragment is used unchanged
 * by both the visible paper cards and PDF export. Tables continue at rows with repeated
 * headers; paragraphs, code, lists and oversized cells preserve markup across pages.
 */
export function paginateDocument(source, geometry) {
  const host = document.createElement('div')
  host.className = 'pagination-measure'
  host.setAttribute('aria-hidden', 'true')
  host.style.width = `${geometry.contentWidth}px`
  document.body.append(host)
  const pages = []
  let current
  let page
  let explicitTrailingBreak = false

  function newPage(force = false) {
    if (page && (force || page.hasChildNodes())) pages.push(page.innerHTML)
    host.replaceChildren()
    page = document.createElement('div')
    page.className = 'markeon-document'
    page.style.width = `${geometry.contentWidth}px`
    host.append(page)
    current = page
  }
  function fits() {
    return page.getBoundingClientRect().height <= geometry.contentHeight + 0.25
  }
  function hasOtherContent(element) {
    return [...page.childNodes].some((child) => child !== element && (child.nodeType === Node.ELEMENT_NODE || child.textContent.trim()))
  }
  function textPart(element, mount) {
    const length = element.textContent.length
    let low = 0
    let high = length
    let best = 0
    let candidate
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const [part] = splitText(element, mid)
      if (candidate) candidate.replaceWith(part)
      else mount.append(part)
      candidate = part
      if (fits()) { best = mid; low = mid + 1 }
      else high = mid - 1
    }
    candidate?.remove()
    if (!best) return null
    // Prefer a word boundary without changing any source characters.
    const prefix = element.textContent.slice(0, best)
    const boundary = prefix.search(/\s+\S*$/)
    if (best < length && boundary > best * 0.8) best = boundary + 1
    return splitText(element, best)
  }

  function placeText(element) {
    let remaining = element
    while (remaining.textContent.length) {
      const part = textPart(remaining, current)
      if (!part) {
        if (page.hasChildNodes()) { newPage(); continue }
        // A single line must fit before fragmentation can make progress.
        throw new Error('The selected font or page margins leave no room for a line of text.')
      }
      current.append(part[0])
      remaining = part[1]
      if (remaining.textContent.length) newPage()
    }
  }

  function fitAtomicMedia() {
    for (const media of source.querySelectorAll('img, svg')) {
      if (media.parentElement.closest('svg')) continue
      const owner = media.closest('figure') || media
      const clone = owner.cloneNode(true)
      const target = clone.matches('img, svg') ? clone
        : clone.querySelectorAll('img, svg')[[...owner.querySelectorAll('img, svg')].indexOf(media)]
      let context = clone
      let branch = owner
      for (let parent = owner.parentElement; parent && parent !== source; parent = parent.parentElement) {
        const shell = parent.cloneNode(false)
        if (parent.tagName === 'TABLE') {
          for (const child of parent.children) {
            if (child !== branch && ['CAPTION', 'COLGROUP', 'THEAD'].includes(child.tagName)) shell.append(child.cloneNode(true))
          }
        }
        shell.append(context)
        context = shell
        branch = parent
      }
      current.append(context)
      const surrounding = page.getBoundingClientRect().height - clone.getBoundingClientRect().height
      // Reserve adjacent text lines so range splitting can progress around inline images.
      const textContainer = owner.closest('p, li, td, th, h1, h2, h3, h4, h5, h6')
      const textSpace = textContainer && textContainer.textContent.trim() !== owner.textContent.trim()
        ? (Number.parseFloat(getComputedStyle(textContainer).lineHeight) || 24) * 2 : 0
      fitMedia(clone, geometry.contentHeight - surrounding - textSpace, target)
      media.style.cssText = target.style.cssText
      context.remove()
    }
  }

  function tableTemplate(table) {
    const fragment = table.cloneNode(false)
    fragment.removeAttribute('id')
    for (const child of table.children) {
      if (['CAPTION', 'COLGROUP', 'THEAD'].includes(child.tagName)) fragment.append(child.cloneNode(true))
    }
    if (!fragment.querySelector('colgroup')) {
      const cells = table.querySelector('tr')?.children
      const widths = cells ? [...cells].map((cell) => cell.getBoundingClientRect().width) : []
      const total = widths.reduce((sum, w) => sum + w, 0)
      if (total) {
        const group = document.createElement('colgroup')
        for (const width of widths) {
          const col = document.createElement('col')
          col.style.width = `${width / total * 100}%`
          group.append(col)
        }
        fragment.prepend(group)
      }
    }
    fragment.style.tableLayout = 'fixed'
    const body = document.createElement('tbody')
    fragment.append(body)
    return { fragment, body }
  }

  function splitTable(table) {
    const rows = [...table.querySelectorAll(':scope > tbody > tr, :scope > tr')]
    if (!rows.length) { placeText(table); return }
    let fragment
    let body
    let continuation = false
    function start() {
      ;({ fragment, body } = tableTemplate(table))
      if (continuation) fragment.classList.add('table-continuation')
      current.append(fragment)
    }
    function advance() {
      if (!body.hasChildNodes()) fragment.remove()
      newPage()
      continuation = true
      start()
    }
    start()
    for (const row of rows) {
      const fitsWholePage = row.getBoundingClientRect().height + (table.tHead?.getBoundingClientRect().height || 0) <= geometry.contentHeight
      let remaining = row.cloneNode(true)
      while (remaining) {
        body.append(remaining)
        if (fits()) { remaining = null; continue }
        remaining.remove()
        if (fitsWholePage && (body.hasChildNodes() || hasOtherContent(fragment))) { advance(); continue }
        // An unusually tall row can continue by splitting each cell's rich content.
        const cells = [...remaining.children]
        const lengths = cells.map((cell) => cell.textContent.length)
        const total = Math.max(...lengths, 0)
        if (!total) throw new Error('A table row is taller than the printable page. Reduce its image size or page margins.')
        let low = 1
        let high = total
        let best = 0
        while (low <= high) {
          const mid = Math.floor((low + high) / 2)
          const trial = remaining.cloneNode(false)
          cells.forEach((cell, i) => trial.append(splitText(cell, Math.min(lengths[i], mid))[0]))
          body.append(trial)
          const ok = fits()
          trial.remove()
          if (ok) { best = mid; low = mid + 1 }
          else high = mid - 1
        }
        if (!best) {
          if (body.hasChildNodes() || hasOtherContent(fragment)) { advance(); continue }
          throw new Error('The table header and a line of its cells cannot fit within the selected margins.')
        }
        const first = remaining.cloneNode(false)
        const rest = remaining.cloneNode(false)
        cells.forEach((cell, i) => {
          let count = Math.min(lengths[i], best)
          const boundary = cell.textContent.slice(0, count).search(/\s+\S*$/)
          if (count < lengths[i] && boundary > count * 0.8) count = boundary + 1
          const pieces = splitText(cell, count)
          first.append(pieces[0])
          rest.append(pieces[1])
        })
        body.append(first)
        remaining = rest.textContent.length ? rest : null
        if (remaining) advance()
      }
    }
    const footer = table.querySelector(':scope > tfoot')
    if (footer) {
      fragment.append(footer.cloneNode(true))
      if (!fits()) {
        fragment.lastElementChild.remove()
        advance()
        fragment.append(footer.cloneNode(true))
        if (!fits()) throw new Error('The table footer is taller than the printable page.')
      }
    }
  }

  function splitList(list) {
    const ordered = list.tagName === 'OL'
    let number = Number(list.getAttribute('start')) || 1
    let shell = list.cloneNode(false)
    current.append(shell)
    for (const original of list.children) {
      let item = original.cloneNode(true)
      let continuing = false
      while (item) {
        if (ordered) item.setAttribute('value', String(Number(original.getAttribute('value')) || number))
        if (continuing) item.style.listStyleType = 'none'
        shell.append(item)
        if (fits()) { item = null; continue }
        item.remove()
        if (shell.hasChildNodes() || hasOtherContent(shell)) {
          if (!shell.hasChildNodes()) shell.remove()
          newPage()
          shell = list.cloneNode(false)
          shell.removeAttribute('id')
          if (ordered) shell.setAttribute('start', String(number))
          current.append(shell)
          continue
        }
        const pieces = textPart(item, shell)
        if (!pieces) throw new Error('A list item cannot fit within the selected page margins.')
        shell.append(pieces[0])
        item = pieces[1].textContent.length ? pieces[1] : null
        if (item) {
          newPage()
          shell = list.cloneNode(false)
          if (ordered) shell.setAttribute('start', String(number))
          current.append(shell)
          continuing = true
        }
      }
      number++
    }
  }

  try {
    newPage()
    fitAtomicMedia()
    const nodes = [...source.childNodes].filter((node) => node.nodeType === Node.ELEMENT_NODE || node.textContent.trim())
    for (let i = 0; i < nodes.length; i++) {
      const original = nodes[i]
      if (original.nodeType !== Node.ELEMENT_NODE) {
        const p = document.createElement('p')
        p.textContent = original.textContent
        placeText(p)
        explicitTrailingBreak = false
        continue
      }
      if (original.classList.contains('page-break')) { newPage(true); explicitTrailingBreak = true; continue }
      explicitTrailingBreak = false
      let clone = original.cloneNode(true)
      current.append(clone)
      if (/^H[1-6]$/.test(clone.tagName) && nodes[i + 1] && hasOtherContent(clone)) {
        const next = nodes[i + 1]
        const minimum = next.tagName === 'TABLE'
          ? (next.querySelector('thead')?.getBoundingClientRect().height || 0) + (next.querySelector('tbody tr')?.getBoundingClientRect().height || 30)
          : (Number.parseFloat(getComputedStyle(page).lineHeight) || 24) * 2
        if (page.getBoundingClientRect().height + minimum > geometry.contentHeight) {
          clone.remove()
          newPage()
          current.append(clone)
        }
      }
      if (fits()) continue
      clone.remove()
      if (original.tagName === 'TABLE') { splitTable(original); continue }
      if (['UL', 'OL'].includes(original.tagName)) { splitList(original); continue }
      if (['P', 'BLOCKQUOTE', 'PRE'].includes(original.tagName) && original.textContent.length) {
        const lineHeight = Number.parseFloat(getComputedStyle(page).lineHeight) || 24
        if (geometry.contentHeight - page.getBoundingClientRect().height < lineHeight * 2 && page.hasChildNodes()) newPage()
        placeText(original)
        continue
      }
      if (page.hasChildNodes()) newPage()
      clone = original.cloneNode(true)
      current.append(clone)
      if (fits()) continue
      if (clone.matches('figure, .mermaid') || clone.querySelector('img, svg')) {
        fitMedia(clone, geometry.contentHeight - (page.getBoundingClientRect().height - clone.getBoundingClientRect().height))
        if (fits()) continue
      }
      clone.remove()
      placeText(original)
    }
    if (page.hasChildNodes() || !pages.length || explicitTrailingBreak) pages.push(page.innerHTML)
    return pages
  } finally {
    host.remove()
  }
}
