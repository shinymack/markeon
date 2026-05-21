import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const READING_ZOOM_MIN = 0.5
export const READING_ZOOM_MAX = 2.5

function clampReadingZoom(z) {
  return Math.min(READING_ZOOM_MAX, Math.max(READING_ZOOM_MIN, z))
}

export const useEditorStore = create(
  persist(
    (set) => ({
      layout: 'split',
      fontSize: 14,
      wordWrap: true,
      lineNumbers: true,
      scrollSync: true,
      readingMode: false,
      readingZoom: 1,
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
      toggleReadingMode: () => set((s) => ({ readingMode: !s.readingMode })),
      setReadingMode: (readingMode) => set({ readingMode }),
      setReadingZoom: (readingZoom) => set({ readingZoom: clampReadingZoom(readingZoom) }),
      resetReadingZoom: () => set({ readingZoom: 1 }),
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
