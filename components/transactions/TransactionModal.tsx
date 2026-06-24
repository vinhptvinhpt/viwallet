'use client'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AmountInput } from '@/components/shared/AmountInput'
import { CategoryPicker } from '@/components/shared/CategoryPicker'
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-surface border-white/10 rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Transaction</SheetTitle>
        </SheetHeader>
        <div className="flex gap-2 mt-4 mb-2 px-4">
          {(['EXPENSE', 'INCOME'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t ? 'bg-primary text-white' : 'bg-surface-2 text-slate-400'
              }`}
            >{t}</button>
          ))}
        </div>
        <div className="px-4">
          <AmountInput value={amount} onChange={setAmount} currency={currency} />
        </div>
        {showExchangeRate && (
          <div className="mt-3 px-4">
            <label className="text-xs text-slate-400 mb-1 block">Exchange Rate (1 {currency} = ? {selectedWallet.currency})</label>
            <Input
              type="number"
              placeholder="Enter rate"
              onChange={e => setExchangeRate(parseFloat(e.target.value) || null)}
              className="bg-surface-2 border-white/10"
            />
          </div>
        )}
        <div className="mt-4 px-4">
          <CategoryPicker value={categoryId} onChange={setCategoryId} type={type} />
        </div>
        <div className="mt-3 px-4">
          <label className="text-xs text-slate-400 mb-1 block">Wallet</label>
          <select value={walletId} onChange={e => setWalletId(e.target.value)}
            className="w-full bg-surface-2 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
            {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
          </select>
        </div>
        <div className="mt-3 px-4">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-surface-2 border-white/10 text-white" />
        </div>
        <div className="mt-3 px-4">
          <Input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)}
            className="bg-surface-2 border-white/10" />
        </div>
        <div className="px-4 pb-4">
          <Button onClick={handleSave} disabled={saving || !amount || !categoryId} className="w-full mt-4">
            {saving ? 'Saving...' : 'Save Transaction'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
