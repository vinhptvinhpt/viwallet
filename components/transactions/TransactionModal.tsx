'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/shared/AmountInput'
import { CategoryPicker } from '@/components/shared/CategoryPicker'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'
import type { Wallet, TransactionWithRelations } from '@/types'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  onSave: (tx: TransactionWithRelations) => void
  wallets: Wallet[]
}

export function TransactionModal({ open, onClose, onSave, wallets }: TransactionModalProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [amount, setAmount] = useState(0)
  const [currency, setCurrency] = useState(wallets[0]?.currency ?? 'USD')
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const reducedMotion = useAppReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  // 2. Escape-to-close
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // 3. Body scroll lock
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // 4. Focus management — move focus into panel on open, trap Tab within it
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    // Focus the panel itself so screen-readers announce it
    panel.focus()

    function getFocusable(): HTMLElement[] {
      return Array.from(
        panel!.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.closest('[hidden]'))
    }

    function trapTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) { e.preventDefault(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    panel.addEventListener('keydown', trapTab)
    return () => panel.removeEventListener('keydown', trapTab)
  }, [open])

  const selectedWallet = wallets.find(w => w.id === walletId)
  const showExchangeRate = selectedWallet && selectedWallet.currency !== currency

  async function handleSave() {
    if (!amount || !categoryId || !walletId) return
    setSaving(true)
    try {
      const convertedAmount = exchangeRate ? Math.round(amount * exchangeRate) : amount
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId, categoryId, type, amount, currency,
          exchangeRate, convertedAmount,
          date: new Date(date).toISOString(),
          note: note || null, photos: [], withPeople: [],
        }),
      })
      if (res.ok) {
        const tx = await res.json()
        onSave(tx)
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
            aria-labelledby="tx-modal-title"
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
            <h2 id="tx-modal-title" className="text-base font-semibold text-text-primary mb-4">Add Transaction</h2>
            <div className="flex gap-2 mb-2">
              {(['EXPENSE', 'INCOME'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === t ? 'bg-primary text-white' : 'bg-surface-2 text-slate-400'
                  }`}
                >{t}</button>
              ))}
            </div>
            <div>
              <AmountInput value={amount} onChange={setAmount} currency={currency} />
            </div>
            {showExchangeRate && (
              <div className="mt-3">
                <label className="text-xs text-slate-400 mb-1 block">Exchange Rate (1 {currency} = ? {selectedWallet.currency})</label>
                <Input
                  type="number"
                  placeholder="Enter rate"
                  onChange={e => setExchangeRate(parseFloat(e.target.value) || null)}
                  className="bg-surface-2 border-white/10"
                />
              </div>
            )}
            <div className="mt-4">
              <CategoryPicker value={categoryId} onChange={setCategoryId} type={type} />
            </div>
            <div className="mt-3">
              <label className="text-xs text-slate-400 mb-1 block">Wallet</label>
              <select value={walletId} onChange={e => setWalletId(e.target.value)}
                className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
              </select>
            </div>
            <div className="mt-3">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="bg-surface-2 border-white/10 text-white" />
            </div>
            <div className="mt-3">
              <Input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)}
                className="bg-surface-2 border-white/10" />
            </div>
            <div className="pb-4">
              <Button onClick={handleSave} disabled={saving || !amount || !categoryId} className="w-full mt-4">
                {saving ? 'Saving...' : 'Save Transaction'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
