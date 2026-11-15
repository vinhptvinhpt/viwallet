import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserSplitGroups } from '@/lib/split/group-actions'
import { GroupCard } from '@/components/split/GroupCard'
import { DebtsSummaryCard } from '@/components/split/DebtsSummaryCard'
import { CreateGroupModal } from '@/components/split/CreateGroupModal'
import { formatAmount } from '@/lib/currency'
import { Users } from 'lucide-react'

export default async function SplitHubPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const groupsResult = await getUserSplitGroups(user.id)
  const groups = groupsResult.success && groupsResult.groups ? groupsResult.groups : []

  // Fetch 1-on-1 personal debts
  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
  })

  const iOweDebts = debts.filter((d) => d.direction === 'I_OWE' && d.status === 'OPEN')
  const owedToMeDebts = debts.filter((d) => d.direction === 'OWED_TO_ME' && d.status === 'OPEN')
  const defaultCurrency = debts[0]?.currency ?? user.baseCurrency ?? 'USD'

  const iOweTotal = iOweDebts.reduce((sum, d) => sum + d.remainingAmount, 0)
  const owedToMeTotal = owedToMeDebts.reduce((sum, d) => sum + d.remainingAmount, 0)

  // Aggregate net balance across all split groups by currency
  const netByCurrency: Record<string, number> = {}
  for (const g of groups) {
    netByCurrency[g.currency] = (netByCurrency[g.currency] ?? 0) + g.myBalance
  }

  const currencies = Object.keys(netByCurrency)

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Split & Debts
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Cost-sharing groups and personal IOUs in one place.
          </p>
        </div>
        <CreateGroupModal />
      </div>

      {/* Net Summary Cards */}
      {currencies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currencies.map((curr) => {
            const net = netByCurrency[curr]
            const isPositive = net > 0
            const isNegative = net < 0

            return (
              <div
                key={curr}
                className="p-5 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Net Balance ({curr})
                  </p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-surface-2 text-text-secondary">
                    Groups
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`text-2xl sm:text-3xl font-black ${
                      isPositive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isNegative
                        ? 'text-rose-500'
                        : 'text-text-primary'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {formatAmount(net, curr)}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {isPositive
                    ? 'Overall, others owe you in this currency'
                    : isNegative
                    ? 'Overall, you owe others in this currency'
                    : 'You are all settled up across these groups'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Groups Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Your Shared Groups ({groups.length})
          </h2>
        </div>

        {groups.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-surface border border-dashed border-hairline space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary mx-auto flex items-center justify-center">
              <Users size={28} />
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="text-base font-bold text-text-primary">No split groups yet</h3>
              <p className="text-xs text-text-secondary mt-1">
                Create a group for your housemates, travel companions, or a shared dinner to split bills evenly or unevenly.
              </p>
            </div>
            <CreateGroupModal />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {groups.map((group: any) => (
              <GroupCard
                key={group.id}
                id={group.id}
                name={group.name}
                currency={group.currency}
                memberCount={group.memberCount}
                myBalance={group.myBalance}
                myRole={group.myRole}
              />
            ))}
          </div>
        )}
      </div>

      {/* 1-on-1 Debts Summary Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Personal 1-on-1 Balances
          </h2>
        </div>
        <DebtsSummaryCard
          iOweTotal={iOweTotal}
          owedToMeTotal={owedToMeTotal}
          currency={defaultCurrency}
          openCount={debts.filter((d) => d.status === 'OPEN').length}
        />
      </div>
    </div>
  )
}
