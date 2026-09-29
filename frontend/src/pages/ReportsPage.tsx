import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileDown, FileSpreadsheet, Loader2, Wallet, FolderOpen, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { reportService } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore, getApiErrorMessage } from '@/stores/toastStore'
import type { ReportSummary } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MONTHS } from '@/lib/constants'
import { generateReportPdf } from '@/lib/reportPdf'

const MONTH_NAMES_FR = MONTHS

interface TransactionRow {
  date: string
  designation: string
  category?: string | null
  source?: string | null
  amount: number
  kind: 'revenu' | 'depense'
}

function currentMonthValue(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(value: string, offset: number): string {
  const [y = 0, m = 1] = value.split('-').map(Number)
  const d = new Date(y, m - 1 + offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function parseMonth(value: string): { month: number; year: number } {
  const [y = 0, m = 1] = value.split('-').map(Number)
  return { month: m, year: y }
}

function formatLabel(value: string): string {
  const { month, year } = parseMonth(value)
  return `${MONTH_NAMES_FR[month - 1] ?? month} ${year}`
}

function buildRows(report: ReportSummary): TransactionRow[] {
  const incomes: TransactionRow[] = report.incomes.map((i) => ({
    date: i.date,
    designation: i.title,
    category: i.category,
    source: i.account,
    amount: i.amount,
    kind: 'revenu',
  }))
  const expenses: TransactionRow[] = report.expenses.map((e) => ({
    date: e.date,
    designation: e.title,
    category: e.category,
    source: e.source,
    amount: e.amount,
    kind: 'depense',
  }))
  return [...incomes, ...expenses].sort((a, b) => a.date.localeCompare(b.date))
}

export default function ReportsPage() {
  const { user } = useAuthStore()
  const currency = user?.currency_code ?? 'GNF'
  const { success, error: toastError } = useToastStore()
  const loc = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount ?? 0)

  const [from, setFrom] = useState(currentMonthValue())
  const [to, setTo] = useState(currentMonthValue())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ReportSummary | null>(null)

  const presets = [
    { label: 'Ce mois', value: () => { const c = currentMonthValue(); return { from: c, to: c } } },
    { label: 'Mois dernier', value: () => { const c = shiftMonth(currentMonthValue(), -1); return { from: c, to: c } } },
    { label: '6 derniers mois', value: () => ({ from: shiftMonth(currentMonthValue(), -5), to: currentMonthValue() }) },
    { label: 'Cette année', value: () => ({ from: `${new Date().getFullYear()}-01`, to: currentMonthValue() }) },
  ]

  const loadReport = async (download: boolean) => {
    const { month: sm, year: sy } = parseMonth(from)
    const { month: em, year: ey } = parseMonth(to)
    if (sy > ey || (sy === ey && sm > em)) {
      setError('La date de début doit être antérieure ou égale à la date de fin.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await reportService.summary({ start_month: sm, start_year: sy, end_month: em, end_year: ey })
      const data = res.data as ReportSummary
      setReport(data)
      if (download) {
        generateReportPdf({
          report: data,
          userName: user?.name ?? 'Utilisateur',
          currency,
        })
        success('Rapport PDF téléchargé avec succès.')
      }
    } catch (e) {
      console.error(e)
      const msg = getApiErrorMessage(e, 'Impossible de générer le rapport.')
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
    }
  }

  const rows = report ? buildRows(report) : []
  const showTotalsRow = report && rows.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
          <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Rapports</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Générer un rapport PDF récapitulatif : bilan des comptes, opérations détaillées et totaux.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intervalle de la période</CardTitle>
          <CardDescription>Choisissez le mois de début et le mois de fin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button
                key={p.label}
                variant="secondary"
                size="sm"
                onClick={() => {
                  const v = p.value()
                  setFrom(v.from)
                  setTo(v.to)
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Du mois</label>
              <input
                type="month"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
              <p className="text-xs text-[var(--muted-foreground)]">{formatLabel(from)}</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Au mois</label>
              <input
                type="month"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
              <p className="text-xs text-[var(--muted-foreground)]">{formatLabel(to)}</p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="primary" onClick={() => loadReport(false)} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>Aperçu</span>
            </Button>
            <Button variant="secondary" onClick={() => loadReport(true)} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              <span>Télécharger en PDF</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <div className="space-y-6">
          {/* Section 1 : en-tête */}
          <Card className="overflow-hidden">
            <div className="bg-emerald-600 dark:bg-emerald-700 px-6 py-5 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">Fin-Track · Rapport financier</h2>
                  <p className="text-sm text-emerald-50/90">Période couverte : {report.interval.start} → {report.interval.end}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl font-extrabold">{report.interval.label}</p>
                  <p className="text-xs text-emerald-50/90">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2 : bilan des comptes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Bilan des comptes
              </CardTitle>
              <CardDescription>État actuel des comptes et caisses au {report.interval.end}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                    <th className="py-2 pr-3">Compte</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Devise</th>
                    <th className="py-2 text-right">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {report.accounts.map((a) => (
                    <tr key={a.name + a.currency_code} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-3 font-medium">{a.name}</td>
                      <td className="py-2 pr-3 text-[var(--muted-foreground)] capitalize">{a.type}</td>
                      <td className="py-2 pr-3 text-[var(--muted-foreground)]">{a.currency_code}</td>
                      <td className="py-2 text-right font-semibold">{loc(a.balance)}</td>
                    </tr>
                  ))}
                  {report.caisses.map((c) => (
                    <tr key={c.name + c.status} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-3 font-medium">
                        <span className="flex items-center gap-1.5">
                          <FolderOpen className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                          {c.name}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-[var(--muted-foreground)] capitalize">Caisse ({c.status === 'active' ? 'active' : 'clôturée'})</td>
                      <td className="py-2 pr-3 text-[var(--muted-foreground)]">{c.currency_code}</td>
                      <td className="py-2 text-right font-semibold">{loc(c.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Section 3 : tableau des opérations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                Détail des opérations · {report.incomes.length} revenus, {report.expenses.length} dépenses
              </CardTitle>
              <CardDescription>Nº · Désignation · Revenu · Dépense</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {rows.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">Aucune opération sur cette période.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                      <th className="py-2 pr-3 w-10">Nº</th>
                      <th className="py-2 pr-3">Désignation</th>
                      <th className="py-2 pr-3 text-right">Revenu</th>
                      <th className="py-2 text-right">Dépense</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx} className="border-t border-[var(--border)]">
                        <td className="py-2 pr-3 text-[var(--muted-foreground)]">{idx + 1}</td>
                        <td className="py-2 pr-3">
                          <span className="font-medium">{r.date} · {r.designation}</span>
                          {r.category && (
                            <span className="ml-1 text-[var(--muted-foreground)]">— {r.category}</span>
                          )}
                          {r.source && (
                            <span className="ml-1 text-[var(--muted-foreground)]">({r.source})</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {r.kind === 'revenu' ? `+${loc(r.amount)}` : ''}
                        </td>
                        <td className="py-2 text-right font-semibold text-red-600 dark:text-red-400">
                          {r.kind === 'depense' ? `-${loc(r.amount)}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {showTotalsRow && (
                    <tfoot>
                      <tr className="border-t-2 border-[var(--border)] bg-[var(--muted)]/30">
                        <td className="py-2.5 pr-3" />
                        <td className="py-2.5 pr-3 font-bold">TOTAL REVENUS</td>
                        <td className="py-2.5 pr-3 text-right font-bold text-emerald-600 dark:text-emerald-400">+{loc(report.totals.incomes)}</td>
                        <td className="py-2.5 text-right" />
                      </tr>
                      <tr className="border-t border-[var(--border)] bg-[var(--muted)]/30">
                        <td className="py-2.5 pr-3" />
                        <td className="py-2.5 pr-3 font-bold">TOTAL DÉPENSES</td>
                        <td className="py-2.5 pr-3 text-right" />
                        <td className="py-2.5 text-right font-bold text-red-600 dark:text-red-400">-{loc(report.totals.expenses)}</td>
                      </tr>
                      <tr className="border-t border-[var(--border)] bg-[var(--muted)]/30">
                        <td className="py-2.5 pr-3" />
                        <td className="py-2.5 pr-3 font-bold">SOLDE NET</td>
                        <td className="py-2.5 pr-3 text-right font-extrabold">{report.totals.net >= 0 ? '+' : '-'}{loc(Math.abs(report.totals.net))}</td>
                        <td className="py-2.5 text-right" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  )
}
