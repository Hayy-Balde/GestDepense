import { differenceInCalendarDays, parseISO, startOfMonth, endOfMonth, subDays, subMonths, isWithinInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { format } from 'date-fns'
import type { Debt, DebtStatus } from '@/types'
import { formatCurrency as formatAmount } from '@/lib/formatters'
import { MONTHS } from '@/lib/constants'

export type DebtPeriodMode = 'all' | '30d' | '3m' | '6m' | '1y' | 'month'

export const DEBT_PERIOD_PRESETS: { label: string; value: DebtPeriodMode }[] = [
  { label: 'Tout', value: 'all' },
  { label: '30 j', value: '30d' },
  { label: '3 mois', value: '3m' },
  { label: '6 mois', value: '6m' },
  { label: '1 an', value: '1y' },
]

function parseMonth(value: string): { month: number; year: number } {
  const [y = 0, m = 1] = value.split('-').map(Number)
  return { month: m, year: y }
}

export function currentMonthValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function shiftMonth(value: string, offset: number): string {
  const { month, year } = parseMonth(value)
  const d = new Date(year, month - 1 + offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(value: string): string {
  const { month, year } = parseMonth(value)
  return `${MONTHS[month - 1] ?? month} ${year}`
}

export const DEFAULT_CURRENCY = 'GNF'

export function debtCurrency(debt: Pick<Debt, 'currency_code' | 'account'>, fallback = DEFAULT_CURRENCY): string {
  return debt.currency_code || debt.account?.currency_code || fallback
}

export function money(amount: number, currency: string): string {
  return formatAmount(Number(amount) || 0, currency)
}

export function longDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy', { locale: fr })
  } catch {
    return dateStr
  }
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  try {
    return differenceInCalendarDays(parseISO(dateStr), new Date())
  } catch {
    return null
  }
}

const STATUS_META: Record<DebtStatus, { label: string; variant: 'secondary' | 'warning' | 'success' }> = {
  pending: { label: 'En cours', variant: 'secondary' },
  partially_paid: { label: 'Partiellement remboursé', variant: 'warning' },
  paid: { label: 'Remboursé', variant: 'success' },
}

export function statusMeta(status: DebtStatus): { label: string; variant: 'secondary' | 'warning' | 'success' } {
  return STATUS_META[status] ?? STATUS_META.pending
}

export function isSettled(debt: Pick<Debt, 'status' | 'remaining_amount'>): boolean {
  return debt.status === 'paid' || Number(debt.remaining_amount) <= 0
}

export function progressTone(progress: number, settled: boolean): string {
  if (settled) return 'bg-green-500'
  if (progress >= 50) return 'bg-emerald-500'
  if (progress > 0) return 'bg-indigo-500'
  return 'bg-[var(--muted-foreground)]/30'
}

function createdAt(debt: Pick<Debt, 'created_at'>): Date | null {
  if (!debt.created_at) return null
  const d = parseISO(debt.created_at)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Une dette appartient à la période selon sa date de création, comme dans le
 * rapport : c'est ce jour-là que la trésorerie a bougé.
 */
export function isDebtInPeriod(
  debt: Pick<Debt, 'created_at'>,
  mode: DebtPeriodMode,
  month: string,
  now: Date = new Date()
): boolean {
  if (mode === 'all') return true

  const date = createdAt(debt)
  if (!date) return false

  if (mode === 'month') {
    const [y, m] = month.split('-').map(Number)
    if (!y || !m) return true
    return isWithinInterval(date, { start: startOfMonth(new Date(y, m - 1, 1)), end: endOfMonth(new Date(y, m - 1, 1)) })
  }

  const intervals: Record<Exclude<DebtPeriodMode, 'all' | 'month'>, Date> = {
    '30d': subDays(now, 30),
    '3m': subMonths(now, 3),
    '6m': subMonths(now, 6),
    '1y': subMonths(now, 12),
  }

  return date >= intervals[mode]
}
