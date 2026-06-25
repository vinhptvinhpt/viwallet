'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { formatAmount } from '@/lib/currency'

interface IncomeExpenseAreaProps {
  data: { date: string; income: number; expense: number }[]
  currency: string
}

export function IncomeExpenseArea({ data, currency }: IncomeExpenseAreaProps) {
  if (data.length === 0) return <p className="text-slate-400 text-center py-8">No data for this period</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'MMM d')} tick={{ fill: '#94A3B8', fontSize: 11 }} />
        <YAxis tickFormatter={v => formatAmount(v, currency)} tick={{ fill: '#94A3B8', fontSize: 11 }} width={70} />
        <Tooltip formatter={(v) => formatAmount(Number(v ?? 0), currency)} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)' }} />
        <Area type="monotone" dataKey="income" stroke="#22C55E" fill="url(#income)" strokeWidth={2} name="Income" />
        <Area type="monotone" dataKey="expense" stroke="#EF4444" fill="url(#expense)" strokeWidth={2} name="Expense" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
