'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/shared/AmountInput'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'
import SuccessCheck from '@/components/motion/SuccessCheck'
import { haptic } from '@/lib/haptics'

interface Wallet {
  id: string
  name: string
  currency: string
}

interface DebtPaymentSheetProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  debtId: string
  debtCurrency: string
}

export function DebtPaymentSheet({
  open,
  onClose,
  onSuccess,
  debtId,
  debtCurrency,
}: DebtPaymentSheetProps) {
  const [amount, setAmount] = useState(0)
  const [walletId, setWalletId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const reducedMotion = useAppReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  // Load wallets once
  useEffect(() => {
    fetch('/api/wallets')
      .then(r => r.json())
      .then(data => setWallets(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  // Reset on open
  useEffect(() => {
    if (open) {
      setAmount(0)
      setWalletId('')
      setDate(new Date().toISOString().split('T')[0])
      setNote('')
    }
  }, [open])

  // Escape-to-close
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Focus management
  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
  }, [open])

  async function handleSave() {
    if (!amount) return
    setSaving(true)
    try {
      const res = await fetch(`/api/debts/${debtId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          walletId: walletId || undefined,
          date: new Date(date).toISOString(),
          note: note || undefined,
        }),
      })
      if (res.ok) {
        haptic()
        onSuccess()
        setSaved(true)
        setTimeout(() => { setSaved(false); onClose() }, 900)
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
            aria-labelledby="debt-payment-title"
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
            <h2 id="debt-payment-title" className="text-base font-semibold text-text-primary mb-4">
              Record Payment
            </h2>

            {/* Success feedback */}
            {saved && (
              <div className="flex justify-center py-4">
                <SuccessCheck show={saved} />
              </div>
            )}

            <AmountInput value={amount} onChange={setAmount} currency={debtCurrency} />

            {wallets.length > 0 && (
              <div className="mt-3">
                <label className="text-xs text-text-secondary mb-1 block">Deduct from wallet (optional)</label>
                <select
                  value={walletId}
                  onChange={e => setWalletId(e.target.value)}
                  className="w-full bg-surface-2 border border-hairline rounded-lg px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">— None —</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-3">
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-surface-2 border-hairline text-text-primary"
              />
            </div>

            <div className="mt-3">
              <Input
                placeholder="Note (optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="bg-surface-2 border-hairline"
              />
            </div>

            <div className="pb-4">
              <Button
                onClick={handleSave}
                disabled={saving || !amount}
                className="w-full mt-4"
              >
                {saving ? 'Saving...' : 'Record Payment'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
