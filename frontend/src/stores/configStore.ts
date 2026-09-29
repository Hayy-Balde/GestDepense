import { create } from 'zustand'
import { api } from '../services/api'
import { resolveIcon } from '../lib/iconMap'
import {
  ACCOUNT_TYPES as DEFAULT_ACCOUNT_TYPES,
  PAYMENT_METHODS as DEFAULT_PAYMENT_METHODS,
  BILLING_CYCLES as DEFAULT_BILLING_CYCLES,
  DEBT_TYPES as DEFAULT_DEBT_TYPES,
  CURRENCIES as DEFAULT_CURRENCIES,
  EXPENSE_CATEGORIES as DEFAULT_EXPENSE_CATEGORIES,
  INCOME_CATEGORIES as DEFAULT_INCOME_CATEGORIES,
  type CategoryConfig,
} from '../lib/constants'
import type { LucideIcon } from 'lucide-react'

export interface AccountTypeOption {
  value: string
  label: string
  icon: string
  color: string
  is_active: boolean
}

export interface PaymentMethodOption {
  value: string
  label: string
  icon: string | null
  is_active: boolean
}

export interface BillingCycleOption {
  value: string
  label: string
  is_active: boolean
}

export interface DebtTypeOption {
  value: string
  label: string
  is_active: boolean
}

export interface CurrencyOption {
  code: string
  name: string
  symbol: string
  decimal_places: number
}

export interface CategoryOption {
  id: string
  slug: string | null
  name: string
  type: 'expense' | 'income'
  icon: string | null
  color: string | null
  is_system: boolean
  sort_order: number
}

export interface CategoryMapEntry {
  id: string
  slug: string | null
  name: string
  icon: LucideIcon
  color: string
  gradient: string
  is_system: boolean
}

interface ConfigState {
  loaded: boolean
  loading: boolean
  error: string | null
  accountTypes: AccountTypeOption[]
  paymentMethods: PaymentMethodOption[]
  billingCycles: BillingCycleOption[]
  debtTypes: DebtTypeOption[]
  currencies: CurrencyOption[]
  categories: CategoryOption[]
  expenseCategories: Record<string, CategoryMapEntry>
  incomeCategories: Record<string, CategoryMapEntry>
  loadConfig: () => Promise<void>
  refresh: () => Promise<void>
}

function buildCategoryMap(
  categories: CategoryOption[],
  type: 'expense' | 'income',
  defaults: Record<string, CategoryConfig>,
): Record<string, CategoryMapEntry> {
  const map: Record<string, CategoryMapEntry> = {}
  for (const cat of categories) {
    if (cat.type !== type) continue
    const fallback = defaults[cat.slug || cat.id] || defaults[cat.id]
    map[cat.id] = {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      icon: resolveIcon(cat.icon),
      color: cat.color || fallback?.color || '#6B7280',
      gradient: fallback?.gradient || 'from-gray-400 to-gray-600',
      is_system: cat.is_system,
    }
  }
  return map
}

export function findCategoryBySlug(
  map: Record<string, CategoryMapEntry>,
  slug: string | null | undefined,
): CategoryMapEntry | undefined {
  if (!slug) return undefined
  if (map[slug]) return map[slug]
  return (Object.values(map) || []).find((c) => c.slug === slug)
}

export const useConfigStore = create<ConfigState>()((set, get) => ({
  loaded: false,
  loading: false,
  error: null,

  accountTypes: DEFAULT_ACCOUNT_TYPES.map((t) => ({
    value: t.value,
    label: t.label,
    icon: t.icon,
    color: t.color,
    is_active: true,
  })),
  paymentMethods: DEFAULT_PAYMENT_METHODS.map((p) => ({
    value: p.value,
    label: p.label,
    icon: null,
    is_active: true,
  })),
  billingCycles: DEFAULT_BILLING_CYCLES.map((b) => ({
    value: b.value,
    label: b.label,
    is_active: true,
  })),
  debtTypes: DEFAULT_DEBT_TYPES.map((d) => ({
    value: d.value,
    label: d.label,
    is_active: true,
  })),
  currencies: DEFAULT_CURRENCIES.map((c) => ({
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    decimal_places: c.code === 'GNF' || c.code === 'XOF' ? 0 : 2,
  })),
  categories: [],

  expenseCategories: buildCategoryMap(
    [],
    'expense',
    DEFAULT_EXPENSE_CATEGORIES,
  ),
  incomeCategories: buildCategoryMap(
    [],
    'income',
    DEFAULT_INCOME_CATEGORIES,
  ),

  loadConfig: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true, error: null })
    try {
      const res = await api.get('/config')
      const data = res.data
      const categories: CategoryOption[] = Array.isArray(data.categories) ? data.categories : []

      set({
        loaded: true,
        loading: false,
        accountTypes: data.account_types || get().accountTypes,
        paymentMethods: data.payment_methods || get().paymentMethods,
        billingCycles: data.billing_cycles || get().billingCycles,
        debtTypes: data.debt_types || get().debtTypes,
        currencies: data.currencies || get().currencies,
        categories,
        expenseCategories: buildCategoryMap(categories, 'expense', DEFAULT_EXPENSE_CATEGORIES),
        incomeCategories: buildCategoryMap(categories, 'income', DEFAULT_INCOME_CATEGORIES),
      })
    } catch {
      set({ loaded: true, loading: false, error: 'Impossible de charger la configuration.' })
    }
  },

  refresh: async () => {
    set({ loaded: false, loading: true, error: null })
    try {
      const res = await api.get('/config')
      const data = res.data
      const categories: CategoryOption[] = Array.isArray(data.categories) ? data.categories : []
      set({
        loaded: true,
        loading: false,
        accountTypes: data.account_types || get().accountTypes,
        paymentMethods: data.payment_methods || get().paymentMethods,
        billingCycles: data.billing_cycles || get().billingCycles,
        debtTypes: data.debt_types || get().debtTypes,
        currencies: data.currencies || get().currencies,
        categories,
        expenseCategories: buildCategoryMap(categories, 'expense', DEFAULT_EXPENSE_CATEGORIES),
        incomeCategories: buildCategoryMap(categories, 'income', DEFAULT_INCOME_CATEGORIES),
      })
    } catch (e) {
      set({ loaded: true, loading: false, error: 'Impossible de charger la configuration.' })
    }
  },
}))
