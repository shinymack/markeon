import { create } from 'zustand'

export const useMediaStore = create((set) => ({
  selection: null,
  selectMedia: (selection) => set({ selection: selection || null }),
  clearSelection: () => set({ selection: null }),
}))
