import { create } from 'zustand'

interface MonthState {
  currentMonth: number
  currentYear: number
  goNext: () => void
  goPrev: () => void
  goToMonth: (month: number, year: number) => void
  goToToday: () => void
}

const now = new Date()

export const useMonthStore = create<MonthState>((set) => ({
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),

  goNext: () =>
    set((state) => {
      if (state.currentMonth === 12) {
        return { currentMonth: 1, currentYear: state.currentYear + 1 }
      }
      return { currentMonth: state.currentMonth + 1 }
    }),

  goPrev: () =>
    set((state) => {
      if (state.currentMonth === 1) {
        return { currentMonth: 12, currentYear: state.currentYear - 1 }
      }
      return { currentMonth: state.currentMonth - 1 }
    }),

  goToMonth: (month, year) => set({ currentMonth: month, currentYear: year }),

  goToToday: () =>
    set({
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear(),
    }),
}))
