'use client'

import { useEffect, useState } from 'react'
import { Wallet } from '@/types'
import { formatAmount } from '@/lib/currency'
import { WalletModal } from '@/components/wallets/WalletModal'
import { Button } from '@/components/ui/button'
import { PlusIcon, PencilIcon } from 'lucide-react'

export default function WalletsSettingsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)

  async function fetchWallets() {
    setLoading(true)
    try {
      const res = await fetch('/api/wallets')
      const data = await res.json()
      setWallets(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallets()
  }, [])

  function openCreate() {
    setEditingWallet(null)
    setModalOpen(true)
  }

  function openEdit(wallet: Wallet) {
    setEditingWallet(wallet)
    setModalOpen(true)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Wallets</h1>
        <Button onClick={openCreate} size="sm">
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Wallet
        </Button>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : wallets.length === 0 ? (
        <p className="text-slate-400">No wallets yet. Create one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {wallets.map((wallet) => (
            <li
              key={wallet.id}
              className="flex items-center justify-between rounded-lg bg-surface-2 border border-white/10 px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{wallet.name}</span>
                <span className="text-sm text-slate-400">
                  {formatAmount(wallet.currentBalance, wallet.currency)} · {wallet.currency}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openEdit(wallet)}
                aria-label={`Edit ${wallet.name}`}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <WalletModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        wallet={editingWallet}
        onSuccess={fetchWallets}
      />
    </div>
  )
}
