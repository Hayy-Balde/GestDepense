import { useCallback, useEffect, useState } from 'react'
import { api } from '@/services/api'
import type { Debt, DebtFormData, DebtPaymentFormData } from '@/types'
import type { Account } from '@/types/account'
import type { Caisse } from '@/types'
import { getApiErrorMessage } from '@/stores/toastStore'

function unwrap<T>(payload: unknown): T {
  const body = payload as { data?: T } | T
  return (body && typeof body === 'object' && 'data' in (body as object) && (body as { data?: T }).data !== undefined
    ? (body as { data: T }).data
    : body) as T
}

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const [debtsRes, accountsRes, caissesRes] = await Promise.all([
        api.get('/debts'),
        api.get('/accounts'),
        api.get('/caisses'),
      ])

      const debtList = unwrap<Debt[]>(debtsRes.data)
      const accountList = unwrap<Account[]>(accountsRes.data)
      const caisseList = unwrap<Caisse[]>(caissesRes.data)

      setDebts(Array.isArray(debtList) ? debtList : [])
      setAccounts(Array.isArray(accountList) ? accountList : [])
      setCaisses(Array.isArray(caisseList) ? caisseList : [])
    } catch (err) {
      setDebts([])
      setError(getApiErrorMessage(err, 'Impossible de charger les dettes.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    load()
  }, [load])

  const create = useCallback(
    async (data: DebtFormData) => {
      setSaving(true)
      try {
        await api.post('/debts', data)
        await load(true)
      } finally {
        setSaving(false)
      }
    },
    [load]
  )

  const update = useCallback(
    async (id: string, data: DebtFormData) => {
      setSaving(true)
      try {
        await api.put(`/debts/${id}`, data)
        await load(true)
      } finally {
        setSaving(false)
      }
    },
    [load]
  )

  const addPayment = useCallback(
    async (debtId: string, data: DebtPaymentFormData) => {
      setSaving(true)
      try {
        await api.post(`/debts/${debtId}/payments`, data)
        await load(true)
      } finally {
        setSaving(false)
      }
    },
    [load]
  )

  const remove = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await api.delete(`/debts/${id}`)
        setDebts((prev) => prev.filter((d) => d.id !== id))
        // account balances were reversed server-side
        api.get('/accounts').then((res) => {
          const list = unwrap<Account[]>(res.data)
          if (Array.isArray(list)) setAccounts(list)
        })
      } finally {
        setSaving(false)
      }
    },
    []
  )

  return { debts, accounts, caisses, loading, saving, error, load, create, update, addPayment, remove }
}
