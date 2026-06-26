'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Handshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Skeleton from '@/components/ui/Skeleton'
import { DebtCard } from '@/components/debts/DebtCard'
import { DebtCreateSheet } from '@/components/debts/DebtCreateSheet'
import AnimatedNumber from '@/components/motion/AnimatedNumber'
import { formatAmount } from '@/lib/currency'
import type { DebtSummary } from '@/components/debts/DebtCard'

function DebtCardSkeleton() {
  return (
    <div className="bg-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-4 border border-hairline space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

function SectionHeader({ label, total, currency }: { label: string; total: number; currency: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">{label}</h2>
      <AnimatedNumber
        value={total}
        format={(n) => formatAmount(Math.round(n), currency)}
        className="text-sm font-semibold text-text-primary"
      />
    </div>
  )
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetch('/api/debts')
      .then(r => r.json())
      .then(data => {
        setDebts(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(debt: DebtSummary) {
    setDebts(prev => [debt, ...prev])
  }

  const iOwe = debts.filter(d => d.direction === 'I_OWE')
  const owedToMe = debts.filter(d => d.direction === 'OWED_TO_ME')

  // Use the first debt's currency for section totals (most common case — single currency)
  const defaultCurrency = debts[0]?.currency ?? 'VND'

  const iOweTotalByCurrency = iOwe.reduce<Record<string, number>>((acc, d) => {
    acc[d.currency] = (acc[d.currency] ?? 0) + d.remainingAmount
    return acc
  }, {})
  const owedToMeTotalByCurrency = owedToMe.reduce<Record<string, number>>((acc, d) => {
    acc[d.currency] = (acc[d.currency] ?? 0) + d.remainingAmount
    return acc
  }, {})

  // Single-currency total for the AnimatedNumber header (pick first currency or default)
  const iOweDisplayCurrency = Object.keys(iOweTotalByCurrency)[0] ?? defaultCurrency
  const owedToMeDisplayCurrency = Object.keys(owedToMeTotalByCurrency)[0] ?? defaultCurrency
  const iOweTotal = iOweTotalByCurrency[iOweDisplayCurrency] ?? 0
  const owedToMeTotal = owedToMeTotalByCurrency[owedToMeDisplayCurrency] ?? 0

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Debts</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={16} className="mr-2" /> New Debt
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <DebtCardSkeleton />
          <DebtCardSkeleton />
          <DebtCardSkeleton />
        </div>
      ) : debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-secondary">
          <Handshake size={40} strokeWidth={1.5} />
          <p className="text-sm">No debts yet — track what you owe or are owed</p>
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
            Add a debt
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* I owe section */}
          {iOwe.length > 0 && (
            <section>
              <SectionHeader label="I owe" total={iOweTotal} currency={iOweDisplayCurrency} />
              <div className="flex flex-col gap-3">
                {iOwe.map((debt, i) => (
                  <Link key={debt.id} href={`/debts/${debt.id}`} className="block">
                    <DebtCard debt={debt} index={i} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Owed to me section */}
          {owedToMe.length > 0 && (
            <section>
              <SectionHeader label="Owed to me" total={owedToMeTotal} currency={owedToMeDisplayCurrency} />
              <div className="flex flex-col gap-3">
                {owedToMe.map((debt, i) => (
                  <Link key={debt.id} href={`/debts/${debt.id}`} className="block">
                    <DebtCard debt={debt} index={i} />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <DebtCreateSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={handleCreated}
      />
    </div>
  )
}
