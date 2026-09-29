import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/formatters'
import type { Target } from '@/hooks/useTargets'

const SELECT_CLASS =
  'flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

export interface TargetValue {
  account_id?: string | null
  caisse_id?: string | null
}

interface Props {
  id: string
  label: string
  hint?: string
  value: TargetValue
  targets: Target[]
  onChange: (value: TargetValue) => void
  required?: boolean
  /** Interdit la caisse (l'argent ne peut qu'entrer sur un compte). */
  accountsOnly?: boolean
  error?: string
  disabled?: boolean
}

const EMPTY = ''

function encode(value: TargetValue): string {
  if (value.caisse_id) return `caisse:${value.caisse_id}`
  if (value.account_id) return `account:${value.account_id}`
  return EMPTY
}

function decode(raw: string): TargetValue {
  const [kind, id] = raw.split(':')
  if (kind === 'account' && id) return { account_id: id, caisse_id: null }
  if (kind === 'caisse' && id) return { account_id: null, caisse_id: id }
  return { account_id: null, caisse_id: null }
}

/**
 * Sélecteur unique « compte ou caisse ».
 *
 * L'API attend deux colonnes distinctes (`account_id`, `caisse_id`) qui ne
 * doivent jamais être remplies ensemble, mais l'utilisateur ne voit pas cette
 * distinction : pour lui, il choisit « d'où vient » ou « où va » l'argent.
 * Présenter deux listes fusionnées évite l'erreur de comprendre qu'il faut
 * d'abord choisir un type.
 */
export default function TargetSelect({
  id,
  label,
  hint,
  value,
  targets,
  onChange,
  required = false,
  accountsOnly = false,
  error,
  disabled = false,
}: Props) {
  const accounts = targets.filter((t) => t.kind === 'account')
  const caisses = accountsOnly ? [] : targets.filter((t) => t.kind === 'caisse')
  const current = encode(value)

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <select
        id={id}
        className={SELECT_CLASS}
        disabled={disabled}
        value={current}
        onChange={(e) => onChange(decode(e.target.value))}
      >
        <option value={EMPTY}>-- Choisir --</option>
        {accounts.length > 0 && (
          <optgroup label="Comptes">
            {accounts.map((t) => (
              <option key={`account-${t.id}`} value={`account:${t.id}`}>
                {t.name} ({t.currencyCode}) — {formatCurrency(t.available, t.currencyCode)}
              </option>
            ))}
          </optgroup>
        )}
        {caisses.length > 0 && (
          <optgroup label="Caisses">
            {caisses.map((t) => (
              <option key={`caisse-${t.id}`} value={`caisse:${t.id}`}>
                {t.name} ({t.currencyCode}) — {formatCurrency(t.available, t.currencyCode)}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {hint && <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
