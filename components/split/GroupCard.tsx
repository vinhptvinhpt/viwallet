import Link from 'next/link'
import { Users, ChevronRight } from 'lucide-react'
import { formatAmount } from '@/lib/currency'

interface GroupCardProps {
  id: string
  name: string
  currency: string
  memberCount: number
  myBalance: number // in cents
  myRole: string
}

export function GroupCard({
  id,
  name,
  currency,
  memberCount,
  myBalance,
  myRole,
}: GroupCardProps) {
  const isOwed = myBalance > 0
  const owes = myBalance < 0
  const isSettled = myBalance === 0

  return (
    <Link
      href={`/split/${id}`}
      className="block p-4 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] hover:border-primary/40 transition-all active:scale-[0.99] group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center text-primary font-bold text-lg group-hover:scale-105 transition-transform">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors">
                {name}
              </h3>
              {myRole === 'ADMIN' && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-text-secondary">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
              <Users size={13} /> {memberCount} {memberCount === 1 ? 'member' : 'members'} · {currency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            {isOwed && (
              <>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">You are owed</p>
                <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  +{formatAmount(myBalance, currency)}
                </p>
              </>
            )}
            {owes && (
              <>
                <p className="text-xs font-semibold text-rose-500">You owe</p>
                <p className="text-sm font-extrabold text-rose-500">
                  {formatAmount(myBalance, currency)}
                </p>
              </>
            )}
            {isSettled && (
              <>
                <p className="text-xs font-medium text-text-secondary">Settled up</p>
                <p className="text-sm font-bold text-text-secondary">{formatAmount(0, currency)}</p>
              </>
            )}
          </div>
          <ChevronRight size={18} className="text-text-secondary group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  )
}
