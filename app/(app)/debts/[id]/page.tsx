'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, Receipt } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatAmount } from '@/lib/currency'
import AnimatedNumber from '@/components/motion/AnimatedNumber'
import Skeleton from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import { DebtPaymentSheet } from '@/components/debts/DebtPaymentSheet'
import { cn } from '@/lib/utils'

interface DebtPayment {
  id: string
  amount: number
  walletId: string | null
  date: string
  note: string | null
}

interface DebtDetail {
  id: string
  direction: 'I_OWE' | 'OWED_TO_ME'
  counterparty: string
  amount: number
  remainingAmount: number
  currency: string
  dueDate: string | null
  status: string
  note: string | null
  payments: DebtPayment[]
}

export default function DebtDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [debt, setDebt] = useState<DebtDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPayment, setShowPayment] = useState(false)

  const loadDebt = useCallback(() => {
    setLoading(true)
    fetch(`/api/debts/${id}`)
      .then(r => r.json())
      .then(data => {
        setDebt(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    loadDebt()
  }, [loadDebt])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-5 space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5 space-y-3">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-1 py-2">
              <Skeleton className="w-9 h-9 rounded-[var(--radius-md)]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!debt) {
    return (
      <div className="p-6 text-text-secondary text-sm text-center">Debt not found.</div>
    )
  }

  const paidAmount = debt.amount - debt.remainingAmount
  const pct = debt.amount > 0 ? Math.min(100, Math.round((paidAmount / debt.amount) * 100)) : 0
  const isSettled = debt.status === 'SETTLED'
  const isIOwe = debt.direction === 'I_OWE'

  return (
    <div className="max-w-2xl mx-auto p-5 space-y-4">
      {/* Back link */}
      <Link
        href="/debts"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={15} /> Back to Debts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{debt.counterparty}</h1>
          <span
            className={cn(
              'inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full',
              isIOwe
                ? 'bg-[var(--color-cat-coral)]/20 text-danger'
                : 'bg-[var(--color-cat-mint)]/20 text-success'
            )}
          >
            {isIOwe ? 'I owe' : 'Owed to me'}
          </span>
        </div>
        {isSettled && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-success)]/15 text-success">
            Settled
          </span>
        )}
      </div>

      {/* Progress card */}
      <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5 border border-hairline">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-text-secondary">
            {isSettled ? 'Total' : 'Remaining'}
          </p>
          {debt.dueDate && (
            <p className="text-xs text-text-secondary">
              Due {format(new Date(debt.dueDate), 'MMM d, yyyy')}
            </p>
          )}
        </div>

        <AnimatedNumber
          value={debt.remainingAmount}
          format={(n) => formatAmount(Math.round(n), debt.currency)}
          className="text-[32px] font-extrabold tracking-tight text-text-primary"
        />
        <p className="text-xs text-text-secondary mt-0.5">
          of {formatAmount(debt.amount, debt.currency)} total
        </p>

        {/* Progress bar */}
        <div className="h-2.5 bg-surface-2 rounded-full overflow-hidden mt-3 mb-2">
          <motion.div
            className={cn('h-full rounded-full', isSettled ? 'bg-success' : isIOwe ? 'bg-danger' : 'bg-success')}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-text-secondary">
          <span>{pct}% paid</span>
          {!isSettled && (
            <span>{formatAmount(debt.remainingAmount, debt.currency)} left</span>
          )}
        </div>

        {debt.note && (
          <p className="mt-3 text-xs text-text-secondary italic">{debt.note}</p>
        )}
      </div>

      {/* Record payment button */}
      {!isSettled && (
        <Button onClick={() => setShowPayment(true)} className="w-full">
          <Plus size={16} className="mr-2" /> Record Payment
        </Button>
      )}

      {/* Payment history */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3 px-1">Payment History</h2>
        {debt.payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-secondary">
            <Receipt size={32} strokeWidth={1.5} />
            <p className="text-sm">No payments yet</p>
          </div>
        ) : (
          <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden divide-y divide-[var(--color-border-hairline)] border border-hairline">
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04 } },
              }}
            >
              {debt.payments.map((p) => (
                <motion.li
                  key={p.id}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
                  }}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-cat-mint)]/15 flex items-center justify-center shrink-0">
                    <Receipt size={16} className="text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {p.note ?? 'Payment'}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {format(new Date(p.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={cn('text-sm font-semibold shrink-0', isIOwe ? 'text-danger' : 'text-success')}>
                    {formatAmount(p.amount, debt.currency)}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        )}
      </div>

      <DebtPaymentSheet
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={loadDebt}
        debtId={debt.id}
        debtCurrency={debt.currency}
      />
    </div>
  )
}
