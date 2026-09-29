import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Move, History, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Wallet, FolderOpen, ExternalLink, Settings2, Lock, XCircle } from "lucide-react"
import { movementService } from "../services/api"
import { useAuthStore } from "../stores/authStore"
import type { Movement, MovementType } from "../types"
import { Card } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { cn } from "../lib/utils"

const TYPE_LABELS: Record<MovementType, string> = {
  apport: "Apport",
  regulation: "Régulation",
  transfer: "Transfert",
  expense: "Dépense",
  income: "Revenu",
  caisse_fund: "Financement caisse",
  caisse_refund: "Restitution caisse",
  caisse_close: "Clôture caisse",
  out: "Perte",
}

const TYPE_ICONS: Record<MovementType, typeof Move> = {
  apport: ArrowDownLeft,
  regulation: Settings2,
  transfer: ArrowRightLeft,
  expense: ArrowUpRight,
  income: ArrowDownLeft,
  caisse_fund: ArrowDownLeft,
  caisse_refund: ArrowUpRight,
  caisse_close: Lock,
  out: XCircle,
}

const TYPE_ORDER: MovementType[] = [
  "apport", "income", "caisse_fund", "transfer", "regulation", "expense", "caisse_refund", "caisse_close", "out",
]

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(n ?? 0)

export default function MouvementsPage() {
  const { user } = useAuthStore()
  const currency = user?.currency_code || "GNF"
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<MovementType | "all">("all")

  useEffect(() => {
    movementService.getAll()
      .then((res) => setMovements(res.data?.data || res.data || []))
      .catch(() => setError("Impossible de charger l'historique."))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (filter === "all" ? movements : movements.filter((m) => m.type === filter)),
    [filter, movements]
  )

  const label = (m: Movement) => {
    if (m.label) return m.label
    const from = m.from_type ? (m.from_type === "external" ? "Externe" : entityLabel(m.from_type, m.from_id).title) : "—"
    const to = m.to_type ? (m.to_type === "external" ? "Externe" : entityLabel(m.to_type, m.to_id).title) : "—"
    return `${TYPE_LABELS[m.type]} : ${from} → ${to}`
  }

  const entityLabel = (type: string | null, id: string | null) => {
    if (!type || !id) return { title: type === "external" ? "Externe" : "—", isAccount: type === "account" }
    const isAccount = type === "account"
    return { title: isAccount ? "Compte" : "Caisse", isAccount }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[var(--background)] min-h-[100dvh]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <History className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Mouvements</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              Journal de tous les mouvements d'argent (apports, transferts, dépenses, clôtures...).
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)]">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge
          onClick={() => setFilter("all")}
          className={cn("cursor-pointer", filter === "all" && "bg-[var(--primary)] text-white")}
          variant={filter === "all" ? "default" : "secondary"}
        >Tous</Badge>
        {TYPE_ORDER.map((t) => (
          <Badge
            key={t}
            onClick={() => setFilter(filter === t ? "all" : t)}
            className="cursor-pointer"
            variant={filter === t ? "default" : "secondary"}
          >{TYPE_LABELS[t]}</Badge>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Move className="w-10 h-10 text-[var(--muted-foreground)]" />
          <p className="text-lg font-medium text-[var(--muted-foreground)]">Aucun mouvement</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-2.5">
          {filtered.map((m) => {
            const Icon = TYPE_ICONS[m.type]
            const outgoing = ["expense", "caisse_refund", "caisse_close", "out", "transfer"].includes(m.type)
            const from = entityLabel(m.from_type, m.from_id)
            const to = entityLabel(m.to_type, m.to_id)
            return (
              <Card key={m.id} className="p-4 flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    outgoing ? "bg-[var(--destructive)]/10 text-[var(--destructive)]" : "bg-[var(--success)]/10 text-[var(--success)]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">{label(m)}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-[var(--muted-foreground)]">
                    <span>{TYPE_LABELS[m.type]}</span>
                    {m.from_type && (
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3 h-3 shrink-0" />
                        <span className="capitalize truncate max-w-[120px]">{from.title}</span>
                      </span>
                    )}
                    {m.to_type && (
                      <>
                        <span className="shrink-0">→</span>
                        <span className="flex items-center gap-1">
                          {to.isAccount ? <Wallet className="w-3 h-3 shrink-0" /> : <FolderOpen className="w-3 h-3 shrink-0" />}
                          <span className="capitalize truncate max-w-[120px]">{to.title}</span>
                        </span>
                      </>
                    )}
                    <span className="shrink-0">·</span>
                    <span>{new Date(m.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("font-bold whitespace-nowrap", outgoing ? "text-[var(--destructive)]" : "text-[var(--success)]")}>
                    {outgoing ? "−" : "+"}{fmt(Number(m.amount))} {m.currency_code}
                  </p>
                  {m.type === "expense" && <ExternalLink className="w-3.5 h-3.5 ml-auto mt-1 text-[var(--muted-foreground)]" />}
                </div>
              </Card>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}