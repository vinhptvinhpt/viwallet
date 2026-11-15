'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, AlertCircle, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAmount } from '@/lib/currency'
import { calculateSplits, SplitMode } from '@/lib/split/calculator'

interface Member {
  id: string
  displayName: string
}

interface ExpenseFormProps {
  groupId: string
  currency: string
  members: Member[]
  currentMemberId: string
  initialData?: {
    id: string
    description: string
    amount: number // in cents
    paidByMemberId: string
    splitMode: SplitMode
    expenseDate: string
    shares: { memberId: string; shareAmount: number; rawSplitValue?: string | null }[]
  }
}

export function ExpenseForm({
  groupId,
  currency,
  members,
  currentMemberId,
  initialData,
}: ExpenseFormProps) {
  const router = useRouter()
  const isEditing = Boolean(initialData)

  const [description, setDescription] = useState(initialData?.description ?? '')
  // Store amount in display units (e.g. "50.00" or "50000")
  const [amountStr, setAmountStr] = useState(
    initialData ? (initialData.amount / 100).toFixed(2) : ''
  )
  const [paidByMemberId, setPaidByMemberId] = useState(
    initialData?.paidByMemberId ?? currentMemberId
  )
  const [splitMode, setSplitMode] = useState<SplitMode>(initialData?.splitMode ?? 'EQUAL')
  const [expenseDate, setExpenseDate] = useState(
    initialData
      ? new Date(initialData.expenseDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )

  // Selected members for EQUAL split
  const [selectedMembers, setSelectedMembers] = useState<string[]>(() => {
    if (initialData?.shares) {
      return initialData.shares.map((s) => s.memberId)
    }
    return members.map((m) => m.id)
  })

  // Values map for PERCENTAGE (%), SHARES (weights), EXACT (dollars/major units)
  const [splitValues, setSplitValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    if (initialData?.shares) {
      for (const s of initialData.shares) {
        if (initialData.splitMode === 'EXACT') {
          map[s.memberId] = (s.shareAmount / 100).toFixed(2)
        } else if (s.rawSplitValue) {
          map[s.memberId] = s.rawSplitValue
        }
      }
    }
    return map
  })

  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Parse amount in cents
  const totalAmountCents = useMemo(() => {
    const num = parseFloat(amountStr)
    if (isNaN(num) || num <= 0) return 0
    return Math.round(num * 100)
  }, [amountStr])

  // Live split calculation
  const splitComputation = useMemo(() => {
    if (totalAmountCents <= 0) return null

    try {
      if (splitMode === 'EQUAL') {
        if (selectedMembers.length === 0) return { error: 'Select at least one member' }
        const res = calculateSplits({
          amount: totalAmountCents,
          memberIds: selectedMembers,
          mode: 'EQUAL',
        })
        return { res, remainder: 0 }
      }

      if (splitMode === 'PERCENTAGE') {
        const numericValues: Record<string, number> = {}
        let sumPct = 0
        for (const m of members) {
          const val = parseFloat(splitValues[m.id] || '0')
          numericValues[m.id] = val
          sumPct += val
        }

        const pctDelta = Math.round((100 - sumPct) * 100) / 100
        if (Math.abs(pctDelta) > 0.05) {
          return { error: `Percentages sum to ${sumPct}%. Needs 100%. (${pctDelta > 0 ? `+${pctDelta}% remaining` : `${pctDelta}% excess`})` }
        }

        const res = calculateSplits({
          amount: totalAmountCents,
          memberIds: members.map((m) => m.id),
          mode: 'PERCENTAGE',
          values: numericValues,
        })
        return { res, remainder: 0 }
      }

      if (splitMode === 'SHARES') {
        const numericValues: Record<string, number> = {}
        let totalWeights = 0
        for (const m of members) {
          const val = parseInt(splitValues[m.id] || '1', 10)
          numericValues[m.id] = val > 0 ? val : 1
          totalWeights += numericValues[m.id]
        }
        const res = calculateSplits({
          amount: totalAmountCents,
          memberIds: members.map((m) => m.id),
          mode: 'SHARES',
          values: numericValues,
        })
        return { res, remainder: 0, totalWeights }
      }

      if (splitMode === 'EXACT') {
        const numericValues: Record<string, number> = {}
        let sumCents = 0
        for (const m of members) {
          const val = parseFloat(splitValues[m.id] || '0')
          const cents = Math.round(val * 100)
          numericValues[m.id] = cents
          sumCents += cents
        }

        const remainingCents = totalAmountCents - sumCents
        if (remainingCents !== 0) {
          return {
            error: `Exact sum (${formatAmount(sumCents, currency)}) does not match total (${formatAmount(totalAmountCents, currency)}). ${remainingCents > 0 ? `${formatAmount(remainingCents, currency)} remaining` : `${formatAmount(-remainingCents, currency)} over`}`,
            remainingCents,
          }
        }

        const res = calculateSplits({
          amount: totalAmountCents,
          memberIds: members.map((m) => m.id),
          mode: 'EXACT',
          values: numericValues,
        })
        return { res, remainder: 0 }
      }

      return null
    } catch (err: any) {
      return { error: err.message }
    }
  }, [totalAmountCents, splitMode, selectedMembers, splitValues, members, currency])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || totalAmountCents <= 0) return
    if (splitComputation?.error) {
      setError(splitComputation.error)
      return
    }

    setLoading(true)
    setError(null)

    // Build raw payload values
    const memberIds = splitMode === 'EQUAL' ? selectedMembers : members.map((m) => m.id)
    const payloadValues: Record<string, number> = {}

    if (splitMode === 'PERCENTAGE') {
      for (const m of members) payloadValues[m.id] = parseFloat(splitValues[m.id] || '0')
    } else if (splitMode === 'SHARES') {
      for (const m of members) payloadValues[m.id] = parseInt(splitValues[m.id] || '1', 10)
    } else if (splitMode === 'EXACT') {
      for (const m of members) payloadValues[m.id] = Math.round(parseFloat(splitValues[m.id] || '0') * 100)
    }

    try {
      const url = isEditing
        ? `/api/split/expenses/${initialData!.id}`
        : `/api/split/expenses`
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          description: description.trim(),
          amount: totalAmountCents,
          paidByMemberId,
          splitMode,
          expenseDate,
          memberIds,
          splitValues: Object.keys(payloadValues).length > 0 ? payloadValues : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save expense')
      }

      router.push(`/split/${groupId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!isEditing || !initialData) return
    if (!confirm('Are you sure you want to delete this expense? This action is recorded in the activity log.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/split/expenses/${initialData.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete expense')
      }
      router.push(`/split/${groupId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  function toggleEqualMember(id: string) {
    if (selectedMembers.includes(id)) {
      if (selectedMembers.length === 1) return // Keep at least one
      setSelectedMembers(selectedMembers.filter((m) => m !== id))
    } else {
      setSelectedMembers([...selectedMembers, id])
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/split/${groupId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft size={16} /> Cancel
        </Link>
        <h1 className="text-lg font-bold text-text-primary">
          {isEditing ? 'Edit Expense' : 'Add an Expense'}
        </h1>
        {isEditing ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
          >
            <Trash2 size={15} /> Delete
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Description & Amount */}
        <div className="p-5 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dinner at Pizza 4P's, Groceries, Hotel"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary"
            />
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
                Date
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Paid By
            </label>
            <select
              value={paidByMemberId}
              onChange={(e) => setPaidByMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName} {m.id === currentMemberId ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Split Modes */}
        <div className="p-5 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">
              Split Mode
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-surface-2 border border-hairline text-xs font-bold">
              {(['EQUAL', 'PERCENTAGE', 'SHARES', 'EXACT'] as SplitMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSplitMode(mode)}
                  className={`py-2 rounded-lg transition-colors capitalize ${
                    splitMode === mode
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {mode.toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Split Breakdown */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-text-secondary font-semibold px-1">
              <span>Member</span>
              <span>{splitMode === 'EQUAL' ? 'Included' : 'Share value'}</span>
            </div>

            <div className="divide-y divide-hairline rounded-xl border border-hairline overflow-hidden bg-surface-2/40">
              {members.map((m) => {
                const isSelected = selectedMembers.includes(m.id)
                const computedShareCents = splitComputation?.res?.shares?.[m.id] ?? 0

                return (
                  <div key={m.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      {splitMode === 'EQUAL' && (
                        <button
                          type="button"
                          onClick={() => toggleEqualMember(m.id)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'border-text-secondary/40 bg-surface'
                          }`}
                        >
                          {isSelected && <Check size={13} />}
                        </button>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {m.displayName}
                        </p>
                        {totalAmountCents > 0 && (
                          <p className="text-[11px] text-text-secondary">
                            Owes: {formatAmount(computedShareCents, currency)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {splitMode === 'EQUAL' && (
                        <span className="text-xs font-bold text-text-primary">
                          {isSelected ? formatAmount(computedShareCents, currency) : 'Excluded'}
                        </span>
                      )}

                      {splitMode === 'PERCENTAGE' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={splitValues[m.id] ?? ''}
                            onChange={(e) =>
                              setSplitValues({ ...splitValues, [m.id]: e.target.value })
                            }
                            className="w-16 px-2 py-1 rounded-lg bg-surface border border-hairline text-right text-xs font-bold text-text-primary"
                          />
                          <span className="text-xs text-text-secondary font-semibold">%</span>
                        </div>
                      )}

                      {splitMode === 'SHARES' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="1"
                            value={splitValues[m.id] ?? '1'}
                            onChange={(e) =>
                              setSplitValues({ ...splitValues, [m.id]: e.target.value })
                            }
                            className="w-16 px-2 py-1 rounded-lg bg-surface border border-hairline text-right text-xs font-bold text-text-primary"
                          />
                          <span className="text-xs text-text-secondary font-semibold">share</span>
                        </div>
                      )}

                      {splitMode === 'EXACT' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={splitValues[m.id] ?? ''}
                            onChange={(e) =>
                              setSplitValues({ ...splitValues, [m.id]: e.target.value })
                            }
                            className="w-24 px-2 py-1 rounded-lg bg-surface border border-hairline text-right text-xs font-bold text-text-primary"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Live Remainder Status Bar */}
            {splitComputation?.error && (
              <p className="text-xs font-semibold text-rose-500 mt-2 px-1">
                {splitComputation.error}
              </p>
            )}
            {!splitComputation?.error && totalAmountCents > 0 && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 px-1">
                ✓ Exact split balanced ({formatAmount(totalAmountCents, currency)})
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href={`/split/${groupId}`}>
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={
              loading ||
              !description.trim() ||
              totalAmountCents <= 0 ||
              Boolean(splitComputation?.error)
            }
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Saving...
              </>
            ) : isEditing ? (
              'Update Expense'
            ) : (
              'Save Expense'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
