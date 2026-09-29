import { create } from 'zustand'

interface QuickAddState {
  expenseOpen: boolean
  incomeOpen: boolean
  openExpense: () => void
  openIncome: () => void
  closeExpense: () => void
  closeIncome: () => void
}

export const useQuickAddStore = create<QuickAddState>((set) => ({
  expenseOpen: false,
  incomeOpen: false,
  openExpense: () => set({ expenseOpen: true }),
  openIncome: () => set({ incomeOpen: true }),
  closeExpense: () => set({ expenseOpen: false }),
  closeIncome: () => set({ incomeOpen: false }),
}))