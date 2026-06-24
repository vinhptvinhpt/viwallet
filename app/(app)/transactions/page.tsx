'use client'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import type { TransactionWithRelations, Wallet } from '@/types'

export const dynamic = 'force-dynamic'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetch('/api/transactions').then(r => r.json()).then(setTransactions)
    fetch('/api/wallets').then(r => r.json()).then(setWallets)
  }, [])

  function handleSave(tx: TransactionWithRelations) {
    setTransactions(prev => [tx, ...prev])
  }

  // Group by date
  const grouped = transactions.reduce<Record<string, TransactionWithRelations[]>>((acc, tx) => {
    const day = format(new Date(tx.date), 'yyyy-MM-dd')
    acc[day] = acc[day] ? [...acc[day], tx] : [tx]
    return acc
  }, {})

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-bold">Transactions</h1>
      </div>
      {Object.entries(grouped).map(([day, txs]) => (
        <div key={day}>
          <p className="px-4 py-2 text-xs text-slate-500 font-medium uppercase tracking-wide">
            {format(new Date(day), 'EEEE, MMM d')}
          </p>
          <div className="bg-surface rounded-xl mx-4 mb-2 divide-y divide-white/5">
            {txs.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
          </div>
        </div>
      ))}
      {transactions.length === 0 && (
        <p className="text-center text-slate-400 py-20">No transactions yet.</p>
      )}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 lg:bottom-8 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 transition-colors z-40"
      >
        <Plus size={24} />
      </button>
      {showModal && (
        wallets.length > 0 ? (
          <TransactionModal
            open={showModal}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            wallets={wallets}
          />
        ) : (
          <p className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-surface text-sm px-4 py-2 rounded-full border border-white/10">
            Add a wallet first in Settings
          </p>
        )
      )}
    </div>
  )
}
