import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, Loader2, AlertCircle, ListPlus, Save } from 'lucide-react'
import QuickEntryRowView, {
  type QuickEntryColumn,
  type QuickEntryFieldErrors,
} from '@/components/quickEntry/QuickEntryRow'
import { Card, CardContent } from '@/components/ui/card'
import { accountService, categoryService, api, quickEntryService } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore, getApiErrorMessage } from '@/stores/toastStore'
import type { Account } from '@/types/account'
import type { Category, Caisse } from '@/types'
import type { PaymentMethod } from '@/types/expense'
import type {
  QuickEntryErrors,
  QuickEntryPayload,
  QuickEntryRow,
  QuickEntryType,
} from '@/types/quickEntry'
import { PAYMENT_METHODS_BY_ACCOUNT_TYPE, DEFAULT_PAYMENT_METHODS } from '@/lib/constants'
import { cn } from '@/lib/utils'

/** Limite alignée sur `QuickEntryController::MAX_ENTRIES`. */
const MAX_ROWS = 200

let uidCounter = 0
const nextUid = () => `qe-${++uidCounter}`

// `slice` plutôt que `split('T')[0]` : sous `noUncheckedIndexedAccess`, l'index
// d'un tableau est typé `string | undefined`.
const today = () => new Date().toISOString().slice(0, 10)

/**
 * Premier moyen de paiement autorisé pour un compte. Fonction pure : elle est
 * appelée au chargement des options, avant que `accounts` ne soit en état.
 */
function defaultPaymentMethod(accountId: string, accounts: Account[]): PaymentMethod {
  const type = accounts.find((a) => a.id === accountId)?.type ?? 'bank'
  const allowed = PAYMENT_METHODS_BY_ACCOUNT_TYPE[type] ?? DEFAULT_PAYMENT_METHODS
  return (allowed[0] ?? 'other') as PaymentMethod
}

/** Accepte la virgule décimale française. */
const parseAmount = (value: string): number => Number(value.replace(',', '.'))

/** Regroupe les erreurs `entries.<index>.<champ>` renvoyées par l'API. */
function regroupApiErrors(apiErrors: QuickEntryErrors): Record<number, QuickEntryFieldErrors> {
  const mapped: Record<number, QuickEntryFieldErrors> = {}

  Object.entries(apiErrors).forEach(([key, messages]) => {
    const match = /^entries\.(\d+)\.(\w+)$/.exec(key)
    if (!match) return

    const line = Number(match[1])
    const field = match[2] as QuickEntryColumn
    mapped[line] = { ...(mapped[line] ?? {}), [field]: messages }
  })

  return mapped
}

export default function QuickEntryPage() {
  const { user } = useAuthStore()
  const currency = user?.currency_code || 'GNF'
  const { success, error: toastError } = useToastStore()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const [rows, setRows] = useState<QuickEntryRow[]>([])
  const [rowErrors, setRowErrors] = useState<Record<number, QuickEntryFieldErrors>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const tableRef = useRef<HTMLDivElement>(null)
  // Dépendance d'effet déclenchant le placement du curseur sur la ligne ajoutée.
  const [focusTicket, setFocusTicket] = useState(0)
  const shouldFocusLastRow = useRef(false)

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  )
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories]
  )

  useEffect(() => {
    Promise.all([accountService.getAll(), categoryService.getAll(), api.get('/caisses')])
      .then(([accountsRes, categoriesRes, caissesRes]) => {
        const unwrap = (payload: unknown): unknown[] =>
          Array.isArray(payload) ? payload : ((payload as { data?: unknown[] })?.data ?? [])

        const accs = unwrap(accountsRes.data) as Account[]
        const cats = unwrap(categoriesRes.data) as Category[]

        setAccounts(accs)
        setCategories(cats)
        setCaisses((unwrap(caissesRes.data) as Caisse[]).filter((c) => c.status !== 'closed'))

        // La première ligne est amorcée ici, et non dans un effet séparé : cela
        // évite un rendu supplémentaire, et laisse le tableau vide après une
        // remise à zéro volontaire.
        const firstAccount = accs[0]
        if (firstAccount) {
          setRows([
            {
              uid: nextUid(),
              type: 'expense',
              title: '',
              amount: '',
              date: today(),
              account_id: firstAccount.id,
              category_id: cats.find((c) => c.type === 'expense')?.id ?? '',
              caisse_id: '',
              payment_method: defaultPaymentMethod(firstAccount.id, accs),
              status: 'completed',
              description: '',
            },
          ])
        }
      })
      .catch(() => {
        setOptionsError('Impossible de charger les comptes, catégories et caisses.')
      })
      .finally(() => setLoadingOptions(false))
  }, [])

  const focusLastRow = useCallback(() => {
    shouldFocusLastRow.current = true
    setFocusTicket((ticket) => ticket + 1)
  }, [])

  // Place le curseur sur la ligne venant d'être ajoutée.
  useEffect(() => {
    if (focusTicket === 0 || !shouldFocusLastRow.current) return

    const body = tableRef.current?.querySelectorAll<HTMLTableRowElement>('tr[data-row]')
    const last = body?.[body.length - 1]
    last?.querySelector<HTMLInputElement>('input[data-col="title"]')?.focus()
    shouldFocusLastRow.current = false
  }, [focusTicket, rows])

  /**
   * Construit une ligne. Une ligne neuve hérite du compte et du moyen de
   * paiement de la dernière ligne du même type : en saisie repetitive, on
   * change le montant et le libellé, pas le compte.
   */
  const buildRow = useCallback(
    (type: QuickEntryType, from?: QuickEntryRow): QuickEntryRow => {
      const accountId = from?.account_id || accounts[0]?.id || ''

      return {
        uid: nextUid(),
        type,
        title: '',
        amount: '',
        date: today(),
        account_id: accountId,
        category_id: from?.category_id ?? '',
        caisse_id: '',
        payment_method: from?.payment_method ?? defaultPaymentMethod(accountId, accounts),
        status: from?.status ?? 'completed',
        description: '',
      }
    },
    [accounts]
  )

  /** Première catégorie d'un type, pour ne jamais proposer une ligne sans catégorie. */
  const firstCategoryOf = useCallback(
    (type: QuickEntryType): string =>
      (type === 'expense' ? expenseCategories : incomeCategories)[0]?.id ?? '',
    [expenseCategories, incomeCategories]
  )

  const insertRow = useCallback((at: number, row: QuickEntryRow) => {
    setRows((current) => {
      if (current.length >= MAX_ROWS) return current
      const copy = [...current]
      copy.splice(at, 0, row)
      return copy
    })
    setRowErrors({})
  }, [])

  const addRow = useCallback(
    (type: QuickEntryType) => {
      if (rows.length >= MAX_ROWS) {
        toastError(`Limite de ${MAX_ROWS} lignes atteinte.`)
        return
      }

      const last = rows[rows.length - 1]
      const source = last?.type === type ? last : undefined
      const row = buildRow(type, source)

      // Une ligne créée seule n'hérite d'aucune catégorie : on en propose une
      // directement, plutôt que de laisser un select vide à remplir.
      if (!row.category_id) row.category_id = firstCategoryOf(type)

      insertRow(rows.length, row)
      focusLastRow()
    },
    [rows, buildRow, insertRow, firstCategoryOf, focusLastRow, toastError]
  )

  const duplicateRow = useCallback(
    (index: number) => {
      const source = rows[index]
      if (!source) return

      if (rows.length >= MAX_ROWS) {
        toastError(`Limite de ${MAX_ROWS} lignes atteinte.`)
        return
      }

      insertRow(index + 1, buildRow(source.type, source))
      focusLastRow()
    },
    [rows, buildRow, insertRow, focusLastRow, toastError]
  )

  const updateRow = useCallback(
    (index: number, patch: Partial<QuickEntryRow>) => {
      setRows((current) =>
        current.map((row, i) => {
          if (i !== index) return row

          const next = { ...row, ...patch }

          // Changer de type doit changer la catégorie : une catégorie de
          // dépense n'existe pas dans la liste des revenus, et le select
          // afficherait une valeur vide non signalée.
          if (patch.type && patch.type !== row.type) {
            next.category_id = firstCategoryOf(patch.type)
            next.caisse_id = ''
          }

          if (patch.account_id && patch.account_id !== row.account_id) {
            next.payment_method = defaultPaymentMethod(patch.account_id, accounts)
          }

          return next
        })
      )
    },
    [firstCategoryOf, accounts]
  )

  const removeRow = useCallback((index: number) => {
    setRows((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)))
    setRowErrors({})
  }, [])

  const clearAll = useCallback(() => {
    setRows([])
    setRowErrors({})
    setSubmitError(null)
  }, [])

  /** `Entrée` passe à la ligne suivante sur la même colonne, comme un tableur. */
  const moveDown = useCallback((column: QuickEntryColumn) => {
    const body = tableRef.current?.querySelectorAll('tr[data-row]')
    if (!body) return

    const current = Array.from(body).findIndex((line) => line.contains(document.activeElement))
    body[current + 1]?.querySelector<HTMLElement>(`[data-col="${column}"]`)?.focus()
  }, [])

  /**
   * Validation locale. L'API valide de nouveau, mais bloquer ici évite un
   * aller-retour réseau pour la plupart des fautes de frappe.
   */
  const validate = useCallback(() => {
    const errors: Record<number, QuickEntryFieldErrors> = {}
    const payloads: QuickEntryPayload[] = []

    rows.forEach((row, index) => {
      const line: QuickEntryFieldErrors = {}
      const amount = parseAmount(row.amount)

      if (!row.title.trim()) line.title = ['Le libellé est requis.']
      if (!Number.isFinite(amount) || amount <= 0) line.amount = ['Le montant doit être supérieur à 0.']
      if (!row.date) line.date = ['La date est requise.']
      if (!row.account_id && !(row.type === 'expense' && row.caisse_id)) {
        line.account_id = ['Choisissez un compte ou une caisse.']
      }
      if (!row.category_id) line.category_id = ['Choisissez une catégorie.']

      if (Object.keys(line).length > 0) {
        errors[index] = line
        return
      }

      payloads.push({
        type: row.type,
        title: row.title.trim(),
        amount,
        date: row.date,
        account_id: row.caisse_id ? null : row.account_id,
        category_id: row.category_id,
        caisse_id: row.caisse_id || null,
        payment_method: row.payment_method || null,
        status: row.status,
        description: row.description,
      })
    })

    return { payloads, errors }
  }, [rows])

  const onSubmit = async () => {
    setSubmitError(null)

    const { payloads, errors } = validate()

    if (Object.keys(errors).length > 0) {
      setRowErrors(errors)
      setSubmitError('Corrigez les lignes en rouge avant d’enregistrer.')

      const firstBad = Math.min(...Object.keys(errors).map(Number))
      const lines = tableRef.current?.querySelectorAll<HTMLTableRowElement>('tr[data-row]')
      lines?.[firstBad]?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()

      return
    }

    setRowErrors({})
    setIsSubmitting(true)

    try {
      const response = await quickEntryService.create(payloads)
      const created = (response.data as { created?: { total: number } }).created

      success(
        (response.data as { message?: string })?.message ??
          `${created?.total ?? payloads.length} écriture(s) enregistrée(s).`
      )
      clearAll()
    } catch (err: unknown) {
      // L'API renvoie `entries.<index>.<champ>` ; rien n'a été écrit, on peut
      // donc afficher ces erreurs sur les lignes sans rien recharger.
      const apiErrors = (err as { response?: { data?: { errors?: QuickEntryErrors } } }).response
        ?.data?.errors

      if (apiErrors && typeof apiErrors === 'object') {
        setRowErrors(regroupApiErrors(apiErrors))
        setSubmitError('Aucune écriture enregistrée : certaines lignes sont invalides.')
      } else {
        setSubmitError(getApiErrorMessage(err, 'Erreur lors de l’enregistrement.'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = useMemo(() => {
    let expenses = 0
    let incomes = 0

    rows.forEach((row) => {
      const amount = parseAmount(row.amount)
      if (!Number.isFinite(amount) || amount <= 0) return

      if (row.type === 'expense') expenses += amount
      else incomes += amount
    })

    return { expenses, incomes, net: incomes - expenses }
  }, [rows])

  const formatAmount = (value: number) =>
    `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`

  const errorCount = Object.keys(rowErrors).length
  const columnHeaders = [
    'Type', 'Libellé', 'Montant', 'Date', 'Compte', 'Catégorie', 'Caisse', 'Paiement', 'Total', '',
  ]

  if (loadingOptions) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <p className="text-sm text-[var(--muted-foreground)]">Chargement des options…</p>
      </div>
    )
  }

  if (optionsError) {
    return (
      <div className="p-6">
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-sm">Erreur d’initialisation</h2>
            <p className="text-xs mt-1">{optionsError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <ListPlus className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Saisie rapide
            </h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Enregistrez plusieurs dépenses et revenus d’un coup. L’envoi est atomique : rien
            n’est écrit tant qu’une seule ligne est invalide.
          </p>
        </div>

        <button
          type="button"
          onClick={() => addRow('expense')}
          className="inline-flex items-center justify-center gap-2 rounded-md font-medium text-sm px-4 py-2 text-white bg-red-600 hover:bg-red-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ligne dépense</span>
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div ref={tableRef} className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Lignes de saisie rapide">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40">
                  {columnHeaders.map((label, position) => (
                    <th
                      key={label || `col-${position}`}
                      scope="col"
                      className={cn(
                        'px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] text-left whitespace-nowrap',
                        position === 8 && 'text-right'
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <QuickEntryRowView
                    key={row.uid}
                    row={row}
                    index={index}
                    accounts={accounts}
                    categories={row.type === 'expense' ? expenseCategories : incomeCategories}
                    caisses={caisses}
                    errors={rowErrors[index] ?? {}}
                    onChange={(patch) => updateRow(index, patch)}
                    onRemove={() => removeRow(index)}
                    onDuplicate={() => duplicateRow(index)}
                    onMoveDown={moveDown}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <p className="p-8 text-center text-sm text-[var(--muted-foreground)]">
              Aucune ligne. Utilisez « Ligne dépense » ou « Ligne revenu » pour commencer.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addRow('income')}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ligne revenu
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Tout effacer
          </button>
          {errorCount > 0 && (
            <span className="text-xs font-semibold text-red-500">
              {errorCount} ligne(s) à corriger
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <dl className="text-xs space-y-0.5">
            <div className="flex gap-2 justify-end">
              <dt className="text-red-500">Dépenses</dt>
              <dd className="font-semibold tabular-nums text-red-500">− {formatAmount(totals.expenses)}</dd>
            </div>
            <div className="flex gap-2 justify-end">
              <dt className="text-emerald-600">Revenus</dt>
              <dd className="font-semibold tabular-nums text-emerald-600">+ {formatAmount(totals.incomes)}</dd>
            </div>
            <div className="flex gap-2 justify-end border-t border-[var(--border)] pt-1">
              <dt className="text-[var(--muted-foreground)]">Solde</dt>
              <dd
                className={cn(
                  'font-bold tabular-nums',
                  totals.net >= 0 ? 'text-emerald-600' : 'text-red-500'
                )}
              >
                {totals.net >= 0 ? '+' : '−'} {formatAmount(Math.abs(totals.net))}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || rows.length === 0}
            className="inline-flex items-center gap-2 rounded-md font-bold text-sm px-5 py-2.5 text-white bg-[var(--primary)] hover:opacity-90 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enregistrement…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer{rows.length > 0 ? ` (${rows.length})` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {submitError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-start gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-xs">{submitError}</p>
        </div>
      )}

      <p className="text-xs text-[var(--muted-foreground)]">
        <kbd className="px-1 py-0.5 rounded border border-[var(--border)]">Entrée</kbd> passe à
        la ligne suivante sur la même colonne, comme dans un tableur. Le bouton duplication
        recopie compte, catégorie et moyen de paiement pour saisir une série d’écritures
        similaires. Maximum {MAX_ROWS} lignes par envoi.{' '}
        <Link to="/depenses" className="underline underline-offset-2">Voir les dépenses</Link>
        {' · '}
        <Link to="/revenus" className="underline underline-offset-2">Voir les revenus</Link>
      </p>
    </div>
  )
}
