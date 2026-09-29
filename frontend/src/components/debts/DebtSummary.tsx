import { Card, CardContent } from '@/components/ui/card'
import { money } from './debtUtils'

interface Props {
  total: number
  remaining: number
  repaid: number
  activeCount: number
  currency: string
}

export default function DebtSummary({ total, remaining, repaid, activeCount, currency }: Props) {
  const items = [
    { label: 'Montant total', value: money(total, currency), tone: 'text-[var(--foreground)]' },
    { label: 'Reste à rembourser', value: money(remaining, currency), tone: 'text-amber-600' },
    { label: 'Remboursé', value: money(repaid, currency), tone: 'text-green-600' },
    { label: 'Dettes actives', value: String(activeCount), tone: 'text-[var(--foreground)]' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-3 sm:p-4">
            <p className="text-[11px] sm:text-xs font-medium text-[var(--muted-foreground)]">
              {item.label}
            </p>
            <p className={`text-base sm:text-lg font-bold mt-0.5 sm:mt-1 ${item.tone}`}>
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
