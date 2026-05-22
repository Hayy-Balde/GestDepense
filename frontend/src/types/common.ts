/* ============================================
   Common API Types
   ============================================ */

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status: number
}

export interface SelectOption {
  value: string
  label: string
  icon?: string
  color?: string
}

export interface DateRange {
  from: string
  to: string
}

export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterParams {
  search?: string
  category_id?: string
  account_id?: string
  caisse_id?: string
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  month?: number
  year?: number
  status?: string
  payment_method?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  per_page?: number
  page?: number
}
