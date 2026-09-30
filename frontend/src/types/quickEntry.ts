/* ============================================
   Quick Entry (saisie rapide) Types
   ============================================ */

import type { PaymentMethod } from './expense'

export type QuickEntryType = 'expense' | 'income'

/**
 * Une ligne du tableau de saisie rapide.
 *
 * Les montants et l'identifiant de ligne sont gardés en `string` : un `number`
 * transformerait une saisie intermédiaire (« 12.», « - ») en `NaN` et ferait
 * sauter la ligne pendant la frappe.
 */
export interface QuickEntryRow {
  /** Identifiant local, pour le suivi React des lignes dupliquées. */
  uid: string
  type: QuickEntryType
  title: string
  amount: string
  date: string
  account_id: string
  category_id: string
  caisse_id: string
  payment_method: PaymentMethod | ''
  status: 'completed' | 'pending' | 'cancelled'
  description: string
}

export interface QuickEntryPayload {
  type: QuickEntryType
  title: string
  amount: number
  date: string
  account_id: string | null
  category_id: string
  caisse_id: string | null
  payment_method: PaymentMethod | null
  status: 'completed' | 'pending' | 'cancelled'
  description: string
}

export interface QuickEntryResponse {
  message: string
  created: {
    expenses: number
    incomes: number
    total: number
  }
}

/** Erreurs renvoyées par l'API, indexées par ligne : `entries.2.amount`. */
export type QuickEntryErrors = Record<string, string[]>
