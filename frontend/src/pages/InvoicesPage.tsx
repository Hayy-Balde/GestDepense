import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, differenceInDays, isPast, isFuture } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  Receipt,
  Plus,
  FileUp,
  FileDown,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { api } from '../services/api'
import type { Invoice, InvoiceFormData, InvoicePayment, InvoiceDirection, InvoiceStatus } from '../types'
import type { Account } from '../types/account'
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
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { useToastStore, getApiErrorMessage } from '../stores/toastStore'
import { useTargets, toTargets } from '../hooks/useTargets'
import TargetSelect from '../components/money/TargetSelect'
import { cn } from '../lib/utils'
import { useAuthStore } from '../stores/authStore'
import { useConfig } from '../hooks/useConfig'

type TabType = 'issued' | 'received'

interface PaymentFormData {
  amount: number
  date: string
  note?: string
  account_id?: string
  caisse_id?: string
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount ?? 0) + ' ' + currency
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: fr })
  } catch {
    return dateStr
  }
}

function getStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    pending: 'En attente',
    partially_paid: 'Partiellement payée',
    paid: 'Payée',
    overdue: 'En retard',
  }
  return labels[status]
}

function getStatusVariant(status: InvoiceStatus): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  const variants: Record<InvoiceStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    pending: 'default',
    partially_paid: 'warning',
    paid: 'success',
    overdue: 'destructive',
  }
  return variants[status]
}

function isOverdue(invoice: Invoice): boolean {
  if (!invoice.due_date) return false
  if (invoice.status === 'paid') return false
  return isPast(parseISO(invoice.due_date))
}

function getDaysUntilDue(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date())
}

export default function InvoicesPage() {
  const { user } = useAuthStore()
  const { currencies } = useConfig()
  const currency = user?.currency_code || 'GNF'

  const [activeTab, setActiveTab] = useState<TabType>('issued')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const { accounts, caisses } = useTargets()
  const targets = toTargets(accounts, caisses)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [showPayments, setShowPayments] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { success, error: toastError } = useToastStore()

  const deletingInvoice = invoices.find((d) => d.id === confirmDeleteId)

  const createForm = useForm<InvoiceFormData>({
    defaultValues: {
      direction: 'issued',
      number: '',
      counterparty: '',
      amount: 0,
      currency_code: currency,
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: '',
      description: '',
      account_id: '',
      caisse_id: '',
    },
  })
  const createDirection = useWatch({ control: createForm.control, name: 'direction' })

  // Une facture émise s'encaisse sur un compte : si l'utilisateur bascule de
  // « reçue » à « émise », la caisse choisie devient invalide.
  useEffect(() => {
    if (createDirection === 'issued' && createForm.watch('caisse_id')) {
      createForm.setValue('caisse_id', undefined, { shouldValidate: true })
    }
  }, [createDirection, createForm])

  const paymentForm = useForm<PaymentFormData>({
    defaultValues: {
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
      account_id: '',
      caisse_id: '',
    },
  })

  const filteredInvoices = invoices.filter((d) => d.direction === activeTab)

  function fetchInvoices() {
    setLoading(true)
    setError(null)
    api
      .get('/invoices')
      .then((res) => {
        const list = res.data?.data || res.data || []
        const withProgress = (list as Invoice[]).map((d) => ({
          ...d,
          progress: d.amount > 0 ? Math.round(((Number(d.amount) - Number(d.remaining_amount)) / Number(d.amount)) * 100) : 0,
        }))
        setInvoices(withProgress)
      })
      .catch(() => {
        setError('Impossible de charger les factures.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    fetchInvoices()
  }, [])

  function closeDialog() {
    setShowCreateDialog(false)
    setEditingInvoice(null)
    createForm.reset({
      direction: 'issued',
      number: '',
      counterparty: '',
      amount: 0,
      currency_code: currency,
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: '',
      description: '',
      account_id: '',
      caisse_id: '',
    })
  }

  function handleCreate(data: InvoiceFormData) {
    const request = editingInvoice
      ? api.put(`/invoices/${editingInvoice.id}`, data)
      : api.post('/invoices', data)

    request
      .then((res) => {
        const item = res.data?.data || res.data
        const normalized: Invoice | null = item
          ? {
              ...item,
              progress: item.amount > 0 ? Math.round(((Number(item.amount) - Number(item.remaining_amount)) / Number(item.amount)) * 100) : 0,
            }
          : null
        if (editingInvoice) {
          setInvoices((prev) => prev.map((d) => (d.id === editingInvoice.id ? (normalized || d) : d)))
        } else if (normalized) {
          setInvoices((prev) => [...prev, normalized])
        }
        success((res.data as { message?: string })?.message || (editingInvoice ? 'Facture modifiée.' : 'Facture créée.'))
        closeDialog()
      })
      .catch((err: unknown) => {
        toastError(getApiErrorMessage(err, 'Impossible d’enregistrer la facture.'))
      })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/invoices/${id}`)
      success('Facture supprimée.')
      setConfirmDeleteId(null)
      setInvoices((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      toastError(getApiErrorMessage(err, 'Impossible de supprimer la facture.'))
      setConfirmDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }

  function openEdit(invoice: Invoice) {
    setEditingInvoice(invoice)
    createForm.reset({
      direction: invoice.direction,
      number: invoice.number || '',
      counterparty: invoice.counterparty,
      amount: Number(invoice.amount),
      currency_code: invoice.currency_code || currency,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date || '',
      description: invoice.description || '',
      account_id: invoice.account_id || '',
      caisse_id: invoice.caisse_id || '',
    })
    setShowCreateDialog(true)
  }

  function openPaymentDialog(invoice: Invoice) {
    setSelectedInvoice(invoice)
    setPaymentError(null)
    // Cible liée à la facture par défaut, sinon premier compte.
    paymentForm.reset({
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
      account_id: invoice.account_id ?? accounts[0]?.id ?? '',
      caisse_id: invoice.caisse_id ?? '',
    })
    setShowPaymentDialog(true)
  }

  function handleAddPayment(data: PaymentFormData) {
    if (!selectedInvoice) return
    setPaymentError(null)
    if (!data.account_id && !data.caisse_id) {
      setPaymentError('Veuillez sélectionner un compte ou une caisse.')
      return
    }
    api
      .post(`/invoices/${selectedInvoice.id}/payments`, data)
      .then((res) => {
        const payment = res.data?.data || res.data
        success((res.data as { message?: string })?.message || 'Paiement enregistré.')
        setInvoices((prev) =>
          prev.map((d) => {
            if (d.id !== selectedInvoice.id) return d
            const paidTotal = (d.payments || []).reduce((s, p) => s + Number(p.amount), 0) + data.amount
            const remaining = Math.max(0, d.amount - paidTotal)
            const progress = d.amount > 0 ? Math.round(((d.amount - remaining) / d.amount) * 100) : 0
            let status: InvoiceStatus = d.status
            if (remaining <= 0) status = 'paid'
            else if (paidTotal > 0) status = 'partially_paid'
            if (d.due_date && isPast(parseISO(d.due_date)) && remaining > 0) status = 'overdue'
            return {
              ...d,
              remaining_amount: remaining,
              progress,
              status,
              payments: [...(d.payments || []), payment || { id: 'tmp-' + Date.now(), invoice_id: d.id, ...data }],
            }
          })
        )
        setShowPaymentDialog(false)
        setSelectedInvoice(null)
      })
      .catch((err: unknown) => {
        const error = err as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }
        const apiMessage = error.response?.data?.message
        const firstFieldError = error.response?.data?.errors
          ? Object.values(error.response.data.errors)[0]?.[0]
          : undefined
        const message = apiMessage || firstFieldError
        if (message) {
          setPaymentError(message)
          toastError(message)
          return
        }
        toastError('Impossible d’enregistrer le paiement.')
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
    total: filteredInvoices.reduce((s, d) => s + Number(d.amount), 0),
    remaining: filteredInvoices.reduce((s, d) => s + Number(d.remaining_amount), 0),
    paid: filteredInvoices.reduce((s, d) => s + (Number(d.amount) - Number(d.remaining_amount)), 0),
    active: filteredInvoices.filter((d) => d.status !== 'paid').length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
              <Receipt className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Factures</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Gérez vos factures émises aux clients et reçues des fournisseurs.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-violet-600 text-white hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-1.5" />
          Nouvelle Facture
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex space-x-1 rounded-xl bg-[var(--muted)]/30 p-1 w-fit">
        {([
          { value: 'issued', label: 'Émises', icon: FileUp },
          { value: 'received', label: 'Reçues', icon: FileDown },
        ] as const).map((tab) => (
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
            <tab.icon className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
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
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              {activeTab === 'issued' ? 'Reste à encaisser' : 'Reste à payer'}
            </p>
            <p className="text-lg font-bold text-violet-600 mt-1">{formatCurrency(summary.remaining, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              {activeTab === 'issued' ? 'Encaissé' : 'Payé'}
            </p>
            <p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(summary.paid, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Factures en cours</p>
            <p className="text-lg font-bold text-[var(--foreground)] mt-1">{summary.active}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-[var(--muted-foreground)] gap-2">
          <Receipt className="w-10 h-10 opacity-30" />
          <p className="text-sm font-medium">
            {activeTab === 'issued' ? 'Aucune facture émise pour l’instant.' : 'Aucune facture reçue pour l’instant.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Créer une facture
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredInvoices.map((invoice) => (
              <motion.div
                key={invoice.id}
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
                            invoice.direction === 'issued' ? 'bg-violet-500/10 text-violet-500' : 'bg-blue-500/10 text-blue-500'
                          )}
                        >
                          {invoice.direction === 'issued' ? (
                            <FileUp className="w-4 h-4" />
                          ) : (
                            <FileDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          {invoice.number ? (
                            <CardTitle className="text-base">{invoice.number}</CardTitle>
                          ) : null}
                          <CardTitle className={cn('text-base', invoice.number && 'text-sm text-[var(--muted-foreground)]')}>
                            {invoice.counterparty}
                          </CardTitle>
                          {invoice.account && (
                            <CardDescription className="mt-0.5 text-xs">
                              Compte : {invoice.account.name}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(invoice.status)}>{getStatusLabel(invoice.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">Montant</span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {formatCurrency(invoice.amount, invoice.currency_code || currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {invoice.direction === 'issued' ? 'Reste à encaisser' : 'Reste à payer'}
                      </span>
                      <span className="text-sm font-bold text-violet-600">
                        {formatCurrency(invoice.remaining_amount, invoice.currency_code || currency)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
                        <span>Paiement</span>
                        <span>{invoice.progress}%</span>
                      </div>
                      <Progress
                        value={invoice.progress}
                        indicatorClassName={cn(
                          invoice.progress >= 100
                            ? 'bg-green-500'
                            : invoice.progress > 0
                              ? 'bg-violet-500'
                              : 'bg-gray-300'
                        )}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Émise : {formatDate(invoice.issue_date)}
                      </span>
                      {invoice.due_date && (
                        <span
                          className={cn(
                            'flex items-center gap-1',
                            isOverdue(invoice) ? 'text-red-500 font-semibold' : ''
                          )}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Échéance : {formatDate(invoice.due_date)}
                          {isOverdue(invoice) && ` (retard de ${Math.abs(getDaysUntilDue(invoice.due_date))}j)`}
                          {!isOverdue(invoice) &&
                            isFuture(parseISO(invoice.due_date)) &&
                            ` (dans ${getDaysUntilDue(invoice.due_date)}j)`}
                          {isOverdue(invoice) && <AlertTriangle className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </div>
                    {invoice.description && (
                      <p className="text-xs text-[var(--muted-foreground)] italic">{invoice.description}</p>
                    )}
                    {(invoice.payments && invoice.payments.length > 0) && (
                      <div>
                        <button
                          onClick={() => togglePayments(invoice.id)}
                          className="text-xs font-medium text-violet-500 hover:text-violet-600 transition-colors"
                        >
                          {showPayments.has(invoice.id) ? 'Masquer' : 'Voir'} les paiements ({invoice.payments.length})
                        </button>
                        <AnimatePresence>
                          {showPayments.has(invoice.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 space-y-1.5">
                                {invoice.payments.map((payment) => (
                                  <div
                                    key={payment.id}
                                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md bg-[var(--muted)]/20"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                      <span className="text-[var(--foreground)]">
                                        {formatCurrency(payment.amount, invoice.currency_code || currency)}
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
                        onClick={() => openPaymentDialog(invoice)}
                        className="bg-violet-600 text-white hover:bg-violet-700"
                        disabled={invoice.status === 'paid'}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {invoice.direction === 'issued' ? 'Encaisser' : 'Payer'}
                      </Button>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          onClick={() => openEdit(invoice)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-400 hover:text-red-600"
                          onClick={() => setConfirmDeleteId(invoice.id)}
                          disabled={deletingId === invoice.id}
                        >
                          {deletingId === invoice.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
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
            <DialogTitle className="text-xl font-bold">
              {editingInvoice ? 'Modifier la facture' : 'Nouvelle Facture'}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice
                ? `Modifiez les informations de la facture de ${editingInvoice.counterparty}.`
                : 'Enregistrez une facture émise ou reçue.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4 mt-2">
            <div>
              <Label>Direction</Label>
              <div className="flex space-x-2 mt-1.5">
                {([
                  { value: 'issued', label: 'Émise (au client)' },
                  { value: 'received', label: 'Reçue (fournisseur)' },
                ] as const).map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => createForm.setValue('direction', t.value as InvoiceDirection)}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all',
                      createDirection === t.value
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-600'
                        : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="invoice-number">Numéro de facture</Label>
                <Input
                  id="invoice-number"
                  {...createForm.register('number')}
                  placeholder="FAC-2026-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invoice-counterparty">
                  {createDirection === 'issued' ? 'Client *' : 'Fournisseur *'}
                </Label>
                <Input
                  id="invoice-counterparty"
                  {...createForm.register('counterparty', { required: true })}
                  placeholder={createDirection === 'issued' ? 'Alpha SARL' : 'Électricité GUIN'}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="invoice-amount">Montant *</Label>
                <Input
                  id="invoice-amount"
                  type="number"
                  min="0"
                  step="1"
                  {...createForm.register('amount', { required: true, valueAsNumber: true })}
                  placeholder="500000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invoice-currency">Devise</Label>
                <select
                  id="invoice-currency"
                  {...createForm.register('currency_code')}
                  className="flex h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="invoice-issue-date">Date d'émission *</Label>
                <Input
                  id="invoice-issue-date"
                  type="date"
                  {...createForm.register('issue_date', { required: true })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invoice-due-date">Date d'échéance</Label>
                <Input
                  id="invoice-due-date"
                  type="date"
                  {...createForm.register('due_date')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <TargetSelect
                id="invoice-target"
                label="Compte ou caisse (optionnel)"
                hint={
                  createDirection === 'issued'
                    ? 'À laisser vide si vous préférez choisir la source d’encaissement au moment du paiement.'
                    : 'À laisser vide si vous préférez choisir la source de paiement au moment du règlement.'
                }
                accountsOnly={createDirection === 'issued'}
                value={{
                  account_id: createForm.watch('account_id'),
                  caisse_id: createForm.watch('caisse_id'),
                }}
                targets={targets}
                onChange={(v) => {
                  createForm.setValue('account_id', v.account_id ?? undefined)
                  createForm.setValue('caisse_id', v.caisse_id ?? undefined)
                  createForm.clearErrors(['account_id', 'caisse_id'])
                }}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                L'enregistrement d'une facture ne déplace aucun argent : c'est un simple
                libellé par défaut, modifiable à chaque règlement.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoice-description">Description</Label>
              <Textarea
                id="invoice-description"
                {...createForm.register('description')}
                placeholder="Motif de la facture..."
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeDialog}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" className="bg-violet-600 text-white hover:bg-violet-700">
                {editingInvoice ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedInvoice?.direction === 'issued' ? 'Encaissement' : 'Paiement de facture'}
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>Pour {selectedInvoice.counterparty} — Reste : {formatCurrency(selectedInvoice.remaining_amount, selectedInvoice.currency_code || currency)}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={paymentForm.handleSubmit(handleAddPayment)} className="space-y-4 mt-2">
            {paymentError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start space-x-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-sm">{paymentError}</p>
              </div>
            )}
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
              <TargetSelect
                id="payment-target"
                label={
                  selectedInvoice?.direction === 'issued'
                    ? "Encaissement — où l'argent arrive"
                    : "Paiement — d'où l'argent part"
                }
                required
                accountsOnly={selectedInvoice?.direction === 'issued'}
                value={{
                  account_id: paymentForm.watch('account_id'),
                  caisse_id: paymentForm.watch('caisse_id'),
                }}
                targets={targets}
                onChange={(v) => {
                  paymentForm.setValue('account_id', v.account_id ?? undefined, {
                    shouldValidate: true,
                  })
                  paymentForm.setValue('caisse_id', v.caisse_id ?? undefined, {
                    shouldValidate: true,
                  })
                  paymentForm.clearErrors(['account_id', 'caisse_id'])
                }}
                error={
                  (paymentForm.formState.errors.account_id?.message as string) ??
                  (paymentForm.formState.errors.caisse_id?.message as string) ??
                  undefined
                }
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
              <Button type="submit" variant="primary" className="bg-violet-600 text-white hover:bg-violet-700">
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
        title="Supprimer cette facture ?"
        description={
          deletingInvoice
            ? `La facture « ${deletingInvoice.number || deletingInvoice.counterparty} » sera définitivement supprimée ainsi que ses paiements, et les soldes des comptes seront restaurés.`
            : undefined
        }
        loading={deletingId === confirmDeleteId}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
      />
    </div>
  )
}