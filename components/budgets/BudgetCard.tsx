import { formatAmount } from '@/lib/currency'
import type { BudgetWithSpent } from '@/types'
import { cn } from '@/lib/utils'

export function BudgetCard({ budget }: { budget: BudgetWithSpent }) {
  const pct = Math.min(100, Math.round((budget.spent / budget.amount) * 100))
  const remaining = Math.max(0, budget.amount - budget.spent)
  const isWarning = pct >= budget.alertThreshold && pct < 100
  const isOver = pct >= 100

  return (
    <div className="p-4 rounded-xl bg-surface border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {budget.category && (
            <span className="text-xl">{budget.category.icon}</span>
          )}
          <span className="font-medium text-sm">{budget.name}</span>
        </div>
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          isOver ? 'bg-negative/20 text-negative' :
          isWarning ? 'bg-amber-500/20 text-amber-400' :
          'bg-white/10 text-slate-400'
        )}>
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isOver ? 'bg-negative' : isWarning ? 'bg-amber-500' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{formatAmount(budget.spent, budget.currency)} spent</span>
        <span>{formatAmount(remaining, budget.currency)} left</span>
      </div>
    </div>
  )
}
