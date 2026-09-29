import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownLeft, ArrowUpRight, HandCoins, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebts } from '@/hooks/useDebts'
import { useConfig } from '@/hooks/useConfig'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore, getApiErrorMessage } from '@/stores/toastStore'
import { cn } from '@/lib/utils'
import type { Debt, DebtFormData, DebtPaymentFormData } from '@/types'
import DebtSummary from '@/components/debts/DebtSummary'
import DebtTable from '@/components/debts/DebtTable'
import DebtMiniCard from '@/components/debts/DebtMiniCard'
import DebtFormDialog from '@/components/debts/DebtFormDialog'
import DebtPaymentDialog from '@/components/debts/DebtPaymentDialog'
import DebtDetailDialog from '@/components/debts/DebtDetailDialog'
import {
  DEFAULT_CURRENCY,
  currentMonthValue,
  isDebtInPeriod,
  isSettled,
  type DebtPeriodMode,
} from '@/components/debts/debtUtils'
import DebtFilters from '@/components/debts/DebtFilters'

export default function DebtsPage() {
  const { user } = useAuthStore()
  const { debtTypes, currencies } = useConfig()
  const defaultCurrency = user?.currency_code || DEFAULT_CURRENCY

  const { debts, accounts, caisses, loading, saving, error, create, update, addPayment, remove } = useDebts()
  const { success, error: toastError } = useToastStore()

  const [activeTab, setActiveTab] = useState<string>('lent')
  const [periodMode, setPeriodMode] = useState<DebtPeriodMode>('all')
  const [periodMonth, setPeriodMonth] = useState<string>(currentMonthValue())
  const [showSettled, setShowSettled] = useState(false)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null)
  const [detailDebt, setDetailDebt] = useState<Debt | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deletingDebt = debts.find((d) => d.id === confirmDeleteId)

  const typeDebts = useMemo(() => debts.filter((d) => d.type === activeTab), [debts, activeTab])

  // Nombre de dettes déjà soldées sur le type courant, pour signaler ce qui est masqué.
  const settledCount = useMemo(() => typeDebts.filter(isSettled).length, [typeDebts])

  // Les dettes remboursées sont masquées par défaut, et la période porte sur la
  // date de création (le jour où la trésorerie a effectivement bougé).
  const filteredDebts = useMemo(
    () =>
      typeDebts.filter(
        (d) => (showSettled || !isSettled(d)) && isDebtInPeriod(d, periodMode, periodMonth)
      ),
    [typeDebts, showSettled, periodMode, periodMonth]
  )

  const summary = useMemo(
    () =>
      filteredDebts.reduce(
        (acc, d) => {
          acc.total += Number(d.amount)
          acc.remaining += Number(d.remaining_amount)
          acc.repaid += Number(d.amount) - Number(d.remaining_amount)
          if (d.status !== 'paid') acc.active += 1
          return acc
        },
        { total: 0, remaining: 0, repaid: 0, active: 0 }
      ),
    [filteredDebts]
  )

  const openCreate = () => {
    setEditingDebt(null)
    setShowFormDialog(true)
  }

  const resetFilters = () => {
    setPeriodMode('all')
    setPeriodMonth(currentMonthValue())
    setShowSettled(false)
  }

  const openEdit = (debt: Debt) => {
    setEditingDebt(debt)
    setShowFormDialog(true)
  }

  const openPayment = (debt: Debt) => {
    setDetailDebt(null)
    setPaymentError(null)
    setPaymentDebt(debt)
  }

  const handleFormSubmit = async (data: DebtFormData) => {
    try {
      if (editingDebt) {
        await update(editingDebt.id, data)
        success('Dette modifiée avec succès.')
      } else {
        await create(data)
        success('Dette créée avec succès.')
      }
      setActiveTab(data.type)
    } catch (err) {
      toastError(getApiErrorMessage(err, 'Impossible d’enregistrer la dette.'))
      throw err
    }
  }

  const handlePaymentSubmit = async (data: DebtPaymentFormData) => {
    if (!paymentDebt) return
    setPaymentError(null)
    try {
      await addPayment(paymentDebt.id, data)
      success('Paiement enregistré avec succès.')
      setPaymentDebt(null)
    } catch (err) {
      const message = getApiErrorMessage(err, 'Impossible d’enregistrer le paiement.')
      setPaymentError(message)
      throw err
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await remove(id)
      success('Dette supprimée avec succès.')
      setConfirmDeleteId(null)
    } catch (err) {
      toastError(getApiErrorMessage(err, 'Impossible de supprimer la dette.'))
    } finally {
      setDeletingId(null)
    }
  }

  const activeTypeLabel = debtTypes.find((t) => t.value === activeTab)?.label ?? 'Dettes'

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
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
        <Button onClick={openCreate} className="bg-indigo-600 text-white hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1.5" />
          Nouvelle dette
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex space-x-1 rounded-xl bg-[var(--muted)]/30 p-1 w-fit overflow-x-auto max-w-full">
        {debtTypes.map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer',
                isActive
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
          )
        })}
      </div>

      <DebtFilters
        mode={periodMode}
        onModeChange={setPeriodMode}
        month={periodMonth}
        onMonthChange={setPeriodMonth}
        showSettled={showSettled}
        onShowSettledChange={setShowSettled}
        settledCount={settledCount}
      />

      <DebtSummary
        total={summary.total}
        remaining={summary.remaining}
        repaid={summary.repaid}
        activeCount={summary.active}
        currency={defaultCurrency}
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredDebts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-[var(--muted-foreground)] gap-2 text-center px-4">
          <HandCoins className="w-10 h-10 opacity-30" />
          {typeDebts.length === 0 ? (
            <>
              <p className="text-sm font-medium">Aucune dette « {activeTypeLabel} » pour l'instant.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={openCreate}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Créer une dette
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Aucune dette à afficher avec ces filtres.</p>
              <p className="text-xs">
                {settledCount > 0 && !showSettled
                  ? `${settledCount} dette${settledCount > 1 ? 's' : ''} remboursée${settledCount > 1 ? 's' : ''} masquée${settledCount > 1 ? 's' : ''} · `
                  : ''}
                {typeDebts.length} dette{typeDebts.length > 1 ? 's' : ''} « {activeTypeLabel} » au total.
              </p>
              <Button variant="secondary" size="sm" onClick={resetFilters} className="cursor-pointer">
                Réinitialiser les filtres
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <DebtTable
            debts={filteredDebts}
            onPay={openPayment}
            onEdit={openEdit}
            onDelete={(d) => setConfirmDeleteId(d.id)}
            onOpenDetail={setDetailDebt}
            busyId={deletingId}
          />

          <div className="lg:hidden space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredDebts.map((debt) => (
                <motion.div
                  key={debt.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <DebtMiniCard
                    debt={debt}
                    onPay={openPayment}
                    onEdit={openEdit}
                    onDelete={(d) => setConfirmDeleteId(d.id)}
                    busyId={deletingId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      <DebtFormDialog
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open)
          if (!open) setEditingDebt(null)
        }}
        editing={editingDebt}
        accounts={accounts}
        caisses={caisses}
        debtTypes={debtTypes}
        currencies={currencies}
        defaultCurrency={defaultCurrency}
        saving={saving}
        onSubmit={handleFormSubmit}
      />

      <DebtPaymentDialog
        open={paymentDebt !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentDebt(null)
            setPaymentError(null)
          }
        }}
        debt={paymentDebt}
        accounts={accounts}
        caisses={caisses}
        saving={saving}
        error={paymentError}
        onSubmit={handlePaymentSubmit}
      />

      <DebtDetailDialog debt={detailDebt} onClose={() => setDetailDebt(null)} onPay={openPayment} />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
        title="Supprimer cette dette ?"
        description={
          deletingDebt
            ? `La dette « ${deletingDebt.person_name} » sera définitivement supprimée ainsi que ses paiements. Les soldes de compte seront ajustés.`
            : undefined
        }
        loading={deletingId === confirmDeleteId}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
      />
    </div>
  )
}
