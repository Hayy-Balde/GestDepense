import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Wallet, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
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

const mockCaisses: Caisse[] = [
  { id: '1', user_id: '', name: 'Alimentation', budget_amount: 500000, spent_amount: 320000, icon: '🍎', color: '#22C55E', description: null, created_at: '', updated_at: '', remaining: 180000, percentage_used: 64 },
  { id: '2', user_id: '', name: 'Transport', budget_amount: 200000, spent_amount: 180000, icon: '🚗', color: '#F59E0B', description: null, created_at: '', updated_at: '', remaining: 20000, percentage_used: 90 },
  { id: '3', user_id: '', name: 'Loisirs', budget_amount: 150000, spent_amount: 45000, icon: '🎮', color: '#3B82F6', description: null, created_at: '', updated_at: '', remaining: 105000, percentage_used: 30 },
  { id: '4', user_id: '', name: 'Santé', budget_amount: 100000, spent_amount: 20000, icon: '🏥', color: '#8B5CF6', description: null, created_at: '', updated_at: '', remaining: 80000, percentage_used: 20 },
]

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount) + '\u00A0' + currency
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

export default function CaissesPage() {
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCaisse, setEditingCaisse] = useState<Caisse | null>(null)
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CaisseFormData>()

  const fetchCaisses = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/caisses')
      setCaisses(data.data || [])
    } catch {
      setCaisses(mockCaisses)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCaisses() }, [])

  const openCreate = () => {
    setEditingCaisse(null)
    reset({ name: '', budget_amount: 0, icon: '🎯', color: '#4F46E5', description: '' })
    setDialogOpen(true)
  }

  const openEdit = (c: Caisse) => {
    setEditingCaisse(c)
    reset({ name: c.name, budget_amount: c.budget_amount, icon: c.icon, color: c.color, description: c.description || '' })
    setDialogOpen(true)
  }

  const onSubmit = async (formData: CaisseFormData) => {
    try {
      if (editingCaisse) {
        await api.put(`/caisses/${editingCaisse.id}`, formData)
      } else {
        await api.post('/caisses', formData)
      }
      setDialogOpen(false)
      fetchCaisses()
    } catch {
      if (editingCaisse) {
        setCaisses(prev => prev.map(c =>
          c.id === editingCaisse.id
            ? { ...c, ...formData, remaining: formData.budget_amount - c.spent_amount, percentage_used: formData.budget_amount > 0 ? Math.round((c.spent_amount / formData.budget_amount) * 100) : 0 }
            : c
        ))
      } else {
        const newCaisse: Caisse = {
          id: Date.now().toString(),
          user_id: '',
          name: formData.name,
          budget_amount: formData.budget_amount,
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

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/caisses/${id}`)
      setCaisses(prev => prev.filter(c => c.id !== id))
    } catch {
      setCaisses(prev => prev.filter(c => c.id !== id))
    }
  }

  const totalBudget = caisses.reduce((s, c) => s + c.budget_amount, 0)
  const totalSpent = caisses.reduce((s, c) => s + c.spent_amount, 0)
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[var(--background)] min-h-[100dvh]">
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[var(--background)] min-h-[100dvh]">
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
            <p className="text-2xl font-bold text-[var(--foreground)]">{formatCurrency(totalBudget, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-[var(--muted-foreground)] font-medium">Dépensé total</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-[var(--destructive)]">{formatCurrency(totalSpent, currency)}</p>
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
                      <span className="text-2xl shrink-0">{caisse.icon || '🎯'}</span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--foreground)] truncate">{caisse.name}</h3>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                          {formatCurrency(caisse.spent_amount, currency)} / {formatCurrency(caisse.budget_amount, currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(caisse)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(caisse.id)}>
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
                        {caisse.remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(caisse.remaining), currency)}
                      </span>
                      <Badge variant={getBadgeVariant(caisse.percentage_used)}>
                        {caisse.percentage_used}% utilisé
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
            <div className="space-y-2">
              <Label htmlFor="budget_amount">Budget</Label>
              <Input
                id="budget_amount"
                type="number"
                {...register('budget_amount', { required: 'Le budget est requis', valueAsNumber: true })}
                placeholder="Ex: 500000"
              />
              {errors.budget_amount && <p className="text-xs text-[var(--destructive)]">{errors.budget_amount.message}</p>}
            </div>
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
    </div>
  )
}
