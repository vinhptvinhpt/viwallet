'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CURRENCIES = ['USD', 'VND', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD']

export function CreateGroupModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [membersText, setMembersText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    const initialMemberNames = membersText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      const res = await fetch('/api/split/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          currency,
          initialMemberNames,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create group')
      }

      setOpen(false)
      setName('')
      setMembersText('')
      router.push(`/split/${data.group.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2 font-semibold">
        <Plus size={16} /> New Group
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-surface rounded-2xl border border-hairline shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary-soft flex items-center justify-center text-primary">
                  <Users size={18} />
                </div>
                <h2 className="text-lg font-bold text-text-primary">Create a Split Group</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apartment 4B, Trip to Da Nang"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Group Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Initial Members (optional, one per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Alice&#10;Bob&#10;Charlie"
                  value={membersText}
                  onChange={(e) => setMembersText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 border border-hairline text-text-primary text-sm focus:outline-none focus:border-primary resize-none"
                />
                <p className="text-[11px] text-text-secondary mt-1">
                  You can invite them later via an invite link.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !name.trim()}>
                  {loading ? (
                    <>
                      <Loader2 size={15} className="mr-2 animate-spin" /> Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
