import { formatAmount } from '@/lib/currency'
import type { TransactionWithRelations } from '@/types'

export function TransactionRow({ tx }: { tx: TransactionWithRelations }) {
  const isIncome = tx.type === 'INCOME'
  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-2 text-lg">
          {tx.category.icon}
        </div>
        <div>
          <p className="text-sm font-medium">{tx.category.name}</p>
          <p className="text-xs text-slate-500">{tx.note || tx.wallet.name}</p>
        </div>
      </div>
      <p className={`font-semibold tabular-nums text-sm ${isIncome ? 'text-positive' : 'text-white'}`}>
        {isIncome ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
      </p>
    </div>
  )
}
