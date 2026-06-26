'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/shared/AmountInput'
import { CategoryPicker } from '@/components/shared/CategoryPicker'
import { useAppReducedMotion } from '@/components/motion/useReducedMotion'
import SuccessCheck from '@/components/motion/SuccessCheck'
import PillToggle from '@/components/ui/PillToggle'
import { createClient } from '@/lib/supabase/client'
import { validateReceiptFiles } from '@/lib/attachments'
import { haptic } from '@/lib/haptics'
import type { Wallet, TransactionWithRelations } from '@/types'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  onSave: (tx: TransactionWithRelations) => void
  wallets: Wallet[]
}

const MODE_OPTIONS = [
  { label: 'Expense', value: 'EXPENSE' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Transfer', value: 'TRANSFER' },
]

export function TransactionModal({ open, onClose, onSave, wallets }: TransactionModalProps) {
  const [mode, setMode] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE')
  const [amount, setAmount] = useState(0)
  const [currency, setCurrency] = useState(wallets[0]?.currency ?? 'VND')
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Receipt state
  const [receiptFiles, setReceiptFiles] = useState<File[]>([])
  const [receiptError, setReceiptError] = useState<string | null>(null)

  // Transfer-specific state
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id ?? '')
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id ?? wallets[0]?.id ?? '')

  const reducedMotion = useAppReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current) }, [])

  // 1. Reset shared fields when mode changes to prevent cross-mode data bleed
  useEffect(() => {
    setAmount(0)
    setExchangeRate(null)
    setCategoryId('')
    setWalletId(wallets[0]?.id ?? '')
    setNote('')
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // 1b. Reset receipt state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setReceiptFiles([])
      setReceiptError(null)
    }
  }, [open])

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

  // Transfer-specific derived values
  const fromWallet = wallets.find(w => w.id === fromWalletId)
  const toWallet = wallets.find(w => w.id === toWalletId)
  const transferCurrenciesDiffer = !!(fromWallet && toWallet && fromWallet.currency !== toWallet.currency)
  const toAmount = transferCurrenciesDiffer && exchangeRate
    ? Math.round(amount * exchangeRate)
    : amount

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const result = validateReceiptFiles(files)
    if (!result.ok) {
      setReceiptError(result.error ?? 'Invalid files')
      setReceiptFiles([])
      e.target.value = ''
      return
    }
    setReceiptError(null)
    setReceiptFiles(files)
  }

  async function uploadReceipts(txnId: string, userId: string): Promise<string[]> {
    if (receiptFiles.length === 0) return []
    const supabase = createClient()
    const paths: string[] = []
    for (const file of receiptFiles) {
      const path = `${userId}/${txnId}/${crypto.randomUUID()}-${file.name}`
      const { error } = await supabase.storage.from('receipts').upload(path, file)
      if (!error) paths.push(path)
    }
    return paths
  }

  async function handleSave() {
    if (mode === 'TRANSFER') {
      if (!amount || !fromWalletId || !toWalletId || fromWalletId === toWalletId) return
      if (transferCurrenciesDiffer && !exchangeRate) return
      setSaving(true)
      try {
        const res = await fetch('/api/transfers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromWalletId,
            toWalletId,
            amount,
            toAmount,
            exchangeRate: transferCurrenciesDiffer ? exchangeRate : undefined,
            date: new Date(date).toISOString(),
            note: note || undefined,
          }),
        })
        if (res.ok) {
          haptic()
          setSaved(true)
          closeTimerRef.current = setTimeout(() => { setSaved(false); onClose() }, 900)
        }
      } finally {
        setSaving(false)
      }
      return
    }

    if (!amount || !categoryId || !walletId) return
    setSaving(true)
    try {
      const convertedAmount = exchangeRate ? Math.round(amount * exchangeRate) : amount
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId, categoryId, type: mode, amount, currency,
          exchangeRate, convertedAmount,
          date: new Date(date).toISOString(),
          note: note || null, photos: [], withPeople: [],
        }),
      })
      if (res.ok) {
        const tx = await res.json()

        // Upload receipts after transaction is created; if upload fails, tx still exists
        if (receiptFiles.length > 0) {
          try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const paths = await uploadReceipts(tx.id, user.id)
              if (paths.length > 0) {
                const patchRes = await fetch(`/api/transactions/${tx.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ photos: paths }),
                })
                if (patchRes.ok) {
                  const updated = await patchRes.json()
                  haptic()
                  onSave(updated)
                  setSaved(true)
                  closeTimerRef.current = setTimeout(() => { setSaved(false); onClose() }, 900)
                  return
                }
              }
            }
          } catch {
            // Upload failed — transaction still saved, just no photos
          }
        }

        haptic()
        onSave(tx)
        setSaved(true)
        setTimeout(() => { setSaved(false); onClose() }, 900)
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

            {/* Success feedback */}
            {saved && (
              <div className="flex justify-center py-4">
                <SuccessCheck show={saved} />
              </div>
            )}

            <div className="mb-4">
              <PillToggle
                options={MODE_OPTIONS}
                value={mode}
                onChange={v => setMode(v as 'EXPENSE' | 'INCOME' | 'TRANSFER')}
              />
            </div>

            {mode === 'TRANSFER' ? (
              <>
                <div className="mt-3">
                  <label className="text-xs text-text-secondary mb-1 block">From Wallet</label>
                  <select value={fromWalletId} onChange={e => setFromWalletId(e.target.value)}
                    className="w-full bg-surface-2 border border-hairline rounded-lg px-3 py-2 text-sm text-text-primary">
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
                  </select>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-text-secondary mb-1 block">To Wallet</label>
                  <select value={toWalletId} onChange={e => setToWalletId(e.target.value)}
                    className="w-full bg-surface-2 border border-hairline rounded-lg px-3 py-2 text-sm text-text-primary">
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
                  </select>
                </div>
                <div className="mt-3">
                  <AmountInput value={amount} onChange={setAmount} currency={fromWallet?.currency ?? 'VND'} />
                </div>
                {transferCurrenciesDiffer && (
                  <div className="mt-3">
                    <label className="text-xs text-text-secondary mb-1 block">
                      Exchange Rate (1 {fromWallet?.currency} = ? {toWallet?.currency})
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter rate"
                      onChange={e => setExchangeRate(parseFloat(e.target.value) || null)}
                      className="bg-surface-2 border-hairline"
                    />
                    {exchangeRate && (
                      <p className="text-xs text-text-secondary mt-1">
                        You will receive {toAmount} {toWallet?.currency}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <AmountInput value={amount} onChange={setAmount} currency={currency} />
                </div>
                {showExchangeRate && (
                  <div className="mt-3">
                    <label className="text-xs text-text-secondary mb-1 block">Exchange Rate (1 {currency} = ? {selectedWallet.currency})</label>
                    <Input
                      type="number"
                      placeholder="Enter rate"
                      onChange={e => setExchangeRate(parseFloat(e.target.value) || null)}
                      className="bg-surface-2 border-hairline"
                    />
                  </div>
                )}
                <div className="mt-4">
                  <CategoryPicker value={categoryId} onChange={setCategoryId} type={mode as 'EXPENSE' | 'INCOME'} />
                </div>
                <div className="mt-3">
                  <label className="text-xs text-text-secondary mb-1 block">Wallet</label>
                  <select value={walletId} onChange={e => setWalletId(e.target.value)}
                    className="w-full bg-surface-2 border border-hairline rounded-lg px-3 py-2 text-sm text-text-primary">
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
                  </select>
                </div>
              </>
            )}

            <div className="mt-3">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="bg-surface-2 border-hairline text-text-primary" />
            </div>
            <div className="mt-3">
              <Input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)}
                className="bg-surface-2 border-hairline" />
            </div>

            {/* Receipt file input — only for expense/income, not transfer */}
            {mode !== 'TRANSFER' && (
              <div className="mt-3">
                <label className="text-xs text-text-secondary mb-1 block">Add receipts</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReceiptChange}
                  className="w-full text-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius-md)] file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                {receiptError && (
                  <p className="text-xs text-destructive mt-1">{receiptError}</p>
                )}
                {receiptFiles.length > 0 && (
                  <p className="text-xs text-text-secondary mt-1">{receiptFiles.length} image{receiptFiles.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
            )}

            <div className="pb-4">
              <Button
                onClick={handleSave}
                disabled={
                  saving ||
                  !amount ||
                  (mode === 'TRANSFER'
                    ? !fromWalletId || !toWalletId || fromWalletId === toWalletId || (transferCurrenciesDiffer && !exchangeRate)
                    : !categoryId)
                }
                className="w-full mt-4"
              >
                {saving ? 'Saving...' : mode === 'TRANSFER' ? 'Transfer' : 'Save Transaction'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
