import { redirect, notFound } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { getGroupData } from '@/lib/split/group-actions'
import { GroupNav } from '@/components/split/GroupNav'
import { formatAmount } from '@/lib/currency'
import { format } from 'date-fns'
import {
  History,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle,
  UserPlus,
  Sparkles,
} from 'lucide-react'

export default async function GroupActivityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { id: groupId } = await params
  const data = await getGroupData(groupId, user.id)

  if (!data.success || !data.group) {
    if (data.error?.includes('Unauthorized')) redirect('/split')
    notFound()
  }

  const { group } = data
  const currency = group.currency
  const logs = group.activityLogs

  function renderActionDetails(log: any) {
    try {
      const details = JSON.parse(log.detailsJson)
      switch (log.actionType) {
        case 'EXPENSE_CREATED':
          return (
            <p className="text-xs text-text-secondary mt-0.5">
              Added &ldquo;{details.description}&rdquo; for{' '}
              <span className="font-bold text-text-primary">
                {formatAmount(details.amount, currency)}
              </span>
            </p>
          )
        case 'EXPENSE_UPDATED':
          return (
            <p className="text-xs text-text-secondary mt-0.5">
              Updated &ldquo;{details.newDescription}&rdquo; from{' '}
              <span className="line-through">{formatAmount(details.oldAmount, currency)}</span>{' '}
              to{' '}
              <span className="font-bold text-text-primary">
                {formatAmount(details.newAmount, currency)}
              </span>
            </p>
          )
        case 'EXPENSE_DELETED':
          return (
            <p className="text-xs text-text-secondary mt-0.5">
              Deleted &ldquo;{details.deletedDescription}&rdquo; ({formatAmount(details.deletedAmount, currency)})
            </p>
          )
        case 'SETTLEMENT_RECORDED': {
          const payer = group.members.find((m: any) => m.id === details.payerMemberId)
          const payee = group.members.find((m: any) => m.id === details.payeeMemberId)
          return (
            <p className="text-xs text-text-secondary mt-0.5">
              {payer?.displayName ?? 'Member'} paid {payee?.displayName ?? 'Member'}{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatAmount(details.amount, currency)}
              </span>
              {details.note ? ` (${details.note})` : ''}
            </p>
          )
        }
        case 'MEMBER_JOINED':
          return (
            <p className="text-xs text-text-secondary mt-0.5">
              {details.displayName} joined the group {details.claimed ? '(claimed placeholder)' : ''}
            </p>
          )
        case 'GROUP_CREATED':
          return (
            <p className="text-xs text-text-secondary mt-0.5">
              Group created by {details.creatorName} with currency {details.currency}
            </p>
          )
        default:
          return <p className="text-xs text-text-secondary mt-0.5">{log.actionType}</p>
      }
    } catch {
      return null
    }
  }

  function getActionIcon(type: string) {
    switch (type) {
      case 'EXPENSE_CREATED':
        return <PlusCircle size={17} className="text-primary" />
      case 'EXPENSE_UPDATED':
        return <Edit3 size={17} className="text-amber-500" />
      case 'EXPENSE_DELETED':
        return <Trash2 size={17} className="text-rose-500" />
      case 'SETTLEMENT_RECORDED':
        return <CheckCircle size={17} className="text-emerald-500" />
      case 'MEMBER_JOINED':
        return <UserPlus size={17} className="text-blue-500" />
      case 'GROUP_CREATED':
        return <Sparkles size={17} className="text-primary" />
      default:
        return <History size={17} className="text-text-secondary" />
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <GroupNav
        groupId={group.id}
        groupName={group.name}
        currency={group.currency}
        inviteToken={group.inviteToken}
      />

      <div className="space-y-3">
        <div className="px-1">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Audit Activity Feed ({logs.length})
          </h2>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-surface border border-hairline text-text-secondary text-xs">
            No activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-hairline rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] overflow-hidden">
            {logs.map((log: any) => (
              <div key={log.id} className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center shrink-0 mt-0.5">
                  {getActionIcon(log.actionType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-text-primary">
                      {log.actorMember?.displayName ?? 'System'}
                    </h4>
                    <span className="text-[10px] text-text-secondary whitespace-nowrap">
                      {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  {renderActionDetails(log)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
