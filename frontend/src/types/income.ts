/* ============================================
   Income Types
   ============================================ */

import type { PaymentMethod } from './expense'

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
  payment_method: PaymentMethod
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
  payment_method: PaymentMethod
  category_id: string
  account_id: string
  is_recurring: boolean
  recurrence_rule?: string
}

export interface IncomeStats {
  total: number
  count: number
  average: number
  by_category: { category_id: string; category: string; icon: string; amount: number; percentage: number }[]
  by_month: { month: string; amount: number }[]
  vs_last_month: number
}
