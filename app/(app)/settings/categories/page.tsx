'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import IconTile from '@/components/shared/IconTile'
import Skeleton from '@/components/ui/Skeleton'
import { getCategoryIcon } from '@/components/shared/categoryIcon'
import { CategorySheet } from '@/components/categories/CategorySheet'
import type { Category } from '@/types'

export default function CategoriesSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    const [exp, inc] = await Promise.all([
      fetch('/api/categories?type=EXPENSE').then(r => r.json()),
      fetch('/api/categories?type=INCOME').then(r => r.json()),
    ])
    setCategories([...exp, ...inc])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleSaved(saved: Category) {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? Existing transactions using this category will keep their data.`)) return
    setDeletingId(cat.id)
    try {
      await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
      setCategories(prev => prev.filter(c => c.id !== cat.id))
    } finally {
      setDeletingId(null)
    }
  }

  function openCreate() { setEditing(null); setSheetOpen(true) }
  function openEdit(cat: Category) { setEditing(cat); setSheetOpen(true) }

  const expense = categories.filter(c => c.type === 'EXPENSE')
  const income = categories.filter(c => c.type === 'INCOME')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Back to Settings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Categories</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-medium rounded-[var(--radius-pill)] active:scale-[0.97] transition-transform"
        >
          <Plus size={15} /> New
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(2)].map((_, s) => (
            <div key={s}>
              <Skeleton className="h-4 w-24 mb-3" />
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-surface rounded-[var(--radius-lg)]">
                    <Skeleton className="w-10 h-10 rounded-[var(--radius-md)]" />
                    <Skeleton className="h-4 flex-1" />
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
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{label}</p>
              <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden divide-y divide-[var(--color-border-hairline)]">
                {items.map(cat => {
                  const isSystem = cat.userId === null
                  return (
                    <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                      <IconTile icon={getCategoryIcon(cat.icon)} color={cat.color} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{cat.name}</p>
                        {isSystem && (
                          <p className="text-xs text-text-secondary">System</p>
                        )}
                      </div>
                      {!isSystem && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-2 rounded-[var(--radius-md)] text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                            aria-label={`Edit ${cat.name}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            disabled={deletingId === cat.id}
                            className="p-2 rounded-[var(--radius-md)] text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                            aria-label={`Delete ${cat.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                {items.length === 0 && (
                  <p className="text-sm text-text-secondary text-center py-6">No {label.toLowerCase()} categories yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CategorySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={handleSaved}
        editing={editing}
      />
    </div>
  )
}
