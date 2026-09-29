import { ArrowDownLeft, ArrowUpRight, Calendar, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Debt } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  debtCurrency,
  daysUntil,
  isSettled,
  longDate,
  money,
  progressTone,
  statusMeta,
} from './debtUtils'

interface Props {
  debts: Debt[]
  onPay: (debt: Debt) => void
  onEdit: (debt: Debt) => void
  onDelete: (debt: Debt) => void
  onOpenDetail: (debt: Debt) => void
  busyId: string | null
}

const TH = 'px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]'

export default function DebtTable({ debts, onPay, onEdit, onDelete, onOpenDetail, busyId }: Props) {
  return (
    <Card className="hidden lg:block overflow-hidden border border-[var(--border)] bg-[var(--card)] rounded-xl shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/20">
                <th className={TH}>Personne</th>
                <th className={TH}>Montant</th>
                <th className={`${TH} text-right`}>Reste dû</th>
                <th className={TH}>Progression</th>
                <th className={TH}>Échéance</th>
                <th className={TH}>Statut</th>
                <th className={TH}>Compte</th>
                <th className={`${TH} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {debts.map((debt) => {
                const currency = debtCurrency(debt)
                const settled = isSettled(debt)
                const meta = statusMeta(debt.status)
                const due = daysUntil(debt.due_date)
                const Lent = debt.type === 'lent'

                return (
                  <tr
                    key={debt.id}
                    className="group hover:bg-[var(--muted)]/10 transition-colors duration-200"
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap max-w-[220px]">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                            Lent ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                          }`}
                        >
                          {Lent ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenDetail(debt)}
                          className="text-left min-w-0 cursor-pointer group/name"
                        >
                          <div className="text-sm font-semibold text-[var(--foreground)] truncate group-hover/name:underline">
                            {debt.person_name}
                          </div>
                          <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                            {debt.person_contact || (debt.payments?.length ? `${debt.payments.length} paiement(s)` : '—')}
                          </div>
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[var(--foreground)]">
                      {money(debt.amount, currency)}
                    </td>

                    <td
                      className={`px-4 py-2.5 whitespace-nowrap text-right text-sm font-bold ${
                        settled ? 'text-green-600' : 'text-amber-600'
                      }`}
                    >
                      {money(debt.remaining_amount, currency)}
                    </td>

                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2 w-28">
                        <Progress
                          value={debt.progress}
                          className="h-1.5 flex-1"
                          indicatorClassName={progressTone(debt.progress, settled)}
                        />
                        <span className="text-[11px] font-semibold text-[var(--muted-foreground)] w-8 text-right">
                          {debt.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {debt.due_date ? (
                        <div
                          className={`flex items-center space-x-1.5 text-xs ${
                            debt.is_overdue && !settled
                              ? 'text-red-500 font-semibold'
                              : 'text-[var(--muted-foreground)]'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{longDate(debt.due_date)}</span>
                          {!settled && due !== null && (
                            <span className="text-[10px] opacity-80">
                              {due < 0 ? `+${Math.abs(due)}j` : `${due}j`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]/50">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                        {debt.is_overdue && !settled && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Retard
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[var(--muted-foreground)] max-w-[140px] truncate">
                      {debt.account?.name || 'Sans compte'}
                    </td>

                    <td className="px-4 py-2.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => onPay(debt)}
                          disabled={settled}
                          title="Ajouter un paiement"
                          aria-label="Ajouter un paiement"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(debt)}
                          title="Modifier"
                          aria-label="Modifier la dette"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(debt)}
                          disabled={busyId === debt.id}
                          title="Supprimer"
                          aria-label="Supprimer la dette"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {busyId === debt.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
