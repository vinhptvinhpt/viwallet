'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { formatAmount } from '@/lib/currency'

interface IncomeExpenseAreaProps {
  data: { date: string; income: number; expense: number }[]
  currency: string
}

export function IncomeExpenseArea({ data, currency }: IncomeExpenseAreaProps) {
  if (data.length === 0) return <p className="text-text-secondary text-center py-8">No data for this period</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-hairline)" />
        <XAxis
          dataKey="date"
          tickFormatter={d => format(new Date(d), 'MMM d')}
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
        />
        <YAxis
          tickFormatter={v => formatAmount(v, currency)}
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
          width={70}
        />
        <Tooltip
          formatter={(v) => formatAmount(Number(v ?? 0), currency)}
          contentStyle={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border-hairline)',
            borderRadius: '12px',
            color: 'var(--color-text-primary)',
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="var(--color-success)"
          fill="url(#incomeGrad)"
          strokeWidth={2}
          name="Income"
          animationDuration={800}
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke="var(--color-danger)"
          fill="url(#expenseGrad)"
          strokeWidth={2}
          name="Expense"
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
