import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ReportSummary } from '@/types'

interface PdfReportOptions {
  report: ReportSummary
  userName: string
  currency: string
}

interface TransactionRow {
  date: string
  designation: string
  category?: string | null
  source?: string | null
  amount: number
  kind: 'revenu' | 'depense'
}

const APP_NAME = 'Fin-Track'

const PRIMARY: [number, number, number] = [16, 185, 129]
const LIGHT_BG: [number, number, number] = [240, 253, 244]
const DARK: [number, number, number] = [17, 24, 39]
const GRAY: [number, number, number] = [107, 114, 128]
const RED: [number, number, number] = [239, 68, 68]
const EMERALD: [number, number, number] = [5, 150, 105]

function fmt(amount: number, currency: string): string {
  // jsPDF (fontes Helvetica standard) ne gère pas U+202F (espace insécable étroite)
  // générée par Intl.NumberFormat('fr-FR') → on la remplace par une espace normale.
  const n = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount ?? 0)
  return `${n.replace(/[\u202f\u00a0]/g, ' ')} ${currency}`
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
  // Dettes, factures et abonnements sont de véritables flux de trésorerie : un
  // prêt accordé, une facture fournisseur payée ou un abonnement réglé est une
  // sortie ; un emprunt reçu ou une facture client encaissée une entrée.
  const cash: TransactionRow[] = (report.cash_events ?? []).map((d) => ({
    date: d.date ?? '',
    designation: d.title,
    category: d.category,
    source: d.account ?? d.source,
    amount: d.amount,
    kind: d.kind,
  }))

  return [...incomes, ...expenses, ...cash].sort((a, b) => a.date.localeCompare(b.date))
}

export function generateReportPdf({ report, userName, currency }: PdfReportOptions): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // ---------- Section 1 : en-tête ----------
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(APP_NAME, 14, 14)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('RAPPORT FINANCIER', 14, 22)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 14, 14, { align: 'right' })
  doc.text(`Par : ${userName}`, pageWidth - 14, 19, { align: 'right' })
  doc.text(`Période : ${report.interval.label}`, pageWidth - 14, 24, { align: 'right' })

  let y = 40

  // Cadre récapitulatif période
  doc.setDrawColor(...PRIMARY)
  doc.setFillColor(...LIGHT_BG)
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'FD')
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.text('Période couverte', 20, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.setFontSize(9)
  doc.text(`${report.interval.start} → ${report.interval.end}`, 20, y + 12.5)
  doc.setTextColor(...PRIMARY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(report.interval.label, pageWidth - 20, y + 10.5, { align: 'right' })
  y += 26

  // ---------- Section 2 : bilan des comptes ----------
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('2. Bilan des comptes', 14, y)
  y += 3

  const accountRows = report.accounts.map((a) => [
    a.name,
    a.type,
    a.currency_code,
    fmt(a.balance, a.currency_code),
  ])
  report.caisses.forEach((c) => {
    accountRows.push([
      `${c.name} (caisse)`,
      c.status === 'active' ? 'active' : 'clôturée',
      c.currency_code,
      fmt(c.remaining, c.currency_code),
    ])
  })

  autoTable(doc, {
    startY: y + 2,
    head: [['Compte', 'Type', 'Devise', 'Solde']],
    body: accountRows,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 28 },
      2: { cellWidth: 18 },
      3: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
    },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12

  // ---------- Section 3 : tableau nº / désignation / revenu / dépense ----------
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('3. Détail des opérations', 14, y)

  const rows = buildRows(report)
  const body = rows.map((r, i) => [
    String(i + 1),
    `${r.date} · ${r.designation}${r.category ? ` — ${r.category}` : ''}${r.source ? ` (${r.source})` : ''}`,
    r.kind === 'revenu' ? fmt(r.amount, currency) : '',
    r.kind === 'depense' ? fmt(r.amount, currency) : '',
  ])

  const totals = report.totals
  body.push([...Array(2)].map(() => '') as string[])
  body.push(['', 'TOTAL REVENUS', fmt(totals.incomes, currency), ''])
  body.push(['', 'TOTAL DÉPENSES', '', fmt(totals.expenses, currency)])
  body.push(['', 'SOLDE NET', totals.net >= 0 ? fmt(totals.net, currency) : '', totals.net < 0 ? fmt(Math.abs(totals.net), currency) : ''])

  if (report.cash_flow && (report.cash_flow.in > 0 || report.cash_flow.out > 0)) {
    body.push([...Array(2)].map(() => '') as string[])
    body.push(['', 'dont dettes & factures — entrées', fmt(report.cash_flow.in, currency), ''])
    body.push(['', 'dont dettes & factures — sorties', '', fmt(report.cash_flow.out, currency)])
    if (report.cash_flow.debts && (report.cash_flow.debts.in > 0 || report.cash_flow.debts.out > 0)) {
      body.push(['', 'dont dettes', fmt(report.cash_flow.debts.in, currency), fmt(report.cash_flow.debts.out, currency)])
    }
    if (report.cash_flow.invoices && (report.cash_flow.invoices.in > 0 || report.cash_flow.invoices.out > 0)) {
      body.push(['', 'dont factures', fmt(report.cash_flow.invoices.in, currency), fmt(report.cash_flow.invoices.out, currency)])
    }
  }

  autoTable(doc, {
    startY: y + 2,
    head: [['Nº', 'Désignation', 'Revenu', 'Dépense']],
    body,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: LIGHT_BG },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 2 && data.cell.raw) {
          data.cell.styles.textColor = EMERALD
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.column.index === 3 && data.cell.raw) {
          data.cell.styles.textColor = RED
          data.cell.styles.fontStyle = 'bold'
        }
        const cellText = String(data.cell.raw ?? '')
        if (cellText.startsWith('TOTAL') || cellText.startsWith('SOLDE')) {
          data.cell.styles.fillColor = LIGHT_BG
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = DARK
        }
      }
    },
    didDrawPage: (data) => {
      // Note de bas de page
      const pageCount = doc.getNumberOfPages()
      for (let p = 1; p <= pageCount; p += 1) {
        doc.setPage(p)
        doc.setFontSize(7.5)
        doc.setTextColor(...GRAY)
        doc.text(`${APP_NAME} — Rapport financier`, 14, doc.internal.pageSize.getHeight() - 8)
        doc.text(`Page ${p} / ${pageCount}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
      }
    },
  })

  doc.save(`rapport-${report.interval.start}-${report.interval.end}.pdf`)
}
