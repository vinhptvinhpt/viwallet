'use client'
import { useEffect, useState } from 'react'
import type { Category } from '@/types'
import { cn } from '@/lib/utils'
import { getCategoryIcon } from '@/components/shared/categoryIcon'

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
      {categories.map(cat => {
        const Ic = getCategoryIcon(cat.icon)
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-colors',
              value === cat.id ? 'bg-primary text-white' : 'bg-surface-2 text-text-secondary hover:bg-primary-soft'
            )}
          >
            <Ic size={20} />
            <span className="truncate w-full text-center">{cat.name}</span>
          </button>
        )
      })}
    </div>
  )
}
