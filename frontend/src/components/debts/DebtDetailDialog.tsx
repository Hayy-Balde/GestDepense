import { CheckCircle, Wallet } from 'lucide-react'
import type { Debt } from '@/types'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { debtCurrency, isSettled, longDate, money, statusMeta } from './debtUtils'

interface Props {
  debt: Debt | null
  onClose: () => void
  onPay: (debt: Debt) => void
}

export default function DebtDetailDialog({ debt, onClose, onPay }: Props) {
  const open = debt !== null
  if (!debt) return null

  const currency = debtCurrency(debt)
  const settled = isSettled(debt)
  const meta = statusMeta(debt.status)
  const payments = [...(debt.payments ?? [])].sort((a, b) => b.date.localeCompare(a.date))
  const repaid = Number(debt.amount) - Number(debt.remaining_amount)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {debt.person_name}
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            {debt.person_contact || (debt.type === 'lent' ? 'Dette prêtée' : 'Dette empruntée')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-2">
          <div className="rounded-lg bg-[var(--muted)]/40 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">Initial</p>
            <p className="text-sm font-bold text-[var(--foreground)] mt-0.5">{money(debt.amount, currency)}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-amber-600">Reste dû</p>
            <p className="text-sm font-bold text-amber-600 mt-0.5">
              {money(debt.remaining_amount, currency)}
            </p>
          </div>
          <div className="rounded-lg bg-green-500/10 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-green-600">Remboursé</p>
            <p className="text-sm font-bold text-green-600 mt-0.5">{money(repaid, currency)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Wallet className="w-3.5 h-3.5" />
          <span>{debt.account?.name || 'Sans compte'}</span>
          {debt.due_date && (
            <>
              <span>•</span>
              <span className={debt.is_overdue && !settled ? 'text-red-500 font-semibold' : ''}>
                Échéance {longDate(debt.due_date)}
              </span>
            </>
          )}
        </div>

        {debt.description && (
          <p className="text-xs italic text-[var(--muted-foreground)] bg-[var(--muted)]/30 rounded-lg px-3 py-2">
            {debt.description}
          </p>
        )}

        <Separator />

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Paiements ({payments.length})
          </p>
          {payments.length === 0 ? (
            <p className="text-xs text-[var(--muted-foreground)] py-3 text-center">Aucun paiement enregistré.</p>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 text-xs px-2.5 py-2 rounded-lg bg-[var(--muted)]/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span className="font-semibold text-[var(--foreground)]">
                      {money(payment.amount, currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 text-[var(--muted-foreground)]">
                    <span className="shrink-0">{longDate(payment.date)}</span>
                    {payment.note && <span className="italic truncate">— {payment.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!settled && (
          <button
            type="button"
            onClick={() => onPay(debt)}
            className="w-full py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Ajouter un paiement
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
