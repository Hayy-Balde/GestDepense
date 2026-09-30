import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Wallet, Plus, Pencil, Trash2, AlertCircle, ArrowDownToLine, Lock } from 'lucide-react'
import { cn } from '../lib/utils'
import { resolveIcon } from '../lib/iconMap'
import { useAuthStore } from '../stores/authStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import type { Caisse, CaisseFormData } from '../types'
import { useConfig } from '../hooks/useConfig'
import type { Account } from '../types/account'
import { MoneyActionModal, DeleteResolutionModal } from '../components/money/MoneyActionModal'
import type { MoneyActionKind, MoneyEntity } from '../components/money/MoneyActionModal'
import { useToastStore, getApiErrorMessage } from '../stores/toastStore'

const mockCaisses: Caisse[] = [
  { id: '1', user_id: '', name: 'Alimentation', budget_amount: 500000, spent_amount: 320000, icon: '🍎', color: '#22C55E', description: null, created_at: '', updated_at: '', remaining: 180000, percentage_used: 64 },
  { id: '2', user_id: '', name: 'Transport', budget_amount: 200000, spent_amount: 180000, icon: '🚗', color: '#F59E0B', description: null, created_at: '', updated_at: '', remaining: 20000, percentage_used: 90 },
  { id: '3', user_id: '', name: 'Loisirs', budget_amount: 150000, spent_amount: 45000, icon: '🎮', color: '#3B82F6', description: null, created_at: '', updated_at: '', remaining: 105000, percentage_used: 30 },
  { id: '4', user_id: '', name: 'Santé', budget_amount: 100000, spent_amount: 20000, icon: '🏥', color: '#8B5CF6', description: null, created_at: '', updated_at: '', remaining: 80000, percentage_used: 20 },
]

function formatCurrency(amount: number, currency: string): string {
  // return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount ?? 0) + ' ' + currency
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency, minimumFractionDigits: 0 }).format(amount ?? 0);

}

function getProgressColor(pct: number): string {
  if (pct > 80) return 'bg-[var(--destructive)]'
  if (pct > 50) return 'bg-[var(--warning)]'
  return 'bg-[var(--success)]'
}

function getBadgeVariant(pct: number): 'destructive' | 'warning' | 'success' {
  if (pct > 80) return 'destructive'
  if (pct > 50) return 'warning'
  return 'success'
}

function caisseCurrency(c: Caisse, fallback: string): string {
  return c.source_account?.currency_code || fallback
}

export default function CaissesPage() {
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCaisse, setEditingCaisse] = useState<Caisse | null>(null)
  const [moneyAction, setMoneyAction] = useState<{ kind: MoneyActionKind; entity: MoneyEntity } | null>(null)
  const [deleting, setDeleting] = useState<Caisse | null>(null)
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'
  const { success, error: toastError } = useToastStore()

  const { currencies } = useConfig()
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CaisseFormData>()

  const fetchCaisses = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/caisses')
      const list = Array.isArray(data) ? data : (data.data || [])
      setCaisses(list)
      const { data: accData } = await api.get('/accounts')
      setAccounts(Array.isArray(accData) ? accData : (accData.data || []))
    } catch {
      setCaisses(mockCaisses)
      setError("Backend non connecté — affichage des données d'exemple")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    fetchCaisses()
  }, [])

  const openCreate = () => {
    setEditingCaisse(null)
    reset({ name: '', budget_amount: 0, source_account_id: accounts[0]?.id || '', currency_code: accounts[0]?.currency_code || currency, icon: '🎯', color: '#4F46E5', description: '' })
    setDialogOpen(true)
  }

  const openEdit = (c: Caisse) => {
    setEditingCaisse(c)
    reset({ name: c.name, budget_amount: c.budget_amount, source_account_id: c.source_account_id || '', currency_code: c.currency_code || currency, icon: c.icon ?? '', color: c.color, description: c.description || '' })
    setDialogOpen(true)
  }

  const onSubmit = async (formData: CaisseFormData) => {
    try {
      if (editingCaisse) {
        const { budget_amount, source_account_id, ...meta } = formData
        const res = await api.put(`/caisses/${editingCaisse.id}`, meta)
        success((res.data as { message?: string })?.message || 'Caisse modifiée avec succès.')
      } else {
        const res = await api.post('/caisses', formData)
        success((res.data as { message?: string })?.message || 'Caisse créée avec succès.')
      }
      setDialogOpen(false)
      fetchCaisses()
    } catch (err) {
      toastError(getApiErrorMessage(err, editingCaisse ? 'Erreur lors de la modification de la caisse.' : 'Erreur lors de la création de la caisse.'))
      if (editingCaisse) {
        setCaisses(prev => prev.map(c =>
          c.id === editingCaisse.id
            ? { ...c, ...formData, remaining: formData.budget_amount - c.spent_amount, percentage_used: formData.budget_amount > 0 ? Math.round((c.spent_amount / formData.budget_amount) * 100) : 0 }
            : c
        ))
      } else {
        const newCaisse: Caisse = {
          id: crypto.randomUUID(),
          user_id: '',
          name: formData.name,
          budget_amount: formData.budget_amount,
          currency_code: formData.currency_code,
          spent_amount: 0,
          icon: formData.icon,
          color: formData.color,
          description: formData.description || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          remaining: formData.budget_amount,
          percentage_used: 0,
        }
        setCaisses(prev => [...prev, newCaisse])
      }
      setDialogOpen(false)
    }
  }

  const handleDelete = async (mode: "lost" | "redirect", destId?: string) => {
    if (!deleting) return
    try {
      const res = await api.delete(`/caisses/${deleting.id}`, { data: { mode, account_id: destId } })
      success((res.data as { message?: string })?.message || 'Caisse supprimée avec succès.')
    } catch (err) {
      toastError(getApiErrorMessage(err, 'Erreur lors de la suppression de la caisse.'))
    }
    fetchCaisses()
  }

  const totalBudget = caisses.reduce((s, c) => s + Number(c.budget_amount), 0)
  const totalSpent = caisses.reduce((s, c) => s + Number(c.spent_amount), 0)
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const firstCaisse: Caisse = caisses[caisses.length - 1] ?? caisses[0]!
const summaryCurrency = caisses.length > 0
    ? new Set(caisses.map((c) => caisseCurrency(c, currency))).size === 1
      ? caisseCurrency(firstCaisse, currency)
      : currency
    : currency

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-[var(--background)] min-h-[100dvh]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl shimmer" />
          <div className="space-y-2">
            <div className="h-6 w-32 rounded shimmer" />
            <div className="h-4 w-64 rounded shimmer" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl border border-[var(--border)] p-4 space-y-2 bg-[var(--card)]">
              <div className="h-4 w-20 rounded shimmer" />
              <div className="h-6 w-28 rounded shimmer" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 rounded-xl border border-[var(--border)] p-5 space-y-3 bg-[var(--card)]">
              <div className="h-5 w-32 rounded shimmer" />
              <div className="h-4 w-24 rounded shimmer" />
              <div className="h-2 w-full rounded shimmer" />
              <div className="h-4 w-20 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background)] min-h-[100dvh]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Caisses</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Gérez vos enveloppes budgétaires et suivez vos dépenses par catégorie.</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle Caisse
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-[var(--muted-foreground)] font-medium">Budget total</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-[var(--foreground)]">{formatCurrency(totalBudget, summaryCurrency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-[var(--muted-foreground)] font-medium">Dépensé total</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-[var(--destructive)]">{formatCurrency(totalSpent, summaryCurrency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-[var(--muted-foreground)] font-medium">Utilisation globale</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-[var(--foreground)]">{overallPct}%</p>
              <Progress value={overallPct} indicatorClassName={getProgressColor(overallPct)} className="flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {caisses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center">
            <Wallet className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <p className="text-lg font-medium text-[var(--muted-foreground)]">Aucune caisse définie</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Créer une caisse
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {caisses.map((caisse, i) => (
            <motion.div
              key={caisse.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: caisse.color }} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 text-[var(--muted-foreground)]">
                        {(() => {
                          const Icon = resolveIcon(caisse.icon)
                          return <Icon className="w-6 h-6" />
                        })()}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)] truncate">{caisse.name}</h3>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {formatCurrency(caisse.spent_amount, caisseCurrency(caisse, currency))} / {formatCurrency(caisse.budget_amount, caisseCurrency(caisse, currency))}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {caisse.status !== "closed" && (
                        <>
                          <Button variant="ghost" size="icon-sm" title="Étendre (apport)" onClick={() => setMoneyAction({ kind: "fund", entity: { id: caisse.id, name: caisse.name, type: "caisse" } })}>
                            <ArrowDownToLine className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Clôturer" onClick={() => setMoneyAction({ kind: "close", entity: { id: caisse.id, name: caisse.name, type: "caisse" } })}>
                            <Lock className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(caisse)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(caisse)}>
                        <Trash2 className="w-4 h-4 text-[var(--destructive)]" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Progress
                      value={caisse.percentage_used}
                      indicatorClassName={getProgressColor(caisse.percentage_used)}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn(
                        'font-medium',
                        caisse.remaining < 0 ? 'text-[var(--destructive)]' : 'text-[var(--foreground)]'
                      )}>
                        {caisse.remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(caisse.remaining), caisseCurrency(caisse, currency))}
                      </span>
                      <Badge variant={caisse.status === "closed" ? "secondary" : getBadgeVariant(caisse.percentage_used)}>
                        {caisse.status === "closed" ? "Clôturée" : `${caisse.percentage_used}% utilisé`}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCaisse ? 'Modifier la caisse' : 'Nouvelle caisse'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                {...register('name', { required: 'Le nom est requis' })}
                placeholder="Ex: Alimentation"
              />
              {errors.name && <p className="text-xs text-[var(--destructive)]">{errors.name.message}</p>}
            </div>
            {!editingCaisse && (
              <div className="space-y-2">
                <Label htmlFor="budget_amount">Montant à placer dans la caisse</Label>
                <Input
                  id="budget_amount"
                  type="number"
                  {...register('budget_amount', { required: 'Le montant est requis', valueAsNumber: true })}
                  placeholder="Ex: 500000"
                />
                {errors.budget_amount && <p className="text-xs text-[var(--destructive)]">{errors.budget_amount.message}</p>}
              </div>
            )}
            {editingCaisse && (
              <div className="space-y-2">
                <Label>Montant</Label>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/30 px-3 py-2 text-sm text-[var(--muted-foreground)]">
                  {formatCurrency(editingCaisse.budget_amount, caisseCurrency(editingCaisse, currency))}
                </div>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Le montant d'une caisse ne peut plus être modifié. Utilisez « Étendre » pour ajouter des fonds.
                </p>
              </div>
            )}
            {!editingCaisse && (
              <div className="space-y-2">
                <Label htmlFor="source_account_id">Compte source (l'argent quittera ce compte)</Label>
                <select
                  id="source_account_id"
                  {...register('source_account_id', { required: 'Choisissez un compte source' })}
                  onChange={(e) => {
                    const acc = accounts.find((a) => a.id === e.target.value)
                    setValue('source_account_id', e.target.value)
                    // La devise suit le compte par défaut ; l'utilisateur reste
                    // libre de la changer si le compte alimenté n'est pas dans
                    // la même devise (une conversion sera appliquée).
                    if (acc) setValue('currency_code', acc.currency_code)
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-[var(--primary)] focus:outline-none"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, a.currency_code)})</option>
                  ))}
                </select>
                {errors.source_account_id && <p className="text-xs text-[var(--destructive)]">{errors.source_account_id.message}</p>}
              </div>
            )}
            {!editingCaisse && (
              <div className="space-y-2">
                <Label htmlFor="currency_code">Devise de la caisse</Label>
                <select
                  id="currency_code"
                  {...register('currency_code', { required: 'Choisissez une devise' })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-[var(--primary)] focus:outline-none"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
                {watch('source_account_id') &&
                  accounts.find((a) => a.id === watch('source_account_id'))?.currency_code !==
                    watch('currency_code') && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Différente du compte source : le montant sera converti au taux en vigueur.
                    </p>
                  )}
                {errors.currency_code && <p className="text-xs text-[var(--destructive)]">{errors.currency_code.message}</p>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icône</Label>
                <Input id="icon" {...register('icon')} defaultValue="🎯" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Input id="color" type="color" {...register('color')} defaultValue="#4F46E5" className="h-10 p-1 cursor-pointer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="Description optionnelle..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editingCaisse ? 'Modifier' : 'Créer'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MoneyActionModal
        open={!!moneyAction}
        onOpenChange={(v) => { if (!v) setMoneyAction(null) }}
        kind={moneyAction?.kind ?? "fund"}
        entity={moneyAction?.entity ?? { id: "", name: "", type: "caisse" }}
        currency={currency}
        accounts={accounts}
        caisses={caisses}
        onDone={fetchCaisses}
      />

      <DeleteResolutionModal
        open={!!deleting}
        onOpenChange={(v) => { if (!v) setDeleting(null) }}
        entityName={deleting?.name || ""}
        accounts={accounts}
        onConfirm={handleDelete}
      />
    </div>
  )
}
