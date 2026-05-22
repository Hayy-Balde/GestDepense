import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      sidebarCollapsed: false,
      mobileMenuOpen: false,

      setTheme: (theme) => {
        const root = document.documentElement
        if (theme === 'system') {
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          root.classList.toggle('dark', systemDark)
        } else {
          root.classList.toggle('dark', theme === 'dark')
        }
        set({ theme })
      },

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'gestdepense-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = JSON.parse(localStorage.getItem('gestdepense-ui') || '{}')
  const theme = stored?.state?.theme || 'system'
  const root = document.documentElement
  if (theme === 'system') {
    root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (useUIStore.getState().theme === 'system') {
      root.classList.toggle('dark', e.matches)
    }
  })
}
