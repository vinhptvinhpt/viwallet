'use client'
import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { formatAmount } from '@/lib/currency'
import { format } from 'date-fns'
import AnimatedNumber from '@/components/motion/AnimatedNumber'
import { cn } from '@/lib/utils'

export interface DebtSummary {
  id: string
  direction: 'I_OWE' | 'OWED_TO_ME'
  counterparty: string
  amount: number
  remainingAmount: number
  currency: string
  dueDate: string | null
  status: string
}

export function DebtCard({ debt, index = 0 }: { debt: DebtSummary; index?: number }) {
  const isSettled = debt.status === 'SETTLED'
  const paidAmount = debt.amount - debt.remainingAmount
  const isIOwe = debt.direction === 'I_OWE'

  return (
    <motion.div
      className={cn(
        'bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4 border border-hairline',
        isSettled && 'opacity-60'
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isSettled ? 0.6 : 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Direction badge */}
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
              isIOwe
                ? 'bg-[var(--color-cat-coral)]/20 text-danger'
                : 'bg-[var(--color-cat-mint)]/20 text-success'
            )}
          >
            {isIOwe ? 'I owe' : 'Owed to me'}
          </span>
        </div>
        {isSettled && (
          <CheckCircle2 size={18} className="text-success shrink-0" />
        )}
      </div>

      {/* Counterparty */}
      <p className="font-semibold text-sm text-text-primary mb-1">{debt.counterparty}</p>

      {/* Amounts */}
      <div className="flex items-baseline gap-1.5">
        <AnimatedNumber
          value={debt.remainingAmount}
          format={(n) => formatAmount(Math.round(n), debt.currency)}
          className="text-xl font-extrabold text-text-primary tabular-nums"
        />
        {paidAmount > 0 && (
          <span className="text-xs text-text-secondary">
            / {formatAmount(debt.amount, debt.currency)}
          </span>
        )}
      </div>

      {/* Progress bar (shown when partially paid) */}
      {paidAmount > 0 && debt.amount > 0 && (
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden mt-2 mb-1">
          <motion.div
            className={cn('h-full rounded-full', isSettled ? 'bg-success' : isIOwe ? 'bg-danger' : 'bg-success')}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.round((paidAmount / debt.amount) * 100))}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Due date */}
      {debt.dueDate && (
        <p className="text-xs text-text-secondary mt-1.5">
          Due {format(new Date(debt.dueDate), 'MMM d, yyyy')}
        </p>
      )}
    </motion.div>
  )
}
