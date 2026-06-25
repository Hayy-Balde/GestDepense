/* ============================================
   Auth Types
   ============================================ */

export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  avatar?: string | null
  currency_code: string
  timezone: string
  locale: string
  preferences: UserPreferences
  email_verified_at: string | null
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  compact_mode: boolean
  notifications_enabled: boolean
  weekly_report: boolean
  monthly_report: boolean
}

export interface LoginRequest {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
  currency_code: string
}

export interface AuthResponse {
  user: User
  token: string
  message: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  email: string
  token: string
  password: string
  password_confirmation: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
  avatar?: File | null
  currency_code?: string
  timezone?: string
  locale?: string
  preferences?: Partial<UserPreferences>
}
