import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRightLeft, Wallet, FolderOpen, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { api, accountService, caisseService } from "../services/api"
import { useAuthStore } from "../stores/authStore"
import type { Account } from "../types/account"
import type { Caisse } from "../types"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(n ?? 0)

type Entity = { type: "account" | "caisse"; id: string; name: string; amount: number; currency: string }

export default function MigrationPage() {
  const { user } = useAuthStore()
  const currency = user?.currency_code || "GNF"
  const [accounts, setAccounts] = useState<Account[]>([])
  const [caisses, setCaisses] = useState<Caisse[]>([])
  const [source, setSource] = useState<Entity | null>(null)
  const [dest, setDest] = useState<Entity | null>(null)
  const [amount, setAmount] = useState("")
  const [label, setLabel] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const sources = [
    ...accounts.map<Entity>((a) => ({ type: "account" as const, id: a.id, name: a.name, amount: Number(a.balance), currency: a.currency_code })),
    ...caisses.filter((c) => c.status !== "closed").map<Entity>((c) => ({ type: "caisse" as const, id: c.id, name: c.name, amount: Number(c.remaining), currency })),
  ]

  const destinations = [
    ...accounts.map<Entity>((a) => ({ type: "account" as const, id: a.id, name: a.name, amount: Number(a.balance), currency: a.currency_code })),
    ...caisses.filter((c) => c.status !== "closed").map<Entity>((c) => ({ type: "caisse" as const, id: c.id, name: c.name, amount: Number(c.remaining), currency })),
  ].filter((e) => !(source && e.id === source.id && e.type === source.type))

  useEffect(() => {
    Promise.all([accountService.getAll(), caisseService.getAll()])
      .then(([a, c]) => {
        setAccounts(a.data?.data || a.data || [])
        setCaisses(c.data?.data || c.data || [])
      })
      .catch(() => setError("Backend non connecté."))
      .finally(() => setLoading(false))
  }, [])

  const run = async () => {
    if (!source || !dest) { setError("Choisissez une source et une destination."); return }
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError("Montant invalide."); return }
    if (amt > source.amount) { setError(`Solde insuffisant sur ${source.name} (${fmt(source.amount)}).`); return }
    setBusy(true); setError(null); setSuccess(null)
    try {
      const data = { amount: amt, to_type: dest.type, to_id: dest.id, label: label || undefined }
      if (source.type === "account") {
        await accountService.transfer(source.id, data)
      } else {
        await caisseService.transfer(source.id, data)
      }
      setSuccess(`Transfert de ${fmt(amt)} ${currency} effectué.`)
      setAmount("")
      // refresh
      const [a, c] = await Promise.all([accountService.getAll(), caisseService.getAll()])
      setAccounts(a.data?.data || a.data || [])
      setCaisses(c.data?.data || c.data || [])
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message || "Échec du transfert.")
    } finally {
      setBusy(false)
    }
  }

  const EntityIcon = (type: "account" | "caisse") => type === "account" ? Wallet : FolderOpen

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 bg-[var(--background)] min-h-[100dvh]">
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
        <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
          <ArrowRightLeft className="w-6 h-6 text-[var(--primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Migration de ressources</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Déplacez de l'argent entre comptes et caisses. Chaque transfert est journalisé.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 text-[var(--success)] text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source */}
          <Card className="p-4 space-y-3">
            <Label>Source (l'argent quitte)</Label>
            <select
              value={source ? `${source.type}:${source.id}` : ""}
              onChange={(e) => {
                const [type, id] = e.target.value.split(":")
                setSource(sources.find((s) => s.type === type && s.id === id) || null)
              }}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
            >
              <option value="">— Choisir —</option>
              <optgroup label="Comptes">
                {sources.filter((s) => s.type === "account").map((s) => (
                  <option key={s.id} value={`${s.type}:${s.id}`}>{s.name} ({fmt(s.amount)} {s.currency})</option>
                ))}
              </optgroup>
              <optgroup label="Caisses">
                {sources.filter((s) => s.type === "caisse").map((s) => (
                  <option key={s.id} value={`${s.type}:${s.id}`}>{s.name} ({fmt(s.amount)} {currency})</option>
                ))}
              </optgroup>
            </select>
            {source && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--secondary)]/50">
                {(() => { const I = EntityIcon(source.type); return <I className="w-5 h-5 text-[var(--muted-foreground)]" /> })()}
                <div>
                  <p className="text-sm font-semibold">{source.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)] capitalize">{source.type} · {fmt(source.amount)} {source.currency} disponibles</p>
                </div>
              </div>
            )}
          </Card>

          {/* Destination */}
          <Card className="p-4 space-y-3">
            <Label>Destination (l'argent arrive)</Label>
            <select
              value={dest ? `${dest.type}:${dest.id}` : ""}
              onChange={(e) => {
                const [type, id] = e.target.value.split(":")
                setDest(destinations.find((d) => d.type === type && d.id === id) || null)
              }}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm"
            >
              <option value="">— Choisir —</option>
              <optgroup label="Comptes">
                {destinations.filter((d) => d.type === "account").map((d) => (
                  <option key={d.id} value={`${d.type}:${d.id}`}>{d.name}</option>
                ))}
              </optgroup>
              <optgroup label="Caisses">
                {destinations.filter((d) => d.type === "caisse").map((d) => (
                  <option key={d.id} value={`${d.type}:${d.id}`}>{d.name}</option>
                ))}
              </optgroup>
            </select>
            {dest && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--secondary)]/50">
                {(() => { const I = EntityIcon(dest.type); return <I className="w-5 h-5 text-[var(--muted-foreground)]" /> })()}
                <p className="text-sm font-semibold capitalize">{dest.type} · {dest.name}</p>
              </div>
            )}
          </Card>
        </div>
      )}

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Montant ({currency})</Label>
            <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label>Libellé (optionnel)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Réallocation fonds" />
          </div>
        </div>
        <Button onClick={run} disabled={busy || !source || !dest} className="cursor-pointer w-full">
          {busy && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
          <ArrowRightLeft className="w-4 h-4 mr-1.5" />
          Migrer l'argent
        </Button>
      </Card>
    </div>
  )
}