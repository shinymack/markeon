import { saveAttachment } from './db'
import { nanoid } from './nanoid'

const MARKEON_IMG_PREFIX = 'markeon://img/'

export function markeonImageUrl(id) {
  return `${MARKEON_IMG_PREFIX}${id}`
}

export function extractMarkeonImageIds(content) {
  const re = /markeon:\/\/img\/([a-zA-Z0-9_-]+)/g
  const ids = new Set()
  let m
  while ((m = re.exec(content)) !== null) ids.add(m[1])
  return [...ids]
}

export function insertImageMarkdown(view, url, alt = 'image') {
  const { from } = view.state.selection.main
  const text = `![${alt}](${url})`
  view.dispatch({
    changes: { from, insert: text },
    selection: { anchor: from + text.length },
  })
}

export async function handleImagePaste(view, file, fileId) {
  if (!file?.type?.startsWith('image/') || !fileId) return false
  const id = nanoid()
  const data = await file.arrayBuffer()
  await saveAttachment({
    id,
    fileId,
    name: file.name || 'image',
    mimeType: file.type,
    data,
  })
  insertImageMarkdown(view, markeonImageUrl(id), 'image')
  return true
}
