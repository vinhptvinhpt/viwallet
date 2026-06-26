'use client'
import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { formatAmount } from '@/lib/currency'
import { format } from 'date-fns'
import IconTile from '@/components/shared/IconTile'
import AnimatedNumber from '@/components/motion/AnimatedNumber'
import { getCategoryIcon } from '@/components/shared/categoryIcon'
import { cn } from '@/lib/utils'

export interface GoalSummary {
  id: string
  name: string
  icon: string
  color: string
  targetAmount: number
  currentAmount: number
  currency: string
  deadline: string | null
  status: string
  _count: { contributions: number }
}

export function GoalCard({ goal, index = 0 }: { goal: GoalSummary; index?: number }) {
  const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
  const isCompleted = goal.status === 'COMPLETED'

  return (
    <motion.div
      className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4 border border-hairline"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <IconTile
            icon={getCategoryIcon(goal.icon)}
            color={goal.color}
            size={40}
          />
          <div>
            <span className="font-semibold text-sm text-text-primary block">{goal.name}</span>
            {goal.deadline && (
              <span className="text-xs text-text-secondary">
                Due {format(new Date(goal.deadline), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
        {isCompleted && (
          <CheckCircle2 size={20} className="text-success shrink-0" />
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-2 rounded-full overflow-hidden mb-2">
        <motion.div
          className={cn('h-full rounded-full', isCompleted ? 'bg-success' : 'bg-primary')}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Amounts */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-text-secondary">
          <AnimatedNumber
            value={goal.currentAmount}
            format={(n) => formatAmount(Math.round(n), goal.currency)}
            className="font-semibold text-text-primary"
          />
          {' '}saved
        </span>
        <span className="text-text-secondary">
          {formatAmount(goal.targetAmount, goal.currency)} goal
        </span>
      </div>

      {/* Pct badge */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-text-secondary">
          {goal._count.contributions} contribution{goal._count.contributions !== 1 ? 's' : ''}
        </span>
        <span className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded-full',
          isCompleted
            ? 'bg-[var(--color-success)]/15 text-success'
            : 'bg-primary/10 text-primary'
        )}>
          {isCompleted ? 'Done' : `${pct}%`}
        </span>
      </div>
    </motion.div>
  )
}
