import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { getGroupData } from '@/lib/split/group-actions'
import { GroupNav } from '@/components/split/GroupNav'
import { formatAmount } from '@/lib/currency'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function GroupBalancesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { id: groupId } = await params
  const data = await getGroupData(groupId, user.id)

  if (!data.success || !data.group || !data.currentMember) {
    if (data.error?.includes('Unauthorized')) redirect('/split')
    notFound()
  }

  const group = data.group
  const currentMember = data.currentMember
  const balances = data.balances ?? {}
  const suggestedTransfers = data.suggestedTransfers ?? []
  const currency = group.currency

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <GroupNav
        groupId={group.id}
        groupName={group.name}
        currency={group.currency}
        inviteToken={group.inviteToken}
      />

      {/* Suggested Settlements Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Suggested Settlements (Minimized)
          </h2>
          <Link href={`/split/${group.id}/settle`}>
            <Button size="sm" variant="outline" className="text-xs font-semibold">
              Record Other Payment
            </Button>
          </Link>
        </div>

        {suggestedTransfers.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-text-primary">All settled up!</h3>
            <p className="text-xs text-text-secondary">
              No outstanding debts remain between any members in this group.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestedTransfers.map((t, idx) => {
              const debtor = group.members.find((m: any) => m.id === t.fromMemberId)
              const creditor = group.members.find((m: any) => m.id === t.toMemberId)
              const isMeDebtor = t.fromMemberId === currentMember.id
              const isMeCreditor = t.toMemberId === currentMember.id

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
                      <span className={isMeDebtor ? 'font-bold text-rose-500' : 'text-text-primary'}>
                        {debtor?.displayName} {isMeDebtor ? '(You)' : ''}
                      </span>
                      <ArrowRight size={13} />
                      <span className={isMeCreditor ? 'font-bold text-emerald-500' : 'text-text-primary'}>
                        {creditor?.displayName} {isMeCreditor ? '(You)' : ''}
                      </span>
                    </div>
                    <p className="text-xl font-black text-text-primary mt-1">
                      {formatAmount(t.amount, currency)}
                    </p>
                  </div>

                  <Link
                    href={`/split/${group.id}/settle?payer=${t.fromMemberId}&payee=${t.toMemberId}&amount=${t.amount / 100}`}
                  >
                    <Button size="sm" className="w-full text-xs font-semibold">
                      Record Payment
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Individual Member Balances Section */}
      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            All Member Positions ({group.members.length})
          </h2>
        </div>

        <div className="divide-y divide-hairline rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] overflow-hidden">
          {group.members.map((member: any) => {
            const b = balances[member.id] ?? { paid: 0, owed: 0, net: 0 }
            const isMe = member.id === currentMember.id

            return (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary font-bold flex items-center justify-center text-sm">
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary">
                        {member.displayName} {isMe ? '(You)' : ''}
                      </h4>
                      {member.userId === null && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-text-secondary">
                          Unclaimed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Paid: {formatAmount(b.paid, currency)} · Share: {formatAmount(b.owed, currency)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-black ${
                      b.net > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : b.net < 0
                        ? 'text-rose-500'
                        : 'text-text-secondary'
                    }`}
                  >
                    {b.net > 0 ? '+' : ''}
                    {formatAmount(b.net, currency)}
                  </span>
                  <p className="text-[10px] text-text-secondary">
                    {b.net > 0 ? 'is owed' : b.net < 0 ? 'owes' : 'settled'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
