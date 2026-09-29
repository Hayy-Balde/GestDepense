import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { PAYMENT_METHODS, PAYMENT_METHOD_ICONS, PAYMENT_METHODS_BY_ACCOUNT_TYPE, DEFAULT_PAYMENT_METHODS } from '../../lib/constants'
import type { IncomeFormData } from '../../types/income'
import type { Account } from '../../types/account'
import type { Category } from '../../types/index'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Separator } from '../ui/separator'
import { Loader2, AlertCircle, Check } from 'lucide-react'
import { useToastStore } from '../../stores/toastStore'

interface IncomeFormProps {
  onSuccess: () => void
  onCancel?: () => void
}

export default function IncomeForm({ onSuccess, onCancel }: IncomeFormProps) {
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { success: toastSuccess, error: toastError } = useToastStore()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<IncomeFormData>({
    defaultValues: {
      title: '',
      amount: undefined as unknown as number,
      currency_code: currency,
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      category_id: '',
      account_id: '',
      description: '',
      is_recurring: false,
      recurrence_rule: '',
    },
  })

  const isRecurring = useWatch({ control, name: 'is_recurring' })
  const accountId = useWatch({ control, name: 'account_id' })
  const paymentMethod = useWatch({ control, name: 'payment_method' })

  const selectedAccount = accounts.find((a) => a.id === accountId)
  const accountType = selectedAccount?.type ?? 'bank'
  const availablePaymentMethods = PAYMENT_METHODS.filter((m) =>
    (PAYMENT_METHODS_BY_ACCOUNT_TYPE[accountType] ?? DEFAULT_PAYMENT_METHODS).includes(m.value)
  )
  const firstAvailableMethod = availablePaymentMethods[0]

  useEffect(() => {
    if (firstAvailableMethod && !availablePaymentMethods.some((m) => m.value === paymentMethod)) {
      setValue('payment_method', firstAvailableMethod.value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset payment method when account changes
  }, [accountId])

  useEffect(() => {
    Promise.all([api.get('/accounts'), api.get('/categories')])
      .then(([accountsRes, categoriesRes]) => {
        const accs = accountsRes.data?.data || accountsRes.data || []
        const cats = categoriesRes.data?.data || categoriesRes.data || []
        const list = Array.isArray(accs) ? accs : []
        setAccounts(list)
        if (list.length > 0) setValue('account_id', list[0].id)

        const incomeCats = (Array.isArray(cats) ? cats : []).filter((c: Category) => c.type === 'income')
        setCategories(incomeCats)
        if (incomeCats.length > 0) setValue('category_id', incomeCats[0].id)
      })
      .catch(() => {
        setAccounts([])
        setCategories([])
      })
  }, [setValue])

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await api.post('/incomes', data)
      toastSuccess((res.data as { message?: string })?.message || 'Revenu enregistré avec succès.')
      onSuccess()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      const msg = error.response?.data?.message || 'Erreur lors de la création du revenu.'
      setSubmitError(msg)
      toastError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {submitError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start space-x-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs">{submitError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="title">Titre</Label>
          <Input id="title" {...register('title', { required: 'Le titre est requis' })} placeholder="Salaire, Freelance, Vente..." />
          {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Montant</Label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0"
              className="pr-14"
              {...register('amount', {
                required: 'Le montant est requis',
                min: { value: 0.01, message: 'Doit être supérieur à 0' },
              })}
            />
            <div className="absolute right-3 top-2.5 text-xs font-bold text-[var(--muted-foreground)] uppercase pointer-events-none">
              {currency}
            </div>
          </div>
          {errors.amount && <p className="text-xs text-red-500 font-medium">{errors.amount.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register('date', { required: 'La date est requise' })} />
          {errors.date && <p className="text-xs text-red-500 font-medium">{errors.date.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category_id">Catégorie</Label>
          <select
            id="category_id"
            {...register('category_id')}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Choisir une catégorie --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="account_id">Compte</Label>
          <select
            id="account_id"
            {...register('account_id', {
              onChange: () => {
                if (firstAvailableMethod) setValue('payment_method', firstAvailableMethod.value)
              },
            })}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Choisir un compte --</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency_code})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment_method">Moyen de réception</Label>
          <select
            id="payment_method"
            {...register('payment_method')}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {availablePaymentMethods.map((m) => (
              <option key={m.value} value={m.value}>
                {PAYMENT_METHOD_ICONS[m.value] ?? '❓'} {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register('description')} placeholder="Détails supplémentaires..." rows={2} />
        </div>

        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center space-x-2">
            <input id="is_recurring" type="checkbox" {...register('is_recurring')} className="rounded border-[var(--border)] text-green-600 focus:ring-green-500" />
            <Label htmlFor="is_recurring" className="text-sm cursor-pointer">Revenu récurrent</Label>
          </div>
          {isRecurring && (
            <div className="space-y-1.5">
              <Label htmlFor="recurrence_rule">Règle de récurrence</Label>
              <Input id="recurrence_rule" {...register('recurrence_rule')} placeholder="mensuel, hebdomadaire, annuel..." />
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors cursor-pointer"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center space-x-2 px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Ajouter le revenu</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}