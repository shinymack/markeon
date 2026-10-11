import { getAttachment, saveAttachment, deleteAttachment } from './db'
import { nanoid } from './nanoid'
import { editorViewRef, editorFileIdRef } from './editorRef'

const MARKEON_IMG_PREFIX = 'markeon://img/'

export function markeonImageUrl(id) {
  return `${MARKEON_IMG_PREFIX}${id}`
}

export function extractMarkeonImageIds(content = '') {
  const re = /markeon:\/\/img\/([a-zA-Z0-9_-]+)/g
  const ids = new Set()
  let match
  while ((match = re.exec(content)) !== null) ids.add(match[1])
  return [...ids]
}

function imageAlt(file) {
  return (file?.name || 'image').replace(/\.[^.]+$/, '').replace(/[\[\]\r\n]/g, '').trim() || 'image'
}

export function insertImageMarkdown(view, url, alt = 'image', position) {
  const from = position ?? view.state.selection.main.from
  const text = `![${alt}](${url})`
  view.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + text.length },
  })
}

async function saveImageAttachment(file, fileId) {
  if (!file?.type?.startsWith('image/') || !fileId) return null
  const id = nanoid()
  const data = await file.arrayBuffer()
  const { useFileStore } = await import('../store/useFileStore')
  await useFileStore.getState().flushSaves()
  await saveAttachment({
    id,
    fileId,
    name: file.name || 'image',
    mimeType: file.type,
    data,
  })
  return id
}

export async function insertImageFile(view, file, fileId, position) {
  const from = position ?? view.state.selection.main.from
  const id = await saveImageAttachment(file, fileId)
  if (!id) return false
  if (editorViewRef.current === view && editorFileIdRef.current === fileId) {
    insertImageMarkdown(view, markeonImageUrl(id), imageAlt(file), Math.min(from, view.state.doc.length))
  } else {
    const { useFileStore } = await import('../store/useFileStore')
    const source = useFileStore.getState().files.find((item) => item.id === fileId)
    if (!source) { await deleteAttachment(id); return false }
    const at = Math.min(from, source.content.length)
    const updated = await useFileStore.getState().updateContent(fileId, `${source.content.slice(0, at)}![${imageAlt(file)}](${markeonImageUrl(id)})${source.content.slice(at)}`)
    if (!updated) { await deleteAttachment(id); return false }
  }
  return true
}

export async function handleImagePaste(view, file, fileId) {
  return insertImageFile(view, file, fileId)
}

export async function handleImageDrop(view, file, fileId, event) {
  if (!file?.type?.startsWith('image/') || !fileId) return false
  const coords = event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)
    ? view.posAtCoords({ x: event.clientX, y: event.clientY })
    : null
  return insertImageFile(view, file, fileId, coords ?? undefined)
}

// Use this from image buttons as well as drag/drop. The returned promise
// resolves false when the user cancels the native picker.
export function pickAndInsertImage(view, fileId) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(false)
        return
      }
      try {
        resolve(await insertImageFile(view, file, fileId))
      } catch (error) {
        reject(error)
      }
    }
    input.oncancel = () => resolve(false)
    input.click()
  })
}
export async function toPortableMarkdown(content = '') {
  const ids = extractMarkeonImageIds(content)
  if (!ids.length) return content
  const replacements = new Map()
  await Promise.all(ids.map(async (id) => {
    const attachment = await getAttachment(id)
    if (!attachment?.data) throw new Error(`Image attachment ${id} is missing; Markdown export was cancelled.`)
    const raw = attachment.data
    const bytes = raw instanceof ArrayBuffer
      ? new Uint8Array(raw)
      : ArrayBuffer.isView(raw)
        ? new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength)
        : new Uint8Array(await raw.arrayBuffer())
    const chunkSize = 0x8000
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
    }
    replacements.set(id, `data:${attachment.mimeType || 'application/octet-stream'};base64,${btoa(binary)}`)
  }))
  let portable = content
  for (const [id, url] of replacements) {
    portable = portable.split(markeonImageUrl(id)).join(url)
  }
  return portable
}
