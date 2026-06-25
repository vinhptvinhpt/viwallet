'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatAmount } from '@/lib/currency'

interface SpendingDonutProps {
  data: { name: string; icon: string; color: string; amount: number }[]
  currency: string
}

// Category token palette — cycles through design-system colors, falls back to the
// category's own hex color so legacy data still renders.
const CAT_TOKENS = [
  'var(--color-cat-mint)',
  'var(--color-cat-purple)',
  'var(--color-cat-amber)',
  'var(--color-cat-coral)',
]

function sliceFill(entry: { color: string }, index: number): string {
  // If the entry carries an explicit CSS-variable reference, honour it.
  if (entry.color?.startsWith('var(--color-cat-')) return entry.color
  // Otherwise cycle through the token palette.
  return CAT_TOKENS[index % CAT_TOKENS.length]
}

export function SpendingDonut({ data, currency }: SpendingDonutProps) {
  if (data.length === 0) return <p className="text-text-secondary text-center py-8">No expense data</p>

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={100}
            dataKey="amount"
            paddingAngle={2}
            isAnimationActive={true}
            animationDuration={800}
            animationBegin={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={sliceFill(entry, i)} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatAmount(Number(value ?? 0), currency)}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-hairline)',
              borderRadius: '12px',
              color: 'var(--color-text-primary)',
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend */}
      <div className="flex flex-col gap-2">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: sliceFill(entry, i) }}
              />
              <span className="text-xs text-on-hero/70">{entry.icon} {entry.name}</span>
            </div>
            <span className="text-xs font-medium text-on-hero">
              {formatAmount(entry.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
