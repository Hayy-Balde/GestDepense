import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { expenseService, accountService, categoryService, api } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Account } from '../../types/account'
import { Category } from '../../types/index'
import type { Caisse } from '../../types'
import { PAYMENT_METHODS, PAYMENT_METHOD_ICONS, PAYMENT_METHODS_BY_ACCOUNT_TYPE, DEFAULT_PAYMENT_METHODS } from '../../lib/constants'
import { iconEmoji } from '../../lib/iconMap'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { useToastStore } from '../../stores/toastStore'

// Zod Validation Schema
const expenseSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(255, 'Titre trop long'),
  amount: z.coerce.number().min(0.01, 'Le montant doit être supérieur à 0'),
  date: z.string().min(1, 'La date est requise'),
  account_id: z.string().uuid('Veuillez sélectionner un compte valide'),
  category_id: z.string().uuid('Veuillez sélectionner une catégorie valide'),
  currency_code: z.string().min(3).max(3).toUpperCase(),
  payment_method: z.enum(['cash', 'bank_transfer', 'mobile_money', 'credit_card', 'debit_card', 'check', 'other']),
  status: z.enum(['completed', 'pending', 'cancelled']),
  description: z.string().optional(),
  caisse_id: z.union([z.string().uuid('Caisse invalide'), z.literal('')]).optional().nullable(),
})

type ExpenseFormInput = z.input<typeof expenseSchema>
type ExpenseFormValues = z.output<typeof expenseSchema>

const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map((m) => ({
  value: m.value,
  label: m.label,
  icon: PAYMENT_METHOD_ICONS[m.value] ?? '❓',
}))

interface ExpenseFormProps {
  onSuccess: () => void
  onCancel?: () => void
}

export default function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { user } = useAuthStore()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [errorOptions, setErrorOptions] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { success: toastSuccess, error: toastError } = useToastStore()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors }
  } = useForm<ExpenseFormInput, undefined, ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: undefined,
      date: new Date().toISOString().split('T')[0],
      account_id: '',
      category_id: '',
      currency_code: user?.currency_code || 'GNF',
      payment_method: 'credit_card',
      status: 'completed',
      description: '',
      caisse_id: null,
    }
  })

  const accountId = useWatch({ control, name: 'account_id' })
  const paymentMethod = useWatch({ control, name: 'payment_method' })
  const selectedAccount = accounts.find((a) => a.id === accountId)
  const accountType = selectedAccount?.type ?? 'bank'
  const availablePaymentMethods = PAYMENT_METHOD_OPTIONS.filter((m) =>
    (PAYMENT_METHODS_BY_ACCOUNT_TYPE[accountType] ?? DEFAULT_PAYMENT_METHODS).includes(m.value)
  )
  const firstAvailableMethod = availablePaymentMethods[0]

  useEffect(() => {
    if (firstAvailableMethod && !availablePaymentMethods.some((m) => m.value === paymentMethod)) {
      setValue('payment_method', firstAvailableMethod.value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset payment method when account changes
  }, [accountId])

  // Load Accounts, Caisses & Categories
  useEffect(() => {
    Promise.all([accountService.getAll(), api.get('/caisses'), categoryService.getAll()])
      .then(([accountsRes, caissesRes, categoriesRes]) => {
        const accs = accountsRes.data.data ? accountsRes.data.data : accountsRes.data
        const caissesList = caissesRes.data.data ? caissesRes.data.data : caissesRes.data
        const cats = categoriesRes.data.data ? categoriesRes.data.data : categoriesRes.data

        setAccounts(accs)
        setCaisses(Array.isArray(caissesList) ? caissesList.filter((c: Caisse) => c.status !== 'closed') : [])

        // Filter only expense categories
        const expenseCats = cats.filter((c: Category) => c.type === 'expense')
        setCategories(expenseCats)

        // Set default selects if available
        if (accs.length > 0) setValue('account_id', accs[0].id)
        if (expenseCats.length > 0) setValue('category_id', expenseCats[0].id)

        setLoadingOptions(false)
      })
      .catch(() => {
        setErrorOptions('Impossible de charger les comptes et catégories.')
        setLoadingOptions(false)
      })
  }, [setValue])

  const onSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await expenseService.create({ ...data, caisse_id: data.caisse_id || null })
      toastSuccess((res.data as { message?: string })?.message || 'Dépense enregistrée avec succès.')
      onSuccess()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      const msg = err.response?.data?.message || 'Erreur lors de la création de la dépense.'
      setSubmitError(msg)
      toastError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingOptions) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-[var(--muted-foreground)]">Chargement des options de paiement...</p>
      </div>
    )
  }

  if (errorOptions) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start space-x-3 text-red-600 dark:text-red-400">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm">Erreur d'initialisation</h4>
          <p className="text-xs mt-1">{errorOptions}</p>
        </div>
      </div>
    )
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
        {/* Title */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Titre</label>
          <input
            {...register('title')}
            type="text"
            placeholder="Abonnement Netflix, Uber, Déjeuner..."
            className="w-full px-3.5 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]/50"
          />
          {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title.message?.toString()}</p>}
        </div>

        {/* Amount & Currency */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Montant</label>
          <div className="relative">
            <input
              {...register('amount')}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full pl-3.5 pr-14 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]/50"
            />
            <div className="absolute right-3 top-2.5 text-xs font-bold text-[var(--muted-foreground)] uppercase">
              {user?.currency_code || 'GNF'}
            </div>
          </div>
          {errors.amount && <p className="text-xs text-red-500 font-medium">{errors.amount.message?.toString()}</p>}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Date</label>
          <input
            {...register('date')}
            type="date"
            className="w-full px-3.5 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          />
          {errors.date && <p className="text-xs text-red-500 font-medium">{errors.date.message?.toString()}</p>}
        </div>

        {/* Account Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Compte</label>
          <select
            {...register('account_id', {
              onChange: () => {
                if (firstAvailableMethod) {
                  setValue('payment_method', firstAvailableMethod.value)
                }
              },
            })}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.balance.toLocaleString()} {acc.currency_code})
              </option>
            ))}
          </select>
          {errors.account_id && <p className="text-xs text-red-500 font-medium">{errors.account_id.message?.toString()}</p>}
        </div>

        {/* Category Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Catégorie</label>
          <select
            {...register('category_id')}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {iconEmoji(cat.icon)} {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="text-xs text-red-500 font-medium">{errors.category_id.message?.toString()}</p>}
        </div>

        {/* Caisse (optional) */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Caisse (optionnel)</label>
          <select
            {...register('caisse_id')}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          >
            <option value="">— Aucune —</option>
            {caisses.map(c => (
              <option key={c.id} value={c.id}>
                {c.icon || '🎯'} {c.name} (restant : {Number(c.remaining).toLocaleString()} )
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--muted-foreground)]">
            Si une caisse est choisie, la dépense sera débitée de la caisse (et non du compte).
          </p>
          {errors.caisse_id && <p className="text-xs text-red-500 font-medium">{errors.caisse_id.message?.toString()}</p>}
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Moyen de paiement</label>
          <select
            {...register('payment_method')}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          >
            {availablePaymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.icon} {method.label}
              </option>
            ))}
          </select>
          {errors.payment_method && <p className="text-xs text-red-500 font-medium">{errors.payment_method.message?.toString()}</p>}
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Statut</label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          >
            <option value="completed">✅ Complété</option>
            <option value="pending">⏳ En attente</option>
            <option value="cancelled">❌ Annulé</option>
          </select>
          {errors.status && <p className="text-xs text-red-500 font-medium">{errors.status.message?.toString()}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Note / Description</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Détails supplémentaires ou commentaires..."
            className="w-full px-3.5 py-2 rounded-lg border border-[var(--border)] bg-transparent text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-[var(--muted-foreground)]/50 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[var(--border)]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center space-x-2 px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-600 rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Ajouter la dépense</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
