import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useMonthStore } from '../stores/monthStore'
import { useAuthStore } from '../stores/authStore'
import type { Budget, BudgetFormData, BudgetByCategory, BudgetCategoryUsage } from '../types/index'
import type { Expense } from '../types/expense'
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  CalendarDays,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useForm, useWatch } from 'react-hook-form'
import { MONTHS } from '../lib/constants'
import { useConfig, findCategoryBySlug } from '../hooks/useConfig'
import { cn } from '../lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Separator } from '../components/ui/separator'
import { Textarea } from '../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog'
import { useToastStore, getApiErrorMessage } from '../stores/toastStore'

function getStatusInfo(percentage: number, remaining: number): { label: string; variant: 'success' | 'warning' | 'destructive' } {
  if (remaining < 0) return { label: 'Dépassement', variant: 'destructive' }
  if (percentage >= 100) return { label: 'Budget atteint', variant: 'warning' }
  if (percentage >= 80) return { label: 'Presque atteint', variant: 'warning' }
  return { label: 'Dans les clous', variant: 'success' }
}

function getProgressColor(percentage: number): string {
  if (percentage < 80) return 'bg-green-500'
  if (percentage <= 100) return 'bg-amber-500'
  return 'bg-red-500'
}

const EMPTY_BY_CATEGORY: BudgetByCategory = {
  month: 0,
  year: 0,
  has_budget: false,
  total_allocated: 0,
  total_spent: 0,
  total_remaining: 0,
  categories: [],
}

export default function BudgetsPage() {
  const { currentMonth, currentYear, goPrev, goNext } = useMonthStore()
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'
  const { expenseCategories } = useConfig()
  const categoryKeys = Object.keys(expenseCategories)

  const [byCategory, setByCategory] = useState<BudgetByCategory>(EMPTY_BY_CATEGORY)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Modal de détails d'une catégorie
  const [detailCat, setDetailCat] = useState<BudgetCategoryUsage | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailExpenses, setDetailExpenses] = useState<Expense[]>([])
  const { success, error: toastError } = useToastStore()

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n ?? 0)

  const defaultFormValues: Record<string, string | number> = {
    total_budget: 0,
    notes: '',
    ...categoryKeys.reduce((acc, key) => ({ ...acc, [`cat_${key}`]: 0 }), {}),
  }

  const form = useForm({ defaultValues: defaultFormValues })
  const watchedValues = useWatch({ control: form.control })
  const calculatedTotal = categoryKeys.reduce(
    (sum, key) => sum + (Number(watchedValues[`cat_${key}`]) || 0),
    0,
  )

  const openDialog = () => {
    if (budget) {
      const prefill: Record<string, string | number> = {
        total_budget: budget.total_budget,
        notes: budget.notes || '',
      }
      categoryKeys.forEach((key) => {
        const found = (budget.categories || []).find((c) => c.category_id === key)
        prefill[`cat_${key}`] = found?.allocated_amount || 0
      })
      form.reset(prefill)
    } else {
      form.reset(defaultFormValues)
    }
    setDialogOpen(true)
  }

  const onSubmit = (data: Record<string, unknown>) => {
    const categoryEntries = categoryKeys
      .filter((key) => (Number(data[`cat_${key}`]) || 0) > 0)
      .map((key) => ({
        category_id: key,
        allocated_amount: Number(data[`cat_${key}`]) || 0,
      }))

    const total = categoryEntries.reduce((sum, c) => sum + Number(c.allocated_amount), 0)

    const payload: BudgetFormData = {
      month: currentMonth,
      year: currentYear,
      total_budget: total,
      notes: String(data.notes ?? ''),
      categories: categoryEntries,
    }

    setSubmitting(true)
    api
      .post('/budgets', payload)
      .then((res) => {
        success((res.data as { message?: string })?.message || 'Budget enregistré avec succès.')
        fetchBudget()
        setDialogOpen(false)
      })
      .catch((err) => {
        toastError(getApiErrorMessage(err, 'Impossible de sauvegarder le budget.'))
        const existingBudget = budget
        const newBudget: Budget = {
          id: existingBudget?.id || `local-${Date.now()}`,
          user_id: user?.id || '',
          month: currentMonth,
          year: currentYear,
          total_budget: total,
          notes: data.notes ? String(data.notes) : null,
          created_at: existingBudget?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_spent: existingBudget?.total_spent || 0,
          remaining: total - (existingBudget?.total_spent || 0),
          categories: categoryEntries.map((c, i) => {
            const existingCat = existingBudget?.categories.find((bc) => bc.category_id === c.category_id)
            const catConfig = findCategoryBySlug(expenseCategories, c.category_id)
            return {
              id: existingCat?.id || `local-cat-${i}`,
              budget_id: existingBudget?.id || `local-${Date.now()}`,
              category_id: c.category_id,
              allocated_amount: c.allocated_amount,
              spent_amount: existingCat?.spent_amount || 0,
              category: {
                id: c.category_id,
                name: catConfig?.name || c.category_id,
                icon: '',
                color: catConfig?.color || '#6B7280',
              },
              remaining: c.allocated_amount - (existingCat?.spent_amount || 0),
              percentage_used:
                c.allocated_amount > 0
                  ? Math.round(((existingCat?.spent_amount || 0) / c.allocated_amount) * 100 * 10) / 10
                  : 0,
            }
          }),
        }
        setBudget(newBudget)
        setDialogOpen(false)
      })
      .finally(() => setSubmitting(false))
  }

  const fetchBudget = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/budgets/by-category', { params: { month: currentMonth, year: currentYear } }),
      api.get('/budgets', { params: { month: currentMonth, year: currentYear } }),
    ])
      .then(([byCatRes, budgetRes]) => {
        setByCategory(byCatRes.data || EMPTY_BY_CATEGORY)
        setBudget(budgetRes.data || null)
      })
      .catch(() => {
        setByCategory(EMPTY_BY_CATEGORY)
        setBudget(null)
        setError('Impossible de charger les budgets pour ce mois.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on month/year change
    fetchBudget()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when month/year change
  }, [currentMonth, currentYear])

  const openDetail = (cat: BudgetCategoryUsage) => {
    setDetailCat(cat)
    setDetailExpenses([])
    setDetailLoading(true)
    api
      .get('/expenses', { params: { category_id: cat.category.id, month: currentMonth, year: currentYear } })
      .then((res) => {
        const rows = res.data?.data || res.data || []
        setDetailExpenses(rows)
      })
      .catch(() => setDetailExpenses([]))
      .finally(() => setDetailLoading(false))
  }

  const overviewPercentage =
    byCategory.total_allocated > 0
      ? Math.round((byCategory.total_spent / byCategory.total_allocated) * 100)
      : 0

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Budgets
            </h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Planifiez vos budgets mensuels et comparez avec vos dépenses réelles.
          </p>
        </div>
        <Button
          onClick={openDialog}
          className="inline-flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Budget</span>
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2 bg-[var(--card)] w-fit mx-auto">
        <button
          onClick={goPrev}
          className="p-1 rounded hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[var(--foreground)]" />
        </button>
        <span className="text-sm font-semibold px-2 text-[var(--foreground)]">
          {MONTHS[currentMonth - 1]} {currentYear}
        </span>
        <button
          onClick={goNext}
          className="p-1 rounded hover:bg-[var(--muted)] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-[var(--foreground)]" />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="inline w-4 h-4 mr-1.5 -mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Aperçu du mois — {MONTHS[currentMonth - 1]} {currentYear}
              </CardTitle>
              <CardDescription>
                Synthèse des catégories planifiées et de l'utilisation réelle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Budget total</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {fmt(byCategory.total_allocated)} {currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Dépensé</p>
                  <p className="text-2xl font-bold text-red-500">
                    {fmt(byCategory.total_spent)} {currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Restant</p>
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      byCategory.total_remaining >= 0 ? 'text-green-500' : 'text-red-500',
                    )}
                  >
                    {fmt(byCategory.total_remaining)} {currency}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">Progression</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {overviewPercentage}%
                  </span>
                </div>
                <Progress
                  value={Math.min(overviewPercentage, 100)}
                  indicatorClassName={getProgressColor(overviewPercentage)}
                />
              </div>
            </CardContent>
          </Card>

          {byCategory.categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="p-4 rounded-full bg-purple-500/10">
                <PiggyBank className="w-10 h-10 text-purple-500" />
              </div>
              <p className="text-lg font-semibold text-[var(--foreground)]">
                Aucune catégorie à afficher
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Configurez vos catégories de dépenses pour suivre ce mois.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  Catégories — {MONTHS[currentMonth - 1]} {currentYear}
                </h2>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Cliquez sur une catégorie pour voir ses dépenses
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {byCategory.categories.map((cat, i) => {
                  const catConfig = findCategoryBySlug(expenseCategories, cat.category.id) ||
                    findCategoryBySlug(expenseCategories, cat.category.name)
                  const displayColor = cat.category.color || catConfig?.color || '#6B7280'
                  const statusInfo = cat.is_planned
                    ? getStatusInfo(cat.percentage_used, cat.remaining)
                    : null

                  return (
                    <motion.button
                      key={cat.category.id}
                      type="button"
                      onClick={() => openDetail(cat)}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-xl"
                    >
                      <Card className="hover:border-[var(--primary)]/40 hover:shadow-md transition-all h-full">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: displayColor }}
                              />
                              <span className="text-sm font-semibold text-[var(--foreground)]">
                                {cat.category.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {cat.transaction_count > 0 && (
                                <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                                  <Receipt className="w-3.5 h-3.5" />
                                  {cat.transaction_count}
                                </span>
                              )}
                              {cat.is_planned ? (
                                <Badge variant={statusInfo!.variant}>{statusInfo!.label}</Badge>
                              ) : (
                                <Badge variant="secondary">Non planifiée</Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                            <div>
                              <p className="text-[var(--muted-foreground)] text-xs">
                                {cat.is_planned ? 'Alloué' : 'Planifié'}
                              </p>
                              <p className="font-semibold text-[var(--foreground)]">
                                {cat.is_planned
                                  ? `${fmt(cat.allocated_amount)} ${currency}`
                                  : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-[var(--muted-foreground)] text-xs">Dépensé</p>
                              <p className={cn('font-semibold', cat.spent_amount > 0 ? 'text-red-500' : 'text-[var(--foreground)]')}>
                                {fmt(cat.spent_amount)} {currency}
                              </p>
                            </div>
                            <div>
                              <p className="text-[var(--muted-foreground)] text-xs">Restant</p>
                              <p
                                className={cn(
                                  'font-semibold',
                                  !cat.is_planned
                                    ? 'text-[var(--muted-foreground)]'
                                    : cat.remaining >= 0
                                      ? 'text-green-500'
                                      : 'text-red-500',
                                )}
                              >
                                {cat.is_planned
                                  ? `${fmt(cat.remaining)} ${currency}`
                                  : cat.spent_amount > 0
                                    ? `-${fmt(cat.spent_amount)}`
                                    : '—'}
                              </p>
                            </div>
                          </div>

                          <Progress
                            value={cat.is_planned ? Math.min(cat.percentage_used, 100) : Math.min(cat.spent_amount > 0 ? 100 : 0, 100)}
                            indicatorClassName={cat.is_planned ? getProgressColor(cat.percentage_used) : 'bg-[var(--muted)]'}
                          />
                        </CardContent>
                      </Card>
                    </motion.button>
                  )
                })}
              </div>
            </>
          )}
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <PiggyBank className="w-5 h-5 text-purple-500" />
              <span>{budget ? 'Modifier le budget' : 'Nouveau budget'}</span>
            </DialogTitle>
            <DialogDescription>
              {budget
                ? 'Ajustez les allocations par catégorie pour ce mois.'
                : 'Définissez un budget en allouant des montants à chaque catégorie.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-3">
              <Label>Notes (optionnel)</Label>
              <Textarea
                {...form.register('notes')}
                placeholder="Ajoutez une note à ce budget…"
              />
            </div>

            <Separator />

            <div>
              <Label className="text-base font-semibold">Allocations par catégorie</Label>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">
                Saisissez le montant alloué à chaque catégorie.
              </p>
              <div className="space-y-3">
                {categoryKeys.map((key) => {
                  const catConfig = expenseCategories[key]!
                  const Icon = catConfig.icon
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-36 shrink-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: catConfig.color }}
                        />
                        <Icon className="w-4 h-4 shrink-0" style={{ color: catConfig.color }} />
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {catConfig.name}
                        </span>
                      </div>
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          min={0}
                          // step={1}
                          placeholder="0"
                          {...form.register(`cat_${key}`, { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Total alloué
              </span>
              <span className="text-lg font-bold text-[var(--foreground)]">
                {fmt(calculatedTotal)} {currency}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || calculatedTotal <= 0}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                )}
                {budget ? 'Mettre à jour' : 'Créer le budget'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal détail catégorie — listes des transactions */}
      <Dialog open={!!detailCat} onOpenChange={(o) => { if (!o) setDetailCat(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: detailCat?.category.color || '#6B7280' }}
              />
              <span>{detailCat?.category.name}</span>
            </DialogTitle>
            <DialogDescription>
              Dépenses de {MONTHS[currentMonth - 1]} {currentYear}
              {detailCat && (
                <> — {fmt(detailCat.spent_amount)} {currency} au total</>
              )}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          ) : detailExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-[var(--muted-foreground)]">
              <Receipt className="w-8 h-8" />
              <p className="text-sm">Aucune dépense pour cette catégorie ce mois-ci</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {detailExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--destructive)]/10 text-[var(--destructive)] flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {e.title}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(e.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-500 shrink-0">
                    -{fmt(Number(e.amount))} {e.currency_code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
