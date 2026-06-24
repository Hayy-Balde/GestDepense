import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { useMonthStore } from '../stores/monthStore'
import { INCOME_CATEGORIES, MONTHS } from '../lib/constants'
import { cn } from '../lib/utils'
import type { Income, IncomeFormData, IncomeSourceType, IncomeStats } from '../types/income'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Separator } from '../components/ui/separator'
import { Skeleton } from '../components/ui/skeleton'
import {
  TrendingUp,
  Gift,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  CalendarDays,
} from 'lucide-react'

const SOURCE_LABELS: Record<IncomeSourceType, string> = {
  salary: 'Salaire',
  business: 'Business',
  freelance: 'Freelance',
  gift: 'Cadeau',
  investment: 'Investissement',
  other: 'Autre',
}

const SOURCE_OPTIONS: { value: IncomeSourceType; label: string }[] = [
  { value: 'salary', label: 'Salaire' },
  { value: 'business', label: 'Business' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'gift', label: 'Cadeau' },
  { value: 'investment', label: 'Investissement' },
  { value: 'other', label: 'Autre' },
]

function getBadgeVariant(st: IncomeSourceType) {
  const v: Record<string, string> = { salary: 'success', business: 'default', freelance: 'secondary', gift: 'warning', investment: 'default', other: 'outline' }
  return v[st] || 'outline'
}

function getCategoryIcon(st: IncomeSourceType) {
  const mapping: Record<IncomeSourceType, string> = { salary: 'salaire', business: 'business', freelance: 'freelance', gift: 'cadeau', investment: 'investissement', other: 'autre' }
  const cat = INCOME_CATEGORIES[mapping[st]]
  if (!cat) return MoreHorizontal
  return cat.icon
}

const MOCK_INCOMES: Income[] = [
  {
    id: 'mock-1', user_id: 'mock', account_id: 'acc-1', category_id: 'salaire',
    title: 'Salaire Mensuel', description: null, amount: 2500000,
    currency_code: 'GNF', date: '2026-06-01', source_type: 'salary',
    is_recurring: true, recurrence_rule: 'monthly',
    created_at: '2026-06-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z',
    account: { id: 'acc-1', name: 'Compte Principal', type: 'bank' },
    category: { id: 'salaire', name: 'Salaire', icon: 'Briefcase', color: '#16A34A' },
  },
  {
    id: 'mock-2', user_id: 'mock', account_id: 'acc-2', category_id: 'freelance',
    title: 'Freelance Projet Web', description: null, amount: 800000,
    currency_code: 'GNF', date: '2026-06-15', source_type: 'freelance',
    is_recurring: false, recurrence_rule: null,
    created_at: '2026-06-15T00:00:00Z', updated_at: '2026-06-15T00:00:00Z',
    account: { id: 'acc-2', name: 'Compte Épargne', type: 'savings' },
    category: { id: 'freelance', name: 'Freelance', icon: 'Laptop', color: '#0EA5E9' },
  },
  {
    id: 'mock-3', user_id: 'mock', account_id: 'acc-1', category_id: 'business',
    title: 'Vente en ligne', description: null, amount: 350000,
    currency_code: 'GNF', date: '2026-06-20', source_type: 'business',
    is_recurring: false, recurrence_rule: null,
    created_at: '2026-06-20T00:00:00Z', updated_at: '2026-06-20T00:00:00Z',
    account: { id: 'acc-1', name: 'Compte Principal', type: 'bank' },
    category: { id: 'business', name: 'Business', icon: 'Building2', color: '#4F46E5' },
  },
]

const MOCK_STATS: IncomeStats = {
  total: 3650000, count: 3, average: 1216667,
  by_source: [
    { source: 'salary', amount: 2500000, percentage: 68.5 },
    { source: 'freelance', amount: 800000, percentage: 21.9 },
    { source: 'business', amount: 350000, percentage: 9.6 },
  ],
  by_month: [{ month: '2026-06', amount: 3650000 }],
  vs_last_month: 12.5,
}

export default function IncomesPage() {
  const { currentMonth, currentYear, goPrev, goNext, goToToday } = useMonthStore()
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'

  const [incomes, setIncomes] = useState<Income[]>([])
  const [stats, setStats] = useState<IncomeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<IncomeFormData>({
    defaultValues: {
      title: '',
      amount: undefined as unknown as number,
      currency_code: currency,
      date: new Date().toISOString().split('T')[0],
      source_type: 'salary',
      category_id: '',
      account_id: '',
      description: '',
      is_recurring: false,
      recurrence_rule: '',
    },
  })

  const isRecurring = watch('is_recurring')

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n ?? 0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/incomes', { params: { month: currentMonth, year: currentYear } }),
      api.get('/incomes/stats', { params: { month: currentMonth, year: currentYear } }),
    ])
      .then(([incomesRes, statsRes]) => {
        setIncomes(incomesRes.data?.data || incomesRes.data || [])
        setStats(statsRes.data?.data || statsRes.data)
      })
      .catch(() => {
        setIncomes(MOCK_INCOMES)
        setStats(MOCK_STATS)
        setError("Backend non connecté — données d'exemple affichées.")
      })
      .finally(() => setLoading(false))
  }, [currentMonth, currentYear, refreshKey])

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await api.post('/incomes', data)
      setShowDialog(false)
      reset()
      setRefreshKey((p) => p + 1)
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || "Erreur lors de la création du revenu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce revenu ?')) return
    try {
      await api.delete(`/incomes/${id}`)
      setRefreshKey((p) => p + 1)
    } catch {
      setIncomes((prev) => prev.filter((inc) => inc.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-48 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Revenus</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Suivez et gérez toutes vos entrées d'argent.
          </p>
        </div>
        <button
          onClick={() => setShowDialog(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Revenu</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Total des revenus</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats ? fmt(stats.total) : '0'} {currency}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {MONTHS[currentMonth - 1]} {currentYear}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Tendance vs mois dernier</p>
            <div className="flex items-center mt-1 space-x-2">
              {stats && stats.vs_last_month >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-green-500" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-500" />
              )}
              <p
                className={cn(
                  'text-2xl font-bold',
                  stats && stats.vs_last_month >= 0 ? 'text-green-600' : 'text-red-500'
                )}
              >
                {stats ? `${stats.vs_last_month >= 0 ? '+' : ''}${stats.vs_last_month.toFixed(1)}%` : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Moyenne mensuelle</p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {stats ? fmt(stats.average) : '0'} {currency}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Sur l'ensemble des relevés</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2 bg-[var(--card)] w-fit">
        <button
          onClick={goPrev}
          className="p-1 rounded hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goToToday}
          className="text-sm font-semibold px-2 hover:text-primary transition-colors cursor-pointer"
        >
          {MONTHS[currentMonth - 1]} {currentYear}
        </button>
        <button
          onClick={goNext}
          className="p-1 rounded hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {incomes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="p-3 rounded-full bg-[var(--muted)]/30">
            <Gift className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">Aucun revenu enregistré</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Ajoutez votre premier revenu en cliquant sur « Nouveau Revenu ».
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, staggerChildren: 0.05 }}
          className="space-y-3"
        >
          {incomes.map((income, idx) => {
            const Icon = getCategoryIcon(income.source_type)
            return (
              <motion.div
                key={income.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:shadow-sm transition-all"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-green-500/10 text-green-600 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {income.title}
                      </p>
                      <Badge variant={getBadgeVariant(income.source_type) as any} className="shrink-0">
                        {SOURCE_LABELS[income.source_type]}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center space-x-1">
                        <CalendarDays className="w-3 h-3" />
                        <span>{new Date(income.date).toLocaleDateString('fr-FR')}</span>
                      </span>
                      {income.account && (
                        <span>{income.account.name}</span>
                      )}
                      {income.is_recurring && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Récurrent</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0 ml-4">
                  <p className="text-sm font-bold text-green-600 whitespace-nowrap">
                    +{fmt(income.amount)} {currency}
                  </p>
                  <button
                    onClick={() => handleDelete(income.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-[var(--muted-foreground)] hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>Ajouter un revenu</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Remplissez les détails ci-dessous pour enregistrer une entrée d'argent.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start space-x-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs">{submitError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  {...register('title', { required: 'Le titre est requis' })}
                  placeholder="Salaire, Freelance, Vente..."
                />
                {errors.title && (
                  <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>
                )}
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
                {errors.amount && (
                  <p className="text-xs text-red-500 font-medium">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date', { required: 'La date est requise' })}
                />
                {errors.date && (
                  <p className="text-xs text-red-500 font-medium">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source_type">Type de revenu</Label>
                <select
                  id="source_type"
                  {...register('source_type')}
                  className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {SOURCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category_id">Catégorie</Label>
                <Input
                  id="category_id"
                  {...register('category_id')}
                  placeholder="salaire, freelance, business..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="account_id">Compte</Label>
                <Input
                  id="account_id"
                  {...register('account_id')}
                  placeholder="ID du compte"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Détails supplémentaires..."
                  rows={2}
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="is_recurring"
                    type="checkbox"
                    {...register('is_recurring')}
                    className="rounded border-[var(--border)] text-green-600 focus:ring-green-500"
                  />
                  <Label htmlFor="is_recurring" className="text-sm cursor-pointer">
                    Revenu récurrent
                  </Label>
                </div>

                {isRecurring && (
                  <div className="space-y-1.5">
                    <Label htmlFor="recurrence_rule">Règle de récurrence</Label>
                    <Input
                      id="recurrence_rule"
                      {...register('recurrence_rule')}
                      placeholder="mensuel, hebdomadaire, annuel..."
                    />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors cursor-pointer"
              >
                Annuler
              </button>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
