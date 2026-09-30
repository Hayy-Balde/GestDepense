import { useEffect, useState, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { motion } from "framer-motion"
import { api } from "../services/api"
import { useAuthStore } from "../stores/authStore"
import type { Account, AccountFormData, AccountType, AccountSummary } from "../types/account"
import { useConfig } from "../hooks/useConfig"
import {
  Building2, Banknote, Smartphone, Wallet, PiggyBank, Bitcoin, CreditCard,
  Plus, Loader2, Pencil, Trash2, AlertTriangle, ArrowRightLeft, Settings2, ArrowDownToLine,
} from "lucide-react"
import { resolveIcon } from "@/lib/iconMap"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { MoneyActionModal, DeleteResolutionModal } from "../components/money/MoneyActionModal"
import type { MoneyActionKind, MoneyEntity } from "../components/money/MoneyActionModal"
import type { Caisse } from "../types"
import { useToastStore, getApiErrorMessage } from "../stores/toastStore"

const MOCK_ACCOUNTS: Account[] = [
  { id: "mock-1", user_id: "mock", name: "Compte Courant", type: "bank", balance: 2_450_000, currency_code: "GNF", color: "#4F46E5", icon: "Building2", is_active: true, credit_limit: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-2", user_id: "mock", name: "Espèces", type: "cash", balance: 350_000, currency_code: "GNF", color: "#16A34A", icon: "Banknote", is_active: true, credit_limit: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "mock-3", user_id: "mock", name: "Mobile Money", type: "mobile_money", balance: 125_000, currency_code: "GNF", color: "#F59E0B", icon: "Smartphone", is_active: true, credit_limit: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

const TYPE_LUCIDE: Record<AccountType, typeof Building2> = {
  bank: Building2,
  cash: Banknote,
  mobile_money: Smartphone,
  wallet: Wallet,
  crypto: Bitcoin,
  savings: PiggyBank,
  credit_card: CreditCard,
}


const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(n ?? 0)

export default function AccountsPage() {
  const { user } = useAuthStore()
  const { accountTypes, currencies } = useConfig()
  const currency = user?.currency_code || "GNF"
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [moneyAction, setMoneyAction] = useState<{ kind: MoneyActionKind; entity: MoneyEntity } | null>(null)
  const [deleting, setDeleting] = useState<Account | null>(null)
  const { success, error: toastError } = useToastStore()

  const form = useForm<AccountFormData>({
    defaultValues: {
      name: "",
      type: "bank",
      balance: 0,
      currency_code: currency,
      color: "#4F46E5",
      icon: "Wallet",
      is_active: true,
      credit_limit: null,
    },
  })

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = form
  const selectedType = useWatch({ control, name: "type" })

  const summary: AccountSummary | null = useMemo(() => {
    if (accounts.length === 0) return null
    const byType = Object.fromEntries(
      accountTypes.map(t => [t.value, { count: 0, balance: 0 }])
    ) as AccountSummary["by_type"]
    for (const a of accounts) {
      byType[a.type].count++
      byType[a.type].balance += Number(a.balance)
    }
    return {
      total_balance: accounts.reduce((s, a) => s + Number(a.balance), 0),
      total_accounts: accounts.length,
      by_type: byType,
    }
  }, [accounts, accountTypes])

  const loadData = () => {
    setLoading(true)
    setError(null)
    api.get("/accounts")
      .then(res => setAccounts(res.data?.data || res.data || []))
      .then(() => api.get("/caisses").then(res => setCaisses(res.data?.data || res.data || [])))
      .catch(() => {
        setAccounts(MOCK_ACCOUNTS)
        setError("Backend non connecté — données d'exemple affichées.")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    loadData()
  }, [])

  const openCreate = () => {
    setEditingAccount(null)
    reset({ name: "", type: "bank", balance: 0, currency_code: currency, color: "#4F46E5", icon: "Wallet", is_active: true, credit_limit: null })
    setShowForm(true)
  }

  const openEdit = (account: Account) => {
    setEditingAccount(account)
    reset({ name: account.name, type: account.type, balance: account.balance, currency_code: account.currency_code, color: account.color, icon: account.icon, is_active: account.is_active, credit_limit: account.credit_limit })
    setShowForm(true)
  }

  const onSubmit = async (data: AccountFormData) => {
    try {
      if (editingAccount) {
        const { balance, type, currency_code, credit_limit, ...meta } = data
        const res = await api.put(`/accounts/${editingAccount.id}`, meta)
        success((res.data as { message?: string })?.message || 'Compte modifié avec succès.')
      } else {
        const res = await api.post("/accounts", data)
        success((res.data as { message?: string })?.message || 'Compte créé avec succès.')
      }
      setShowForm(false)
      loadData()
    } catch (err) {
      toastError(getApiErrorMessage(err, editingAccount ? 'Erreur lors de la modification du compte.' : 'Erreur lors de la création du compte.'))
      if (editingAccount) {
        setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, ...data, credit_limit: data.credit_limit ?? null, updated_at: new Date().toISOString() } : a))
      } else {
        setAccounts(prev => [...prev, { id: `mock-${Date.now()}`, user_id: "mock", ...data, credit_limit: data.credit_limit ?? null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      }
      setShowForm(false)
    }
  }

  const handleDelete = async (mode: "lost" | "redirect", destId?: string) => {
    if (!deleting) return
    try {
      const res = await api.delete(`/accounts/${deleting.id}`, { data: { mode, account_id: destId } })
      success((res.data as { message?: string })?.message || 'Compte supprimé avec succès.')
    } catch (err) {
      toastError(getApiErrorMessage(err, 'Erreur lors de la suppression du compte.'))
    }
    loadData()
  }

  const moneyEntity: MoneyEntity | null = moneyAction?.entity ?? null

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Comptes</h1>
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Gérez vos comptes bancaires, portefeuilles et espèces.
          </p>
        </div>
        <Button onClick={openCreate} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-1.5" />
          Nouveau Compte
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {summary && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Solde Total</CardDescription>
              <CardTitle className="text-xl font-bold">{fmt(summary.total_balance)} {currency}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Nombre de Comptes</CardDescription>
              <CardTitle className="text-xl font-bold">{summary.total_accounts}</CardTitle>
            </CardHeader>
          </Card>
          {accountTypes.filter(t => (summary.by_type[t.value as AccountType]?.count || 0) > 0).slice(0, 2).map(t => {
            const byType = summary.by_type[t.value as AccountType]
            const Icon = TYPE_LUCIDE[t.value as AccountType] || Wallet
            return (
              <Card key={t.value}>
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {t.label}
                  </CardDescription>
                  <CardTitle className="text-xl font-bold">{fmt(byType.balance)} {currency}</CardTitle>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--muted-foreground)]/20" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-[var(--muted-foreground)]/20 rounded" />
                  <div className="h-3 w-16 bg-[var(--muted-foreground)]/20 rounded" />
                </div>
              </div>
              <div className="h-8 w-32 bg-[var(--muted-foreground)]/20 rounded" />
              <div className="h-4 w-20 bg-[var(--muted-foreground)]/20 rounded" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-full bg-[var(--muted)]/30 mb-4">
            <Wallet className="w-12 h-12 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Aucun compte</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-6">
            Créez votre premier compte pour commencer à suivre vos finances.
          </p>
          <Button onClick={openCreate} className="cursor-pointer">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau Compte
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5"
        >
          {accounts.map((account, index) => {
            const Icon = resolveIcon(account.icon)
            const typeInfo = accountTypes.find(t => t.value === account.type)
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card className="relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: account.color }} />
                  <CardContent className="p-5 pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${account.color}20`, color: account.color }}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                          <p className="text-xs text-[var(--muted-foreground)]">{typeInfo?.label || account.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="Apport"
                          onClick={() => setMoneyAction({ kind: "apport", entity: { id: account.id, name: account.name, type: "account" } })}
                          className="p-1.5 rounded-md hover:bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Régulation"
                          onClick={() => setMoneyAction({ kind: "regulate", entity: { id: account.id, name: account.name, type: "account" } })}
                          className="p-1.5 rounded-md hover:bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Transfert"
                          onClick={() => setMoneyAction({ kind: "transfer", entity: { id: account.id, name: account.name, type: "account" } })}
                          className="p-1.5 rounded-md hover:bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Modifier"
                          onClick={() => openEdit(account)}
                          className="p-1.5 rounded-md hover:bg-[var(--muted)]/50 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={() => setDeleting(account)}
                          className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <p className="text-xl font-bold" style={{ color: account.color }}>
                        {fmt(account.balance)} {account.currency_code}
                      </p>
                      <Badge variant={account.is_active ? "success" : "secondary"}>
                        {account.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              {editingAccount ? "Modifier le Compte" : "Nouveau Compte"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingAccount
                ? "Modifiez les détails de votre compte ci-dessous."
                : "Remplissez les détails ci-dessous pour créer un nouveau compte."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du Compte</Label>
              <Input id="name" {...register("name", { required: "Le nom est requis" })} placeholder="Ex: Compte Courant" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  {...register("type")}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {accountTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Solde Initial {editingAccount && <span className="text-xs text-[var(--muted-foreground)]">(via Régulation)</span>}</Label>
                <Input id="balance" type="number" step="0.01" disabled={!!editingAccount} {...register("balance", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency_code">Devise</Label>
                <select
                  id="currency_code"
                  {...register("currency_code")}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.symbol})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Input id="color" type="color" {...register("color")} className="h-10 p-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icône</Label>
              <Input id="icon" {...register("icon")} placeholder="Wallet" />
              <p className="text-xs text-[var(--muted-foreground)]">
                Nom de l'icône Lucide (Wallet, Building2, Banknote, Smartphone...)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="is_active" {...register("is_active")} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <Label htmlFor="is_active" className="mb-0 cursor-pointer">Compte actif</Label>
            </div>

            {selectedType === "credit_card" && (
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Plafond de Crédit</Label>
                <Input id="credit_limit" type="number" step="0.01" {...register("credit_limit", { valueAsNumber: true })} />
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="cursor-pointer">
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {editingAccount ? "Enregistrer" : "Créer le Compte"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MoneyActionModal
        open={!!moneyAction}
        onOpenChange={(v) => { if (!v) setMoneyAction(null) }}
        kind={moneyAction?.kind ?? "apport"}
        entity={moneyEntity ?? { id: "", name: "", type: "account" }}
        currency={currency}
        accounts={accounts}
        caisses={caisses}
        onDone={loadData}
      />

      <DeleteResolutionModal
        open={!!deleting}
        onOpenChange={(v) => { if (!v) setDeleting(null) }}
        entityName={deleting?.name || ""}
        accounts={accounts.filter((a) => a.id !== deleting?.id)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
