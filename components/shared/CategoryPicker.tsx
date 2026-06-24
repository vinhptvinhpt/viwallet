'use client'
import { useEffect, useState } from 'react'
import type { Category } from '@/types'
import { cn } from '@/lib/utils'

interface CategoryPickerProps {
  value: string
  onChange: (categoryId: string) => void
  type: 'EXPENSE' | 'INCOME'
}

export function CategoryPicker({ value, onChange, type }: CategoryPickerProps) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch('/api/categories?type=' + type).then(r => r.json()).then(setCategories)
  }, [type])

  return (
    <div className="grid grid-cols-4 gap-2">
      {categories.map(cat => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(cat.id)}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-colors',
            value === cat.id ? 'bg-primary text-white' : 'bg-surface-2 text-slate-400 hover:bg-white/10'
          )}
        >
          <span className="text-lg">{cat.icon}</span>
          <span className="truncate w-full text-center">{cat.name}</span>
        </button>
      ))}
    </div>
  )
}
