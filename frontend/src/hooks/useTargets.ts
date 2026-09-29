import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import type { Account } from '@/types/account'
import type { Caisse } from '@/types'

/**
 * Comptes et caisses utilisables comme destination d'un mouvement d'argent.
 *
 * Les deux sont des cibles légitimes : un compte porte un solde, une caisse est
 * une enveloppe de dépenses alimentée par un compte. Les charger ensemble évite
 * que chaque page refasse le même aller-retour et garantisse la même liste.
 */
export interface Target {
  id: string
  name: string
  currencyCode: string
  kind: 'account' | 'caisse'
  /** Solde du compte, ou quota restant de la caisse. */
  available: number
}

export function useTargets(): { accounts: Account[]; caisses: Caisse[]; loading: boolean } {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const unwrap = (res: unknown): unknown[] => {
      const data = (res as { data?: unknown })?.data
      return Array.isArray(data) ? data : Array.isArray(res) ? (res as unknown[]) : []
    }

    Promise.allSettled([api.get('/accounts'), api.get('/caisses')]).then(([accRes, caisRes]) => {
      if (cancelled) return
      if (accRes.status === 'fulfilled') setAccounts(unwrap(accRes.value) as Account[])
      if (caisRes.status === 'fulfilled') setCaisses(unwrap(caisRes.value) as Caisse[])
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { accounts, caisses, loading }
}

/** Une caisse clôturée ne peut plus être utilisée. */
export function openCaisses(caisses: Caisse[]): Caisse[] {
  return caisses.filter((c) => c.status !== 'closed')
}

export function toTargets(accounts: Account[], caisses: Caisse[]): Target[] {
  return [
    ...accounts.map((a) => ({
      id: a.id,
      name: a.name,
      currencyCode: a.currency_code,
      kind: 'account' as const,
      available: Number(a.balance),
    })),
    ...openCaisses(caisses).map((c) => ({
      id: c.id,
      name: c.name,
      currencyCode: c.currency_code ?? c.source_account?.currency_code ?? 'GNF',
      kind: 'caisse' as const,
      available: Number(c.remaining),
    })),
  ]
}
