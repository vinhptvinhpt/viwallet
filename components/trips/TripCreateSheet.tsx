'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'
import type { Trip } from '@/types'

const CURRENCIES = ['VND', 'USD', 'EUR', 'GBP', 'JPY', 'KRW', 'THB', 'SGD', 'AUD']

interface TripCreateSheetProps {
  open: boolean
  onClose: () => void
  onCreated: (trip: Trip) => void
}

export function TripCreateSheet({ open, onClose, onCreated }: TripCreateSheetProps) {
  const [name, setName] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('VND')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reducedMotion = useAppReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setBaseCurrency('VND')
      setStartDate(new Date().toISOString().split('T')[0])
      setEndDate('')
      setError(null)
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
    if (open) panelRef.current?.focus()
  }, [open])

  async function handleSave() {
    if (!name.trim()) { setError('Trip name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          baseCurrency,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
        }),
      })
      if (res.ok) {
        const trip = await res.json()
        onCreated(trip)
        onClose()
      } else {
        setError('Failed to create trip. Please try again.')
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
            aria-labelledby="trip-create-title"
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 z-50 bg-surface rounded-t-[var(--radius-lg)] p-5 max-h-[90vh] overflow-y-auto outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
            drag={reducedMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => { if (info.offset.y > 120) onClose() }}
          >
            <h2 id="trip-create-title" className="text-base font-semibold text-text-primary mb-4">
              New Trip
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Trip name</label>
                <Input
                  placeholder="e.g. Tokyo 2026"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-surface-2 border-hairline"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Base currency</label>
                <select
                  value={baseCurrency}
                  onChange={e => setBaseCurrency(e.target.value)}
                  className="w-full bg-surface-2 border border-hairline rounded-lg px-3 py-2 text-sm text-text-primary"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Start date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-surface-2 border-hairline text-text-primary"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">End date (optional)</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-surface-2 border-hairline text-text-primary"
                />
              </div>

              {error && <p className="text-xs text-danger">{error}</p>}
            </div>

            <div className="pb-4">
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="w-full mt-4"
              >
                {saving ? 'Creating...' : 'Create Trip'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
