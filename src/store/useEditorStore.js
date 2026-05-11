import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useEditorStore = create(
  persist(
    (set) => ({
      layout: 'split',
      fontSize: 14,
      wordWrap: true,
      lineNumbers: true,
      scrollSync: true,
      exportSettings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        watermark: '',
        showHeader: false,
        showFooter: false,
        headerTemplate: '{{title}}',
        footerTemplate: '{{page}} / {{total}}',
        author: '',
      },

      setLayout: (layout) => set({ layout }),
      setFontSize: (fontSize) => set({ fontSize }),
      toggleWordWrap: () => set((s) => ({ wordWrap: !s.wordWrap })),
      toggleLineNumbers: () => set((s) => ({ lineNumbers: !s.lineNumbers })),
      toggleScrollSync: () => set((s) => ({ scrollSync: !s.scrollSync })),
      setExportSettings: (settings) =>
        set((s) => ({ exportSettings: { ...s.exportSettings, ...settings } })),
      setMargin: (side, value) =>
        set((s) => ({
          exportSettings: {
            ...s.exportSettings,
            margins: { ...s.exportSettings.margins, [side]: value },
          },
        })),
    }),
    {
      name: 'markeon-editor',
    }
  )
)
