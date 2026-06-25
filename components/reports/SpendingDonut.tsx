'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatAmount } from '@/lib/currency'

interface SpendingDonutProps {
  data: { name: string; icon: string; color: string; amount: number }[]
  currency: string
}

export function SpendingDonut({ data, currency }: SpendingDonutProps) {
  if (data.length === 0) return <p className="text-slate-400 text-center py-8">No expense data</p>

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          dataKey="amount"
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatAmount(Number(value ?? 0), currency)} />
        <Legend
          formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
