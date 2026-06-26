'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/shared/AmountInput'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'
import type { GoalSummary } from './GoalCard'

interface GoalCreateSheetProps {
  open: boolean
  onClose: () => void
  onSaved: (goal: GoalSummary) => void
}

export function GoalCreateSheet({ open, onClose, onSaved }: GoalCreateSheetProps) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState(0)
  const [currency, setCurrency] = useState('VND')
  const [deadline, setDeadline] = useState('')
  const [icon, setIcon] = useState('target')
  const [color, setColor] = useState('#5DD6A8')
  const [saving, setSaving] = useState(false)

  const reducedMotion = useAppReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setTargetAmount(0)
      setCurrency('VND')
      setDeadline('')
      setIcon('target')
      setColor('#5DD6A8')
    }
  }, [open])

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

  async function handleSave() {
    if (!name.trim() || !targetAmount) return
    setSaving(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          targetAmount,
          currency,
          deadline: deadline || undefined,
          icon,
          color,
        }),
      })
      if (res.ok) {
        const goal = await res.json()
        onSaved({ ...goal, _count: { contributions: 0 } })
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

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
            aria-labelledby="create-goal-title"
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
            <h2 id="create-goal-title" className="text-base font-semibold text-text-primary mb-4">
              New Savings Goal
            </h2>

            <div className="mb-3">
              <label className="text-xs text-text-secondary mb-1 block">Goal name</label>
              <Input
                placeholder="e.g. Emergency fund"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-surface-2 border-hairline"
              />
            </div>

            <AmountInput value={targetAmount} onChange={setTargetAmount} currency={currency} />

            <div className="mt-3">
              <label className="text-xs text-text-secondary mb-1 block">Currency</label>
              <Input
                placeholder="USD"
                value={currency}
                onChange={e => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                className="bg-surface-2 border-hairline uppercase"
              />
            </div>

            <div className="mt-3">
              <label className="text-xs text-text-secondary mb-1 block">Deadline (optional)</label>
              <Input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="bg-surface-2 border-hairline text-text-primary"
              />
            </div>

            <div className="mt-3">
              <label className="text-xs text-text-secondary mb-1 block">Icon (Lucide name)</label>
              <input
                type="text"
                value={icon}
                onChange={e => setIcon(e.target.value)}
                placeholder="e.g. target"
                className="w-full bg-surface-2 border border-hairline rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-primary outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="mt-3">
              <label className="text-xs text-text-secondary mb-1 block">Color</label>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="h-9 w-full cursor-pointer rounded-[var(--radius-md)] border border-hairline bg-surface-2"
              />
            </div>

            <div className="pb-4">
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim() || !targetAmount}
                className="w-full mt-4"
              >
                {saving ? 'Creating...' : 'Create Goal'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
