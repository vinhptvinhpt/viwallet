'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns'
import dynamic from 'next/dynamic'
import { formatAmount } from '@/lib/currency'
import Skeleton from '@/components/ui/Skeleton'
import AnimatedNumber from '@/components/motion/AnimatedNumber'

const SpendingDonut = dynamic(
  () => import('@/components/reports/SpendingDonut').then(m => ({ default: m.SpendingDonut })),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" /> }
)

const IncomeExpenseArea = dynamic(
  () => import('@/components/reports/IncomeExpenseArea').then(m => ({ default: m.IncomeExpenseArea })),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" /> }
)

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date())
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const currency = 'VND'

  useEffect(() => {
    setLoading(true)
    const from = startOfMonth(month).toISOString()
    const to = endOfMonth(month).toISOString()
    fetch(`/api/reports/summary?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(data => {
        setSummary(data)
        setLoading(false)
      })
  }, [month])

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-4">
      {/* Header + date range control */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Reports</h1>

        {/* Pill date control */}
        <div className="flex items-center gap-1 bg-surface-2 rounded-[var(--radius-pill)] px-1 py-1">
          <button
            onClick={() => setMonth(m => addMonths(m, -1))}
            className="p-1.5 rounded-[var(--radius-pill)] text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-text-primary w-28 text-center select-none">
            {format(month, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setMonth(m => addMonths(m, 1))}
            className="p-1.5 rounded-[var(--radius-pill)] text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Income / Expense summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
          <p className="text-xs text-text-secondary">Income</p>
          {loading ? (
            <Skeleton className="h-7 w-28 mt-1" />
          ) : (
            <AnimatedNumber
              value={(summary?.totalIncome ?? 0) / 100}
              format={n => formatAmount(Math.round(n * 100), currency)}
              className="text-xl font-bold text-success mt-1 tabular-nums block"
            />
          )}
        </div>
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
          <p className="text-xs text-text-secondary">Expense</p>
          {loading ? (
            <Skeleton className="h-7 w-28 mt-1" />
          ) : (
            <AnimatedNumber
              value={(summary?.totalExpense ?? 0) / 100}
              format={n => formatAmount(Math.round(n * 100), currency)}
              className="text-xl font-bold text-danger mt-1 tabular-nums block"
            />
          )}
        </div>
      </div>

      {/* Spending by Category donut */}
      <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Spending by Category</h2>
        {loading ? (
          <Skeleton className="h-[220px] w-full rounded-[var(--radius-md)]" />
        ) : (
          <SpendingDonut data={summary?.byCategory ?? []} currency={currency} />
        )}
      </div>

      {/* Income vs Expense area chart */}
      <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Income vs Expense</h2>
        {loading ? (
          <Skeleton className="h-[200px] w-full rounded-[var(--radius-md)]" />
        ) : (
          <IncomeExpenseArea data={summary?.byDay ?? []} currency={currency} />
        )}
      </div>
    </div>
  )
}
