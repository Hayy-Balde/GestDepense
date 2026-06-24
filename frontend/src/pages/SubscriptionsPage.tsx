import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { format, parseISO, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  RefreshCw,
  Plus,
  Calendar,
  CreditCard,
  Globe,
  Bell,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { api } from '../services/api'
import type { Subscription, SubscriptionFormData, BillingCycle } from '../types'
import { useAuthStore } from '../stores/authStore'
import { BILLING_CYCLES, CURRENCIES } from '../lib/constants'
import { cn } from '../lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Separator } from '../components/ui/separator'

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'mock-1',
    user_id: '',
    account_id: null,
    name: 'Netflix',
    amount: 29900,
    currency_code: 'GNF',
    billing_cycle: 'monthly',
    next_billing_date: '2026-07-15',
    icon: '🎬',
    color: '#E50914',
    url: null,
    is_active: true,
    reminder_days_before: 3,
    created_at: '',
    updated_at: '',
    annual_cost: 358800,
  },
  {
    id: 'mock-2',
    user_id: '',
    account_id: null,
    name: 'Spotify',
    amount: 9900,
    currency_code: 'GNF',
    billing_cycle: 'monthly',
    next_billing_date: '2026-07-02',
    icon: '🎵',
    color: '#1DB954',
    url: null,
    is_active: true,
    reminder_days_before: 3,
    created_at: '',
    updated_at: '',
    annual_cost: 118800,
  },
  {
    id: 'mock-3',
    user_id: '',
    account_id: null,
    name: 'Dropbox',
    amount: 15000,
    currency_code: 'GNF',
    billing_cycle: 'monthly',
    next_billing_date: '2026-07-20',
    icon: '📦',
    color: '#0061FF',
    url: null,
    is_active: true,
    reminder_days_before: 3,
    created_at: '',
    updated_at: '',
    annual_cost: 180000,
  },
  {
    id: 'mock-4',
    user_id: '',
    account_id: null,
    name: 'Amazon Prime',
    amount: 79000,
    currency_code: 'GNF',
    billing_cycle: 'yearly',
    next_billing_date: '2026-08-10',
    icon: '📦',
    color: '#FF9900',
    url: null,
    is_active: true,
    reminder_days_before: 7,
    created_at: '',
    updated_at: '',
    annual_cost: 79000,
  },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n)

const cycleLabel: Record<BillingCycle, string> = {
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  yearly: 'Annuel',
}

const annualMultiplier: Record<BillingCycle, number> = {
  weekly: 52,
  monthly: 12,
  quarterly: 4,
  yearly: 1,
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--muted)]" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-24 bg-[var(--muted)] rounded" />
          <div className="h-3 w-16 bg-[var(--muted)] rounded" />
        </div>
      </div>
      <div className="h-8 w-28 bg-[var(--muted)] rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-[var(--muted)] rounded" />
        <div className="h-3 w-3/4 bg-[var(--muted)] rounded" />
      </div>
    </div>
  )
}

export default function SubscriptionsPage() {
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Subscription | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>()

  const fetchSubscriptions = () => {
    setLoading(true)
    setError(null)
    api
      .get('/subscriptions')
      .then((res) => {
        setSubscriptions(res.data?.data || res.data || [])
      })
      .catch(() => {
        setSubscriptions(MOCK_SUBSCRIPTIONS)
        setError('Backend non connecté — données d\'exemple affichées.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const bill = (s: Subscription) => s.amount
  const annual = (s: Subscription) => s.amount * annualMultiplier[s.billing_cycle]

  const totalMonthly = subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => {
      if (s.billing_cycle === 'monthly') return sum + s.amount
      if (s.billing_cycle === 'yearly') return sum + s.amount / 12
      if (s.billing_cycle === 'weekly') return sum + s.amount * 52 / 12
      if (s.billing_cycle === 'quarterly') return sum + s.amount / 3
      return sum
    }, 0)

  const totalAnnual = subscriptions
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + annual(s), 0)

  const activeCount = subscriptions.filter((s) => s.is_active).length

  const upcoming = [7, 14, 30].map((days) => {
    const today = new Date()
    const limit = new Date(today.getTime() + days * 86400000)
    const upcomingItems = subscriptions.filter((s) => {
      if (!s.is_active) return false
      const next = new Date(s.next_billing_date)
      return next >= today && next <= limit
    })
    return {
      days,
      count: upcomingItems.length,
      total: upcomingItems.reduce((sum, s) => sum + s.amount, 0),
    }
  })

  const openCreate = () => {
    setEditing(null)
    reset({
      name: '',
      amount: 0,
      currency_code: currency,
      billing_cycle: 'monthly',
      next_billing_date: '',
      account_id: '',
      icon: '📱',
      color: '#06B6D4',
      url: '',
      is_active: true,
      reminder_days_before: 3,
    })
    setDialogOpen(true)
  }

  const openEdit = (sub: Subscription) => {
    setEditing(sub)
    reset({
      name: sub.name,
      amount: sub.amount,
      currency_code: sub.currency_code,
      billing_cycle: sub.billing_cycle,
      next_billing_date: sub.next_billing_date,
      account_id: sub.account_id || '',
      icon: sub.icon,
      color: sub.color,
      url: sub.url || '',
      is_active: sub.is_active,
      reminder_days_before: sub.reminder_days_before,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      const payload = {
        ...data,
        account_id: data.account_id || null,
        url: data.url || null,
      }
      if (editing) {
        await api.put(`/subscriptions/${editing.id}`, payload)
      } else {
        await api.post('/subscriptions', payload)
      }
      setDialogOpen(false)
      fetchSubscriptions()
    } catch {
      const updated = editing
        ? subscriptions.map((s) =>
            s.id === editing.id ? { ...s, ...data } : s
          )
        : [
            ...subscriptions,
            {
              id: `mock-${Date.now()}`,
              user_id: '',
              account_id: data.account_id || null,
              ...data,
              url: data.url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              annual_cost: data.amount * annualMultiplier[data.billing_cycle],
            } as Subscription,
          ]
      setSubscriptions(updated as Subscription[])
      setDialogOpen(false)
      setError('Backend non connecté — modification locale effectuée.')
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await api.delete(`/subscriptions/${id}`)
      setSubscriptions((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setSubscriptions((prev) => prev.filter((s) => s.id !== id))
      setError('Backend non connecté — suppression locale effectuée.')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggle = async (sub: Subscription) => {
    try {
      await api.put(`/subscriptions/${sub.id}/toggle`)
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === sub.id ? { ...s, is_active: !s.is_active } : s
        )
      )
    } catch {
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === sub.id ? { ...s, is_active: !s.is_active } : s
        )
      )
      setError('Backend non connecté — modification locale effectuée.')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Abonnements
            </h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Gérez vos abonnements récurrents et anticipez vos prochains
            paiements.
          </p>
        </div>

        <Button onClick={openCreate} className="space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nouvel Abonnement</span>
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 animate-pulse space-y-3"
            >
              <div className="h-4 w-24 bg-[var(--muted)] rounded" />
              <div className="h-8 w-32 bg-[var(--muted)] rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Total mensuel
            </p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {fmt(Math.round(totalMonthly))} {currency}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Total annuel
            </p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {fmt(Math.round(totalAnnual))} {currency}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Abonnements actifs
            </p>
            <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
              {activeCount}
            </p>
          </div>
        </div>
      )}

      {/* Upcoming payments */}
      {!loading && subscriptions.filter((s) => s.is_active).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-500" />
              Paiements à venir
            </CardTitle>
            <CardDescription>
              Récapitulatif des prochains prélèvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {upcoming.map(({ days, count, total }) => (
                <div
                  key={days}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-center"
                >
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Dans {days} jours
                  </p>
                  <p className="text-lg font-bold text-[var(--foreground)] mt-0.5">
                    {count}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {fmt(total)} {currency}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-3 rounded-full bg-[var(--muted)]/30 mb-4">
            <RefreshCw className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <p className="text-lg font-medium text-[var(--foreground)]">
            Aucun abonnement enregistré
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Ajoutez votre premier abonnement pour commencer le suivi.
          </p>
          <Button onClick={openCreate} className="mt-4 space-x-2">
            <Plus className="w-4 h-4" />
            <span>Nouvel Abonnement</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {subscriptions.map((sub) => {
            const daysUntil = differenceInDays(
              parseISO(sub.next_billing_date),
              new Date()
            )
            const isUrgent = daysUntil >= 0 && daysUntil < 7

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="relative overflow-hidden h-full flex flex-col">
                  {/* Color accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: sub.color }}
                  />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{
                            backgroundColor: `${sub.color}15`,
                          }}
                        >
                          {sub.icon}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate max-w-[140px]">
                            {sub.name}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {fmt(sub.amount)} {sub.currency_code}
                            </span>
                            <span className="text-[var(--muted-foreground)]">
                              /
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {cycleLabel[sub.billing_cycle]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between pt-0">
                    <div className="space-y-2">
                      {/* Next billing date */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-[var(--muted-foreground)] shrink-0" />
                        <span className="text-[var(--muted-foreground)]">
                          Prochain prélèvement :
                        </span>
                        <span className="font-medium text-[var(--foreground)]">
                          {format(
                            parseISO(sub.next_billing_date),
                            'dd MMMM yyyy',
                            { locale: fr }
                          )}
                        </span>
                      </div>

                      {/* Days until next payment */}
                      {daysUntil >= 0 && (
                        <div
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-medium',
                            isUrgent
                              ? 'text-red-500'
                              : 'text-[var(--muted-foreground)]'
                          )}
                        >
                          <Bell className="w-3 h-3" />
                          <span>
                            {daysUntil === 0
                              ? 'Aujourd\'hui'
                              : `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      )}

                      {/* Account */}
                      {sub.account_id && (
                        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <CreditCard className="w-3 h-3" />
                          <span>Compte lié</span>
                        </div>
                      )}

                      {/* URL */}
                      {sub.url && (
                        <div className="flex items-center gap-2 text-xs">
                          <Globe className="w-3 h-3 text-[var(--muted-foreground)] shrink-0" />
                          <a
                            href={sub.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-500 hover:underline truncate"
                          >
                            {sub.url}
                          </a>
                        </div>
                      )}
                    </div>

                    <Separator className="my-3" />

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleToggle(sub)}
                        className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium transition-colors',
                          sub.is_active
                            ? 'text-green-500 hover:text-green-600'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                        )}
                      >
                        {sub.is_active ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {sub.is_active ? 'Actif' : 'Inactif'}
                      </button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(sub)}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(sub.id)}
                          disabled={deleting === sub.id}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-500" />
              {editing ? 'Modifier l\'abonnement' : 'Nouvel Abonnement'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Modifiez les détails de votre abonnement ci-dessous.'
                : 'Ajoutez un nouvel abonnement récurrent pour suivre vos paiements.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                placeholder="Netflix, Spotify, ..."
                {...register('name', { required: 'Le nom est requis' })}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="29900"
                  {...register('amount', {
                    required: 'Le montant est requis',
                    valueAsNumber: true,
                    min: { value: 0, message: 'Montant invalide' },
                  })}
                />
                {errors.amount && (
                  <p className="text-xs text-red-500">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency_code">Devise</Label>
                <select
                  id="currency_code"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('currency_code')}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Cycle de facturation</Label>
                <select
                  id="billing_cycle"
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  {...register('billing_cycle')}
                >
                  {BILLING_CYCLES.map((bc) => (
                    <option key={bc.value} value={bc.value}>
                      {bc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_billing_date">Prochaine facturation</Label>
                <Input
                  id="next_billing_date"
                  type="date"
                  {...register('next_billing_date', {
                    required: 'La date est requise',
                  })}
                />
                {errors.next_billing_date && (
                  <p className="text-xs text-red-500">
                    {errors.next_billing_date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icône</Label>
                <Input
                  id="icon"
                  placeholder="📱"
                  {...register('icon')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Input
                  id="color"
                  type="color"
                  {...register('color')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_id">
                Compte lié <span className="text-[var(--muted-foreground)]">(optionnel)</span>
              </Label>
              <Input
                id="account_id"
                placeholder="ID du compte"
                {...register('account_id')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">
                URL <span className="text-[var(--muted-foreground)]">(optionnel)</span>
              </Label>
              <Input
                id="url"
                placeholder="https://"
                {...register('url')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reminder_days_before">
                  Rappel (jours avant)
                </Label>
                <Input
                  id="reminder_days_before"
                  type="number"
                  {...register('reminder_days_before', {
                    valueAsNumber: true,
                  })}
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    {...register('is_active')}
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Abonnement actif
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'En cours...'
                  : editing
                    ? 'Enregistrer'
                    : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
