'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns'
import { SpendingDonut } from '@/components/reports/SpendingDonut'
import { IncomeExpenseArea } from '@/components/reports/IncomeExpenseArea'
import { formatAmount } from '@/lib/currency'

export const dynamic = 'force-dynamic'

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date())
  const [summary, setSummary] = useState<any>(null)
  const currency = 'USD' // TODO: use user.baseCurrency from context

  useEffect(() => {
    const from = startOfMonth(month).toISOString()
    const to = endOfMonth(month).toISOString()
    fetch(`/api/reports/summary?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(setSummary)
  }, [month])

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(m => addMonths(m, -1))} className="p-1 hover:bg-white/10 rounded">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium w-28 text-center">{format(month, 'MMMM yyyy')}</span>
          <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-1 hover:bg-white/10 rounded">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <p className="text-xs text-slate-400">Income</p>
              <p className="text-xl font-bold text-positive mt-1 tabular-nums">{formatAmount(summary.totalIncome, currency)}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-white/10">
              <p className="text-xs text-slate-400">Expense</p>
              <p className="text-xl font-bold text-negative mt-1 tabular-nums">{formatAmount(summary.totalExpense, currency)}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-white/10 mb-4">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Spending by Category</h2>
            <SpendingDonut data={summary.byCategory} currency={currency} />
          </div>

          <div className="p-4 rounded-xl bg-surface border border-white/10">
            <h2 className="text-sm font-medium text-slate-400 mb-3">Income vs Expense</h2>
            <IncomeExpenseArea data={summary.byDay} currency={currency} />
          </div>
        </>
      )}
    </div>
  )
}
