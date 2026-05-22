/* ============================================
   Expense Types
   ============================================ */

export type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money' | 'credit_card' | 'debit_card' | 'check' | 'other'
export type TransactionStatus = 'completed' | 'pending' | 'cancelled'

export interface Expense {
  id: string
  user_id: string
  account_id: string
  caisse_id: string | null
  category_id: string
  sub_category_id: string | null
  title: string
  description: string | null
  amount: number
  currency_code: string
  date: string
  time: string | null
  payment_method: PaymentMethod
  is_recurring: boolean
  recurrence_rule: string | null
  status: TransactionStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Relations
  account?: { id: string; name: string; type: string }
  category?: { id: string; name: string; icon: string; color: string }
  sub_category?: { id: string; name: string } | null
  caisse?: { id: string; name: string } | null
  tags?: { id: string; name: string; color: string }[]
  attachments?: { id: string; file_name: string; file_path: string; mime_type: string }[]
}

export interface ExpenseFormData {
  title: string
  description?: string
  amount: number
  currency_code: string
  date: string
  time?: string
  category_id: string
  sub_category_id?: string
  account_id: string
  caisse_id?: string
  payment_method: PaymentMethod
  is_recurring: boolean
  recurrence_rule?: string
  status: TransactionStatus
  notes?: string
  tags?: string[]
}

export interface ExpenseFilters {
  search?: string
  category_id?: string
  account_id?: string
  caisse_id?: string
  payment_method?: PaymentMethod
  status?: TransactionStatus
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  month?: number
  year?: number
}

export interface ExpenseStats {
  total: number
  count: number
  average: number
  max: number
  by_category: { category: string; amount: number; color: string; percentage: number }[]
  by_day: { date: string; amount: number }[]
  vs_last_month: number
}
