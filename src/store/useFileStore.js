import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAllFiles, saveFile, deleteFile, deleteAttachmentsByIds } from '../lib/db'
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

function makeFile(name = 'untitled.md') {
  return {
    id: nanoid(),
    name,
    content: `# ${name.replace('.md', '')}\n\nStart writing here...\n`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: 0,
    themeId: 'academic-serif',
    layoutSettings: { ...DEFAULT_LAYOUT, margins: { ...DEFAULT_LAYOUT.margins } },
    styleOverrides: { ...DEFAULT_STYLE },
  }
}

export { DEFAULT_LAYOUT }

let _bootstrapping = false

export const useFileStore = create(
  persist(
    (set, get) => ({
      files: [],
      activeFileId: null,

      loadFiles: async () => {
        if (_bootstrapping) return
        _bootstrapping = true
        const files = await getAllFiles()
        if (files.length === 0) {
          const defaultFile = makeFile('welcome.md')
          defaultFile.content = `# Welcome to Markeon\n\nWrite your markdown here. See it rendered live on the right.\n\n## Features\n\n- **Bold**, *italic*, \`code\`\n- Tables, task lists, footnotes\n- Math: $E = mc^2$\n- Diagrams with Mermaid\n\n## Try it\n\nStart typing and watch the preview update in real-time.\n`
          await saveFile(defaultFile)
          set({ files: [defaultFile], activeFileId: defaultFile.id })
        } else {
          const activeId = get().activeFileId
          set({ files, activeFileId: activeId && files.find(f => f.id === activeId) ? activeId : files[0].id })
        }
      },

      getActiveFile: () => {
        const { files, activeFileId } = get()
        return files.find((f) => f.id === activeFileId) || null
      },

      setActiveFile: (id) => set({ activeFileId: id }),

      createFile: async (name = 'untitled.md') => {
        const { files } = get()
        const file = makeFile(name)
        file.order = files.length
        await saveFile(file)
        set((state) => ({
          files: [...state.files, file],
          activeFileId: file.id,
        }))
        return file
      },

      updateContent: async (id, content) => {
        const { files } = get()
        const file = files.find((f) => f.id === id)
        if (!file) return

        const updated = { ...file, content, updatedAt: Date.now() }
        await saveFile(updated)
        set((state) => ({
          files: state.files.map((f) => (f.id === id ? updated : f)),
        }))
      },

      renameFile: async (id, name) => {
        const { files } = get()
        const file = files.find((f) => f.id === id)
        if (!file) return

        const updated = { ...file, name, updatedAt: Date.now() }
        await saveFile(updated)
        set((state) => ({
          files: state.files.map((f) => (f.id === id ? updated : f)),
        }))
      },

      deleteFile: async (id) => {
        const { files, activeFileId } = get()
        const file = files.find((f) => f.id === id)
        if (file?.content) {
          const attachmentIds = extractMarkeonImageIds(file.content)
          if (attachmentIds.length) await deleteAttachmentsByIds(attachmentIds)
        }
        await deleteFile(id)
        const remaining = files.filter((f) => f.id !== id)
        const nextActive =
          activeFileId === id ? (remaining[0]?.id || null) : activeFileId
        set({ files: remaining, activeFileId: nextActive })
      },

      setFileTheme: async (id, themeId) => {
        const { files } = get()
        const file = files.find((f) => f.id === id)
        if (!file) return
        const updated = { ...file, themeId, updatedAt: Date.now() }
        await saveFile(updated)
        set((state) => ({
          files: state.files.map((f) => (f.id === id ? updated : f)),
        }))
      },

      setFileLayout: async (id, patch) => {
        const { files } = get()
        const file = files.find((f) => f.id === id)
        if (!file) return
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
        await saveFile(updated)
        set((state) => ({
          files: state.files.map((f) => (f.id === id ? updated : f)),
        }))
      },

      setFileStyle: async (id, patch) => {
        const { files } = get()
        const file = files.find((f) => f.id === id)
        if (!file) return
        const updated = {
          ...file,
          styleOverrides: { ...(file.styleOverrides || DEFAULT_STYLE), ...patch },
          updatedAt: Date.now(),
        }
        await saveFile(updated)
        set((state) => ({
          files: state.files.map((f) => (f.id === id ? updated : f)),
        }))
      },

      reorderFiles: async (newOrder) => {
        const updated = newOrder.map((file, i) => ({ ...file, order: i }))
        for (const f of updated) await saveFile(f)
        set({ files: updated })
      },
    }),
    {
      name: 'markeon-files',
      partialize: (state) => ({ activeFileId: state.activeFileId }),
    }
  )
)
