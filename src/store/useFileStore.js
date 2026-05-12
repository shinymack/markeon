import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAllFiles, saveFile, deleteFile } from '../lib/db'
import { nanoid } from '../lib/nanoid'

function makeFile(name = 'untitled.md') {
  return {
    id: nanoid(),
    name,
    content: `# ${name.replace('.md', '')}\n\nStart writing here...\n`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: 0,
  }
}

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
        await deleteFile(id)
        const remaining = files.filter((f) => f.id !== id)
        const nextActive =
          activeFileId === id ? (remaining[0]?.id || null) : activeFileId
        set({ files: remaining, activeFileId: nextActive })
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
