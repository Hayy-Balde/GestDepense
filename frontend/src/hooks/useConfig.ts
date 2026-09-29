import { useConfigStore } from '../stores/configStore'
import { resolveIcon } from '../lib/iconMap'
import type { LucideIcon } from 'lucide-react'
import type { CategoryMapEntry } from '../stores/configStore'
export { findCategoryBySlug } from '../stores/configStore'

const FLAGS: Record<string, string> = {
  GNF: '🇬🇳',
  EUR: '🇪🇺',
  USD: '🇺🇸',
  GBP: '🇬🇧',
  XOF: '🏦',
}

export interface AccountTypeOption {
  value: string
  label: string
  icon: LucideIcon
  color: string
}

export interface CurrencyOption {
  code: string
  name: string
  symbol: string
  flag: string
}

export interface UseConfigResult {
  accountTypes: AccountTypeOption[]
  paymentMethods: { value: string; label: string }[]
  billingCycles: { value: string; label: string }[]
  debtTypes: { value: string; label: string }[]
  currencies: CurrencyOption[]
  expenseCategories: Record<string, CategoryMapEntry>
  incomeCategories: Record<string, CategoryMapEntry>
  categories: import('../stores/configStore').CategoryOption[]
  configError: string | null
  configLoading: boolean
  refreshConfig: () => Promise<void>
}

export function useConfig(): UseConfigResult {
  const accountTypes = useConfigStore((s) => s.accountTypes)
  const paymentMethods = useConfigStore((s) => s.paymentMethods)
  const billingCycles = useConfigStore((s) => s.billingCycles)
  const debtTypes = useConfigStore((s) => s.debtTypes)
  const currencies = useConfigStore((s) => s.currencies)
  const categories = useConfigStore((s) => s.categories)
  const expenseCategories = useConfigStore((s) => s.expenseCategories)
  const incomeCategories = useConfigStore((s) => s.incomeCategories)
  const configError = useConfigStore((s) => s.error)
  const configLoading = useConfigStore((s) => s.loading)
  const refreshConfig = useConfigStore((s) => s.refresh)

  return {
    accountTypes: accountTypes.map((t) => ({
      value: t.value,
      label: t.label,
      icon: resolveIcon(t.icon),
      color: t.color,
    })),
    paymentMethods: paymentMethods.map((p) => ({
      value: p.value,
      label: p.label,
    })),
    billingCycles: billingCycles.map((b) => ({
      value: b.value,
      label: b.label,
    })),
    debtTypes: debtTypes.map((d) => ({
      value: d.value,
      label: d.label,
    })),
    currencies: currencies.map((c) => ({
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      flag: FLAGS[c.code] || '',
    })),
    categories,
    expenseCategories,
    incomeCategories,
    configError,
    configLoading,
    refreshConfig,
  }
}
