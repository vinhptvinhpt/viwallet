'use client'
import { motion } from 'motion/react'
import { formatAmount } from '@/lib/currency'
import IconTile from '@/components/shared/IconTile'
import { getCategoryIcon } from '@/components/shared/categoryIcon'
import type { TransactionWithRelations } from '@/types'

export function TransactionRow({
  tx,
  onClick,
}: {
  tx: TransactionWithRelations
  onClick?: (tx: TransactionWithRelations) => void
}) {
  const isIncome = tx.type === 'INCOME'
  return (
    <motion.div
      className="flex items-center justify-between py-3 px-4 cursor-pointer"
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => onClick?.(tx)}
    >
      <div className="flex items-center gap-3">
        <IconTile
          icon={getCategoryIcon(tx.category.icon)}
          color={tx.category.color}
          size={40}
        />
        <div>
          <p className="text-sm font-medium text-text-primary">{tx.category.name}</p>
          <p className="text-xs text-text-secondary">{tx.note || tx.wallet.name}</p>
        </div>
      </div>
      <p
        className={`font-semibold tabular-nums text-sm ${
          isIncome ? 'text-success' : 'text-text-primary'
        }`}
      >
        {isIncome ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
      </p>
    </motion.div>
  )
}
