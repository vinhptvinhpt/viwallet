'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Check, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UnclaimedMember {
  id: string
  displayName: string
}

interface InviteClaimViewProps {
  groupId: string
  groupName: string
  currency: string
  token: string
  creatorName: string
  unclaimedMembers: UnclaimedMember[]
  currentUserDisplayName: string
}

export function InviteClaimView({
  groupId,
  groupName,
  currency,
  token,
  creatorName,
  unclaimedMembers,
  currentUserDisplayName,
}: InviteClaimViewProps) {
  const router = useRouter()
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    unclaimedMembers[0]?.id ?? null
  )
  const [isNewMember, setIsNewMember] = useState(unclaimedMembers.length === 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    setError(null)

    try {
      const payload: any = { token }
      if (!isNewMember && selectedClaimId) {
        payload.claimMemberId = selectedClaimId
      }

      const res = await fetch('/api/split/invite/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to join group')
      }

      router.push(`/split/${data.group.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 my-8 space-y-6">
      <div className="p-8 rounded-3xl bg-surface border border-hairline shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-primary-soft text-primary mx-auto flex items-center justify-center font-bold text-2xl shadow-inner">
          {groupName.charAt(0).toUpperCase()}
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Group Invitation
          </span>
          <h1 className="text-2xl font-black text-text-primary mt-2">{groupName}</h1>
          <p className="text-xs text-text-secondary mt-1">
            Invited by <span className="font-semibold text-text-primary">{creatorName}</span> ·{' '}
            {currency}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold">
            {error}
          </div>
        )}

        {unclaimedMembers.length > 0 && (
          <div className="text-left space-y-3 pt-2 border-t border-hairline">
            <p className="text-xs font-bold text-text-secondary">
              Are you one of these members? Claim your name:
            </p>

            <div className="space-y-1.5">
              {unclaimedMembers.map((m) => {
                const isSelected = !isNewMember && selectedClaimId === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setIsNewMember(false)
                      setSelectedClaimId(m.id)
                    }}
                    className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-hairline bg-surface-2 text-text-primary hover:border-primary/40'
                    }`}
                  >
                    <span>I am {m.displayName}</span>
                    {isSelected && <Check size={16} />}
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => {
                  setIsNewMember(true)
                  setSelectedClaimId(null)
                }}
                className={`w-full p-3 rounded-xl text-left text-xs font-bold flex items-center justify-between border transition-all ${
                  isNewMember
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-hairline bg-surface-2 text-text-primary hover:border-primary/40'
                }`}
              >
                <span>None of these — join as &ldquo;{currentUserDisplayName}&rdquo;</span>
                {isNewMember && <Check size={16} />}
              </button>
            </div>
          </div>
        )}

        <Button onClick={handleJoin} disabled={loading} className="w-full font-bold h-11 text-sm gap-2">
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Joining group...
            </>
          ) : (
            <>
              Join Group <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
