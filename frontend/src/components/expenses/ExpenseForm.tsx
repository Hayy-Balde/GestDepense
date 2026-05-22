import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { expenseService, accountService, categoryService } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Account } from '../../types/account'
import { Category } from '../../types/index'
import { AlertCircle, Check, Loader2 } from 'lucide-react'

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
  description: z.string().optional()
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  onSuccess: () => void
  onCancel?: () => void
}

export default function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { user } = useAuthStore()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [errorOptions, setErrorOptions] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      title: '',
      amount: undefined,
      date: new Date().toISOString().split('T')[0],
      account_id: '',
      category_id: '',
      currency_code: user?.currency_code || 'GNF',
      payment_method: 'credit_card',
      status: 'completed',
      description: ''
    }
  })

  // Load Accounts & Categories
  useEffect(() => {
    Promise.all([accountService.getAll(), categoryService.getAll()])
      .then(([accountsRes, categoriesRes]) => {
        const accs = accountsRes.data.data ? accountsRes.data.data : accountsRes.data
        const cats = categoriesRes.data.data ? categoriesRes.data.data : categoriesRes.data

        setAccounts(accs)
        
        // Filter only expense categories
        const expenseCats = cats.filter((c: Category) => c.type === 'expense')
        setCategories(expenseCats)

        // Set default selects if available
        if (accs.length > 0) setValue('account_id', accs[0].id)
        if (expenseCats.length > 0) setValue('category_id', expenseCats[0].id)

        setLoadingOptions(false)
      })
      .catch(err => {
        console.error(err)
        setErrorOptions('Impossible de charger les comptes et catégories.')
        setLoadingOptions(false)
      })
  }, [setValue])

  const onSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await expenseService.create(data)
      onSuccess()
    } catch (error: any) {
      console.error(error)
      setSubmitError(error.response?.data?.message || 'Erreur lors de la création de la dépense.')
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
            {...register('account_id')}
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
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          {errors.category_id && <p className="text-xs text-red-500 font-medium">{errors.category_id.message?.toString()}</p>}
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Moyen de paiement</label>
          <select
            {...register('payment_method')}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          >
            <option value="credit_card">💳 Carte de crédit</option>
            <option value="debit_card">💳 Carte de débit</option>
            <option value="cash">💵 Espèces</option>
            <option value="bank_transfer">🏦 Virement bancaire</option>
            <option value="mobile_money">📱 Mobile money</option>
            <option value="check">✍️ Chèque</option>
            <option value="other">❓ Autre</option>
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
