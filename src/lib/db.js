import { openDB } from 'idb'

const DB_NAME = 'markeon'
const DB_VERSION = 1

let db = null

async function getDB() {
  if (db) return db

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
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
