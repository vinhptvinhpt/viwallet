import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfMonth, endOfMonth } from 'date-fns'
type BudgetWithCategory = {
  id: string
  userId: string
  name: string
  amount: number
  currency: string
  period: string
  startDate: Date
  endDate: Date | null
  alertThreshold: number
  categoryId: string | null
  category: { id: string; name: string; icon: string; color: string } | null
}

const budgetSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(['ENVELOPE', 'LIMIT']),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  categoryId: z.string().nullable().optional(),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']).default('MONTHLY'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  rollover: z.boolean().default(false),
  alertThreshold: z.number().int().min(1).max(100).default(80),
})

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
    include: { category: { select: { id: true, name: true, icon: true, color: true } } },
  })

  const budgetsWithSpent = await Promise.all(budgets.map(async (budget: BudgetWithCategory) => {
    const where: any = {
      userId: user.id,
      type: 'EXPENSE',
      date: { gte: monthStart, lte: monthEnd },
    }
    if (budget.categoryId) where.categoryId = budget.categoryId

    const agg = await prisma.transaction.aggregate({
      where,
      _sum: { convertedAmount: true },
    })
    return { ...budget, spent: agg._sum.convertedAmount ?? 0 }
  }))

  return NextResponse.json(budgetsWithSpent)
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = budgetSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const budget = await prisma.budget.create({
    data: {
      ...parsed.data,
      userId: user.id,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  })
  return NextResponse.json(budget, { status: 201 })
}
