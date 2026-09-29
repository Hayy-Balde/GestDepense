import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DEBT_PERIOD_PRESETS,
  monthLabel,
  shiftMonth,
  type DebtPeriodMode,
} from './debtUtils'

interface DebtFiltersProps {
  mode: DebtPeriodMode
  onModeChange: (mode: DebtPeriodMode) => void
  month: string
  onMonthChange: (month: string) => void
  showSettled: boolean
  onShowSettledChange: (value: boolean) => void
  settledCount: number
}

export default function DebtFilters({
  mode,
  onModeChange,
  month,
  onMonthChange,
  showSettled,
  onShowSettledChange,
  settledCount,
}: DebtFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {DEBT_PERIOD_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant={mode === preset.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onModeChange(preset.value)}
            className={cn(
              'cursor-pointer',
              mode === preset.value && 'bg-indigo-600 text-white hover:bg-indigo-700'
            )}
          >
            {preset.label}
          </Button>
        ))}

        <div
          className={cn(
            'flex items-center gap-0.5 rounded-lg border px-0.5 py-0.5',
            mode === 'month'
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-[var(--border)] bg-[var(--card)]'
          )}
        >
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={() => {
              onMonthChange(shiftMonth(month, -1))
              onModeChange('month')
            }}
            className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onModeChange('month')}
            className="px-2 text-sm font-medium text-[var(--foreground)] cursor-pointer whitespace-nowrap"
          >
            {monthLabel(month)}
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => {
              onMonthChange(shiftMonth(month, 1))
              onModeChange('month')
            }}
            className="p-1 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={showSettled}
        onClick={() => onShowSettledChange(!showSettled)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer w-fit',
          showSettled
            ? 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400'
            : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        )}
      >
        <span
          className={cn(
            'flex items-center justify-center w-4 h-4 rounded border transition-colors',
            showSettled
              ? 'bg-green-600 border-green-600 text-white'
              : 'border-[var(--border)] bg-transparent'
          )}
        >
          {showSettled && <Check className="w-3 h-3" strokeWidth={3} />}
        </span>
        Remboursées
        {settledCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-[var(--muted)] text-[10px] font-bold text-[var(--muted-foreground)]">
            {settledCount}
          </span>
        )}
      </button>
    </div>
  )
}
