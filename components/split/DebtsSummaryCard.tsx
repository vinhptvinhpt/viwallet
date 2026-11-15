import Link from 'next/link'
import { ArrowRight, CreditCard } from 'lucide-react'
import { formatAmount } from '@/lib/currency'

interface DebtsSummaryCardProps {
  iOweTotal: number
  owedToMeTotal: number
  currency: string
  openCount: number
}

export function DebtsSummaryCard({
  iOweTotal,
  owedToMeTotal,
  currency,
  openCount,
}: DebtsSummaryCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-text-secondary">
            <CreditCard size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">1-on-1 IOUs</h4>
            <p className="text-xs text-text-secondary">{openCount} active personal {openCount === 1 ? 'record' : 'records'}</p>
          </div>
        </div>
        <Link
          href="/debts"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-hairline">
        <div className="p-2.5 rounded-xl bg-surface-2">
          <p className="text-[11px] font-medium text-text-secondary">You are owed</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatAmount(owedToMeTotal, currency)}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-surface-2">
          <p className="text-[11px] font-medium text-text-secondary">You owe</p>
          <p className="text-sm font-bold text-rose-500 mt-0.5">
            {formatAmount(iOweTotal, currency)}
          </p>
        </div>
      </div>
    </div>
  )
}
