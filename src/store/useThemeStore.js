import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      mode: 'dark',
      activeThemeId: 'academic-serif',
      themeOverrides: {},

      setMode: (mode) => {
        document.documentElement.setAttribute('data-theme', mode)
        set({ mode })
      },

      toggleMode: () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark'
          ? 'light'
          : 'dark'
        document.documentElement.setAttribute('data-theme', next)
        set({ mode: next })
      },

      setActiveTheme: (id) => set({ activeThemeId: id }),

      setThemeOverride: (key, value) =>
        set((state) => ({
          themeOverrides: { ...state.themeOverrides, [key]: value },
        })),

      clearThemeOverrides: () => set({ themeOverrides: {} }),
    }),
    {
      name: 'markeon-theme',
      partialize: (state) => ({
        mode: state.mode,
        activeThemeId: state.activeThemeId,
      }),
    }
  )
)
