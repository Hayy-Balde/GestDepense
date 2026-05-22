/* ============================================
   Income Types
   ============================================ */

export type IncomeSourceType = 'salary' | 'business' | 'freelance' | 'gift' | 'investment' | 'other'

export interface Income {
  id: string
  user_id: string
  account_id: string
  category_id: string
  title: string
  description: string | null
  amount: number
  currency_code: string
  date: string
  source_type: IncomeSourceType
  is_recurring: boolean
  recurrence_rule: string | null
  created_at: string
  updated_at: string
  account?: { id: string; name: string; type: string }
  category?: { id: string; name: string; icon: string; color: string }
}

export interface IncomeFormData {
  title: string
  description?: string
  amount: number
  currency_code: string
  date: string
  source_type: IncomeSourceType
  category_id: string
  account_id: string
  is_recurring: boolean
  recurrence_rule?: string
}

export interface IncomeStats {
  total: number
  count: number
  average: number
  by_source: { source: IncomeSourceType; amount: number; percentage: number }[]
  by_month: { month: string; amount: number }[]
  vs_last_month: number
}
