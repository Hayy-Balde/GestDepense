import { useEffect, useState } from "react"
import { Loader2, AlertCircle, ArrowRightLeft, PiggyBank } from "lucide-react"
import { accountService, caisseService } from "../../services/api"
import type { Account } from "../../types/account"
import type { Caisse } from "../../types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { useToastStore } from "../../stores/toastStore"

export type MoneyActionKind = "apport" | "regulate" | "transfer" | "fund" | "close"

export interface MoneyEntity {
  id: string
  name: string
  type: "account" | "caisse"
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  kind: MoneyActionKind
  entity: MoneyEntity
  currency: string
  accounts: Account[]
  caisses: Caisse[]
  onDone: () => void
}

const KIND_META: Record<MoneyActionKind, { title: string; desc: string }> = {
  apport: { title: "Apport de fonds", desc: "Ajouter de l'argent au compte (provenance externe)." },
  regulate: { title: "Régulation", desc: "Corriger le solde actuel vers le montant exact." },
  transfer: { title: "Transfert", desc: "Déplacer de l'argent vers un compte ou une caisse." },
  fund: { title: "Étendre la caisse", desc: "Ajouter de l'argent à la caisse depuis un compte (étendre le quota)." },
  close: { title: "Clôturer la caisse", desc: "Clôturer et restituer le solde restant vers un compte." },
}

export function MoneyActionModal({ open, onOpenChange, kind, entity, currency, accounts, caisses, onDone }: Props) {
  const meta = KIND_META[kind]
  const [amount, setAmount] = useState("")
  const constValue = kind === "regulate"
  const [regulateValue, setRegulateValue] = useState("")
  const [sourceAccountId, setSourceAccountId] = useState("")
  const [destType, setDestType] = useState<"account" | "caisse">("account")
  const [destId, setDestId] = useState("")
  const [label, setLabel] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { success: toastSuccess } = useToastStore()

  const otherAccounts = accounts.filter((a) => a.id !== entity.id)
  const otherCaisses = entity.type === "caisse" ? caisses.filter((c) => c.id !== entity.id && c.status !== "closed") : caisses.filter((c) => c.status !== "closed")

  useEffect(() => {
    if (open) {
      setAmount("")
      setRegulateValue("")
      setSourceAccountId(accounts[0]?.id || "")
      setDestType("account")
      setDestId(otherAccounts[0]?.id || otherCaisses[0]?.id || "")
      setLabel("")
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, entity.id])

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const amt = parseFloat(amount)
      if (kind !== "regulate" && kind !== "close" && (!amt || amt <= 0)) {
        setError("Indiquez un montant valide.")
        return
      }
      switch (kind) {
        case "apport":
          await accountService.apport(entity.id, { amount: amt, label: label || undefined })
          break
        case "regulate": {
          const v = parseFloat(regulateValue)
          if (isNaN(v) || v < 0) { setError("Indiquez un solde exact valide."); return }
          await accountService.regulate(entity.id, { balance: v, label: label || undefined })
          break
        }
        case "transfer":
          await accountService.transfer(entity.id, { amount: amt, to_type: destType, to_id: destId, label: label || undefined })
          break
        case "fund":
          await caisseService.fund(entity.id, { source_account_id: sourceAccountId, amount: amt, label: label || undefined })
          break
        case "close":
          await caisseService.close(entity.id, { account_id: destId || undefined, label: label || undefined })
          break
      }
      onOpenChange(false)
      toastSuccess(`Opération effectuée avec succès sur « ${entity.name} ».`)
      onDone()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message || "Une erreur est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-[var(--primary)]" />
            {meta.title} — {entity.name}
          </DialogTitle>
          <DialogDescription className="text-xs">{meta.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Source account for fund */}
          {kind === "fund" && (
            <div className="space-y-2">
              <Label>Compte source</Label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-[var(--primary)] focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.balance} {a.currency_code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount (except regulate & close) */}
          {!constValue && kind !== "close" && (
            <div className="space-y-2">
              <Label>Montant ({currency})</Label>
              <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
          )}

          {/* Regulate exact value */}
          {kind === "regulate" && (
            <div className="space-y-2">
              <Label>Nouveau solde exact ({currency})</Label>
              <Input type="number" step="0.01" min="0" value={regulateValue} onChange={(e) => setRegulateValue(e.target.value)} placeholder="Montant correct" />
            </div>
          )}

          {/* Transfer destination */}
          {kind === "transfer" && (
            <div className="space-y-2">
              <Label>Vers</Label>
              <select
                value={destType}
                onChange={(e) => { setDestType(e.target.value as "account" | "caisse"); setDestId("") }}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="account">Compte</option>
                <option value="caisse">Caisse</option>
              </select>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="">— Choisir —</option>
                {(destType === "account" ? otherAccounts : otherCaisses).map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Close destination account */}
          {kind === "close" && (
            <div className="space-y-2">
              <Label>Compte de destination (solde restant)</Label>
              <select
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="">— Choisir un compte —</option>
                {otherAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {otherAccounts.length === 0 && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--destructive)]">
                  <PiggyBank className="w-3.5 h-3.5" /> Aucun autre compte disponible pour la restitution.
                </p>
              )}
            </div>
          )}

          {/* Label */}
          <div className="space-y-2">
            <Label>Libellé (optionnel)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Apport épargne, Correction..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="cursor-pointer">Annuler</Button>
            <Button type="button" onClick={run} disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Valider
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  entityName: string
  accounts: Account[]
  onConfirm: (mode: "lost" | "redirect", destId?: string) => Promise<void>
}

export function DeleteResolutionModal({ open, onOpenChange, entityName, accounts, onConfirm }: DeleteModalProps) {
  const [mode, setMode] = useState<"lost" | "redirect">("redirect")
  const [destId, setDestId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setMode("redirect")
      setDestId(accounts[0]?.id || "")
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const confirm = async () => {
    if (mode === "redirect" && !destId) { setError("Choisissez un compte de destination."); return }
    setLoading(true)
    setError(null)
    try {
      await onConfirm(mode, mode === "redirect" ? destId : undefined)
      onOpenChange(false)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message || "Une erreur est survenue.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Supprimer « {entityName} » ?</DialogTitle>
          <DialogDescription className="text-xs">
            {entityName === "Autre" ? "" : "Choisissez comment gérer l'argent restant."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="space-y-2">
            {(
              [
                { value: "redirect", label: "Rediriger l'argent vers un autre compte", desc: "Le solde restant sera transféré au compte choisi." },
                { value: "lost", label: "Perdre le montant restant", desc: "L'argent restant sera considéré comme disparu (journalisé)." },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${mode === opt.value ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)]"}`}
              >
                <input type="radio" checked={mode === opt.value} onChange={() => setMode(opt.value)} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium text-[var(--foreground)]">{opt.label}</span>
                  <span className="block text-xs text-[var(--muted-foreground)]">{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>

          {mode === "redirect" && (
            <div className="space-y-2">
              <Label>Compte de destination</Label>
              <select value={destId} onChange={(e) => setDestId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm">
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="cursor-pointer">Annuler</Button>
            <Button type="button" variant="danger" onClick={confirm} disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}