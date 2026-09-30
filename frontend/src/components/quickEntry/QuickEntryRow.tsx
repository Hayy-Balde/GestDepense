import { useEffect, useMemo } from 'react'
import type { KeyboardEvent } from 'react'
import { Trash2, Copy } from 'lucide-react'
import type { Account } from '@/types/account'
import type { Category, Caisse } from '@/types'
import type { PaymentMethod } from '@/types/expense'
import type { QuickEntryRow } from '@/types/quickEntry'
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_ICONS,
  PAYMENT_METHODS_BY_ACCOUNT_TYPE,
  DEFAULT_PAYMENT_METHODS,
} from '@/lib/constants'
import { iconEmoji } from '@/lib/iconMap'
import { cn } from '@/lib/utils'

/** Colonnes navigables au clavier entre les lignes. */
export type QuickEntryColumn =
  | 'title'
  | 'amount'
  | 'date'
  | 'account_id'
  | 'category_id'
  | 'caisse_id'
  | 'payment_method'

export type QuickEntryFieldErrors = Partial<Record<QuickEntryColumn, string[]>>

interface QuickEntryRowViewProps {
  row: QuickEntryRow
  index: number
  accounts: Account[]
  categories: Category[]
  caisses: Caisse[]
  errors: QuickEntryFieldErrors
  onChange: (patch: Partial<QuickEntryRow>) => void
  onRemove: () => void
  onDuplicate: () => void
  onMoveDown: (column: QuickEntryColumn) => void
}

const textInput =
  'w-full px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-transparent text-sm ' +
  'focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none ' +
  'transition-all placeholder:text-[var(--muted-foreground)]/50'

const selectInput = `w-full px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-all`

const errorBorder = 'border-red-500 focus:border-red-500 focus:ring-red-500'

export default function QuickEntryRowView({
  row,
  index,
  accounts,
  categories,
  caisses,
  errors,
  onChange,
  onRemove,
  onDuplicate,
  onMoveDown,
}: QuickEntryRowViewProps) {
  const isExpense = row.type === 'expense'
  const rowLabel = `Ligne ${index + 1}`

  // Les moyens de paiement disponibles dépendent du type de compte : proposer
  // une carte de crédit sur une épargne n'a pas de sens.
  const accountType = accounts.find((a) => a.id === row.account_id)?.type ?? 'bank'
  const allowedMethods = useMemo(
    () => PAYMENT_METHODS_BY_ACCOUNT_TYPE[accountType] ?? DEFAULT_PAYMENT_METHODS,
    [accountType]
  )

  // Le compte peut avoir changé sous une valeur devenue invalide : on retombe
  // sur le premier moyen autorisé plutôt que d'envoyer une valeur rejetée.
  useEffect(() => {
    if (row.payment_method && !allowedMethods.includes(row.payment_method)) {
      onChange({ payment_method: (allowedMethods[0] ?? 'other') as PaymentMethod })
    }
  }, [allowedMethods, row.payment_method, onChange])

  const handleKeyDown = (column: QuickEntryColumn) => (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      onMoveDown(column)
    }
  }

  const amountValue = Number(row.amount.replace(',', '.'))

  return (
    // `data-row` permet à la page de retrouver cette ligne lors de la
    // navigation au clavier et du défilement vers la première ligne fautive.
    <tr data-row className="border-b border-[var(--border)] last:border-0 align-top">
      <td className="py-2 pl-1 pr-1">
        <div
          className="flex rounded-md border border-[var(--border)] overflow-hidden"
          role="group"
          aria-label={`Type de la ${rowLabel.toLowerCase()}`}
        >
          <button
            type="button"
            onClick={() => onChange({ type: 'expense', caisse_id: '' })}
            aria-pressed={isExpense}
            title="Dépense"
            className={cn(
              'px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
              isExpense
                ? 'bg-red-500 text-white'
                : 'text-[var(--muted-foreground)] hover:bg-red-500/10'
            )}
          >
            Dép
          </button>
          <button
            type="button"
            onClick={() => onChange({ type: 'income', caisse_id: '' })}
            aria-pressed={!isExpense}
            title="Revenu"
            className={cn(
              'px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
              !isExpense
                ? 'bg-emerald-500 text-white'
                : 'text-[var(--muted-foreground)] hover:bg-emerald-500/10'
            )}
          >
            Rev
          </button>
        </div>
      </td>

      <td className="py-2 pr-1 min-w-[170px]">
        <input
          data-col="title"
          type="text"
          value={row.title}
          onChange={(e) => onChange({ title: e.target.value })}
          onKeyDown={handleKeyDown('title')}
          placeholder="Libellé"
          aria-label={`Libellé — ${rowLabel}`}
          aria-invalid={errors.title ? true : undefined}
          className={cn(textInput, errors.title && errorBorder)}
        />
      </td>

      <td className="py-2 pr-1 w-[120px]">
        <input
          data-col="amount"
          // `text` + `inputMode="decimal"` plutôt que `type="number"` : en
          // locale française la virgule est le séparateur décimal, et
          // `type="number"` la refuse.
          type="text"
          inputMode="decimal"
          value={row.amount}
          onChange={(e) => onChange({ amount: e.target.value })}
          onKeyDown={handleKeyDown('amount')}
          placeholder="0"
          aria-label={`Montant — ${rowLabel}`}
          aria-invalid={errors.amount ? true : undefined}
          className={cn(textInput, 'text-right font-medium tabular-nums', errors.amount && errorBorder)}
        />
      </td>

      <td className="py-2 pr-1 w-[140px]">
        <input
          data-col="date"
          type="date"
          value={row.date}
          onChange={(e) => onChange({ date: e.target.value })}
          onKeyDown={handleKeyDown('date')}
          aria-label={`Date — ${rowLabel}`}
          className={cn(textInput, errors.date && errorBorder)}
        />
      </td>

      <td className="py-2 pr-1 min-w-[160px]">
        <select
          data-col="account_id"
          value={row.account_id}
          onChange={(e) => onChange({ account_id: e.target.value })}
          onKeyDown={handleKeyDown('account_id')}
          aria-label={`Compte — ${rowLabel}`}
          aria-invalid={errors.account_id ? true : undefined}
          className={cn(selectInput, errors.account_id && errorBorder)}
        >
          <option value="">— Compte —</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </td>

      <td className="py-2 pr-1 min-w-[160px]">
        <select
          data-col="category_id"
          value={row.category_id}
          onChange={(e) => onChange({ category_id: e.target.value })}
          onKeyDown={handleKeyDown('category_id')}
          aria-label={`Catégorie — ${rowLabel}`}
          aria-invalid={errors.category_id ? true : undefined}
          className={cn(selectInput, errors.category_id && errorBorder)}
        >
          <option value="">— Catégorie —</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {iconEmoji(category.icon)} {category.name}
            </option>
          ))}
        </select>
      </td>

      {/*
        La cellule reste rendue pour un revenu, simplement vide : la retirer
        décalerait toutes les colonnes des lignes suivantes, puisque le tableau
        est partagé par toutes les lignes.
      */}
      <td className="py-2 pr-1 min-w-[140px]">
        {isExpense ? (
          <select
            data-col="caisse_id"
            value={row.caisse_id}
            onChange={(e) => onChange({ caisse_id: e.target.value })}
            onKeyDown={handleKeyDown('caisse_id')}
            aria-label={`Caisse — ${rowLabel}`}
            className={cn(selectInput, errors.caisse_id && errorBorder)}
          >
            <option value="">— Aucune —</option>
            {caisses.map((caisse) => (
              <option key={caisse.id} value={caisse.id}>
                {caisse.icon || '🎯'} {caisse.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="block px-2.5 py-1.5 text-sm text-[var(--muted-foreground)]/40">
            —
          </span>
        )}
      </td>

      <td className="py-2 pr-1 min-w-[150px]">
        <select
          data-col="payment_method"
          value={row.payment_method}
          onChange={(e) => onChange({ payment_method: e.target.value as PaymentMethod })}
          onKeyDown={handleKeyDown('payment_method')}
          aria-label={`Moyen de paiement — ${rowLabel}`}
          className={cn(selectInput, errors.payment_method && errorBorder)}
        >
          {allowedMethods.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_ICONS[method] ?? '❓'}{' '}
              {PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method}
            </option>
          ))}
        </select>
      </td>

      <td className="py-2 pr-1 w-[110px] text-right whitespace-nowrap font-semibold tabular-nums">
        {Number.isFinite(amountValue) && amountValue > 0 ? (
          <span className={isExpense ? 'text-red-500' : 'text-emerald-600'}>
            {isExpense ? '−' : '+'}
            {amountValue.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
          </span>
        ) : (
          <span className="text-[var(--muted-foreground)]/40">—</span>
        )}
      </td>

      <td className="py-2 w-[76px]">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={onDuplicate}
            title="Dupliquer la ligne"
            aria-label={`Dupliquer — ${rowLabel}`}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Supprimer la ligne"
            aria-label={`Supprimer — ${rowLabel}`}
            className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
