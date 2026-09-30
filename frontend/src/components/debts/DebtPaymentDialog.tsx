import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import type { Debt, DebtPaymentFormData } from '@/types'
import type { Account } from '@/types/account'
import type { Caisse } from '@/types'
import { toTargets } from '@/hooks/useTargets'
import TargetSelect from '@/components/money/TargetSelect'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { debtCurrency, money } from './debtUtils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  debt: Debt | null
  accounts: Account[]
  caisses: Caisse[]
  saving: boolean
  error: string | null
  onSubmit: (data: DebtPaymentFormData) => Promise<void>
}

export default function DebtPaymentDialog({
  open,
  onOpenChange,
  debt,
  accounts,
  caisses,
  saving,
  error,
  onSubmit,
}: Props) {
  const form = useForm<DebtPaymentFormData>({
    defaultValues: {
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
      account_id: undefined,
      caisse_id: undefined,
    },
  })
  const { register, handleSubmit, reset, formState, watch, setValue, clearErrors } = form
  const targets = toTargets(accounts, caisses)

  useEffect(() => {
    if (!open) return
    // On repart de la cible liée à la dette si elle existe : c'est le compte ou
    // la caisse que l'utilisateur a choisi à la création, le plus probable.
    reset({
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
      account_id: debt?.account_id ?? accounts[0]?.id ?? undefined,
      caisse_id: debt?.caisse_id ?? undefined,
    })
  }, [open, debt, accounts, reset])

  const submit = handleSubmit(async (data) => {
    const payload: DebtPaymentFormData = {
      amount: Number(data.amount),
      date: data.date,
      note: data.note?.trim() || undefined,
      account_id: data.account_id ?? undefined,
      caisse_id: data.caisse_id ?? undefined,
    }
    try {
      await onSubmit(payload)
      onOpenChange(false)
    } catch {
      // error surfaced by the page
    }
  })

  const currency = debt ? debtCurrency(debt) : 'GNF'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Ajouter un paiement</DialogTitle>
          <DialogDescription>
            {debt && (
              <>
                Pour {debt.person_name} — Reste : {money(debt.remaining_amount, currency)}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start space-x-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">Montant *</Label>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              step="1"
              {...register('amount', { required: true, valueAsNumber: true, min: 0.01 })}
              placeholder="100000"
            />
            {formState.errors.amount && (
              <p className="text-xs text-red-500 font-medium">Montant invalide.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-date">Date</Label>
            <Input id="payment-date" type="date" {...register('date', { required: true })} />
          </div>

          <TargetSelect
            id="payment-target"
            label={
              debt?.type === 'lent'
                ? "Remboursement reçu — sur quoi l'argent arrive"
                : "Remboursement versé — d'où l'argent sort"
            }
            required
            // Recevoir un remboursement crédite un compte : une caisse ne peut
            // pas être alimentée par un flux entrant.
            accountsOnly={debt?.type === 'lent'}
            value={{ account_id: watch('account_id'), caisse_id: watch('caisse_id') }}
            targets={targets}
            onChange={(v) => {
              setValue('account_id', v.account_id ?? undefined, { shouldValidate: true })
              setValue('caisse_id', v.caisse_id ?? undefined, { shouldValidate: true })
              clearErrors(['account_id', 'caisse_id'])
            }}
            error={
              (formState.errors.account_id?.message as string) ??
              (formState.errors.caisse_id?.message as string) ??
              undefined
            }
          />

          <div className="space-y-1.5">
            <Label htmlFor="payment-note">Note</Label>
            <Textarea id="payment-note" {...register('note')} placeholder="Optionnel..." rows={2} />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="bg-indigo-600 text-white hover:bg-indigo-700 inline-flex items-center"
            >
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
