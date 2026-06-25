'use client'
import { useEffect, useState } from 'react'
import { formatAmount } from '@/lib/currency'
import { BudgetCard } from '@/components/budgets/BudgetCard'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { SpendingDonut } from '@/components/reports/SpendingDonut'
import { startOfMonth, endOfMonth } from 'date-fns'
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
    })
  }, [])

  const netWorth = wallets
    .filter(w => !w.excludeFromTotal)
    .reduce((sum: number, w) => sum + w.currentBalance, 0)

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Net Worth */}
      <div className="p-6 rounded-2xl bg-surface border border-white/10">
        <p className="text-slate-400 text-sm">Net Worth</p>
        <p className="text-4xl font-bold mt-1 tabular-nums">{formatAmount(netWorth, currency)}</p>
        {summary && (
          <div className="flex gap-6 mt-3">
            <span className="text-sm text-positive">↑ {formatAmount(summary.totalIncome, currency)}</span>
            <span className="text-sm text-negative">↓ {formatAmount(summary.totalExpense, currency)}</span>
          </div>
        )}
      </div>

      {/* Spending Donut */}
      {summary?.byCategory && summary.byCategory.length > 0 && (
        <div className="p-4 rounded-xl bg-surface border border-white/10">
          <h2 className="text-sm font-medium text-slate-400 mb-2">This Month</h2>
          <SpendingDonut data={summary.byCategory} currency={currency} />
        </div>
      )}

      {/* Budget Status */}
      {budgets.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Budgets</h2>
          <div className="flex flex-col gap-3">
            {budgets.slice(0, 3).map(b => <BudgetCard key={b.id} budget={b} />)}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Recent Transactions</h2>
        <div className="bg-surface rounded-xl border border-white/10 divide-y divide-white/5">
          {transactions.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
          {transactions.length === 0 && (
            <p className="text-center text-slate-400 py-8 text-sm">No transactions yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
