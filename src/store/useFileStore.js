import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAllFiles, saveFile, deleteFile as deleteStoredFile } from '../lib/db'
import { extractMarkeonImageIds } from '../lib/images'
import { nanoid } from '../lib/nanoid'

const DEFAULT_LAYOUT = {
  fontSize: null,
  lineHeight: null,
  margins: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
  marginLinked: true,
  paperSize: 'A4',
  orientation: 'portrait',
  watermark: '',
}

export const DEFAULT_STYLE = {
  bodyFont: null,
  headingFont: null,
  monoFont: null,
  headingColor: null,
  accentColor: null,
  bodyColor: null,
  pageBg: null,
}

function makeFile(name = 'untitled.md', initial = {}) {
  const now = Date.now()
  const defaultContent = `# ${name.replace(/\.md$/i, '')}\n\nStart writing here...\n`
  const layout = initial.layoutSettings || {}
  return {
    id: initial.id || nanoid(),
    name,
    content: initial.content ?? defaultContent,
    createdAt: initial.createdAt || now,
    updatedAt: now,
    order: initial.order ?? 0,
    themeId: initial.themeId || 'academic-serif',
    layoutSettings: {
      ...DEFAULT_LAYOUT,
      ...layout,
      margins: { ...DEFAULT_LAYOUT.margins, ...(layout.margins || {}) },
    },
    styleOverrides: { ...DEFAULT_STYLE, ...(initial.styleOverrides || {}) },
  }
}

export { DEFAULT_LAYOUT }

const DEBOUNCE_MS = 400
const pendingSnapshots = new Map()
const saveTimers = new Map()
const saveChains = new Map()
const activeSaveTasks = new Set()
const deletedFileIds = new Set()
const saveFailures = new Map()
let _bootstrapping = false

function setStatus(set, status, error = null) {
  const failure = error || saveFailures.values().next().value || null
  set({ saveStatus: failure ? 'error' : status, saveError: failure })
}

function hasQueuedWork() {
  return pendingSnapshots.size > 0 || saveTimers.size > 0
}

function scheduleSave(id, snapshot, set, get, delay = DEBOUNCE_MS) {
  if (deletedFileIds.has(id)) return
  pendingSnapshots.set(id, snapshot)
  saveFailures.delete(id)
  saveFailures.delete('operation')
  clearTimeout(saveTimers.get(id))
  setStatus(set, 'pending', null)
  const timer = setTimeout(() => {
    saveTimers.delete(id)
    beginSave(id, set, get)
  }, delay)
  saveTimers.set(id, timer)
}

function beginSave(id, set, get) {
  if (deletedFileIds.has(id)) {
    pendingSnapshots.delete(id)
    return null
  }
  const snapshot = pendingSnapshots.get(id)
  if (!snapshot) return null
  pendingSnapshots.delete(id)
  setStatus(set, 'saving', null)
  const previous = saveChains.get(id) || Promise.resolve()
  const task = previous
    .catch(() => {})
    .then(() => saveFile(snapshot))
  saveChains.set(id, task)
  activeSaveTasks.add(task)
  task.then(
    () => {
      activeSaveTasks.delete(task)
      if (saveChains.get(id) === task) saveChains.delete(id)
      if (!hasQueuedWork() && activeSaveTasks.size === 0) setStatus(set, 'saved', null)
      else if (hasQueuedWork()) setStatus(set, 'pending', null)
    },
    (error) => {
      saveFailures.set(id, error)
      activeSaveTasks.delete(task)
      if (saveChains.get(id) === task) saveChains.delete(id)
      setStatus(set, 'error', error)
    }
  ).catch(() => {})
  return task
}

function drainTimers(set, get) {
  for (const [id, timer] of saveTimers) {
    clearTimeout(timer)
    saveTimers.delete(id)
    beginSave(id, set, get)
  }
  // A snapshot can only be queued by scheduleSave, but drain defensively if a
  // caller observes it between clearing a timer and starting the write.
  for (const id of pendingSnapshots.keys()) beginSave(id, set, get)
}

export const useFileStore = create(
  persist(
    (set, get) => ({
      files: [],
      activeFileId: null,
      saveStatus: 'saved',
      saveError: null,

      loadFiles: async () => {
        if (_bootstrapping) return
        _bootstrapping = true
        try {
          const files = await getAllFiles()
          if (files.length === 0) {
            const defaultFile = makeFile('welcome.md')
            defaultFile.content = `# Welcome to Markeon\n\nWrite your markdown here. See it rendered live on the right.\n\n## Features\n\n- **Bold**, *italic*, \`code\`\n- Tables, task lists, footnotes\n- Math: $E = mc^2$\n- Diagrams with Mermaid\n\n## Try it\n\nStart typing and watch the preview update in real-time.\n`
            await saveFile(defaultFile)
            set({ files: [defaultFile], activeFileId: defaultFile.id, saveStatus: 'saved', saveError: null })
          } else {
            const activeId = get().activeFileId
            set({
              files,
              activeFileId: activeId && files.find((f) => f.id === activeId) ? activeId : files[0].id,
              saveStatus: 'saved',
              saveError: null,
            })
          }
        } catch (error) {
          setStatus(set, 'error', error)
          throw error
        } finally {
          _bootstrapping = false
        }
      },

      getActiveFile: () => {
        const { files, activeFileId } = get()
        return files.find((f) => f.id === activeFileId) || null
      },

      setActiveFile: (id) => set({ activeFileId: id }),

      createFile: (name = 'untitled.md', initial = {}) => {
        const { files } = get()
        const file = makeFile(name, initial)
        file.order = initial.order ?? files.length
        set((state) => ({
          files: [...state.files, file],
          activeFileId: file.id,
        }))
        scheduleSave(file.id, file, set, get, 0)
        return file
      },

      duplicateFile: (id) => {
        const source = get().files.find((file) => file.id === id)
        if (!source || deletedFileIds.has(id)) return null
        const baseName = source.name.replace(/\.md$/i, '')
        return get().createFile(`${baseName} copy.md`, {
          content: source.content,
          themeId: source.themeId,
          layoutSettings: source.layoutSettings,
          styleOverrides: source.styleOverrides,
        })
      },

      updateContent: (id, content) => {
        const file = get().files.find((item) => item.id === id)
        if (!file || deletedFileIds.has(id)) return Promise.resolve(null)
        if (file.content === content) return Promise.resolve(file)
        const updated = { ...file, content, updatedAt: Date.now() }
        set((state) => ({ files: state.files.map((item) => (item.id === id ? updated : item)) }))
        scheduleSave(id, updated, set, get)
        return Promise.resolve(updated)
      },

      renameFile: (id, name) => {
        const file = get().files.find((item) => item.id === id)
        if (!file || deletedFileIds.has(id)) return Promise.resolve(null)
        const updated = { ...file, name, updatedAt: Date.now() }
        set((state) => ({ files: state.files.map((item) => (item.id === id ? updated : item)) }))
        scheduleSave(id, updated, set, get, 0)
        return Promise.resolve(updated)
      },

      deleteFile: async (id) => {
        const file = get().files.find((item) => item.id === id)
        if (!file || deletedFileIds.has(id)) return
        deletedFileIds.add(id)
        clearTimeout(saveTimers.get(id))
        saveTimers.delete(id)
        pendingSnapshots.delete(id)
        try {
          const pendingWrite = saveChains.get(id)
          if (pendingWrite) await pendingWrite.catch(() => {})
          const referenceOwners = new Map()
          for (const other of get().files) {
            if (other.id === id) continue
            for (const attachmentId of extractMarkeonImageIds(other.content || '')) referenceOwners.set(attachmentId, other.id)
          }
          await deleteStoredFile(id, extractMarkeonImageIds(file.content || ''), referenceOwners)
          set((state) => {
            const files = state.files.filter((item) => item.id !== id)
            return { files, activeFileId: state.activeFileId === id ? (files[0]?.id || null) : state.activeFileId }
          })
          saveFailures.delete(id)
          setStatus(set, hasQueuedWork() ? 'pending' : activeSaveTasks.size ? 'saving' : 'saved')
        } catch (error) {
          deletedFileIds.delete(id)
          saveFailures.set(id, error)
          setStatus(set, 'error', error)
          throw error
        }
      },

      setFileTheme: (id, themeId) => {
        const file = get().files.find((item) => item.id === id)
        if (!file || deletedFileIds.has(id)) return Promise.resolve(null)
        const updated = { ...file, themeId, updatedAt: Date.now() }
        set((state) => ({ files: state.files.map((item) => (item.id === id ? updated : item)) }))
        scheduleSave(id, updated, set, get, 0)
        return Promise.resolve(updated)
      },

      setFileLayout: (id, patch) => {
        const file = get().files.find((item) => item.id === id)
        if (!file || deletedFileIds.has(id)) return Promise.resolve(null)
        const existing = file.layoutSettings || DEFAULT_LAYOUT
        const updated = {
          ...file,
          layoutSettings: {
            ...existing,
            ...patch,
            margins: { ...existing.margins, ...(patch.margins || {}) },
          },
          updatedAt: Date.now(),
        }
        set((state) => ({ files: state.files.map((item) => (item.id === id ? updated : item)) }))
        scheduleSave(id, updated, set, get, 0)
        return Promise.resolve(updated)
      },

      setFileStyle: (id, patch) => {
        const file = get().files.find((item) => item.id === id)
        if (!file || deletedFileIds.has(id)) return Promise.resolve(null)
        const updated = {
          ...file,
          styleOverrides: { ...(file.styleOverrides || DEFAULT_STYLE), ...patch },
          updatedAt: Date.now(),
        }
        set((state) => ({ files: state.files.map((item) => (item.id === id ? updated : item)) }))
        scheduleSave(id, updated, set, get, 0)
        return Promise.resolve(updated)
      },

      reorderFiles: (newOrder) => {
        const updated = newOrder.map((file, index) => ({ ...file, order: index }))
        set({ files: updated })
        for (const file of updated) scheduleSave(file.id, file, set, get, 0)
        return Promise.resolve(updated)
      },

      reportStorageError: (error) => {
        saveFailures.set('operation', error)
        setStatus(set, 'error', error)
      },

      flushSaves: async () => {
        drainTimers(set, get)
        let firstFailure = null
        while (activeSaveTasks.size || hasQueuedWork()) {
          drainTimers(set, get)
          const tasks = [...activeSaveTasks]
          if (!tasks.length) continue
          const results = await Promise.allSettled(tasks)
          const failure = results.find((result) => result.status === 'rejected')
          if (failure && !firstFailure) firstFailure = failure.reason
        }
        const failure = firstFailure || saveFailures.values().next().value
        if (failure) {
          setStatus(set, 'error', failure)
          throw failure
        }
        if (get().saveStatus !== 'error') setStatus(set, 'saved', null)
      },
    }),
    {
      name: 'markeon-files',
      partialize: (state) => ({ activeFileId: state.activeFileId }),
    }
  )
)
