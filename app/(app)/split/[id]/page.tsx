import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/auth'
import { getGroupData } from '@/lib/split/group-actions'
import { GroupNav } from '@/components/split/GroupNav'
import { formatAmount } from '@/lib/currency'
import { format } from 'date-fns'
import { Receipt, Plus, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function GroupOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  const { id: groupId } = await params
  const data = await getGroupData(groupId, user.id)

  if (!data.success || !data.group || !data.currentMember) {
    if (data.error?.includes('Unauthorized')) {
      redirect('/split')
    }
    notFound()
  }

  const group = data.group
  const currentMember = data.currentMember
  const balances = data.balances ?? {}
  const suggestedTransfers = data.suggestedTransfers ?? []
  const currency = group.currency
  const myNet = balances[currentMember.id]?.net ?? 0

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      <GroupNav
        groupId={group.id}
        groupName={group.name}
        currency={group.currency}
        inviteToken={group.inviteToken}
      />

      {/* Hero Net Balance Banner */}
      <div className="p-6 rounded-3xl bg-surface border border-hairline shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Your Balance in this Group
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-black ${
                myNet > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : myNet < 0
                  ? 'text-rose-500'
                  : 'text-text-primary'
              }`}
            >
              {myNet > 0 ? '+' : ''}
              {formatAmount(myNet, currency)}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {myNet > 0
              ? 'You are owed money by your group members'
              : myNet < 0
              ? 'You owe money to your group members'
              : 'You are completely settled up with everyone!'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/split/${group.id}/settle`}>
            <Button variant="outline" size="sm" className="font-semibold">
              Settle Up
            </Button>
          </Link>
          <Link href={`/split/${group.id}/expenses/new`}>
            <Button size="sm" className="font-semibold gap-1.5">
              <Plus size={16} /> Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Minimized Settlement Plan (Who pays whom) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Settlement Plan (Fewest Transfers)
          </h2>
          <Link
            href={`/split/${group.id}/balances`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View all balances
          </Link>
        </div>

        {suggestedTransfers.length === 0 ? (
          <div className="p-4 rounded-2xl bg-surface border border-hairline flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={20} className="shrink-0" />
            <span className="text-xs font-bold">Everyone in the group is settled up!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {suggestedTransfers.map((t, idx) => {
              const debtor = group.members.find((m: any) => m.id === t.fromMemberId)
              const creditor = group.members.find((m: any) => m.id === t.toMemberId)
              const isMeDebtor = t.fromMemberId === currentMember.id
              const isMeCreditor = t.toMemberId === currentMember.id

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] flex items-center justify-between"
                >
                  <div className="text-xs">
                    <p className="font-semibold text-text-primary">
                      <span className={isMeDebtor ? 'font-bold text-rose-500' : ''}>
                        {debtor?.displayName ?? 'Member'}
                      </span>{' '}
                      pays{' '}
                      <span className={isMeCreditor ? 'font-bold text-emerald-500' : ''}>
                        {creditor?.displayName ?? 'Member'}
                      </span>
                    </p>
                    <p className="text-sm font-extrabold text-text-primary mt-0.5">
                      {formatAmount(t.amount, currency)}
                    </p>
                  </div>
                  <Link
                    href={`/split/${group.id}/settle?payer=${t.fromMemberId}&payee=${t.toMemberId}&amount=${t.amount / 100}`}
                  >
                    <Button size="sm" variant="outline" className="text-xs font-semibold h-8 px-2.5">
                      Record Pay
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Expenses List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Recent Expenses ({group.expenses.length})
          </h2>
          {group.expenses.length > 0 && (
            <Link
              href={`/split/${group.id}/expenses/new`}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <Plus size={13} /> Add expense
            </Link>
          )}
        </div>

        {group.expenses.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-surface border border-dashed border-hairline space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary mx-auto flex items-center justify-center">
              <Receipt size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">No expenses yet</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Add an expense to start splitting costs with the group.
              </p>
            </div>
            <Link href={`/split/${group.id}/expenses/new`}>
              <Button size="sm" className="font-semibold">
                Add First Expense
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-hairline rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)] overflow-hidden">
            {group.expenses.map((expense: any) => {
              const isPayer = expense.paidByMemberId === currentMember.id
              const myShare = expense.shares.find((s: any) => s.memberId === currentMember.id)
              const myShareAmount = myShare?.shareAmount ?? 0

              let userImpact = 0
              if (isPayer) {
                userImpact = expense.amount - myShareAmount
              } else {
                userImpact = -myShareAmount
              }

              return (
                <Link
                  key={expense.id}
                  href={`/split/${group.id}/expenses/${expense.id}/edit`}
                  className="p-4 flex items-center justify-between hover:bg-surface-2 transition-colors block group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                      <Receipt size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                        {expense.description}
                      </h4>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {expense.paidByMember?.displayName} paid {formatAmount(expense.amount, currency)} ·{' '}
                        {format(new Date(expense.expenseDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {userImpact > 0 && (
                      <>
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">you lent</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatAmount(userImpact, currency)}
                        </p>
                      </>
                    )}
                    {userImpact < 0 && (
                      <>
                        <p className="text-xs font-medium text-rose-500">you borrowed</p>
                        <p className="text-sm font-bold text-rose-500">
                          {formatAmount(userImpact, currency)}
                        </p>
                      </>
                    )}
                    {userImpact === 0 && (
                      <p className="text-xs font-medium text-text-secondary">not involved</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
