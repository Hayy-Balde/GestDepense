/* ============================================
   Caisse Types
   ============================================ */

export interface Caisse {
  id: string
  user_id: string
  name: string
  budget_amount: number
  spent_amount: number
  icon: string
  color: string
  description: string | null
  created_at: string
  updated_at: string
  remaining: number
  percentage_used: number
}

export interface CaisseFormData {
  name: string
  budget_amount: number
  icon: string
  color: string
  description?: string
}

/* ============================================
   Saving Types
   ============================================ */

export type SavingStatus = 'active' | 'completed' | 'cancelled'

export interface Saving {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string
  color: string
  auto_save_amount: number | null
  auto_save_frequency: string | null
  status: SavingStatus
  created_at: string
  updated_at: string
  progress: number
  remaining: number
  transactions?: SavingTransaction[]
}

export interface SavingTransaction {
  id: string
  saving_id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  date: string
  note: string | null
}

export interface SavingFormData {
  name: string
  target_amount: number
  deadline?: string
  icon: string
  color: string
  auto_save_amount?: number
  auto_save_frequency?: string
}

/* ============================================
   Budget Types
   ============================================ */

export interface Budget {
  id: string
  user_id: string
  month: number
  year: number
  total_budget: number
  notes: string | null
  created_at: string
  updated_at: string
  total_spent: number
  remaining: number
  categories: BudgetCategory[]
}

export interface BudgetCategory {
  id: string
  budget_id: string
  category_id: string
  allocated_amount: number
  spent_amount: number
  category?: { id: string; name: string; icon: string; color: string }
  remaining: number
  percentage_used: number
}

export interface BudgetFormData {
  month: number
  year: number
  total_budget: number
  notes?: string
  categories: { category_id: string; allocated_amount: number }[]
}

/* ============================================
   Subscription Types
   ============================================ */

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface Subscription {
  id: string
  user_id: string
  account_id: string | null
  name: string
  amount: number
  currency_code: string
  billing_cycle: BillingCycle
  next_billing_date: string
  icon: string
  color: string
  url: string | null
  is_active: boolean
  reminder_days_before: number
  created_at: string
  updated_at: string
  annual_cost: number
}

export interface SubscriptionFormData {
  name: string
  amount: number
  currency_code: string
  billing_cycle: BillingCycle
  next_billing_date: string
  account_id?: string
  icon: string
  color: string
  url?: string
  is_active: boolean
  reminder_days_before: number
}

/* ============================================
   Debt Types
   ============================================ */

export type DebtType = 'lent' | 'borrowed'
export type DebtStatus = 'active' | 'partially_paid' | 'paid' | 'overdue'

export interface Debt {
  id: string
  user_id: string
  type: DebtType
  person_name: string
  person_contact: string | null
  amount: number
  remaining_amount: number
  currency_code: string
  due_date: string | null
  description: string | null
  status: DebtStatus
  created_at: string
  updated_at: string
  payments?: DebtPayment[]
  progress: number
}

export interface DebtPayment {
  id: string
  debt_id: string
  amount: number
  date: string
  note: string | null
}

export interface DebtFormData {
  type: DebtType
  person_name: string
  person_contact?: string
  amount: number
  currency_code: string
  due_date?: string
  description?: string
}

/* ============================================
   Dashboard Types
   ============================================ */

export interface DashboardOverview {
  total_expenses: number
  total_incomes: number
  available_balance: number
  total_savings: number
  expense_trend: number
  income_trend: number
  savings_rate: number
}

export interface MonthlySummary {
  month: number
  year: number
  incomes: number
  expenses: number
  savings: number
  surplus: number
  top_categories: { name: string; amount: number; color: string; icon: string }[]
  daily_spending: { date: string; amount: number }[]
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  color: string
  icon: string
  count: number
}

export interface TrendData {
  month: string
  incomes: number
  expenses: number
  savings: number
}

export interface RecentTransaction {
  id: string
  type: 'expense' | 'income'
  title: string
  amount: number
  date: string
  category_name: string
  category_color: string
  category_icon: string
  account_name: string
}

/* ============================================
   Category Types
   ============================================ */

export type CategoryTypeEnum = 'expense' | 'income'

export interface Category {
  id: string
  user_id: string | null
  name: string
  type: CategoryTypeEnum
  icon: string
  color: string
  is_system: boolean
  sort_order: number
  sub_categories?: SubCategory[]
}

export interface SubCategory {
  id: string
  category_id: string
  name: string
  icon: string | null
}

/* ============================================
   Notification Types
   ============================================ */

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}
