import { useEffect, useState } from 'react'
import { expenseService } from '@/services/api'
import { useMonthStore } from '@/stores/monthStore'
import { useAuthStore } from '@/stores/authStore'
import type { ExpenseBilan } from '@/types/expense'
import { iconEmoji } from '@/lib/iconMap'
import { TrendingDown, TrendingUp, Wallet, Repeat, Zap, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MONTHS } from '@/lib/constants'

const EMPTY: ExpenseBilan = {
  total: 0,
  count: 0,
  average: 0,
  prev_average: 0,
  prev_total: 0,
  vs_last_month: 0,
  by_category: [],
  most_frequent_category: null,
  highest_amount_category: null,
}

export default function ExpenseBilan() {
  const { currentMonth, currentYear } = useMonthStore()
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'
  const [data, setData] = useState<ExpenseBilan>(EMPTY)
  const [loading, setLoading] = useState(true)

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n ?? 0)

  useEffect(() => {
    setLoading(true)
    expenseService
      .stats({ month: currentMonth, year: currentYear })
      .then((res) => setData(res.data || EMPTY))
      .catch(() => setData(EMPTY))
      .finally(() => setLoading(false))
  }, [currentMonth, currentYear])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  const vsIsUp = data.vs_last_month > 0
  const averageDelta = data.average - data.prev_average
  const hasPrev = data.prev_total > 0

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-[var(--primary)]" />
        <h3 className="font-semibold text-[var(--foreground)]">Bilan — {MONTHS[currentMonth - 1]} {currentYear}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-[var(--destructive)]" />
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Total dépensé</p>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {fmt(data.total)} {currency}
          </p>
          <p className={cn("text-xs mt-1 font-medium flex items-center gap-1", vsIsUp ? "text-[var(--destructive)]" : "text-[var(--success)]")}>
            {vsIsUp ? "▲" : "▼"} {Math.abs(data.vs_last_month).toFixed(1)}%
            {hasPrev ? ' vs mois dernier' : ' (aucun mois précédent)'}
          </p>
        </div>

        {/* Moyenne */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--primary)]" />
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Moyenne / dépense</p>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {fmt(data.average)} {currency}
          </p>
          <p className={cn("text-xs mt-1 font-medium", averageDelta > 0 ? "text-[var(--destructive)]" : averageDelta < 0 ? "text-[var(--success)]" : "text-[var(--muted-foreground)]")}>
            {averageDelta > 0 ? "▲" : averageDelta < 0 ? "▼" : ""}
            {averageDelta !== 0 ? ` ${fmt(Math.abs(averageDelta))} vs ${fmt(data.prev_average)}` : ' stable'}
            {hasPrev ? ' (mois dernier)' : ' (aucun mois précédent)'}
          </p>
        </div>

        {/* Catégorie la plus fréquente */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Repeat className="w-3.5 h-3.5 text-[var(--warning)]" />
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Catégorie la plus fréquente</p>
          </div>
          {data.most_frequent_category ? (
            <>
              <p className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 truncate">
                <span>{iconEmoji(data.most_frequent_category.icon)}</span>
                <span className="truncate">{data.most_frequent_category.category}</span>
              </p>
              <p className="text-xs mt-1 font-medium text-[var(--muted-foreground)]">
                {data.most_frequent_category.count} dépense(s) · {fmt(data.most_frequent_category.amount)} {currency}
              </p>
            </>
          ) : (
            <p className="text-xl font-bold text-[var(--muted-foreground)]">—</p>
          )}
        </div>

        {/* Catégorie au montant le plus élevé */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/10 p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-[var(--primary)]" />
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Plus gros poste de dépense</p>
          </div>
          {data.highest_amount_category ? (
            <>
              <p className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2 truncate">
                <span>{iconEmoji(data.highest_amount_category.icon)}</span>
                <span className="truncate">{data.highest_amount_category.category}</span>
              </p>
              <p className="text-xs mt-1 font-medium text-[var(--destructive)]">
                {fmt(data.highest_amount_category.amount)} {currency} · {data.highest_amount_category.percentage}% du total
              </p>
            </>
          ) : (
            <p className="text-xl font-bold text-[var(--muted-foreground)]">—</p>
          )}
        </div>
      </div>
    </div>
  )
}
