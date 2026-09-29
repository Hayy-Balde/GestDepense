import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, TrendingDown, PieChart, Calendar, Download, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import { api } from '@/services/api'
import type { TrendData, CategoryBreakdown } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { CHART_COLORS } from '@/lib/constants'

const periods = [
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '3 mois', value: '90d' },
  { label: '6 mois', value: '6m' },
  { label: '12 mois', value: '365d' },
]

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
  payload?: Record<string, unknown>
}

const ChartTooltipContent = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg p-3 text-sm">
      {label && <p className="font-medium mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          {entry.name}: {formatCurrency(entry.value ?? 0)}
        </p>
      ))}
    </div>
  )
}

const PieTooltipContent = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) => {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload as Record<string, unknown> | undefined
  if (!data) return null
  return (
    <div className="bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium">{(data.category as string) || (data.name as string)}</p>
      <p className="text-sm">{(data.amount as number) ? formatCurrency(data.amount as number) : formatCurrency(data.value as number)}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{data.percentage as number}%</p>
    </div>
  )
}

function formatCurrency(amount: number): string {
  const currency = useAuthStore.getState().user?.currency_code ?? 'GNF'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount ?? 0)
}

const EmptyChart = ({ message = 'Pas assez de données' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center h-[300px] text-[var(--muted-foreground)]">
    <BarChart3 className="w-12 h-12 mb-2 opacity-30" />
    <p className="text-sm">{message}</p>
  </div>
)

const ChartSkeleton = () => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-[260px] w-full rounded-lg" />
  </div>
)

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const currency = useAuthStore((s) => s.user?.currency_code ?? 'GNF')
  const locFormatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount ?? 0)

  const [period, setPeriod] = useState('6m')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([])
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryBreakdown[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tr, ex, inc] = await Promise.all([
          api.get<{ data: TrendData[] }>('/analytics/trends', { params: { period } }),
          api.get<{ data: CategoryBreakdown[] }>('/analytics/breakdown', { params: { type: 'expense' } }),
          api.get<{ data: CategoryBreakdown[] }>('/analytics/breakdown', { params: { type: 'income' } }),
        ])
        if (!cancelled) {
          setTrends(tr.data.data)
          setExpenseBreakdown(ex.data.data)
          setIncomeBreakdown(inc.data.data)
        }
      } catch {
        if (!cancelled) {
          setTrends([])
          setExpenseBreakdown([])
          setIncomeBreakdown([])
          setError('Impossible de charger les données analytiques.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [period])

  const avgIncome = trends.length > 0
    ? trends.reduce((s, t) => s + Number(t.incomes), 0) / trends.length
    : 0,
  avgExpense = trends.length > 0
    ? trends.reduce((s, t) => s + Number(t.expenses), 0) / trends.length
    : 0
  const totalIncomes = trends.reduce((s, t) => s + Number(t.incomes), 0)
  const totalExpenses = trends.reduce((s, t) => s + Number(t.expenses), 0)
  const totalSavings = trends.reduce((s, t) => s + Number(t.savings), 0)
  const savingsRate = totalIncomes > 0 ? (totalSavings / totalIncomes) * 100 : 0
  const bestMonth = trends.length > 0
    ? trends.reduce((best, t) => t.savings > best.savings ? t : best, trends[0]!)
    : null

  const balanceData = trends.map((t) => ({
    month: t.month,
    surplus: t.incomes - t.expenses,
  }))

  const topExpenses = [...expenseBreakdown].sort((a, b) => b.amount - a.amount).slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Analytiques</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Visualisez vos finances avec des graphiques détaillés.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" aria-label="Télécharger" onClick={() => navigate('/rapports')} title="Générer un rapport">
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Actualiser"
            onClick={() => {
              setPeriod((prev) => prev)
              window.location.reload()
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          <span className="flex-1">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null)
              setPeriod((prev) => prev === '30d' ? '7d' : '30d')
            }}
          >
            Réessayer
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32 mt-1" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                Revenu moyen/mois
              </CardDescription>
              <CardTitle className="text-xl">{locFormatCurrency(avgIncome)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                Dépense moyenne/mois
              </CardDescription>
              <CardTitle className="text-xl">{locFormatCurrency(avgExpense)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                Taux d'épargne moyen
              </CardDescription>
              <CardTitle className="text-xl">{savingsRate.toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Meilleur mois
              </CardDescription>
              <CardTitle className="text-xl">
                {bestMonth
                  ? `${bestMonth.month} (${locFormatCurrency(bestMonth.savings)})`
                  : '—'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution Revenus vs Dépenses</CardTitle>
            <CardDescription>Évolution sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : trends.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Area type="monotone" dataKey="incomes" name="Revenus" stroke="#16A34A" fill="url(#incomeGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#EF4444" fill="url(#expenseGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des Dépenses</CardTitle>
            <CardDescription>Par catégorie de dépense</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : expenseBreakdown.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={300} className="max-w-[300px]">
                  <RePieChart>
                    <Pie
                      data={expenseBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {expenseBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 w-full">
                  {expenseBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-[var(--foreground)]">{item.category}</span>
                      </div>
                      <span className="text-[var(--muted-foreground)]">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des Revenus</CardTitle>
            <CardDescription>Par source de revenu</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : incomeBreakdown.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={300} className="max-w-[300px]">
                  <RePieChart>
                    <Pie
                      data={incomeBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {incomeBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 w-full">
                  {incomeBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-[var(--foreground)]">{item.category}</span>
                      </div>
                      <span className="text-[var(--muted-foreground)]">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solde Mensuel</CardTitle>
            <CardDescription>Surplus ou déficit par mois</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : balanceData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={balanceData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="surplus" name="Solde" radius={[4, 4, 0, 0]}>
                    {balanceData.map((entry, i) => (
                      <Cell key={i} fill={entry.surplus >= 0 ? '#16A34A' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Dépenses</CardTitle>
            <CardDescription>5 principales catégories de dépenses</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : topExpenses.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topExpenses} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                  <YAxis type="category" dataKey="category" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="amount" name="Montant" radius={[0, 4, 4, 0]}>
                    {topExpenses.map((entry, i) => (
                      <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Épargne & Résultat Net</CardTitle>
            <CardDescription>Excédent (revenus - dépenses) par période</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : trends.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="savings" name="Résultat net" stroke="#8B5CF6" fill="url(#savingsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
