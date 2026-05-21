import { openDB } from 'idb'

const DB_NAME = 'markeon'
const DB_VERSION = 2

let db = null

async function getDB() {
  if (db) return db

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      if (!database.objectStoreNames.contains('files')) {
        const fileStore = database.createObjectStore('files', { keyPath: 'id' })
        fileStore.createIndex('order', 'order')
      }

      if (!database.objectStoreNames.contains('themes')) {
        database.createObjectStore('themes', { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains('fonts')) {
        database.createObjectStore('fonts', { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains('meta')) {
        database.createObjectStore('meta', { keyPath: 'key' })
      }

      if (oldVersion < 2 && !database.objectStoreNames.contains('attachments')) {
        const store = database.createObjectStore('attachments', { keyPath: 'id' })
        store.createIndex('fileId', 'fileId')
      }
    },
  })

  return db
}

// Files
export async function getAllFiles() {
  const database = await getDB()
  const files = await database.getAllFromIndex('files', 'order')
  return files
}

export async function getFile(id) {
  const database = await getDB()
  return database.get('files', id)
}

export async function saveFile(file) {
  const database = await getDB()
  await database.put('files', file)
}

export async function deleteFile(id) {
  const database = await getDB()
  await database.delete('files', id)
}

export async function getFileCount() {
  const database = await getDB()
  return database.count('files')
}

// Attachments
export async function saveAttachment(attachment) {
  const database = await getDB()
  await database.put('attachments', attachment)
}

export async function getAttachment(id) {
  const database = await getDB()
  return database.get('attachments', id)
}

export async function deleteAttachment(id) {
  const database = await getDB()
  await database.delete('attachments', id)
}

export async function deleteAttachmentsByIds(ids) {
  const database = await getDB()
  const tx = database.transaction('attachments', 'readwrite')
  await Promise.all([...ids].map((id) => tx.store.delete(id)))
  await tx.done
}

// Themes
export async function getAllThemes() {
  const database = await getDB()
  return database.getAll('themes')
}

export async function saveTheme(theme) {
  const database = await getDB()
  await database.put('themes', theme)
}

export async function deleteTheme(id) {
  const database = await getDB()
  await database.delete('themes', id)
}

// Fonts
export async function getAllFonts() {
  const database = await getDB()
  return database.getAll('fonts')
}

export async function saveFont(font) {
  const database = await getDB()
  await database.put('fonts', font)
}

export async function deleteFont(id) {
  const database = await getDB()
  await database.delete('fonts', id)
}

// Meta (project-level config)
export async function getMeta(key) {
  const database = await getDB()
  const record = await database.get('meta', key)
  return record ? record.value : null
}

export async function setMeta(key, value) {
  const database = await getDB()
  await database.put('meta', { key, value })
}
