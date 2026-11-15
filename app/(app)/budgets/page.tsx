import { redirect } from 'next/navigation'
import { startOfMonth, endOfMonth } from 'date-fns'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BudgetsView } from '@/components/budgets/BudgetsView'

export default async function BudgetsPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [rawBudgets, monthExpenses] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: user.id },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    }),
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'EXPENSE',
        date: { gte: monthStart, lte: monthEnd },
      },
      select: {
        categoryId: true,
        convertedAmount: true,
      },
    }),
  ])

  const budgetsWithSpent = rawBudgets.map(budget => {
    const spent = monthExpenses
      .filter(t => !budget.categoryId || t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + t.convertedAmount, 0)
    return { ...budget, spent }
  })

  return (
    <BudgetsView
      initialBudgets={JSON.parse(JSON.stringify(budgetsWithSpent))}
    />
  )
}
