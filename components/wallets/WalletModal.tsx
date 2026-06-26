'use client'

import { useState } from 'react'
import { Wallet } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WalletModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet?: Wallet | null
  onSuccess?: () => void
}

export function WalletModal({ open, onOpenChange, wallet, onSuccess }: WalletModalProps) {
  const [name, setName] = useState(wallet?.name ?? '')
  const [currency, setCurrency] = useState(wallet?.currency ?? 'VND')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (wallet) {
        await fetch(`/api/wallets/${wallet.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, currency }),
        })
      } else {
        await fetch('/api/wallets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, currency, initialBalance: 0 }),
        })
      }
      onOpenChange(false)
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{wallet ? 'Edit Wallet' : 'Add Wallet'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wallet-name">Name</Label>
            <Input
              id="wallet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cash, Checking"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wallet-currency">Currency</Label>
            <Input
              id="wallet-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="USD"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {wallet ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
