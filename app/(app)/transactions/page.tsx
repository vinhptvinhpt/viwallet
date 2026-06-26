'use client'
import { useEffect, useState, useMemo } from 'react'
import { Plus, X, Wallet as WalletIcon } from 'lucide-react'
import { format, getDay } from 'date-fns'
import { motion } from 'motion/react'
import { TransactionRow } from '@/components/transactions/TransactionRow'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { FilterSheet } from '@/components/transactions/FilterSheet'
import PillToggle from '@/components/ui/PillToggle'
import { Input } from '@/components/ui/input'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/shared/EmptyState'
import { formatAmount } from '@/lib/currency'
import type { TransactionWithRelations, Wallet } from '@/types'

// Week starts on Monday (0=Mon … 6=Sun)
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function WeeklyBarsCard({ transactions }: { transactions: TransactionWithRelations[] }) {
  // Map getDay() (0=Sun) to Mon-first index
  const dayIndex = (d: Date) => {
    const raw = getDay(d) // 0 Sun, 1 Mon … 6 Sat
    return raw === 0 ? 6 : raw - 1 // 0=Mon … 6=Sun
  }

  const totals = useMemo(() => {
    const sums = Array(7).fill(0)
    for (const tx of transactions) {
      if (tx.type === 'EXPENSE') {
        sums[dayIndex(new Date(tx.date))] += tx.amount
      }
    }
    return sums
  }, [transactions])

  const max = Math.max(...totals, 1)
  const peakIdx = totals.indexOf(max)
  const currency = transactions.find(t => t.type === 'EXPENSE')?.currency ?? 'VND'

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4 mx-4 mb-4">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Spending this week
      </p>
      <div className="flex items-end gap-1 h-16">
        {totals.map((val, i) => {
          const height = max === 0 ? 0 : Math.max(4, Math.round((val / max) * 56))
          const isPeak = i === peakIdx && val > 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-sm transition-all duration-500 ${
                  isPeak ? 'bg-primary' : 'bg-primary-soft'
                }`}
                style={{ height }}
              />
              <span
                className={`text-[9px] font-medium ${
                  isPeak ? 'text-primary' : 'text-text-secondary'
                }`}
              >
                {WEEKDAYS[i]}
              </span>
            </div>
          )
        })}
      </div>
      {max > 1 && (
        <p className="text-xs text-text-secondary mt-2 text-right">
          Peak: {WEEKDAYS[peakIdx]} · {formatAmount(max, currency)}
        </p>
      )}
    </div>
  )
}

function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-10 h-10 rounded-[var(--radius-md)] shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  )
}

const FILTER_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})

  useEffect(() => {
    const params = new URLSearchParams(activeFilters)
    Promise.all([
      fetch(`/api/transactions?${params}`).then(r => r.json()),
      fetch('/api/wallets').then(r => r.json()),
    ]).then(([txs, ws]) => {
      setTransactions(txs)
      setWallets(ws)
      setLoading(false)
    })
  }, [activeFilters])

  function handleSave(tx: TransactionWithRelations) {
    setTransactions(prev => [tx, ...prev])
  }

  // Filter by type
  const filtered = useMemo(() =>
    typeFilter === 'ALL'
      ? transactions
      : transactions.filter(tx => tx.type === typeFilter),
    [transactions, typeFilter]
  )

  // Group by date
  const grouped = useMemo(() =>
    filtered.reduce<Record<string, TransactionWithRelations[]>>((acc, tx) => {
      const day = format(new Date(tx.date), 'yyyy-MM-dd')
      acc[day] = acc[day] ? [...acc[day], tx] : [tx]
      return acc
    }, {}),
    [filtered]
  )

  function handleRemoveFilter(key: string) {
    setActiveFilters(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleApplyFilters(params: Record<string, string>) {
    setActiveFilters(params)
  }

  const filterChips = Object.entries(activeFilters).filter(([k]) => k !== 'limit' && k !== 'offset')

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* ── Header ── */}
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Transactions</h1>

        {/* Search input and filters button */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search transactions..."
            value={activeFilters.q || ''}
            onChange={e => setActiveFilters(prev => ({ ...prev, q: e.target.value }))}
            className="bg-surface-2 border-hairline flex-1"
          />
          <button
            onClick={() => setFilterSheetOpen(true)}
            className="px-4 py-2 bg-surface-2 border border-hairline rounded-[var(--radius-md)] text-sm font-medium text-text-primary hover:bg-surface-2/80 transition-colors"
          >
            Filters
          </button>
        </div>

        {/* Active filters chips */}
        {filterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filterChips.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full"
              >
                <span>{key}: {value}</span>
                <button
                  onClick={() => handleRemoveFilter(key)}
                  className="hover:text-primary/70"
                  aria-label={`Remove ${key} filter`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <PillToggle
          options={FILTER_OPTIONS}
          value={typeFilter}
          onChange={setTypeFilter}
        />
      </div>

      {/* ── Weekly Bar Chart ── */}
      {loading ? (
        <div className="mx-4 mb-4 bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4">
          <Skeleton className="h-3 w-36 mb-3" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <WeeklyBarsCard transactions={transactions} />
      )}

      {/* ── Transaction list ── */}
      {loading ? (
        <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] mx-4 mb-4 overflow-hidden divide-y divide-[var(--color-border-hairline)]">
          {[...Array(5)].map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={WalletIcon}
          title={Object.keys(activeFilters).length > 0 || typeFilter !== 'ALL' ? 'No matching transactions' : 'No transactions yet'}
          subtitle={Object.keys(activeFilters).length > 0 || typeFilter !== 'ALL' ? 'Try adjusting your filters.' : 'Tap + to record your first transaction.'}
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {Object.entries(grouped).map(([day, txs]) => (
            <motion.div
              key={day}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
              }}
            >
              <p className="px-5 py-2 text-xs text-text-secondary font-semibold uppercase tracking-wide">
                {format(new Date(day), 'EEEE, MMM d')}
              </p>
              <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] mx-4 mb-3 overflow-hidden divide-y divide-[var(--color-border-hairline)]">
                {txs.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── FAB ── */}
      <motion.button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-6 lg:bottom-8 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[var(--shadow-elevated)] z-40"
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        aria-label="Add transaction"
      >
        <Plus size={24} />
      </motion.button>

      {/* ── Modal / no-wallet guard ── */}
      {showModal && (
        wallets.length > 0 ? (
          <TransactionModal
            open={showModal}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            wallets={wallets}
          />
        ) : (
          <p className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-surface text-sm px-4 py-2 rounded-full border border-white/10 text-text-primary z-50">
            Add a wallet first in Settings
          </p>
        )
      )}

      {/* ── Filter Sheet ── */}
      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onApply={handleApplyFilters}
        wallets={wallets}
      />
    </div>
  )
}
