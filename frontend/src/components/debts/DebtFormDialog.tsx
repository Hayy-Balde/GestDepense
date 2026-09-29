import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import type { Debt, DebtFormData, DebtType } from '@/types'
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
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Debt | null
  accounts: Account[]
  caisses: Caisse[]
  debtTypes: { value: string; label: string }[]
  currencies: { code: string; name: string }[]
  defaultCurrency: string
  saving: boolean
  onSubmit: (data: DebtFormData) => Promise<void>
}

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

export default function DebtFormDialog({
  open,
  onOpenChange,
  editing,
  accounts,
  caisses,
  debtTypes,
  currencies,
  defaultCurrency,
  saving,
  onSubmit,
}: Props) {
  const form = useForm<DebtFormData>({
    defaultValues: {
      type: 'lent',
      person_name: '',
      person_contact: '',
      amount: 0,
      currency_code: defaultCurrency,
      due_date: '',
      description: '',
      account_id: '',
      caisse_id: '',
    },
  })
  const { register, handleSubmit, reset, setValue, clearErrors, watch, formState } = form
  const targets = toTargets(accounts, caisses)
  const type = useWatch({ control: form.control, name: 'type' })

  // Une caisse ne peut pas recevoir d'argent : si l'utilisateur bascule un prêt
  // en emprunt, la caisse choisie devient invalide et on la vide plutôt que de
  // lui laisser un champ qui échouera à l'enregistrement.
  useEffect(() => {
    if (type === 'borrowed' && watch('caisse_id')) {
      setValue('caisse_id', undefined, { shouldValidate: true })
    }
  }, [type, watch, setValue])

  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        type: editing.type,
        person_name: editing.person_name,
        person_contact: editing.person_contact || '',
        amount: Number(editing.amount),
        currency_code: editing.currency_code || defaultCurrency,
        due_date: editing.due_date || '',
        description: editing.description || '',
        account_id: editing.account_id || '',
        caisse_id: editing.caisse_id || '',
      })
    } else {
      reset({
        type: 'lent',
        person_name: '',
        person_contact: '',
        amount: 0,
        currency_code: defaultCurrency,
        due_date: '',
        description: '',
        account_id: accounts[0]?.id ?? '',
        caisse_id: '',
      })
    }
  }, [open, editing, accounts, defaultCurrency, reset])

  const submit = handleSubmit(async (data) => {
    const payload: DebtFormData = {
      ...data,
      amount: Number(data.amount),
      person_contact: data.person_contact?.trim() || undefined,
      due_date: data.due_date || undefined,
      description: data.description?.trim() || undefined,
    }
    try {
      await onSubmit(payload)
      onOpenChange(false)
    } catch {
      // error surfaced by the page toast
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editing ? 'Modifier la dette' : 'Nouvelle dette'}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `Modifiez les informations de la dette de ${editing.person_name}.`
              : "Enregistrez l'argent que vous prêtez ou empruntez."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 mt-2">
          <div>
            <Label>Type</Label>
            <div className="flex space-x-2 mt-1.5">
              {debtTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setValue('type', t.value as DebtType)}
                  className={cn(
                    'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer',
                    type === t.value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="person_name">Nom de la personne *</Label>
              <Input
                id="person_name"
                {...register('person_name', { required: true })}
                placeholder="Jean Dupont"
              />
              {formState.errors.person_name && (
                <p className="text-xs text-red-500 font-medium">Le nom est requis.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="person_contact">Contact</Label>
              <Input
                id="person_contact"
                {...register('person_contact')}
                placeholder="Téléphone ou email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Montant *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1"
                {...register('amount', { required: true, valueAsNumber: true, min: 0.01 })}
                placeholder="500000"
              />
              {formState.errors.amount && (
                <p className="text-xs text-red-500 font-medium">Montant invalide.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency_code">Devise</Label>
              <select id="currency_code" {...register('currency_code')} className={SELECT_CLASS}>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <TargetSelect
            id="debt-target"
            label={
              type === 'lent'
                ? "Source — d'où part l'argent"
                : "Réception — où arrive l'argent"
            }
            required
            // Un emprunt fait entrer l'argent : une caisse ne peut pas être
            // alimentée par un flux entrant, seuls les comptes conviennent.
            accountsOnly={type === 'borrowed'}
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
            <Label htmlFor="due_date">Date d'échéance</Label>
            <Input id="due_date" type="date" {...register('due_date')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Motif du prêt..."
              rows={2}
            />
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
              {editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
