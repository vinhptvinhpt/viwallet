'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'
import type { Wallet } from '@/types'

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  onApply: (params: Record<string, string>) => void
  wallets?: Wallet[]
}

interface FilterState {
  q: string
  minAmount: string
  maxAmount: string
  categoryIds: string
  walletId: string
  type: string
  from: string
  to: string
}

const TYPE_OPTIONS = [
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Debt/Loan', value: 'DEBT_LOAN' },
]

const CATEGORY_OPTIONS = [
  { id: 'food', name: 'Food', icon: '🍽️' },
  { id: 'transport', name: 'Transport', icon: '🚗' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️' },
  { id: 'utilities', name: 'Utilities', icon: '💡' },
  { id: 'health', name: 'Health', icon: '🏥' },
]

export function FilterSheet({ open, onClose, onApply, wallets = [] }: FilterSheetProps) {
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    minAmount: '',
    maxAmount: '',
    categoryIds: '',
    walletId: '',
    type: '',
    from: '',
    to: '',
  })

  const reducedMotion = useAppReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
  }, [open])

  function handleApply() {
    const params: Record<string, string> = {}
    if (filters.q) params.q = filters.q
    if (filters.minAmount) params.minAmount = filters.minAmount
    if (filters.maxAmount) params.maxAmount = filters.maxAmount
    if (filters.categoryIds) params.categoryIds = filters.categoryIds
    if (filters.walletId) params.walletId = filters.walletId
    if (filters.type) params.type = filters.type
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to
    onApply(params)
    onClose()
  }

  function toggleCategory(id: string) {
    const ids = filters.categoryIds.split(',').filter(Boolean)
    const idx = ids.indexOf(id)
    if (idx > -1) {
      ids.splice(idx, 1)
    } else {
      ids.push(id)
    }
    setFilters(prev => ({ ...prev, categoryIds: ids.join(',') }))
  }

  function toggleType(value: string) {
    setFilters(prev => ({
      ...prev,
      type: prev.type === value ? '' : value
    }))
  }

  function handleReset() {
    setFilters({
      q: '',
      minAmount: '',
      maxAmount: '',
      categoryIds: '',
      walletId: '',
      type: '',
      from: '',
      to: '',
    })
  }

  const hasActiveFilters = Object.values(filters).some(v => v)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-sheet-title"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-[var(--radius-lg)] p-5 max-h-[90vh] overflow-y-auto outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 300, damping: 30 }
            }
            drag={reducedMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => { if (info.offset.y > 120) onClose() }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="filter-sheet-title" className="text-base font-semibold text-text-primary">
                Filters
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-surface-2 rounded-[var(--radius-md)] text-text-secondary"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search text */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-2 block font-medium">Search</label>
              <Input
                placeholder="Search notes..."
                value={filters.q}
                onChange={e => setFilters(prev => ({ ...prev, q: e.target.value }))}
                className="bg-surface-2 border-hairline"
              />
            </div>

            {/* Amount range */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-2 block font-medium">Amount range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={e => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="bg-surface-2 border-hairline flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={e => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="bg-surface-2 border-hairline flex-1"
                />
              </div>
            </div>

            {/* Category chips */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-2 block font-medium">Categories</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(cat => {
                  const isSelected = filters.categoryIds.split(',').includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-surface-2 text-text-primary hover:bg-surface-2/80'
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Type pills */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-2 block font-medium">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => toggleType(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      filters.type === opt.value
                        ? 'bg-primary text-white'
                        : 'bg-surface-2 text-text-primary hover:bg-surface-2/80'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet select */}
            {wallets.length > 0 && (
              <div className="mb-4">
                <label className="text-xs text-text-secondary mb-2 block font-medium">Wallet</label>
                <select
                  value={filters.walletId}
                  onChange={e => setFilters(prev => ({ ...prev, walletId: e.target.value }))}
                  className="w-full bg-surface-2 border border-hairline rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">All wallets</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date range */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-2 block font-medium">Date range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.from}
                  onChange={e => setFilters(prev => ({ ...prev, from: e.target.value }))}
                  className="bg-surface-2 border-hairline flex-1 text-text-primary"
                />
                <Input
                  type="date"
                  value={filters.to}
                  onChange={e => setFilters(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-surface-2 border-hairline flex-1 text-text-primary"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pb-4 flex gap-2">
              {hasActiveFilters && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 mt-4"
                >
                  Reset
                </Button>
              )}
              <Button
                onClick={handleApply}
                className={hasActiveFilters ? 'flex-1 mt-4' : 'w-full mt-4'}
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
