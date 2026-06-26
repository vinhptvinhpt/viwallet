'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { formatAmount } from '@/lib/currency'
import { format } from 'date-fns'
import AnimatedNumber from '@/components/motion/AnimatedNumber'
import Skeleton from '@/components/ui/Skeleton'
import IconTile from '@/components/shared/IconTile'
import { getCategoryIcon } from '@/components/shared/categoryIcon'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import type { Trip, TransactionWithRelations } from '@/types'

type TripWithTransactions = Trip & {
  transactions: TransactionWithRelations[]
  totalSpent: number
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip] = useState<TripWithTransactions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/trips/${id}`)
      .then(r => r.json())
      .then(data => {
        setTrip(data)
        setLoading(false)
      })
  }, [id])

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-5 space-y-4">
        {/* Back link skeleton */}
        <Skeleton className="h-4 w-24" />
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        {/* Total spent card */}
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5 space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-10 w-36" />
        </div>
        {/* Transaction skeletons */}
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden divide-y divide-[var(--color-border-hairline)]">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="w-10 h-10 rounded-[var(--radius-md)] shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="p-6 text-text-secondary text-sm text-center">
        Trip not found.
      </div>
    )
  }

  const currency = trip.baseCurrency

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Cover / Hero ── */}
      {trip.coverImage ? (
        <div className="relative h-44 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={trip.coverImage}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5">
            <h1 className="text-2xl font-bold text-white">{trip.name}</h1>
            {trip.endDate && (
              <p className="text-white/70 text-sm mt-0.5">
                {format(new Date(trip.startDate), 'MMM d')} — {format(new Date(trip.endDate), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
      ) : null}

      <div className="p-5 space-y-4">
        {/* ── Back link ── */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={15} /> Back to Trips
        </Link>

        {/* ── Title (when no cover) ── */}
        {!trip.coverImage && (
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-[var(--radius-md)] shrink-0 flex items-center justify-center"
              style={{ background: 'var(--color-primary-muted)', color: 'var(--color-primary)' }}
            >
              <MapPin size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{trip.name}</h1>
              <p className="text-text-secondary text-sm mt-0.5">
                {format(new Date(trip.startDate), 'MMM d')}
                {trip.endDate
                  ? ` — ${format(new Date(trip.endDate), 'MMM d, yyyy')}`
                  : ' — ongoing'}
              </p>
            </div>
          </div>
        )}

        {/* ── Total Spent card ── */}
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5">
          <p className="text-sm font-medium text-text-secondary">Total Spent</p>
          <AnimatedNumber
            value={trip.totalSpent / 100}
            format={(n) => formatAmount(Math.round(n * 100), currency)}
            className="text-[32px] font-extrabold tracking-tight text-text-primary mt-1"
          />
          <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">{currency}</p>
        </div>

        {/* ── Transactions ── */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3 px-1">Transactions</h2>
          <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] overflow-hidden divide-y divide-[var(--color-border-hairline)]">
            {trip.transactions.length === 0 ? (
              <p className="text-center text-text-secondary py-12 text-sm">
                No transactions in this trip.
              </p>
            ) : (
              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
              >
                {trip.transactions.map((tx: TransactionWithRelations) => (
                  <motion.li
                    key={tx.id}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
                    }}
                  >
                    <TransactionRow tx={tx} />
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
