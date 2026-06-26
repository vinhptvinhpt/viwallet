'use client'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryPicker } from '@/components/shared/CategoryPicker'
import type { Budget } from '@/types'

interface BudgetModalProps {
  open: boolean
  onClose: () => void
  onSave: (budget: Budget) => void
}

export function BudgetModal({ open, onClose, onSave }: BudgetModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'LIMIT' | 'ENVELOPE'>('LIMIT')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('VND')
  const [categoryId, setCategoryId] = useState('')
  const [alertThreshold, setAlertThreshold] = useState(80)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const amountCents = Math.round(parseFloat(amount) * 100)
    if (!name || !amountCents) return
    setSaving(true)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          amount: amountCents,
          currency,
          categoryId: categoryId || null,
          period: 'MONTHLY',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          rollover: false,
          alertThreshold,
        }),
      })
      if (res.ok) {
        const budget = await res.json()
        onSave(budget)
        onClose()
        setName('')
        setAmount('')
        setCategoryId('')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="bg-surface border-white/10 rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Budget</SheetTitle>
        </SheetHeader>
        <div className="flex gap-2 mt-4 mb-2 px-4">
          {(['LIMIT', 'ENVELOPE'] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t ? 'bg-primary text-white' : 'bg-surface-2 text-slate-400'
              }`}
            >{t === 'LIMIT' ? 'Spending Limit' : 'Envelope'}</button>
          ))}
        </div>
        <div className="px-4 mt-3">
          <Input
            placeholder="Budget name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-surface-2 border-white/10"
          />
        </div>
        <div className="px-4 mt-3 flex gap-2">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-surface-2 border-white/10 flex-1"
          />
          <Input
            placeholder="USD"
            value={currency}
            onChange={e => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
            className="bg-surface-2 border-white/10 w-20"
            maxLength={3}
          />
        </div>
        <div className="mt-4 px-4">
          <CategoryPicker value={categoryId} onChange={setCategoryId} type="EXPENSE" />
        </div>
        <div className="mt-3 px-4">
          <label className="text-xs text-slate-400 mb-1 block">Alert at {alertThreshold}%</label>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={alertThreshold}
            onChange={e => setAlertThreshold(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div className="px-4 pb-4">
          <Button
            onClick={handleSave}
            disabled={saving || !name || !amount}
            className="w-full mt-4"
          >
            {saving ? 'Saving...' : 'Save Budget'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
