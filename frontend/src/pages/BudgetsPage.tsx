import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useMonthStore } from '../stores/monthStore'
import { useAuthStore } from '../stores/authStore'
import type { Budget, BudgetFormData } from '../types/index'
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { MONTHS, EXPENSE_CATEGORIES } from '../lib/constants'
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

const MOCK_BUDGET: Budget = {
  id: 'mock-budget-1',
  user_id: 'mock',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  total_budget: 1_200_000,
  notes: 'Budget du mois en cours (données mock)',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  total_spent: 890_000,
  remaining: 310_000,
  categories: [
    {
      id: 'mock-cat-1',
      budget_id: 'mock-budget-1',
      category_id: 'alimentation',
      allocated_amount: 400_000,
      spent_amount: 320_000,
      category: { id: 'alimentation', name: 'Alimentation', icon: 'Utensils', color: '#F97316' },
      remaining: 80_000,
      percentage_used: 80,
    },
    {
      id: 'mock-cat-2',
      budget_id: 'mock-budget-1',
      category_id: 'transport',
      allocated_amount: 200_000,
      spent_amount: 180_000,
      category: { id: 'transport', name: 'Transport', icon: 'Car', color: '#3B82F6' },
      remaining: 20_000,
      percentage_used: 90,
    },
    {
      id: 'mock-cat-3',
      budget_id: 'mock-budget-1',
      category_id: 'logement',
      allocated_amount: 350_000,
      spent_amount: 200_000,
      category: { id: 'logement', name: 'Logement', icon: 'Home', color: '#8B5CF6' },
      remaining: 150_000,
      percentage_used: 57.1,
    },
    {
      id: 'mock-cat-4',
      budget_id: 'mock-budget-1',
      category_id: 'loisirs',
      allocated_amount: 150_000,
      spent_amount: 190_000,
      category: { id: 'loisirs', name: 'Loisirs', icon: 'Gamepad2', color: '#EC4899' },
      remaining: -40_000,
      percentage_used: 126.7,
    },
    {
      id: 'mock-cat-5',
      budget_id: 'mock-budget-1',
      category_id: 'sante',
      allocated_amount: 100_000,
      spent_amount: 0,
      category: { id: 'sante', name: 'Santé', icon: 'Heart', color: '#EF4444' },
      remaining: 100_000,
      percentage_used: 0,
    },
  ],
}

const categoryKeys = Object.keys(EXPENSE_CATEGORIES)

function getStatusInfo(percentage: number): { label: string; variant: 'success' | 'warning' | 'destructive' } {
  if (percentage < 80) return { label: 'Dans les clous', variant: 'success' }
  if (percentage <= 100) return { label: 'Dépassement', variant: 'warning' }
  return { label: 'Restant', variant: 'destructive' }
}

function getProgressColor(percentage: number): string {
  if (percentage < 80) return 'bg-green-500'
  if (percentage <= 100) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function BudgetsPage() {
  const { currentMonth, currentYear, goPrev, goNext } = useMonthStore()
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'

  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n ?? 0)

  const defaultFormValues: Record<string, string | number> = {
    total_budget: 0,
    notes: '',
    ...categoryKeys.reduce((acc, key) => ({ ...acc, [`cat_${key}`]: 0 }), {}),
  }

  const form = useForm({ defaultValues: defaultFormValues })
  const watchedValues = form.watch()
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
        const found = budget.categories.find((c) => c.category_id === key)
        prefill[`cat_${key}`] = found?.allocated_amount || 0
      })
      form.reset(prefill)
    } else {
      form.reset(defaultFormValues)
    }
    setDialogOpen(true)
  }

  const onSubmit = (data: Record<string, any>) => {
    const categoryEntries = categoryKeys
      .filter((key) => (Number(data[`cat_${key}`]) || 0) > 0)
      .map((key) => ({
        category_id: key,
        allocated_amount: Number(data[`cat_${key}`]) || 0,
      }))

    const total = categoryEntries.reduce((sum, c) => sum + c.allocated_amount, 0)

    const payload: BudgetFormData = {
      month: currentMonth,
      year: currentYear,
      total_budget: total,
      notes: data.notes || '',
      categories: categoryEntries,
    }

    setSubmitting(true)
    api
      .post('/budgets', payload)
      .then((res) => {
        setBudget(res.data?.data || res.data)
        setDialogOpen(false)
      })
      .catch(() => {
        const existingBudget = budget
        const newBudget: Budget = {
          id: existingBudget?.id || `local-${Date.now()}`,
          user_id: user?.id || '',
          month: currentMonth,
          year: currentYear,
          total_budget: total,
          notes: data.notes || null,
          created_at: existingBudget?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          total_spent: existingBudget?.total_spent || 0,
          remaining: total - (existingBudget?.total_spent || 0),
          categories: categoryEntries.map((c, i) => {
            const existingCat = existingBudget?.categories.find((bc) => bc.category_id === c.category_id)
            const catConfig = EXPENSE_CATEGORIES[c.category_id]
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
    api
      .get('/budgets', { params: { month: currentMonth, year: currentYear } })
      .then((res) => {
        setBudget(res.data?.data || null)
      })
      .catch(() => {
        const now = new Date()
        if (currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear()) {
          setBudget(MOCK_BUDGET)
          setError('Backend non connecté — données d\'exemple affichées.')
        } else {
          setBudget(null)
          setError(null)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBudget()
  }, [currentMonth, currentYear])

  const overviewPercentage =
    budget && budget.total_budget > 0
      ? Math.round((budget.total_spent / budget.total_budget) * 100)
      : 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
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
      ) : !budget ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center gap-4 py-20"
        >
          <div className="p-4 rounded-full bg-purple-500/10">
            <PiggyBank className="w-10 h-10 text-purple-500" />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">
            Aucun budget défini pour ce mois
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Créez un budget pour mieux suivre vos dépenses par catégorie.
          </p>
          <Button onClick={openDialog} className="mt-2">
            <Plus className="w-4 h-4 mr-1.5" />
            Créer un budget
          </Button>
        </motion.div>
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
                Aperçu du budget — {MONTHS[currentMonth - 1]} {currentYear}
              </CardTitle>
              <CardDescription>
                Synthèse globale de votre budget mensuel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Budget total</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {fmt(budget.total_budget)} {currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Dépensé</p>
                  <p className="text-2xl font-bold text-red-500">
                    {fmt(budget.total_spent)} {currency}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Restant</p>
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      budget.remaining >= 0 ? 'text-green-500' : 'text-red-500',
                    )}
                  >
                    {fmt(budget.remaining)} {currency}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budget.categories.map((cat, i) => {
              const catConfig = EXPENSE_CATEGORIES[cat.category_id]
              const displayName = cat.category?.name || catConfig?.name || cat.category_id
              const displayColor = cat.category?.color || catConfig?.color || '#6B7280'
              const Icon = catConfig?.icon
              const statusInfo = getStatusInfo(cat.percentage_used)

              return (
                <motion.div
                  key={cat.id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: displayColor }}
                          />
                          {Icon && (
                            <Icon className="w-4 h-4 shrink-0" style={{ color: displayColor }} />
                          )}
                          <span className="text-sm font-semibold text-[var(--foreground)]">
                            {displayName}
                          </span>
                        </div>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                        <div>
                          <p className="text-[var(--muted-foreground)] text-xs">Alloué</p>
                          <p className="font-semibold text-[var(--foreground)]">
                            {fmt(cat.allocated_amount)} {currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--muted-foreground)] text-xs">Dépensé</p>
                          <p className="font-semibold text-red-500">
                            {fmt(cat.spent_amount)} {currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--muted-foreground)] text-xs">Restant</p>
                          <p
                            className={cn(
                              'font-semibold',
                              cat.remaining >= 0 ? 'text-green-500' : 'text-red-500',
                            )}
                          >
                            {fmt(cat.remaining)} {currency}
                          </p>
                        </div>
                      </div>

                      <Progress
                        value={Math.min(cat.percentage_used, 100)}
                        indicatorClassName={getProgressColor(cat.percentage_used)}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
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
                  const catConfig = EXPENSE_CATEGORIES[key]!
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
                          step={1000}
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
    </div>
  )
}
