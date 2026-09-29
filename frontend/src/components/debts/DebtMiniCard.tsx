import { ArrowDownLeft, ArrowUpRight, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Debt } from '@/types'
import { Progress } from '@/components/ui/progress'
import { debtCurrency, isSettled, money, progressTone } from './debtUtils'

interface Props {
  debt: Debt
  onPay: (debt: Debt) => void
  onEdit: (debt: Debt) => void
  onDelete: (debt: Debt) => void
  busyId: string | null
}

export default function DebtMiniCard({ debt, onPay, onEdit, onDelete, busyId }: Props) {
  const currency = debtCurrency(debt)
  const settled = isSettled(debt)
  const Lent = debt.type === 'lent'

  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div
        className={`flex items-center justify-center w-6 h-6 shrink-0 rounded-md ${
          Lent ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
        }`}
      >
        {Lent ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--foreground)] truncate">{debt.person_name}</span>
          {debt.is_overdue && !settled && (
            <span className="text-[10px] font-bold text-red-500 shrink-0">RETARD</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[11px] font-bold ${settled ? 'text-green-600' : 'text-amber-600'}`}>
            {money(debt.remaining_amount, currency)}
          </span>
          <span className="text-[10px] text-[var(--muted-foreground)]">/ {money(debt.amount, currency)}</span>
        </div>
      </div>

      <div className="w-12 shrink-0">
        <Progress
          value={debt.progress}
          className="h-1"
          indicatorClassName={progressTone(debt.progress, settled)}
        />
        <p className="text-[9px] text-center text-[var(--muted-foreground)] mt-0.5">{debt.progress}%</p>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => onPay(debt)}
          disabled={settled}
          aria-label="Ajouter un paiement"
          className="w-6 h-6 flex items-center justify-center rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onEdit(debt)}
          aria-label="Modifier la dette"
          className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(debt)}
          disabled={busyId === debt.id}
          aria-label="Supprimer la dette"
          className="w-6 h-6 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 transition-colors cursor-pointer"
        >
          {busyId === debt.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  )
}
