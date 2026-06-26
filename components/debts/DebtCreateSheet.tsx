'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/shared/AmountInput'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'
import type { DebtSummary } from './DebtCard'

interface DebtCreateSheetProps {
  open: boolean
  onClose: () => void
  onSaved: (debt: DebtSummary) => void
}

export function DebtCreateSheet({ open, onClose, onSaved }: DebtCreateSheetProps) {
  const [direction, setDirection] = useState<'I_OWE' | 'OWED_TO_ME'>('I_OWE')
  const [counterparty, setCounterparty] = useState('')
  const [amount, setAmount] = useState(0)
  const [currency, setCurrency] = useState('VND')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const reducedMotion = useAppReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setDirection('I_OWE')
      setCounterparty('')
      setAmount(0)
      setCurrency('VND')
      setDueDate('')
      setNote('')
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
    if (!counterparty.trim() || !amount) return
    setSaving(true)
    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction,
          counterparty: counterparty.trim(),
          amount,
          currency,
          dueDate: dueDate || undefined,
          note: note || undefined,
        }),
      })
      if (res.ok) {
        const debt = await res.json()
        onSaved(debt)
        onClose()
      }
    } catch {
      // network failure — spinner clears via finally
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
            aria-labelledby="create-debt-title"
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
            <h2 id="create-debt-title" className="text-base font-semibold text-text-primary mb-4">
              New Debt
            </h2>

            {/* Direction toggle */}
            <div className="flex rounded-[var(--radius-md)] overflow-hidden border border-hairline mb-4">
              <button
                type="button"
                onClick={() => setDirection('I_OWE')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  direction === 'I_OWE'
                    ? 'bg-[var(--color-cat-coral)]/20 text-danger'
                    : 'bg-surface-2 text-text-secondary'
                }`}
              >
                I owe
              </button>
              <button
                type="button"
                onClick={() => setDirection('OWED_TO_ME')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  direction === 'OWED_TO_ME'
                    ? 'bg-[var(--color-cat-mint)]/20 text-success'
                    : 'bg-surface-2 text-text-secondary'
                }`}
              >
                Owed to me
              </button>
            </div>

            <div className="mb-3">
              <label htmlFor="debt-counterparty" className="text-xs text-text-secondary mb-1 block">
                {direction === 'I_OWE' ? 'Who do you owe?' : 'Who owes you?'}
              </label>
              <Input
                id="debt-counterparty"
                placeholder="e.g. Alice"
                value={counterparty}
                onChange={e => setCounterparty(e.target.value)}
                className="bg-surface-2 border-hairline"
              />
            </div>

            <AmountInput value={amount} onChange={setAmount} currency={currency} />

            <div className="mt-3">
              <label htmlFor="debt-currency" className="text-xs text-text-secondary mb-1 block">Currency</label>
              <Input
                id="debt-currency"
                placeholder="USD"
                value={currency}
                onChange={e => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                className="bg-surface-2 border-hairline uppercase"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="debt-due-date" className="text-xs text-text-secondary mb-1 block">Due date (optional)</label>
              <Input
                id="debt-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="bg-surface-2 border-hairline text-text-primary"
              />
            </div>

            <div className="mt-3">
              <label htmlFor="debt-note" className="text-xs text-text-secondary mb-1 block">Note (optional)</label>
              <Input
                id="debt-note"
                placeholder="Note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-surface-2 border-hairline"
              />
            </div>

            <div className="pb-4">
              <Button
                onClick={handleSave}
                disabled={saving || !counterparty.trim() || !amount}
                className="w-full mt-4"
              >
                {saving ? 'Creating...' : 'Create Debt'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
