'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'
import { getCategoryIcon } from '@/components/shared/categoryIcon'
import type { Category } from '@/types'

const ICON_OPTIONS = [
  'utensils', 'coffee', 'shopping-bag', 'shopping-cart', 'car', 'bus', 'train', 'plane',
  'home', 'tv', 'smartphone', 'laptop', 'heart-pulse', 'pill', 'dumbbell', 'book',
  'graduation-cap', 'music', 'gamepad-2', 'scissors', 'shirt', 'gift', 'baby', 'paw-print',
  'bolt', 'droplets', 'wifi', 'wrench', 'briefcase', 'trending-up', 'circle-dollar-sign', 'circle-dot',
]

const COLOR_OPTIONS = [
  '#F08A7C', '#FBC54D', '#5DD6A8', '#7C6FE8', '#60A5FA', '#F472B6',
  '#34D399', '#FB923C', '#A78BFA', '#38BDF8', '#94A3B8', '#E24B4A',
]

interface CategorySheetProps {
  open: boolean
  onClose: () => void
  onSaved: (category: Category) => void
  editing?: Category | null
}

export function CategorySheet({ open, onClose, onSaved, editing }: CategorySheetProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('circle-dot')
  const [color, setColor] = useState('#7C6FE8')
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reducedMotion = useAppReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name)
        setIcon(editing.icon)
        setColor(editing.color)
        setType(editing.type as 'EXPENSE' | 'INCOME')
      } else {
        setName('')
        setIcon('circle-dot')
        setColor('#7C6FE8')
        setType('EXPENSE')
      }
      setError(null)
    }
  }, [open, editing])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  async function handleSave() {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon, color, type }),
      })
      if (res.ok) {
        const saved = await res.json()
        onSaved(saved)
        onClose()
      } else {
        setError('Failed to save. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const PreviewIcon = getCategoryIcon(icon)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog" aria-modal="true" aria-labelledby="cat-sheet-title"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-[var(--radius-lg)] p-5 max-h-[92vh] overflow-y-auto outline-none"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
            drag={reducedMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => { if (info.offset.y > 120) onClose() }}
          >
            <h2 id="cat-sheet-title" className="text-base font-semibold text-text-primary mb-4">
              {editing ? 'Edit Category' : 'New Category'}
            </h2>

            {/* Preview */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-surface-2 rounded-[var(--radius-md)]">
              <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + '33' }}>
                <PreviewIcon size={20} style={{ color }} />
              </div>
              <span className="text-sm font-medium text-text-primary">{name || 'Preview'}</span>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-1 block">Name</label>
              <Input
                placeholder="Category name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-surface-2 border-hairline"
              />
            </div>

            {/* Type — only for new categories */}
            {!editing && (
              <div className="mb-4">
                <label className="text-xs text-text-secondary mb-2 block">Type</label>
                <div className="flex bg-surface-2 rounded-[var(--radius-pill)] p-1">
                  {(['EXPENSE', 'INCOME'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-[var(--radius-pill)] transition-colors duration-100 ${
                        type === t ? 'bg-hero text-on-hero' : 'text-text-secondary'
                      }`}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full transition-transform active:scale-90"
                    style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : undefined, outlineOffset: color === c ? '2px' : undefined }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {/* Icon */}
            <div className="mb-4">
              <label className="text-xs text-text-secondary mb-2 block">Icon</label>
              <div className="grid grid-cols-8 gap-2">
                {ICON_OPTIONS.map(ic => {
                  const Ic = getCategoryIcon(ic)
                  return (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-[var(--radius-md)] flex items-center justify-center transition-colors duration-100 ${
                        icon === ic ? 'bg-primary/20 text-primary' : 'bg-surface-2 text-text-secondary hover:bg-primary-soft'
                      }`}
                      aria-label={ic}
                    >
                      <Ic size={18} />
                    </button>
                  )
                })}
              </div>
            </div>

            {error && <p className="text-xs text-danger mb-3">{error}</p>}

            <div className="pb-4">
              <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
