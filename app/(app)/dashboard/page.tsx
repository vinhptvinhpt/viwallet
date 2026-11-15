import { redirect } from 'next/navigation'
import { startOfMonth, endOfMonth } from 'date-fns'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DashboardView } from '@/components/dashboard/DashboardView'

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [rawWallets, rawBudgets, rawTransactions, monthTxs] = await Promise.all([
    prisma.wallet.findMany({
      where: { userId: user.id, archived: false },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.budget.findMany({
      where: { userId: user.id },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 10,
      include: { wallet: true, category: true },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } },
      include: { category: { select: { name: true, icon: true, color: true } } },
    }),
  ])

  // Compute spent for budgets in-memory from month transactions
  const rawBudgetsWithSpent = rawBudgets.map(budget => {
    const spent = monthTxs
      .filter(t => t.type === 'EXPENSE' && (!budget.categoryId || t.categoryId === budget.categoryId))
      .reduce((sum, t) => sum + t.convertedAmount, 0)
    return { ...budget, spent }
  })

  // Compute month summary in-memory
  const totalIncome = monthTxs
    .filter(t => t.type === 'INCOME')
    .reduce((s, t) => s + t.convertedAmount, 0)
  const totalExpense = monthTxs
    .filter(t => t.type === 'EXPENSE')
    .reduce((s, t) => s + t.convertedAmount, 0)

  const catMap = new Map<string, { name: string; icon: string; color: string; amount: number }>()
  for (const tx of monthTxs.filter(t => t.type === 'EXPENSE')) {
    const key = tx.categoryId
    const existing = catMap.get(key)
    if (existing) {
      existing.amount += tx.convertedAmount
    } else {
      catMap.set(key, { ...tx.category, amount: tx.convertedAmount })
    }
  }
  const byCategory = [...catMap.values()].sort((a, b) => b.amount - a.amount).slice(0, 6)

  const initialSummary = { totalIncome, totalExpense, byCategory }

  return (
    <DashboardView
      initialWallets={JSON.parse(JSON.stringify(rawWallets))}
      initialBudgets={JSON.parse(JSON.stringify(rawBudgetsWithSpent))}
      initialTransactions={JSON.parse(JSON.stringify(rawTransactions))}
      initialSummary={initialSummary}
    />
  )
}
