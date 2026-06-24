import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, differenceInDays, isPast, isFuture } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { api } from '../services/api'
import type { Debt, DebtFormData, DebtPayment, DebtType, DebtStatus } from '../types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Separator } from '../components/ui/separator'
import { cn } from '../lib/utils'
import { useAuthStore } from '../stores/authStore'
import { DEBT_TYPES, CURRENCIES } from '../lib/constants'

type TabType = 'lent' | 'borrowed'

interface PaymentFormData {
  amount: number
  date: string
  note?: string
}

const MOCK_LENT: Debt[] = [
  {
    id: 'mock-lent-1',
    user_id: 'mock',
    type: 'lent',
    person_name: 'Jean Camara',
    person_contact: '+224 621 11 22 33',
    amount: 500000,
    remaining_amount: 200000,
    currency_code: 'GNF',
    due_date: '2026-08-15',
    description: 'Prêt pour son projet agricole',
    status: 'partially_paid',
    progress: 60,
    created_at: '2026-01-10',
    updated_at: '2026-06-01',
    payments: [
      { id: 'mock-pay-1', debt_id: 'mock-lent-1', amount: 150000, date: '2026-03-15', note: null },
      { id: 'mock-pay-2', debt_id: 'mock-lent-1', amount: 150000, date: '2026-05-20', note: null },
    ],
  },
  {
    id: 'mock-lent-2',
    user_id: 'mock',
    type: 'lent',
    person_name: 'Marie Diallo',
    person_contact: null,
    amount: 300000,
    remaining_amount: 0,
    currency_code: 'GNF',
    due_date: null,
    description: null,
    status: 'paid',
    progress: 100,
    created_at: '2026-02-01',
    updated_at: '2026-04-10',
    payments: [
      { id: 'mock-pay-3', debt_id: 'mock-lent-2', amount: 300000, date: '2026-04-10', note: 'Remboursement intégral' },
    ],
  },
  {
    id: 'mock-lent-3',
    user_id: 'mock',
    type: 'lent',
    person_name: 'Amadou Bah',
    person_contact: '+224 622 33 44 55',
    amount: 1000000,
    remaining_amount: 1000000,
    currency_code: 'GNF',
    due_date: '2026-06-05',
    description: 'Prêt pour frais médicaux',
    status: 'overdue',
    progress: 0,
    created_at: '2026-05-01',
    updated_at: '2026-05-01',
    payments: [],
  },
]

const MOCK_BORROWED: Debt[] = [
  {
    id: 'mock-borrowed-1',
    user_id: 'mock',
    type: 'borrowed',
    person_name: 'Prêt Bancaire',
    person_contact: 'Banque Populaire',
    amount: 3000000,
    remaining_amount: 1200000,
    currency_code: 'GNF',
    due_date: '2027-12-30',
    description: 'Prêt personnel sur 24 mois',
    status: 'partially_paid',
    progress: 60,
    created_at: '2026-01-15',
    updated_at: '2026-06-01',
    payments: [
      { id: 'mock-pay-4', debt_id: 'mock-borrowed-1', amount: 600000, date: '2026-03-01', note: null },
      { id: 'mock-pay-5', debt_id: 'mock-borrowed-1', amount: 600000, date: '2026-06-01', note: null },
      { id: 'mock-pay-6', debt_id: 'mock-borrowed-1', amount: 600000, date: '2026-09-01', note: null },
    ],
  },
  {
    id: 'mock-borrowed-2',
    user_id: 'mock',
    type: 'borrowed',
    person_name: 'Maman',
    person_contact: null,
    amount: 500000,
    remaining_amount: 500000,
    currency_code: 'GNF',
    due_date: null,
    description: 'Prêt pour acheter le réfrigérateur',
    status: 'active',
    progress: 0,
    created_at: '2026-05-20',
    updated_at: '2026-05-20',
    payments: [],
  },
]

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount) + ' ' + currency
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: fr })
  } catch {
    return dateStr
  }
}

function getStatusLabel(status: DebtStatus): string {
  const labels: Record<DebtStatus, string> = {
    active: 'Actif',
    partially_paid: 'Partiellement remboursé',
    paid: 'Remboursé',
    overdue: 'En retard',
  }
  return labels[status]
}

function getStatusVariant(status: DebtStatus): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  const variants: Record<DebtStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    active: 'default',
    partially_paid: 'warning',
    paid: 'success',
    overdue: 'destructive',
  }
  return variants[status]
}

function isOverdue(debt: Debt): boolean {
  if (!debt.due_date) return false
  if (debt.status === 'paid') return false
  return isPast(parseISO(debt.due_date))
}

function getDaysUntilDue(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date())
}

export default function DebtsPage() {
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'

  const [activeTab, setActiveTab] = useState<TabType>('lent')
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [showPayments, setShowPayments] = useState<Set<string>>(new Set())

  const createForm = useForm<DebtFormData>({
    defaultValues: {
      type: 'lent',
      person_name: '',
      person_contact: '',
      amount: 0,
      currency_code: currency,
      due_date: '',
      description: '',
    },
  })

  const paymentForm = useForm<PaymentFormData>({
    defaultValues: {
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
    },
  })

  const filteredDebts = debts.filter((d) => d.type === activeTab)

  useEffect(() => {
    fetchDebts()
  }, [])

  function fetchDebts() {
    setLoading(true)
    setError(null)
    api
      .get('/debts')
      .then((res) => {
        setDebts(res.data?.data || res.data || [])
      })
      .catch(() => {
        setDebts([...MOCK_LENT, ...MOCK_BORROWED])
        setError('Backend non connecté — données d\'exemple affichées.')
      })
      .finally(() => setLoading(false))
  }

  function handleCreate(data: DebtFormData) {
    api
      .post('/debts', data)
      .then((res) => {
        const created = res.data?.data || res.data
        if (created) {
          setDebts((prev) => [...prev, created])
        }
        setShowCreateDialog(false)
        createForm.reset({
          type: 'lent',
          person_name: '',
          person_contact: '',
          amount: 0,
          currency_code: currency,
          due_date: '',
          description: '',
        })
      })
      .catch(() => {
        const mockId = 'mock-' + Date.now()
        const newDebt: Debt = {
          id: mockId,
          user_id: 'mock',
          type: data.type,
          person_name: data.person_name,
          person_contact: data.person_contact || null,
          amount: data.amount,
          remaining_amount: data.amount,
          currency_code: data.currency_code,
          due_date: data.due_date || null,
          description: data.description || null,
          status: 'active',
          progress: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          payments: [],
        }
        setDebts((prev) => [...prev, newDebt])
        setShowCreateDialog(false)
        createForm.reset({
          type: 'lent',
          person_name: '',
          person_contact: '',
          amount: 0,
          currency_code: currency,
          due_date: '',
          description: '',
        })
        setError('Impossible de créer la dette sur le serveur — donnée enregistrée localement.')
      })
  }

  function handleDelete(id: string) {
    api
      .delete(`/debts/${id}`)
      .then(() => {
        setDebts((prev) => prev.filter((d) => d.id !== id))
      })
      .catch(() => {
        setDebts((prev) => prev.filter((d) => d.id !== id))
        setError('Impossible de supprimer la dette sur le serveur — donnée supprimée localement.')
      })
  }

  function openPaymentDialog(debt: Debt) {
    setSelectedDebt(debt)
    paymentForm.reset({
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
    })
    setShowPaymentDialog(true)
  }

  function handleAddPayment(data: PaymentFormData) {
    if (!selectedDebt) return
    api
      .post(`/debts/${selectedDebt.id}/payments`, data)
      .then((res) => {
        const payment = res.data?.data || res.data
        setDebts((prev) =>
          prev.map((d) => {
            if (d.id !== selectedDebt.id) return d
            const paidTotal = (d.payments || []).reduce((s, p) => s + p.amount, 0) + data.amount
            const remaining = Math.max(0, d.amount - paidTotal)
            const progress = d.amount > 0 ? Math.round(((d.amount - remaining) / d.amount) * 100) : 0
            let status: DebtStatus = d.status
            if (remaining <= 0) status = 'paid'
            else if (paidTotal > 0) status = 'partially_paid'
            if (d.due_date && isPast(parseISO(d.due_date)) && remaining > 0) status = 'overdue'
            return {
              ...d,
              remaining_amount: remaining,
              progress,
              status,
              payments: [...(d.payments || []), payment || { id: 'mock-pay-' + Date.now(), debt_id: d.id, ...data }],
            }
          })
        )
        setShowPaymentDialog(false)
        setSelectedDebt(null)
      })
      .catch(() => {
        if (!selectedDebt) return
        const payment: DebtPayment = { id: 'mock-pay-' + Date.now(), debt_id: selectedDebt.id, amount: data.amount, date: data.date, note: data.note || null }
        setDebts((prev) =>
          prev.map((d) => {
            if (d.id !== selectedDebt.id) return d
            const paidTotal = (d.payments || []).reduce((s, p) => s + p.amount, 0) + data.amount
            const remaining = Math.max(0, d.amount - paidTotal)
            const progress = d.amount > 0 ? Math.round(((d.amount - remaining) / d.amount) * 100) : 0
            let status: DebtStatus = d.status
            if (remaining <= 0) status = 'paid'
            else if (paidTotal > 0) status = 'partially_paid'
            if (d.due_date && isPast(parseISO(d.due_date)) && remaining > 0) status = 'overdue'
            return {
              ...d,
              remaining_amount: remaining,
              progress,
              status,
              payments: [...(d.payments || []), payment],
            }
          })
        )
        setShowPaymentDialog(false)
        setSelectedDebt(null)
        setError('Impossible d\'ajouter le paiement sur le serveur — enregistré localement.')
      })
  }

  function togglePayments(id: string) {
    setShowPayments((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const summary = {
    total: filteredDebts.reduce((s, d) => s + d.amount, 0),
    remaining: filteredDebts.reduce((s, d) => s + d.remaining_amount, 0),
    repaid: filteredDebts.reduce((s, d) => s + (d.amount - d.remaining_amount), 0),
    active: filteredDebts.filter((d) => d.status !== 'paid').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <HandCoins className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Dettes</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Suivez l'argent que vous avez prêté ou emprunté.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1.5" />
          Nouvelle Dette
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex space-x-1 rounded-xl bg-[var(--muted)]/30 p-1 w-fit">
        {DEBT_TYPES.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as TabType)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              activeTab === tab.value
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            {tab.value === 'lent' ? (
              <ArrowUpRight className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            ) : (
              <ArrowDownLeft className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Montant total</p>
            <p className="text-lg font-bold text-[var(--foreground)] mt-1">{formatCurrency(summary.total, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Reste à rembourser</p>
            <p className="text-lg font-bold text-amber-600 mt-1">{formatCurrency(summary.remaining, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Remboursé</p>
            <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(summary.repaid, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Dettes actives</p>
            <p className="text-lg font-bold text-[var(--foreground)] mt-1">{summary.active}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : filteredDebts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-[var(--muted-foreground)] gap-2">
          <HandCoins className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">
            {activeTab === 'lent' ? "Aucune dette prêtée pour l'instant." : "Aucune dette empruntée pour l'instant."}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Créer une dette
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDebts.map((debt) => (
              <motion.div
                key={debt.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg mt-0.5',
                            debt.type === 'lent' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                          )}
                        >
                          {debt.type === 'lent' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{debt.person_name}</CardTitle>
                          {debt.person_contact && (
                            <CardDescription className="mt-0.5">{debt.person_contact}</CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(debt.status)}>{getStatusLabel(debt.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">Montant initial</span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {formatCurrency(debt.amount, debt.currency_code || currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">Reste dû</span>
                      <span className="text-sm font-bold text-amber-600">
                        {formatCurrency(debt.remaining_amount, debt.currency_code || currency)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                        <span>Remboursement</span>
                        <span>{debt.progress}%</span>
                      </div>
                      <Progress
                        value={debt.progress}
                        indicatorClassName={cn(
                          debt.progress >= 100
                            ? 'bg-green-500'
                            : debt.progress > 0
                              ? 'bg-indigo-500'
                              : 'bg-gray-300'
                        )}
                      />
                    </div>
                    {debt.due_date && (
                      <div
                        className={cn(
                          'flex items-center space-x-2 text-xs',
                          isOverdue(debt) ? 'text-red-500 font-semibold' : 'text-[var(--muted-foreground)]'
                        )}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Échéance : {formatDate(debt.due_date)}
                          {isOverdue(debt) && ` (retard de ${Math.abs(getDaysUntilDue(debt.due_date))}j)`}
                          {!isOverdue(debt) &&
                            isFuture(parseISO(debt.due_date)) &&
                            ` (dans ${getDaysUntilDue(debt.due_date)}j)`}
                        </span>
                        {isOverdue(debt) && <AlertTriangle className="w-3.5 h-3.5" />}
                      </div>
                    )}
                    {debt.description && (
                      <p className="text-xs text-[var(--muted-foreground)] italic">{debt.description}</p>
                    )}
                    {(debt.payments && debt.payments.length > 0) && (
                      <div>
                        <button
                          onClick={() => togglePayments(debt.id)}
                          className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
                        >
                          {showPayments.has(debt.id) ? 'Masquer' : 'Voir'} les paiements ({debt.payments.length})
                        </button>
                        <AnimatePresence>
                          {showPayments.has(debt.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 space-y-1.5">
                                {debt.payments.map((payment) => (
                                  <div
                                    key={payment.id}
                                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-[var(--muted)]/20"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                      <span className="text-[var(--foreground)]">
                                        {formatCurrency(payment.amount, debt.currency_code || currency)}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-[var(--muted-foreground)]">
                                        {formatDate(payment.date)}
                                      </span>
                                      {payment.note && (
                                        <span className="italic text-[var(--muted-foreground)] max-w-[120px] truncate">
                                          — {payment.note}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openPaymentDialog(debt)}
                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                        disabled={debt.status === 'paid'}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Ajouter un paiement
                      </Button>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-400 hover:text-red-600"
                          onClick={() => handleDelete(debt.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Nouvelle Dette</DialogTitle>
            <DialogDescription>Enregistrez l'argent que vous prêtez ou empruntez.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(handleCreate)}
            className="space-y-4 mt-2"
          >
            <div>
              <Label>Type</Label>
              <div className="flex space-x-2 mt-1.5">
                {DEBT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => createForm.setValue('type', t.value as DebtType)}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                      createForm.watch('type') === t.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600'
                        : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="person_name">Nom de la personne *</Label>
              <Input
                id="person_name"
                {...createForm.register('person_name', { required: true })}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="person_contact">Contact</Label>
              <Input
                id="person_contact"
                {...createForm.register('person_contact')}
                placeholder="Téléphone ou email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Montant *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="1"
                  {...createForm.register('amount', { required: true, valueAsNumber: true })}
                  placeholder="500000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency_code">Devise</Label>
                <select
                  id="currency_code"
                  {...createForm.register('currency_code')}
                  className="flex h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due_date">Date d'échéance</Label>
              <Input
                id="due_date"
                type="date"
                {...createForm.register('due_date')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...createForm.register('description')}
                placeholder="Motif du prêt..."
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreateDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" className="bg-indigo-600 text-white hover:bg-indigo-700">
                Créer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Ajouter un paiement
            </DialogTitle>
            <DialogDescription>
              {selectedDebt && (
                <>Pour {selectedDebt.person_name} — Reste : {formatCurrency(selectedDebt.remaining_amount, selectedDebt.currency_code || currency)}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={paymentForm.handleSubmit(handleAddPayment)}
            className="space-y-4 mt-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">Montant *</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="1"
                {...paymentForm.register('amount', { required: true, valueAsNumber: true })}
                placeholder="100000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-date">Date</Label>
              <Input
                id="payment-date"
                type="date"
                {...paymentForm.register('date', { required: true })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-note">Note</Label>
              <Textarea
                id="payment-note"
                {...paymentForm.register('note')}
                placeholder="Optionnel..."
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowPaymentDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" className="bg-indigo-600 text-white hover:bg-indigo-700">
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
