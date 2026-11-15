'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Member {
  id: string
  displayName: string
}

interface SettleFormProps {
  groupId: string
  currency: string
  members: Member[]
  currentMemberId: string
}

export function SettleForm({
  groupId,
  currency,
  members,
  currentMemberId,
}: SettleFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const defaultPayer = searchParams.get('payer') || currentMemberId
  const defaultPayee =
    searchParams.get('payee') ||
    members.find((m) => m.id !== defaultPayer)?.id ||
    ''
  const defaultAmount = searchParams.get('amount') || ''

  const [payerMemberId, setPayerMemberId] = useState(defaultPayer)
  const [payeeMemberId, setPayeeMemberId] = useState(defaultPayee)
  const [amountStr, setAmountStr] = useState(defaultAmount)
  const [settlementDate, setSettlementDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (payerMemberId === payeeMemberId) {
      setError('Payer and payee must be different members')
      return
    }

    const num = parseFloat(amountStr)
    if (isNaN(num) || num <= 0) {
      setError('Amount must be a positive number')
      return
    }

    const amountCents = Math.round(num * 100)
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/split/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          payerMemberId,
          payeeMemberId,
          amount: amountCents,
          settlementDate,
          note: note.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record settlement')
      }

      router.push(`/split/${groupId}/balances`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/split/${groupId}/balances`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
        <h1 className="text-lg font-bold text-text-primary">Record a Settlement</h1>
        <div className="w-16" />
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-5 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Payer (Who paid?)
              </label>
              <select
                value={payerMemberId}
                onChange={(e) => setPayerMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary font-semibold"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} {m.id === currentMemberId ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Payee (Who received?)
              </label>
              <select
                value={payeeMemberId}
                onChange={(e) => setPayeeMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary font-semibold"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} {m.id === currentMemberId ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-base font-bold focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Bank transfer, Cash, Venmo"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href={`/split/${groupId}/balances`}>
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={
              loading ||
              !amountStr ||
              parseFloat(amountStr) <= 0 ||
              payerMemberId === payeeMemberId
            }
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Recording...
              </>
            ) : (
              'Record Settlement'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
