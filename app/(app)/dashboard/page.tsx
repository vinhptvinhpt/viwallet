'use client'
import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { formatAmount } from '@/lib/currency'
import { SpendingDonut } from '@/components/reports/SpendingDonut'
import { startOfMonth, endOfMonth } from 'date-fns'
import AnimatedNumber from '@/components/motion/AnimatedNumber'
import Skeleton from '@/components/ui/Skeleton'
import IconTile from '@/components/shared/IconTile'
import { getCategoryIcon } from '@/components/shared/categoryIcon'
import type { Wallet, BudgetWithSpent, TransactionWithRelations } from '@/types'

interface ReportSummary {
  totalIncome: number
  totalExpense: number
  byCategory?: { name: string; icon: string; color: string; amount: number }[]
  byDay?: { date: string; income: number; expense: number }[]
}

export default function DashboardPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const currency = 'USD'

  useEffect(() => {
    const from = startOfMonth(new Date()).toISOString()
    const to = endOfMonth(new Date()).toISOString()

    Promise.all([
      fetch('/api/wallets').then(r => r.json()),
      fetch('/api/budgets').then(r => r.json()),
      fetch('/api/transactions?limit=10').then(r => r.json()),
      fetch(`/api/reports/summary?from=${from}&to=${to}`).then(r => r.json()),
    ]).then(([w, b, t, s]) => {
      setWallets(w)
      setBudgets(b)
      setTransactions(t)
      setSummary(s)
      setLoading(false)
    })
  }, [])

  const netWorth = wallets
    .filter(w => !w.excludeFromTotal)
    .reduce((sum: number, w) => sum + w.currentBalance, 0)

  // Top budget by spend percentage for the quick-stat card
  const topBudget = budgets.length > 0
    ? [...budgets].sort((a, b) => (b.spent / b.amount) - (a.spent / a.amount))[0]
    : null

  // Month spend from summary
  const monthSpend = summary?.totalExpense ?? 0
  const monthIncome = summary?.totalIncome ?? 0

  // Simple trend: income vs expense ratio this month
  const hasTrend = summary !== null && (monthIncome > 0 || monthSpend > 0)
  const trendPositive = monthIncome > monthSpend
  const trendDiff = monthIncome - monthSpend

  const baseCurrency = currency

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      {/* ── Total Balance Header ── */}
      <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5">
        <p className="text-sm font-medium text-text-secondary">Total Balance</p>

        {loading ? (
          <Skeleton className="h-10 w-48 mt-1" />
        ) : (
          <AnimatedNumber
            value={netWorth / 100}
            format={(n) => formatAmount(Math.round(n * 100), baseCurrency)}
            className="text-[34px] font-extrabold tracking-tight text-text-primary mt-1"
          />
        )}

        {hasTrend && !loading && (
          <div className="flex items-center gap-2 mt-3">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                trendPositive
                  ? 'bg-[var(--color-success)]/15 text-success'
                  : 'bg-[var(--color-danger)]/15 text-danger'
              }`}
            >
              {trendPositive ? '↑' : '↓'} {formatAmount(Math.abs(trendDiff), baseCurrency)} this month
            </span>
            <span className="text-xs text-text-secondary">
              +{formatAmount(monthIncome, baseCurrency)} in · -{formatAmount(monthSpend, baseCurrency)} out
            </span>
          </div>
        )}
      </div>

      {/* ── Hero Analytics Card ── */}
      <div className="bg-hero text-on-hero rounded-[var(--radius-lg)] p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-on-hero/50 mb-4">
          This Month
        </p>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[220px] w-full bg-white/10" />
            <Skeleton className="h-4 w-3/4 bg-white/10" />
            <Skeleton className="h-4 w-1/2 bg-white/10" />
          </div>
        ) : summary?.byCategory && summary.byCategory.length > 0 ? (
          <SpendingDonut data={summary.byCategory} currency={currency} />
        ) : (
          <p className="text-on-hero/50 text-sm text-center py-10">No spending data yet.</p>
        )}

        {/* Quick-stat row inside hero card */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            {/* Month spend stat */}
            <div className="bg-white/8 rounded-[var(--radius-md)] p-3">
              <p className="text-xs text-on-hero/50 mb-1">Spent</p>
              <p className="text-base font-bold text-on-hero tabular-nums">
                {formatAmount(monthSpend, baseCurrency)}
              </p>
            </div>

            {/* Top budget stat */}
            {topBudget ? (
              <div className="bg-white/8 rounded-[var(--radius-md)] p-3">
                <p className="text-xs text-on-hero/50 mb-1 truncate">{topBudget.name}</p>
                <div className="flex items-end gap-1">
                  <p className="text-base font-bold text-on-hero tabular-nums">
                    {Math.min(100, Math.round((topBudget.spent / topBudget.amount) * 100))}%
                  </p>
                  <p className="text-xs text-on-hero/50 mb-0.5">used</p>
                </div>
                {/* Mini progress bar */}
                <div className="h-1 bg-white/15 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-cat-mint)] transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.round((topBudget.spent / topBudget.amount) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white/8 rounded-[var(--radius-md)] p-3">
                <p className="text-xs text-on-hero/50 mb-1">Earned</p>
                <p className="text-base font-bold text-on-hero tabular-nums">
                  {formatAmount(monthIncome, baseCurrency)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Recent Transactions ── */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-3 px-1">Recent Transactions</h2>
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden divide-y divide-[var(--color-border-hairline)]">
          {loading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="w-10 h-10 rounded-[var(--radius-md)] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </>
          ) : transactions.length === 0 ? (
            <p className="text-center text-text-secondary py-8 text-sm">No transactions yet.</p>
          ) : (
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
            >
              {transactions.map((tx) => {
                const isIncome = tx.type === 'INCOME'
                return (
                  <motion.li
                    key={tx.id}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
                    }}
                    className="flex items-center justify-between py-3 px-4"
                  >
                    <div className="flex items-center gap-3">
                      <IconTile icon={getCategoryIcon(tx.category.icon)} color={tx.category.color} size={40} />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{tx.category.name}</p>
                        <p className="text-xs text-text-secondary">{tx.note || tx.wallet.name}</p>
                      </div>
                    </div>
                    <p
                      className={`font-semibold tabular-nums text-sm ${
                        isIncome ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
                    </p>
                  </motion.li>
                )
              })}
            </motion.ul>
          )}
        </div>
      </div>
    </div>
  )
}
