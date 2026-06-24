'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { formatAmount } from '@/lib/currency'
import type { Trip, TransactionWithRelations } from '@/types'

export const dynamic = 'force-dynamic'

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  type TripWithTransactions = Trip & { transactions: TransactionWithRelations[]; totalSpent: number }
  const [trip, setTrip] = useState<TripWithTransactions | null>(null)

  useEffect(() => {
    fetch(`/api/trips/${id}`).then(r => r.json()).then(setTrip)
  }, [id])

  if (!trip) return <div className="p-6 text-slate-400">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="p-6">
        <Link href="/trips" className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm">
          <ArrowLeft size={16} /> Back to Trips
        </Link>
        <h1 className="text-2xl font-bold">{trip.name}</h1>
        <p className="text-slate-400 text-sm mt-1">{trip.baseCurrency}</p>
        <div className="mt-4 p-4 rounded-xl bg-surface border border-white/10">
          <p className="text-slate-400 text-sm">Total Spent</p>
          <p className="text-3xl font-bold mt-1">{formatAmount(trip.totalSpent, trip.baseCurrency)}</p>
        </div>
      </div>
      <div>
        {trip.transactions.map((tx: TransactionWithRelations) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
        {trip.transactions.length === 0 && (
          <p className="text-center text-slate-400 py-12">No transactions in this trip.</p>
        )}
      </div>
    </div>
  )
}
