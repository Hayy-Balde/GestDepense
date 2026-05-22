/**
 * Currency & number formatting utilities
 */

const currencyConfig: Record<string, { symbol: string; locale: string; decimals: number }> = {
  GNF: { symbol: 'FG', locale: 'fr-GN', decimals: 0 },
  EUR: { symbol: '€', locale: 'fr-FR', decimals: 2 },
  USD: { symbol: '$', locale: 'en-US', decimals: 2 },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 2 },
  XOF: { symbol: 'FCFA', locale: 'fr-FR', decimals: 0 },
}

export function formatCurrency(
  amount: number,
  currency: string = 'GNF',
  compact: boolean = false
): string {
  const config = currencyConfig[currency] ?? { symbol: currency, locale: 'fr-FR', decimals: 2 }

  if (compact && Math.abs(amount) >= 1_000_000) {
    const formatted = (amount / 1_000_000).toFixed(1)
    return `${formatted}M ${config.symbol}`
  }

  if (compact && Math.abs(amount) >= 1_000) {
    const formatted = (amount / 1_000).toFixed(1)
    return `${formatted}K ${config.symbol}`
  }

  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount)

  return `${formatted} ${config.symbol}`
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'relative') {
    return formatRelativeDate(d)
  }

  if (format === 'long') {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d)
  }

  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`
  return `Il y a ${Math.floor(diffDays / 365)} ans`
}

export function formatMonth(month: number, year: number): string {
  const date = new Date(year, month - 1)
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  return `${hours}h${minutes}`
}
