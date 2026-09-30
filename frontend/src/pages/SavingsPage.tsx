import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { resolveIcon } from '@/lib/iconMap'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  PiggyBank, Plus, Target, TrendingUp, Clock,
  ArrowDown, ArrowUp, Trash2, Edit3, ChevronDown, ChevronUp,
} from 'lucide-react'
import { api } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../lib/utils'
import type { Saving, SavingFormData } from '../types'
import type { Account } from '../types/account'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../components/ui/dialog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Separator } from '../components/ui/separator'
import { Skeleton } from '../components/ui/skeleton'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { useToastStore, getApiErrorMessage } from '../stores/toastStore'

const MOCK_SAVINGS: Saving[] = [
  {
    id: 'mock-1',
    user_id: '',
    account_id: null,
    name: 'Voyage au Maroc',
    target_amount: 2000000,
    current_amount: 750000,
    deadline: '2026-12-31',
    icon: '✈️',
    color: '#EC4899',
    auto_save_amount: null,
    auto_save_frequency: null,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    progress: 37.5,
    remaining: 1250000,
    transactions: [
      { id: 't1', saving_id: 'mock-1', type: 'deposit', amount: 500000, date: new Date().toISOString(), note: 'Virement initial' },
      { id: 't2', saving_id: 'mock-1', type: 'deposit', amount: 250000, date: new Date(Date.now() - 604800000).toISOString(), note: null },
    ],
  },
  {
    id: 'mock-2',
    user_id: '',
    account_id: null,
    name: 'Nouvel Ordinateur',
    target_amount: 4000000,
    current_amount: 4000000,
    deadline: null,
    icon: '💻',
    color: '#8B5CF6',
    auto_save_amount: null,
    auto_save_frequency: null,
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    progress: 100,
    remaining: 0,
    transactions: [
      { id: 't3', saving_id: 'mock-2', type: 'deposit', amount: 4000000, date: new Date().toISOString(), note: 'Objectif atteint' },
    ],
  },
  {
    id: 'mock-3',
    user_id: '',
    account_id: null,
    name: "Fonds d'Urgence",
    target_amount: 1000000,
    current_amount: 300000,
    deadline: null,
    icon: '🛡️',
    color: '#10B981',
    auto_save_amount: 100000,
    auto_save_frequency: 'mensuel',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    progress: 30,
    remaining: 700000,
    transactions: [
      { id: 't4', saving_id: 'mock-3', type: 'deposit', amount: 100000, date: new Date().toISOString(), note: 'Épargne automatique' },
      { id: 't5', saving_id: 'mock-3', type: 'deposit', amount: 100000, date: new Date(Date.now() - 2592000000).toISOString(), note: 'Épargne automatique' },
      { id: 't6', saving_id: 'mock-3', type: 'deposit', amount: 100000, date: new Date(Date.now() - 5184000000).toISOString(), note: 'Épargne automatique' },
    ],
  },
]

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  completed: 'Complété',
  cancelled: 'Annulé',
}

const STATUS_VARIANTS: Record<string, 'success' | 'default' | 'destructive'> = {
  active: 'success',
  completed: 'default',
  cancelled: 'destructive',
}

const FREQUENCY_LABELS: Record<string, string> = {
  hebdomadaire: 'semaine',
  mensuel: 'mois',
  trimestriel: 'trimestre',
  annuel: 'an',
}

export default function SavingsPage() {
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'

  const [savings, setSavings] = useState<Saving[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null)
  const [depositTarget, setDepositTarget] = useState<Saving | null>(null)
  const [withdrawTarget, setWithdrawTarget] = useState<Saving | null>(null)
  const [expandedTx, setExpandedTx] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { success, error: toastError } = useToastStore()

  const deletingSaving = savings.find((s) => s.id === confirmDeleteId)

  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(n ?? 0)

  const form = useForm<SavingFormData>({
    defaultValues: {
      name: '',
      target_amount: 0,
      deadline: '',
      icon: '🏆',
      color: '#EC4899',
      account_id: '',
    },
  })

  const openCreate = () => {
    setEditingSaving(null)
    form.reset({
      name: '',
      target_amount: 0,
      deadline: '',
      icon: '🏆',
      color: '#EC4899',
      account_id: accounts[0]?.id ?? '',
      auto_save_amount: undefined,
      auto_save_frequency: '',
    })
    setShowForm(true)
  }

  const openEdit = (saving: Saving) => {
    setEditingSaving(saving)
    form.reset({
      name: saving.name,
      target_amount: saving.target_amount,
      deadline: saving.deadline ? saving.deadline.split('T')[0] : '',
      icon: saving.icon ?? '',
      color: saving.color,
      account_id: saving.account_id ?? accounts[0]?.id ?? '',
      auto_save_amount: saving.auto_save_amount ?? undefined,
      auto_save_frequency: saving.auto_save_frequency ?? '',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSaving(null)
  }

  const fetchSavings = () => {
    setLoading(true)
    setError(null)
    api.get('/savings')
      .then((res) => {
        setSavings(res.data?.data || res.data || [])
      })
      .catch(() => {
        setSavings(MOCK_SAVINGS)
        setError("Backend non connecté \u2014 données d'exemple affichées.")
      })
      .finally(() => setLoading(false))
  }

  const fetchAccounts = () => {
    api.get('/accounts')
      .then((res) => {
        const list = res.data?.data || res.data || []
        setAccounts(Array.isArray(list) ? list : [])
      })
      .catch(() => setAccounts([]))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    fetchSavings()
    fetchAccounts()
  }, [])

  const onSubmit = async (data: SavingFormData) => {
    try {
      const payload = { ...data }
      if (!payload.deadline) delete payload.deadline
      if (!payload.account_id) delete payload.account_id
      if (!payload.auto_save_amount) {
        delete payload.auto_save_amount
        delete payload.auto_save_frequency
      }
      if (editingSaving) {
        await api.put(`/savings/${editingSaving.id}`, payload)
      } else {
        await api.post('/savings', payload)
      }
      closeForm()
      fetchSavings()
    } catch {
      setError("Erreur lors de l'enregistrement de l'objectif.")
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await api.delete(`/savings/${id}`)
      success((res.data as { message?: string })?.message || "Objectif d'épargne supprimé avec succès.")
      setConfirmDeleteId(null)
      fetchSavings()
    } catch (err) {
      toastError(getApiErrorMessage(err, "Erreur lors de la suppression de l'objectif."))
      setConfirmDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeposit = async (saving: Saving, amount: number, sourceAccountId: string, note?: string) => {
    try {
      const res = await api.post(`/savings/${saving.id}/deposit`, { amount, source_account_id: sourceAccountId, note: note || null })
      success((res.data as { message?: string })?.message || 'Dépôt effectué avec succès.')
      setDepositTarget(null)
      fetchSavings()
    } catch (err) {
      toastError(getApiErrorMessage(err, 'Erreur lors du dépôt.'))
      setDepositTarget(null)
    }
  }

  const handleWithdraw = async (saving: Saving, amount: number, sourceAccountId: string, note?: string) => {
    try {
      const res = await api.post(`/savings/${saving.id}/withdraw`, { amount, source_account_id: sourceAccountId, note: note || null })
      success((res.data as { message?: string })?.message || 'Retrait effectué avec succès.')
      setWithdrawTarget(null)
      fetchSavings()
    } catch (err) {
      toastError(getApiErrorMessage(err, 'Erreur lors du retrait.'))
      setWithdrawTarget(null)
    }
  }

  const toggleTx = (id: string) => {
    setExpandedTx((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalSaved = savings.reduce((sum, s) => sum + Number(s.current_amount), 0)
  const totalTargets = savings.reduce((sum, s) => sum + Number(s.target_amount), 0)
  const overallRate = totalTargets > 0 ? Math.round((totalSaved / totalTargets) * 100) : 0

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-500">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Epargnes</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Définissez et suivez vos objectifs d'épargne.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Nouvel Objectif
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          ⚠️ {error}
        </div>
      )}

      {!loading && savings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total épargné', value: totalSaved, icon: PiggyBank, color: 'text-pink-500', bg: 'bg-pink-500/10' },
            { label: 'Objectifs totaux', value: totalTargets, icon: Target, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: "Taux d'épargne global", value: overallRate, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', suffix: '%' },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">{item.label}</p>
                  <p className={cn('text-xl font-bold', item.color)}>
                    {item.suffix ? `${item.value}%` : `${fmt(item.value)} ${currency}`}
                  </p>
                </div>
                <div className={cn('p-2.5 rounded-xl', item.bg)}>
                  <item.icon className={cn('w-5 h-5', item.color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && savings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="p-4 rounded-full bg-pink-500/10">
            <PiggyBank className="w-10 h-10 text-pink-500" />
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">Aucun objectif d'épargne</p>
          <p className="text-sm text-[var(--muted-foreground)]">Créez votre premier objectif pour commencer à épargner.</p>
          <Button onClick={openCreate} className="mt-2">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouvel Objectif
          </Button>
        </div>
      )}

      {!loading && savings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savings.map((saving, index) => (
            <motion.div
              key={saving.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Card className="overflow-hidden" style={{ borderTop: `3px solid ${saving.color}` }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0 text-[var(--muted-foreground)]">
                        {(() => { const Icon = resolveIcon(saving.icon); return <Icon className="w-6 h-6" /> })()}
                      </span>
                      <div>
                        <CardTitle className="text-base">{saving.name}</CardTitle>
                        <CardDescription className="text-xs">
                          Objectif : {fmt(saving.target_amount)} {currency}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANTS[saving.status] || 'default'}>
                      {STATUS_LABELS[saving.status] || saving.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {saving.account && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Compte : {saving.account.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--muted-foreground)]">épargné</span>
                    <span className="text-lg font-bold">{fmt(saving.current_amount)} {currency}</span>
                  </div>

                  <div className="space-y-1">
                    <Progress value={saving.progress} indicatorClassName="bg-[var(--primary)]" />
                    <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                      <span>{saving.progress.toFixed(1)}%</span>
                      <span>Reste {fmt(saving.remaining)} {currency}</span>
                    </div>
                  </div>

                  {saving.deadline && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>échéance : {formatDistanceToNow(new Date(saving.deadline), { locale: fr, addSuffix: true })}</span>
                    </div>
                  )}

                  {saving.auto_save_amount && saving.auto_save_frequency && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] bg-[var(--secondary)]/30 rounded-lg px-2.5 py-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        épargne automatique : {fmt(saving.auto_save_amount)} {currency}
                        {saving.auto_save_frequency && FREQUENCY_LABELS[saving.auto_save_frequency]
                          ? ` /${FREQUENCY_LABELS[saving.auto_save_frequency]}`
                          : ` /${saving.auto_save_frequency}`}
                      </span>
                    </div>
                  )}

                  {saving.status === 'active' && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => setDepositTarget(saving)}
                      >
                        <ArrowDown className="w-3.5 h-3.5 mr-1" />
                        Déposer
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => setWithdrawTarget(saving)}
                      >
                        <ArrowUp className="w-3.5 h-3.5 mr-1" />
                        Retirer
                      </Button>
                    </div>
                  )}

                  <div className="flex gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(saving)}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setConfirmDeleteId(saving.id)}
                      disabled={deletingId === saving.id}
                    >
                      {deletingId === saving.id ? (
                        <span className="inline-flex items-center">
                          <span className="w-3.5 h-3.5 mr-1 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                          Suppression...
                        </span>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Supprimer
                        </>
                      )}
                    </Button>
                  </div>

                  {saving.transactions && saving.transactions.length > 0 && (
                    <>
                      <Separator />
                      <button
                        onClick={() => toggleTx(saving.id)}
                        className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-full"
                      >
                        {expandedTx.has(saving.id) ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {saving.transactions.length} transaction{saving.transactions.length > 1 ? 's' : ''}
                      </button>
                      {expandedTx.has(saving.id) && (
                        <div className="space-y-1.5 pt-1">
                          {saving.transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                {tx.type === 'deposit' ? (
                                  <ArrowDown className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <ArrowUp className="w-3 h-3 text-red-500" />
                                )}
                                <span className="text-[var(--muted-foreground)]">
                                  {tx.note || (tx.type === 'deposit' ? 'Dépô' : 'Retrait')}
                                </span>
                              </div>
                              <span className={tx.type === 'deposit' ? 'text-emerald-500 font-medium' : 'text-red-500 font-medium'}>
                                {tx.type === 'deposit' ? '+' : '-'}{fmt(tx.amount)} {currency}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {editingSaving ? '\u270f\ufe0f Modifier l\'objectif' : '🏆 Nouvel objectif'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingSaving
                ? "Modifiez les détails de votre objectif d'épargne."
                : "Créez un nouvel objectif pour suivre votre épargne."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" {...form.register('name', { required: true })} placeholder="Nom de l'objectif" />
              {form.formState.errors.name && <p className="text-xs text-red-500">Ce champ est requis</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_amount">Montant cible</Label>
              <Input
                id="target_amount"
                type="number"
                disabled={!!editingSaving}
                {...form.register('target_amount', { required: true, min: 1, valueAsNumber: true })}
                placeholder="Ex: 1000000"
              />
              {form.formState.errors.target_amount && <p className="text-xs text-red-500">Montant valide requis</p>}
              {editingSaving && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Le montant cible ne peut plus être modifié. Utilisez Déposer / Retirer pour faire évoluer l'épargne.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_id">Compte source</Label>
              <select
                id="account_id"
                {...form.register('account_id', { required: true })}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choisir un compte --</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency_code})
                  </option>
                ))}
              </select>
              {form.formState.errors.account_id && (
                <p className="text-xs text-red-500">Compte source requis</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Date d'échéance (optionnelle)</Label>
              <Input id="deadline" type="date" {...form.register('deadline')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icône</Label>
                <Input id="icon" {...form.register('icon')} placeholder="🏆" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Input id="color" type="color" {...form.register('color')} className="h-10 p-1" />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="auto_save_amount">épargne automatique (optionnelle)</Label>
              <Input
                id="auto_save_amount"
                type="number"
                {...form.register('auto_save_amount', { valueAsNumber: true })}
                placeholder="Montant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto_save_frequency">Fréquence</Label>
              <select
                id="auto_save_frequency"
                {...form.register('auto_save_frequency')}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">Sélectionner...</option>
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="mensuel">Mensuel</option>
                <option value="trimestriel">Trimestriel</option>
                <option value="annuel">Annuel</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={closeForm}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                {editingSaving ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <TransactionDialog
        saving={depositTarget}
        type="deposit"
        accounts={accounts}
        onClose={() => setDepositTarget(null)}
        onConfirm={handleDeposit}
        fmt={fmt}
        currency={currency}
      />

      <TransactionDialog
        saving={withdrawTarget}
        type="withdrawal"
        accounts={accounts}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={handleWithdraw}
        fmt={fmt}
        currency={currency}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
        title="Supprimer cet objectif d'épargne ?"
        description={
          deletingSaving
            ? `« ${deletingSaving.name} » et tous ses mouvements seront définitivement supprimés.`
            : undefined
        }
        loading={deletingId === confirmDeleteId}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
      />
    </div>
  )
}

function TransactionDialog({
  saving,
  type,
  accounts,
  onClose,
  onConfirm,
  fmt,
  currency,
}: {
  saving: Saving | null
  type: 'deposit' | 'withdrawal'
  accounts: Account[]
  onClose: () => void
  onConfirm: (saving: Saving, amount: number, sourceAccountId: string, note?: string) => void
  fmt: (n: number) => string
  currency: string
}) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (saving) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset fields when type changes
      setAmount('')
      setNote('')
      setSourceAccountId(saving.account_id ?? accounts[0]?.id ?? '')
    }
  }, [saving])

  const isDeposit = type === 'deposit'

  const handleSubmit = async () => {
    const parsed = parseInt(amount, 10)
    if (!amount || isNaN(parsed) || parsed <= 0) return
    if (!sourceAccountId) return
    setSubmitting(true)
    try {
      await onConfirm(saving!, parsed, sourceAccountId, note || undefined)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={saving !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {isDeposit ? '📥 Déposer' : '📤 Retirer'} — {saving?.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isDeposit
              ? "Ajoutez des fonds à cet objectif d'épargne."
              : "Retirez des fonds de cet objectif d'épargne."}
          </DialogDescription>
        </DialogHeader>
        {saving && (
          <div className="space-y-4 mt-2">
            <div className="text-sm text-[var(--muted-foreground)]">
              Solde actuel : <span className="font-semibold text-[var(--foreground)]">{fmt(saving.current_amount)} {currency}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-account">Compte {isDeposit ? 'source' : 'de destination'}</Label>
              <select
                id="tx-account"
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Montant</Label>
              <Input
                id="tx-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Montant"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-note">Note (optionnelle)</Label>
              <Textarea
                id="tx-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Virement mensuel"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={onClose}>
                Annuler
              </Button>
              <Button
                variant={isDeposit ? 'primary' : 'secondary'}
                type="button"
                onClick={handleSubmit}
                disabled={!amount || !sourceAccountId || submitting}
              >
                {submitting ? '...' : isDeposit ? 'Déposer' : 'Retirer'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
