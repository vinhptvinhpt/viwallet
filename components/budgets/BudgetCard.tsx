'use client'
import { motion } from 'motion/react'
import { formatAmount } from '@/lib/currency'
import type { BudgetWithSpent } from '@/types'
import { cn } from '@/lib/utils'
import IconTile from '@/components/shared/IconTile'
import { getCategoryIcon } from '@/components/shared/categoryIcon'

export function BudgetCard({ budget }: { budget: BudgetWithSpent }) {
  const pct = Math.min(100, Math.round((budget.spent / budget.amount) * 100))
  const remaining = Math.max(0, budget.amount - budget.spent)
  const isWarning = pct >= budget.alertThreshold && pct < 100
  const isOver = pct >= 100

  const fillColor = isOver
    ? 'bg-danger'
    : isWarning
    ? 'bg-[var(--color-cat-amber)]'
    : 'bg-primary'

  const badgeColor = isOver
    ? 'bg-[var(--color-danger)]/15 text-danger'
    : isWarning
    ? 'bg-[var(--color-cat-amber)]/15 text-[var(--color-cat-amber)]'
    : 'bg-surface-2 text-text-secondary'

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {budget.category ? (
            <IconTile
              icon={getCategoryIcon(budget.category.icon)}
              color={budget.category.color}
              size={36}
            />
          ) : null}
          <span className="font-semibold text-sm text-text-primary">{budget.name}</span>
        </div>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', badgeColor)}>
          {pct}%
        </span>
      </div>

      {/* Animated progress bar */}
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-2">
        <motion.div
          className={cn('h-full rounded-full', fillColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="flex justify-between text-xs text-text-secondary">
        <span>{formatAmount(budget.spent, budget.currency)} spent</span>
        <span>{formatAmount(remaining, budget.currency)} left</span>
      </div>
    </div>
  )
}
