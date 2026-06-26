'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import IconTile from '@/components/shared/IconTile'
import Skeleton from '@/components/ui/Skeleton'
import { getCategoryIcon } from '@/components/shared/categoryIcon'
import type { Category } from '@/types'

export default function CategoriesSettingsPage() {
  const [expense, setExpense] = useState<Category[]>([])
  const [income, setIncome] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/categories?type=EXPENSE').then(r => r.json()),
      fetch('/api/categories?type=INCOME').then(r => r.json()),
    ]).then(([exp, inc]) => {
      setExpense(exp)
      setIncome(inc)
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Back to Settings
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Categories</h1>

      {loading ? (
        <div className="space-y-6">
          {[...Array(2)].map((_, s) => (
            <div key={s}>
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="grid grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3 bg-surface rounded-[var(--radius-md)]">
                    <Skeleton className="w-9 h-9 rounded-[var(--radius-md)]" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {[{ label: 'Expense', items: expense }, { label: 'Income', items: income }].map(({ label, items }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">{label}</p>
              <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
                <div className="grid grid-cols-4 gap-3">
                  {items.map(cat => (
                    <div
                      key={cat.id}
                      className="flex flex-col items-center gap-2 p-3 rounded-[var(--radius-md)] bg-surface-2"
                    >
                      <IconTile icon={getCategoryIcon(cat.icon)} color={cat.color} size={36} />
                      <span className="text-xs text-text-secondary text-center leading-tight truncate w-full text-center">
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
