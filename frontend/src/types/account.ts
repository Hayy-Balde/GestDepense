/* ============================================
   Account Types
   ============================================ */

export type AccountType = 'bank' | 'cash' | 'mobile_money' | 'wallet' | 'crypto' | 'savings' | 'credit_card'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  currency_code: string
  color: string
  icon: string
  is_active: boolean
  credit_limit: number | null
  created_at: string
  updated_at: string
}

export interface AccountFormData {
  name: string
  type: AccountType
  balance: number
  currency_code: string
  color: string
  icon: string
  is_active: boolean
  credit_limit?: number | null
}

export interface AccountSummary {
  total_balance: number
  total_accounts: number
  by_type: Record<AccountType, { count: number; balance: number }>
}
